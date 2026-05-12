import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type PresentationContextValue = {
  autoScrollEnabled: boolean;
  currentTableId: string | null;
  registerTable: (id: string) => void;
  goToNextTableOrPage: () => void;
  setUserInteraction: () => void;
  tableQueue: string[];
};

const noop = () => {};

const PresentationContext = createContext<PresentationContextValue>({
  autoScrollEnabled: false,
  currentTableId: null,
  registerTable: noop,
  goToNextTableOrPage: noop,
  setUserInteraction: noop,
  tableQueue: [],
});

export function PresentationProvider({ children }: { children: ReactNode }) {
  const [tableQueue, setTableQueue] = useState<string[]>([]);

  const registerTable = useCallback((id: string) => {
    setTableQueue((q) => (q.includes(id) ? q : [...q, id]));
  }, []);

  const value = useMemo<PresentationContextValue>(
    () => ({
      autoScrollEnabled: false,
      currentTableId: null,
      registerTable,
      goToNextTableOrPage: noop,
      setUserInteraction: noop,
      tableQueue,
    }),
    [registerTable, tableQueue],
  );

  return (
    <PresentationContext.Provider value={value}>
      {children}
    </PresentationContext.Provider>
  );
}

export function usePresentation(): PresentationContextValue {
  return useContext(PresentationContext);
}
