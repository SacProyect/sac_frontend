import { createContext, useCallback, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "./useLocalStorage";
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

// MODO DESARROLLO: Usuario admin fake para revisar V2 sin backend
const DEV_MODE = false; // Cambiar a false cuando quieras usar autenticación real
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
    const user = storedUser;
    const token = storedToken;

    const setUser = (newUser: User | null) => {
        setStoredUser(newUser);
    };

    const setToken = (newToken: string | null) => {
        setStoredToken(newToken);
    };
    
    const navigate = useNavigate();

    const login = async (user: User, token: string) => {
        setUser(user);
        setToken(token);
        navigate("/");
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        navigate("/", { replace: true });
    };

    const refreshUser = useCallback(async () => {
        if (!token) return;
        try {
            const resp = await apiConnection.get<{
                user: User;
                token: string;
            }>("/user/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(resp.data.user);
            setToken(resp.data.token);
        } catch (err: any) {
            console.error("Failed to refresh user:", err);
            if (err.response?.status === 401) {
                logout();
            } else {
                // Optional: show error or just ignore
                console.warn("Non-auth error during refresh, not logging out.");
            }
        }
    }, [token]);

    const value = useMemo(
        () => ({
            user,
            setUser,
            login,
            token,
            logout,
            refreshUser
        }),
        [user]
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