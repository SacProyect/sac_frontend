// src/context/PresentationContext.tsx
import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    ReactNode,
} from 'react';

type PresentationContextType = {
    isAutoMode: boolean;
    currentPage: number;
    autoScrollEnabled: boolean;
    currentTableId: string | null;
    registerTable: (id: string) => void;
    goToNextTableOrPage: () => void;
    setUserInteraction: () => void;
    goToNextPageOnScrollEnd: () => void;
    goToNextPage: () => void,
    goToPrevPage: () => void,
    goToPage: (page: number) => void
};

const PresentationContext = createContext<PresentationContextType | undefined>(undefined);

export const PresentationProvider = ({ children }: { children: ReactNode }) => {
    const [isAutoMode, setIsAutoMode] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    const [tableQueue, setTableQueue] = useState<string[]>([]);
    const [currentTableId, setCurrentTableId] = useState<string | null>(null);

    const lastInteractionRef = useRef<number>(Date.now());

    const INACTIVITY_LIMIT = 30000; // 30s
    const TOTAL_PAGES = 3;

    useEffect(() => {
        setTableQueue([]);
        setCurrentTableId(null);
    }, [currentPage]);

    const setUserInteraction = () => {
        lastInteractionRef.current = Date.now();
        if (isAutoMode) setIsAutoMode(false);
    };

    const registerTable = (id: string) => {
        setTableQueue(prev => {
            const alreadyRegistered = prev.includes(id);
            if (!alreadyRegistered) {
                const updated = [...prev, id];
                if (updated.length === 1) {
                    // Primer registro activa el primero
                    setCurrentTableId(id);
                }
                return updated;
            }
            return prev;
        });
    };

    const goToNextTableOrPage = () => {
        const index = tableQueue.findIndex(id => id === currentTableId);
        if (index === -1 || index === tableQueue.length - 1) {
            // Última tabla → avanzar de página
            setCurrentTableId(null);
            setTableQueue([]);
            goToNextPageOnScrollEnd();
        } else {
            setCurrentTableId(tableQueue[index + 1]);
        }
    };

    const goToPage = (page: number) => setCurrentPage(page);
    const goToPrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
    const goToNextPage = () => setCurrentPage((prev) => Math.min(TOTAL_PAGES, prev + 1));

    const goToNextPageOnScrollEnd = () => {
        if (!isAutoMode) return;

        setCurrentPage(prev => {
            if (prev >= TOTAL_PAGES) {
                return 2; // Salta de la 3 a la 2
            } else {
                return prev + 1;
            }
        });
    };

    useEffect(() => {
        setIsLargeScreen(window.innerWidth > 1024);

        const handleUserActivity = () => setUserInteraction();

        window.addEventListener('click', handleUserActivity);
        window.addEventListener('scroll', handleUserActivity);
        window.addEventListener('mousemove', handleUserActivity);
        window.addEventListener('keydown', handleUserActivity);

        const checkInactivity = setInterval(() => {
            if (!isLargeScreen) return;
            const now = Date.now();
            if (!isAutoMode && now - lastInteractionRef.current > INACTIVITY_LIMIT) {
                setIsAutoMode(true);
                setCurrentPage(2); // ← inicia desde la página 2 al detectar inactividad
            }
        }, 1000);

        return () => {
            clearInterval(checkInactivity);
            window.removeEventListener('click', handleUserActivity);
            window.removeEventListener('scroll', handleUserActivity);
            window.removeEventListener('mousemove', handleUserActivity);
            window.removeEventListener('keydown', handleUserActivity);
        };
    }, [isAutoMode, isLargeScreen]);

    useEffect(() => {
        setAutoScrollEnabled(isAutoMode);
    }, [isAutoMode, currentPage]);

    return (
        <PresentationContext.Provider
            value={{
                isAutoMode,
                currentPage,
                autoScrollEnabled,
                currentTableId,
                registerTable,
                goToNextTableOrPage,
                setUserInteraction,
                goToNextPageOnScrollEnd,
                goToNextPage,
                goToPrevPage,
                goToPage
            }}
        >
            {children}
        </PresentationContext.Provider>
    );
};

export const usePresentation = () => {
    const context = useContext(PresentationContext);
    if (context === undefined) {
        throw new Error('usePresentation must be used within a PresentationProvider');
    }
    return context;
};
