import { FileDown, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';

type Props = {
    value: string;
    onChange: (v: string) => void;
    onRefresh: () => void;
    /**
     * Si se provee, se renderiza el botón "Excel" (`data-testid="expedientes-export"`)
     * que invoca esta función al hacer click. El orquestador es responsable
     * de gestionar el estado de export y los toasts de success/error.
     */
    onExport?: () => void | Promise<void>;
    /**
     * Estado de carga. Deshabilita los botones "Actualizar" y (si existe)
     * "Excel" mientras sea `true`, y anima el ícono `RefreshCw`.
     */
    isLoading: boolean;
};

/**
 * Barra de búsqueda + botón "Actualizar" del tab Expedientes.
 *
 * - El debounce se gestiona en el orquestador (`ExpedientesTab`); este
 *   componente es presentacional y dispara `onChange` por cada keystroke.
 * - `data-testid="expedientes-search"`, `data-testid="expedientes-refresh"`
 *   y `data-testid="expedientes-export"` siguen la guía §7.4.
 * - El botón "Excel" solo se renderiza si el orquestador pasa `onExport`
 *   (TASK-005b). El orquestador controla el estado de export y la
 *   notificación con toast.
 */
export function ExpedientesSearchBar({
    value,
    onChange,
    onRefresh,
    onExport,
    isLoading,
}: Props) {
    return (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 min-w-[200px]">
                <Search
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                    aria-hidden="true"
                />
                <Input
                    data-testid="expedientes-search"
                    placeholder="Buscar por nombre, cédula, coord.…"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="pl-9 bg-background"
                    aria-label="Buscar expedientes por fiscal"
                />
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={onRefresh}
                disabled={isLoading}
                data-testid="expedientes-refresh"
            >
                <RefreshCw
                    className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                />
                Actualizar
            </Button>
            {onExport && (
                <Button
                    type="button"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                    onClick={() => void onExport()}
                    disabled={isLoading}
                    data-testid="expedientes-export"
                >
                    <FileDown className="h-4 w-4" aria-hidden="true" />
                    Excel
                </Button>
            )}
        </div>
    );
}
