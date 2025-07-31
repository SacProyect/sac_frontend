import { useEffect, useRef } from 'react';
import { usePresentation } from '@/components/context/PresentationContext';

// This hook enables auto-scrolling of a given containerRef
// It only triggers logic when enabled === true AND this table is the active one
export function useAutoScroll(
    containerRef: React.RefObject<HTMLDivElement | null>,
    tableId: string,
    enabled: boolean // new flag to prevent early execution
) {
    const {
        autoScrollEnabled,
        currentTableId,
        registerTable,
        goToNextTableOrPage,
        setUserInteraction,
    } = usePresentation();

    const intervalRef = useRef<number | null>(null);
    const finishedRef = useRef(false);

    // Register the table once
    useEffect(() => { 
        registerTable(tableId);
    }, [tableId]);

    // Main scroll logic
    useEffect(() => {
        const el = containerRef.current;

        // Only run logic if the feature is enabled, table is active and auto mode is on
        if (!el || !enabled || !autoScrollEnabled || tableId !== currentTableId) return;

        // Skip scrolling if there's no overflow
        if (el.scrollHeight <= el.clientHeight) {
            console.log(`[${tableId}] No scrollable content. Skipping...`);
            goToNextTableOrPage();
            return;
        }

        finishedRef.current = false;
        el.scrollTop = 0;

        const handleUserScroll = () => {
            setUserInteraction();
            if (intervalRef.current) clearInterval(intervalRef.current);
        };

        el.addEventListener('wheel', handleUserScroll, { passive: true });
        el.addEventListener('touchstart', handleUserScroll);

        // Delay start to ensure DOM has rendered the full content
        setTimeout(() => {
            intervalRef.current = window.setInterval(() => {
                if (!el) return;

                el.scrollTop += 2; // Scroll speed

                const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;

                if (atBottom && !finishedRef.current) {
                    finishedRef.current = true;
                    clearInterval(intervalRef.current!);
                    console.log(`[${tableId}] Scroll finished. Advancing...`);

                    setTimeout(() => {
                        goToNextTableOrPage();
                    }, 1000);
                }
            }, 20);
        }, 200);

        // Cleanup
        return () => {
            el.removeEventListener('wheel', handleUserScroll);
            el.removeEventListener('touchstart', handleUserScroll);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [autoScrollEnabled, currentTableId, tableId, enabled]);
}
