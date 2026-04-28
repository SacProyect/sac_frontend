import { useCallback, useEffect, useState } from 'react';

const DEMO_MODE_KEY = 'stats-demo-mode-active';
const DEMO_MODE_EVENT = 'stats-demo-mode-change';

const readDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(DEMO_MODE_KEY) === 'true';
};

export const setDemoModeActive = (active: boolean) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_MODE_KEY, active ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent<boolean>(DEMO_MODE_EVENT, { detail: active }));
};

export const useDemoMode = () => {
  const [isDemoModeActive, setIsDemoModeActive] = useState<boolean>(readDemoMode);

  useEffect(() => {
    const syncFromStorage = () => setIsDemoModeActive(readDemoMode());
    const onCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      setIsDemoModeActive(Boolean(customEvent.detail));
    };

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener(DEMO_MODE_EVENT, onCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener(DEMO_MODE_EVENT, onCustomEvent as EventListener);
    };
  }, []);

  const activateDemoMode = useCallback(() => setDemoModeActive(true), []);
  const deactivateDemoMode = useCallback(() => setDemoModeActive(false), []);

  return {
    isDemoModeActive,
    activateDemoMode,
    deactivateDemoMode,
  };
};
