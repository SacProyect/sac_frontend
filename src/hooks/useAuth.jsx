import { createContext, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "./useLocalStorage";
import { useOutlet } from "react-router-dom";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useLocalStorage("user", null);
    const [token, setToken] = useLocalStorage("authToken", null);
    const navigate = useNavigate();

    const login = async (user, token) => {
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
    return useContext(AuthContext);
};

export const AuthLayout = () => {
    const outlet = useOutlet();

    return (
        <AuthProvider>{outlet}</AuthProvider>
    );
};