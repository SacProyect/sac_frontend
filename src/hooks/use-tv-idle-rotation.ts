import { useEffect, useRef, useState, useCallback, type Dispatch, type SetStateAction } from 'react';

const DEFAULT_IDLE_MS = 3 * 60 * 1000;
const DEFAULT_PAGE_MS = 15 * 1000;
const DEFAULT_CARD_MS = 8 * 1000;
const SPOTLIGHT_SLOTS = 4;

/**
 * Tras `idleMs` sin actividad (incl. movimiento del cursor), activa modo TV:
 * rota la paginación y avanza el índice de tarjeta destacada.
 * Cualquier evento de usuario reinicia el temporizador de inactividad y desactiva el modo TV.
 */
export function useTvIdleRotation({
  idleMs = DEFAULT_IDLE_MS,
  pageRotateMs = DEFAULT_PAGE_MS,
  cardSpotlightMs = DEFAULT_CARD_MS,
  totalPages = 3,
  page,
  setPage,
}: {
  idleMs?: number;
  pageRotateMs?: number;
  cardSpotlightMs?: number;
  totalPages?: number;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
}) {
  const [tvMode, setTvMode] = useState(false);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleIdle = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setTvMode(true);
      setSpotlightIndex(0);
    }, idleMs);
  }, [idleMs]);

  const onUserActivity = useCallback(() => {
    setTvMode(false);
    setSpotlightIndex(0);
    scheduleIdle();
  }, [scheduleIdle]);

  useEffect(() => {
    scheduleIdle();
    const opts: AddEventListenerOptions = { passive: true };
    const handler = () => onUserActivity();
    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'wheel',
      'touchstart',
      'touchmove',
      'click',
      'pointerdown',
      'pointermove',
    ];
    events.forEach((e) => window.addEventListener(e, handler, opts));
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler, opts));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [onUserActivity, scheduleIdle]);

  useEffect(() => {
    if (!tvMode) return;
    const id = window.setInterval(() => {
      setPage((p: number) => (p >= totalPages ? 1 : p + 1));
    }, pageRotateMs);
    return () => clearInterval(id);
  }, [tvMode, pageRotateMs, totalPages, setPage]);

  useEffect(() => {
    if (!tvMode) return;
    const id = window.setInterval(() => {
      setSpotlightIndex((i: number) => (i + 1) % SPOTLIGHT_SLOTS);
    }, cardSpotlightMs);
    return () => clearInterval(id);
  }, [tvMode, cardSpotlightMs]);

  useEffect(() => {
    if (tvMode) setSpotlightIndex(0);
  }, [page, tvMode]);

  const tvSpotlightIndex = tvMode ? spotlightIndex : undefined;

  return { tvMode, tvSpotlightIndex };
}
