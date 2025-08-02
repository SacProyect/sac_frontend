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
    } = usePresentation();

    const intervalRef = useRef<number | null>(null);
    const finishedRef = useRef(false);
    const waitRef = useRef<number | null>(null);

    // Register the table once
    useEffect(() => {
        registerTable(tableId);
    }, [tableId]);

    // Main scroll logic with wait until currentTableId matches
    useEffect(() => {
        const el = containerRef.current;

        console.log(`[${tableId}] autoScroll conditions:`, {
            el,
            enabled,
            autoScrollEnabled,
            currentTableId,
            match: tableId === currentTableId,
            scrollHeight: el?.scrollHeight,
            clientHeight: el?.clientHeight,
        });

        // Skip if ref not ready or not enabled yet
        if (!el || !enabled || !autoScrollEnabled) return;

        // Wait until this table is active (currentTableId === tableId)
        if (currentTableId !== tableId) return;

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

        // Delay to ensure DOM and scroll height is stable
        waitRef.current = setTimeout(() => {
            intervalRef.current = window.setInterval(() => {
                if (!el) return;

                el.scrollTop += 2;

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
        }, 1000);

        // Cleanup
        return () => {
            el.removeEventListener('wheel', handleUserScroll);
            el.removeEventListener('touchstart', handleUserScroll);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (waitRef.current) clearTimeout(waitRef.current);
        };
    }, [autoScrollEnabled, currentTableId, tableId, enabled]);
}
