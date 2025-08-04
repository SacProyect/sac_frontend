import { useEffect, useRef } from 'react';
import { usePresentation } from '@/components/context/PresentationContext';

// This hook enables auto-scrolling of a given containerRef
// It only triggers logic when enabled === true AND this table is the active one
export function useAutoScroll(
    containerRef: React.RefObject<HTMLDivElement | null>,
    tableId: string,
    enabled: boolean
) {
    const {
        autoScrollEnabled,
        currentTableId,
        registerTable,
        goToNextTableOrPage,
        setUserInteraction,
        tableQueue,
    } = usePresentation();

    const intervalRef = useRef<number | null>(null);
    const finishedRef = useRef(false);
    const waitRef = useRef<number | null>(null);

    // Register the table once
    useEffect(() => {
        registerTable(tableId);
    }, []);

    // Main scroll logic with wait until currentTableId matches
    useEffect(() => {
        const el = containerRef.current;

        const tryScroll = () => {
            if (!el || !enabled || !autoScrollEnabled) return;
            if (currentTableId !== tableId) return;

            const hasScroll = el.scrollHeight > el.clientHeight;

            console.log(`[${tableId}] tryScroll:`, {
                scrollHeight: el.scrollHeight,
                clientHeight: el.clientHeight,
                hasScroll,
            });

            if (!hasScroll) {
                console.log(`[${tableId}] ⏳ Waiting for scrollable content... Retrying in 500ms`);
                setTimeout(tryScroll, 500);
                return;
            }

            // Scroll logic
            finishedRef.current = false;
            el.scrollTop = 0;

            const handleUserScroll = () => {
                setUserInteraction();
                if (intervalRef.current) clearInterval(intervalRef.current);
            };

            el.addEventListener('wheel', handleUserScroll, { passive: true });
            el.addEventListener('touchstart', handleUserScroll);

            intervalRef.current = window.setInterval(() => {
                if (!el) return;

                el.scrollTop += 15;

                const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;

                if (atBottom && !finishedRef.current) {
                    finishedRef.current = true;
                    clearInterval(intervalRef.current!);
                    console.log(`[${tableId}] ✅ Scroll finished. Advancing...`);

                    setTimeout(() => {
                        // Prevent advancing if tableQueue was reset
                        if (!tableQueue.includes(currentTableId)) {
                            console.warn(`[${tableId}] 🚫 Skipping advance: currentTableId (${currentTableId}) not in queue`, tableQueue);
                            return;
                        }

                        goToNextTableOrPage();
                    }, 1000);
                }
            }, 20);
        };

        const start = setTimeout(() => {
            tryScroll();
        }, 500); // wait a little for DOM stability

        return () => {
            clearTimeout(start);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (waitRef.current) clearTimeout(waitRef.current);
            containerRef.current?.removeEventListener('wheel', setUserInteraction);
            containerRef.current?.removeEventListener('touchstart', setUserInteraction);
        };
    }, [autoScrollEnabled, currentTableId, tableId, enabled]);
}
