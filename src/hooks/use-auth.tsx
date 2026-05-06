import { createContext, useCallback, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "./use-local-storage";
import { useOutlet } from "react-router-dom";
import { User } from "../types/user";
import { ReactNode } from "react";
import apiConnection from "@/components/utils/api/api-connection";


interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (user: User, token: string) => Promise<void>;
    token: string | null;
    logout: () => void;
    refreshUser: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Solo en `vite` dev: define VITE_DEV_FAKE_AUTH=true en .env.development.local */
const devFakeAuth =
    import.meta.env.DEV && import.meta.env.VITE_DEV_FAKE_AUTH === "true";

const FAKE_ADMIN_USER: User = {
    id: "dev-admin-fake-id",
    personId: "12345678",
    name: "Admin Test (Fake)",
    role: "ADMIN",
    password: "",
    status: true,
    taxpayer: [],
    coordinatedGroup: null as any,
    group: null as any,
    groupId: "",
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [storedUser, setStoredUser] = useLocalStorage("user", null);
    const [storedToken, setStoredToken] = useLocalStorage("authToken", null);
    const user = devFakeAuth && !storedUser ? FAKE_ADMIN_USER : storedUser;
    const token = storedToken;

    const setUser = useCallback((newUser: User | null) => {
        setStoredUser(newUser);
    }, [setStoredUser]);

    const setToken = useCallback((newToken: string | null) => {
        setStoredToken(newToken);
    }, [setStoredToken]);

    const navigate = useNavigate();

    const login = useCallback(
        async (user: User, token: string) => {
            setStoredUser(user);
            setStoredToken(token);
            navigate("/");
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
        }),
        [user, token, login, logout, refreshUser, setUser]
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
        <AuthProvider>{outlet}</AuthProvider>
    );
};