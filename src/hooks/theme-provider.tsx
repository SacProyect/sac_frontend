import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

export type SacTheme = "light" | "dark";

type ThemeContextValue = {
    theme: SacTheme;
    setTheme: (t: SacTheme) => void;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "sac-theme";

function readStoredTheme(): SacTheme {
    try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s === "light" || s === "dark") return s;
    } catch {
        /* ignore */
    }
    return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<SacTheme>(() => readStoredTheme());

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle("dark", theme === "dark");
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            /* ignore */
        }
    }, [theme]);

    const setTheme = useCallback((t: SacTheme) => setThemeState(t), []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
    }, []);

    const value = useMemo(
        () => ({
            theme,
            setTheme,
            toggleTheme,
        }),
        [theme, setTheme, toggleTheme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useTheme debe usarse dentro de ThemeProvider");
    }
    return ctx;
}
