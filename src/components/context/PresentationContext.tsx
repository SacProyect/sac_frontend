import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

interface PresentationValue {
  autoScrollEnabled: boolean;
  currentTableId: string;
  registerTable: (id: string) => void;
  goToNextTableOrPage: () => void;
  setUserInteraction: () => void;
  tableQueue: string[];
}

const PresentationContext = createContext<PresentationValue | null>(null);

/** Contexto opcional para modo presentación / auto-scroll (tablas). Stub hasta activar la feature. */
export function PresentationProvider({ children }: { children: ReactNode }) {
  const registerTable = useCallback((_id: string) => {}, []);
  const goToNextTableOrPage = useCallback(() => {}, []);
  const setUserInteraction = useCallback(() => {}, []);

  const value = useMemo<PresentationValue>(
    () => ({
      autoScrollEnabled: false,
      currentTableId: '',
      registerTable,
      goToNextTableOrPage,
      setUserInteraction,
      tableQueue: [],
    }),
    [registerTable, goToNextTableOrPage, setUserInteraction]
  );

  return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>;
}

export function usePresentation(): PresentationValue {
  const ctx = useContext(PresentationContext);
  if (!ctx) {
    return {
      autoScrollEnabled: false,
      currentTableId: '',
      registerTable: () => {},
      goToNextTableOrPage: () => {},
      setUserInteraction: () => {},
      tableQueue: [],
    };
  }
  return ctx;
}
