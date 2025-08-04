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
    goToPage: (page: number) => void;
    tableQueue: string[];
};

const expectedTablesPerPage: Record<number, number> = {
    2: 4,
    3: 3,
};

const PresentationContext = createContext<PresentationContextType | undefined>(undefined);


export const usePresentation = () => {
    const context = useContext(PresentationContext);
    if (context === undefined) {
        throw new Error('usePresentation must be used within a PresentationProvider');
    }
    return context;
};


export const PresentationProvider = ({ children }: { children: ReactNode }) => {
    const [isAutoMode, setIsAutoMode] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    const [tableQueue, setTableQueue] = useState<string[]>([]);
    const [currentTableId, setCurrentTableId] = useState<string | null>(null);

    const lastInteractionRef = useRef<number>(Date.now());

    const INACTIVITY_LIMIT = 30000; // ms
    const TOTAL_PAGES = 3;

    // useEffect(() => {
    //     setTableQueue([]);
    //     setCurrentTableId(null);
    // }, [currentPage]);

    const setUserInteraction = () => {
        lastInteractionRef.current = Date.now();
        if (isAutoMode) setIsAutoMode(false);
    };

    const registerTable = (id: string) => {
        setTableQueue(prev => {
            const alreadyRegistered = prev.includes(id);
            if (!alreadyRegistered) {
                const updated = [...prev, id];
                console.log(`[registerTable] Registered table: ${id}`);

                console.log(`[registerTable] Total registered tables: ${updated.length}`);
                if (updated.length === 1) {
                    setCurrentTableId(id);
                    console.log(`[registerTable] First table set as active: ${id}`);
                }
                return updated;
            } else {
                console.log(`[registerTable] Table ${id} is already registered.`);
            }
            return prev;
        });
    };




    const goToNextTableOrPage = () => {
        const expectedCount = expectedTablesPerPage[currentPage] || 0;

        console.log(`[goToNextTableOrPage] Called on page ${currentPage}`);
        console.log(`[goToNextTableOrPage] currentTableId: ${currentTableId}`);
        console.log(`[goToNextTableOrPage] tableQueue:`, tableQueue);
        console.log(`[goToNextTableOrPage] expectedCount for page ${currentPage}: ${expectedCount}`);

        if (!currentTableId) {
            console.warn(`[goToNextTableOrPage] ❌ currentTableId is null. Aborting.`);
            return;
        }

        if (tableQueue.length === 0) {
            console.warn(`[goToNextTableOrPage] ❌ tableQueue is empty. No tables registered.`);
            return;
        }

        const index = tableQueue.findIndex(id => id === currentTableId);

        if (index === -1) {
            console.warn(`[goToNextTableOrPage] ❌ currentTableId (${currentTableId}) not found in tableQueue.`);
            console.warn(`[goToNextTableOrPage] Full tableQueue:`, tableQueue);
            return;
        }

        const notAllTablesReady = tableQueue.length < expectedCount;

        if (index === tableQueue.length - 1) {
            if (notAllTablesReady) {
                console.log(`[goToNextTableOrPage] ⚠️ Reached last registered table (${currentTableId}) but only ${tableQueue.length}/${expectedCount} tables registered. Waiting for more tables.`);
                return;
            }

            console.log(`[goToNextTableOrPage] ✅ Last table (${currentTableId}) reached. Proceeding to next page.`);
            setCurrentTableId(null);
            setTableQueue([]);
            goToNextPageOnScrollEnd();
        } else {
            const nextId = tableQueue[index + 1];
            setCurrentTableId(nextId);
            console.log(`[goToNextTableOrPage] ➡️ Moving to next table: ${nextId}`);
        }
    };

    const goToPage = (page: number) => setCurrentPage(page);
    const goToPrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
    const goToNextPage = () => setCurrentPage((prev) => Math.min(TOTAL_PAGES, prev + 1));

    const goToNextPageOnScrollEnd = () => {
        if (!isAutoMode) return;

        setCurrentPage(prev => {
            const isLastPage = prev >= TOTAL_PAGES;
            const shouldLoop = isLastPage && tableQueue.length === 0 && currentTableId === null;

            if (isLastPage) {
                if (!shouldLoop) {
                    console.log(`[goToNextPageOnScrollEnd] Staying on page ${prev} until scroll finishes.`);
                    return prev; // Wait until scroll in last page completes
                }

                console.log(`[goToNextPageOnScrollEnd] Last page done. Looping back to page 2.`);
                return 2;
            }

            const nextPage = prev + 1;
            console.log(`[goToNextPageOnScrollEnd] Moving from page ${prev} to ${nextPage}`);
            return nextPage;
        });
    };

    // Watch for loop condition after tables have been cleared on last page
    useEffect(() => {
        if (!isAutoMode || currentPage !== TOTAL_PAGES) return;

        const timeout = setTimeout(() => {
            const shouldLoop = tableQueue.length === 0 && currentTableId === null;
            if (shouldLoop) {
                console.log(`[Loop Timeout] 30s passed on page ${currentPage}. Returning to page 2`);
                setCurrentPage(2);
            }
        }, 30000); // 30 seconds

        return () => clearTimeout(timeout);
    }, [isAutoMode, currentPage, tableQueue.length, currentTableId]);

    useEffect(() => {
        setIsLargeScreen(window.innerWidth > 1024);

        const handleUserActivity = () => setUserInteraction();

        window.addEventListener('click', handleUserActivity);
        window.addEventListener('scroll', handleUserActivity);
        // window.addEventListener('mousemove', handleUserActivity);
        window.addEventListener('keydown', handleUserActivity);

        const checkInactivity = setInterval(() => {
            if (!isLargeScreen) return;
            const now = Date.now();
            if (!isAutoMode && now - lastInteractionRef.current > INACTIVITY_LIMIT) {
                console.log("[Inactivity] Auto mode activated due to inactivity");
                setIsAutoMode(true);
                setCurrentPage((prev) => {
                    if (prev !== 2) {
                        console.log(`[Inactivity] Jumping to page 2 from page ${prev}`);
                    }
                    return prev !== 2 ? 2 : prev;
                });
            }
        }, 1000);

        return () => {
            clearInterval(checkInactivity);
            window.removeEventListener('click', handleUserActivity);
            window.removeEventListener('scroll', handleUserActivity);
            // window.removeEventListener('mousemove', handleUserActivity);
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
                tableQueue,
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
