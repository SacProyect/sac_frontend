import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "./use-local-storage";
import { useOutlet } from "react-router-dom";
import { User } from "../types/user";
import { ReactNode } from "react";
import apiConnection from "@/components/utils/api/api-connection";
import DevRoleSwitcher from "@/components/dev/DevRoleSwitcher";


interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (user: User, token: string) => Promise<void>;
    token: string | null;
    logout: () => void;
    refreshUser: () => Promise<void>;
    devRoleOverride: string | null;
    setDevRoleOverride: (role: "ADMIN" | "COORDINATOR" | "SUPERVISOR" | "FISCAL" | null) => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

// MODO DESARROLLO: Usuario fake para revisar V2 sin backend/login.
// Cambia el rol por query (?devRole=FISCAL) o por el switcher visible.
// Solo en `vite` dev: define VITE_DEV_FAKE_AUTH=true en .env.development.local
export const DEV_MODE = import.meta.env.DEV && import.meta.env.VITE_DEV_FAKE_AUTH === "true";
type DevRole = "ADMIN" | "COORDINATOR" | "SUPERVISOR" | "FISCAL";

const FAKE_GROUP_ID = "dev-group-fake-id";
const FAKE_GROUP = { id: FAKE_GROUP_ID, name: "Equipo Demo" } as any;

function buildFakeUser(role: DevRole): User {
    const base = {
        password: "",
        status: true,
        taxpayer: [],
    } as Partial<User> as any;
    if (role === "ADMIN") {
        return {
            ...base,
            id: "dev-admin-fake-id",
            personId: "12345678",
            name: "Admin Test (Fake)",
            role: "ADMIN",
            coordinatedGroup: null,
            group: null,
            groupId: "",
        };
    }
    if (role === "COORDINATOR") {
        return {
            ...base,
            id: "dev-coord-fake-id",
            personId: "23456789",
            name: "Coordinador Test (Fake)",
            role: "COORDINATOR",
            coordinatedGroup: FAKE_GROUP,
            group: FAKE_GROUP,
            groupId: FAKE_GROUP_ID,
        };
    }
    if (role === "SUPERVISOR") {
        return {
            ...base,
            id: "dev-super-fake-id",
            personId: "34567890",
            name: "Supervisor Test (Fake)",
            role: "SUPERVISOR",
            coordinatedGroup: null,
            group: FAKE_GROUP,
            groupId: FAKE_GROUP_ID,
        };
    }
    return {
        ...base,
        id: "dev-fiscal-fake-id",
        personId: "45678901",
        name: "Fiscal Test (Fake)",
        role: "FISCAL",
        coordinatedGroup: null,
        group: FAKE_GROUP,
        groupId: FAKE_GROUP_ID,
    };
}

const DEV_ROLE_KEY = "dev-fake-role";
const VALID_DEV_ROLES: DevRole[] = ["ADMIN", "COORDINATOR", "SUPERVISOR", "FISCAL"];

function readDevRole(): DevRole {
    try {
        const fromQuery = new URLSearchParams(window.location.search).get("devRole")?.toUpperCase();
        if (fromQuery && VALID_DEV_ROLES.includes(fromQuery as DevRole)) {
            // sessionStorage = por pestaña, así dos ventanas pueden tener roles distintos.
            window.sessionStorage.setItem(DEV_ROLE_KEY, fromQuery);
            return fromQuery as DevRole;
        }
        const fromSession = window.sessionStorage.getItem(DEV_ROLE_KEY);
        if (fromSession && VALID_DEV_ROLES.includes(fromSession as DevRole)) return fromSession as DevRole;
        const saved = window.localStorage.getItem(DEV_ROLE_KEY);
        if (saved && VALID_DEV_ROLES.includes(saved as DevRole)) return saved as DevRole;
    } catch {}
    return "ADMIN";
}

export function setDevFakeRole(role: DevRole) {
    try {
        window.sessionStorage.setItem(DEV_ROLE_KEY, role);
        window.localStorage.setItem(DEV_ROLE_KEY, role);
        window.localStorage.removeItem("user");
        window.localStorage.removeItem("authToken");
        window.location.reload();
    } catch {}
}
export function getDevFakeRole(): DevRole {
    return readDevRole();
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [storedUser, setStoredUser] = useLocalStorage<User | null>("user", null);
    const [storedToken, setStoredToken] = useLocalStorage<string | null>("authToken", null);

    const [devRoleOverride, setDevRoleOverride] = useLocalStorage<DevRole | null>("dev-role-override", null);

    // En DEV_MODE, derivamos el user del sessionStorage (por pestaña)
    const devUser = useMemo<User | null>(() => {
        if (!DEV_MODE) return null;
        return buildFakeUser(readDevRole());
    }, []);

    const user = useMemo(() => {
        const baseUser = DEV_MODE ? devUser : storedUser;
        if (import.meta.env.DEV && devRoleOverride && baseUser) {
            return { ...baseUser, role: devRoleOverride };
        }
        return baseUser;
    }, [DEV_MODE, devUser, storedUser, devRoleOverride]);

    const token = DEV_MODE ? "dev-fake-token" : storedToken;

    const setUser = useCallback((newUser: User | null) => {
        setStoredUser(newUser);
    }, [setStoredUser]);

    const setToken = useCallback((newToken: string | null) => {
        setStoredToken(newToken);
    }, [setStoredToken]);

    const navigate = useNavigate();

    useEffect(() => {
        if (!DEV_MODE) return;
        if (!storedToken) setStoredToken("dev-fake-token");
    }, [storedToken, setStoredToken]);

    const login = useCallback(
        async (user: User, token: string) => {
            setStoredUser(user);
            setStoredToken(token);
            navigate("/admin", { replace: true });
        },
        [navigate, setStoredUser, setStoredToken]
    );

    const logout = useCallback(() => {
        setStoredUser(null);
        setStoredToken(null);
        navigate("/", { replace: true });
    }, [navigate, setStoredUser, setStoredToken]);

    const refreshUser = useCallback(async () => {
        if (!storedToken) return;
        try {
            const resp = await apiConnection.get<{
                user: User;
                token: string;
            }>("/user/me", {
                headers: { Authorization: `Bearer ${storedToken}` },
            });
            setStoredUser(resp.data.user);
            setStoredToken(resp.data.token);
        } catch (err: any) {
            console.error("Failed to refresh user:", err);
            if (err.response?.status === 401) {
                logout();
            } else {
                // Optional: show error or just ignore
                console.warn("Non-auth error during refresh, not logging out.");
            }
        }
    }, [storedToken, logout, setStoredUser, setStoredToken]);

    const value = useMemo(
        () => ({
            user,
            setUser,
            login,
            token,
            logout,
            refreshUser,
            devRoleOverride,
            setDevRoleOverride: (role: DevRole | null) => setDevRoleOverride(role),
        }),
        [user, token, login, logout, refreshUser, setUser, devRoleOverride, setDevRoleOverride]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }

    return context;
};

export const AuthLayout = () => {
    const outlet = useOutlet();

    return (
        <AuthProvider>
            {outlet}
            {import.meta.env.DEV && <DevRoleSwitcher />}
        </AuthProvider>
    );
};