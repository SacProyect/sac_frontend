import { useEffect, useState } from 'react';

/**
 * Hook que detecta si el usuario prefiere reduced motion.
 *
 * Implementación: usa `window.matchMedia('(prefers-reduced-motion: reduce)')`
 * que es librería-agnóstico (no depende de framer-motion).
 *
 * Componentes que animan deben usar este hook para omitir animaciones:
 *   const reducedMotion = usePrefersReducedMotion();
 *   if (reducedMotion) return; // skip animation
 *
 * Sigue la convención del design system y la guía visual §9.1.
 */
export function usePrefersReducedMotion(): boolean {
    const [reducedMotion, setReducedMotion] = useState(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    return reducedMotion;
}
