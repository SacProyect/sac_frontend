import { createContext, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "./useLocalStorage";
import { useOutlet } from "react-router-dom";
import { User } from "../types/user";
import { ReactNode } from "react";


interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (user: User, token: string) => Promise<void>;
    token: string | null;
    logout: () => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useLocalStorage("user", null);
    const [token, setToken] = useLocalStorage("authToken", null);
    const navigate = useNavigate();

    const login = async (user: User, token: string) => {
        setUser(user);
        setToken(token);
        navigate("/");
    };
    const logout = () => {
        setUser(null);
        navigate("/", { replace: true });
    };

    const value = useMemo(
        () => ({
            user,
            setUser,
            login,
            token,
            logout,
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