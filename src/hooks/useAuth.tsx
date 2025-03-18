<<<<<<< HEAD
import { createContext, useCallback, useContext, useMemo } from "react";
=======
import { createContext, useContext, useMemo } from "react";
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "./useLocalStorage";
import { useOutlet } from "react-router-dom";
import { User } from "../types/user";
import { ReactNode } from "react";
<<<<<<< HEAD
import apiConnection from "@/components/utils/api/apiConnection";
=======
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)


interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (user: User, token: string) => Promise<void>;
    token: string | null;
    logout: () => void;
<<<<<<< HEAD
    refreshUser: () => Promise<void>;
=======
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

<<<<<<< HEAD
// MODO DESARROLLO: Usuario admin fake para revisar V2 sin backend
const DEV_MODE = true; // Cambiar a false cuando quieras usar autenticación real
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
    // En modo desarrollo, siempre usar usuario fake
    const [storedUser, setStoredUser] = useLocalStorage("user", null);
    const [storedToken, setStoredToken] = useLocalStorage("authToken", null);
    
    // Si está en modo desarrollo y no hay usuario, usar el fake
    const user = DEV_MODE && !storedUser ? FAKE_ADMIN_USER : storedUser;
    const token = DEV_MODE && !storedToken ? "fake-dev-token" : storedToken;
    
    const setUser = (newUser: User | null) => {
        if (DEV_MODE && newUser === FAKE_ADMIN_USER) {
            // No guardar el usuario fake en localStorage
            return;
        }
        setStoredUser(newUser);
    };
    
    const setToken = (newToken: string | null) => {
        if (DEV_MODE && newToken === "fake-dev-token") {
            // No guardar el token fake en localStorage
            return;
        }
        setStoredToken(newToken);
    };
    
=======
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useLocalStorage("user", null);
    const [token, setToken] = useLocalStorage("authToken", null);
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
    const navigate = useNavigate();

    const login = async (user: User, token: string) => {
        setUser(user);
        setToken(token);
        navigate("/");
    };
<<<<<<< HEAD

    const logout = () => {
        setUser(null);
        setToken(null);
        navigate("/", { replace: true });
    };

    const refreshUser = useCallback(async () => {
        // En modo desarrollo, no hacer refresh (usuario fake siempre disponible)
        if (DEV_MODE) return;
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

=======
    const logout = () => {
        setUser(null);
        navigate("/", { replace: true });
    };

>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
    const value = useMemo(
        () => ({
            user,
            setUser,
            login,
            token,
            logout,
<<<<<<< HEAD
            refreshUser
=======
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
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