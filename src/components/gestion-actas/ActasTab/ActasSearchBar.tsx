import { RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';

type Props = {
    value: string;
    onChange: (v: string) => void;
    onRefresh: () => void;
    isLoading: boolean;
};

/**
 * Barra de búsqueda + botón "Actualizar" del tab Actas.
 *
 * - El debounce se gestiona en el orquestador (`ActasTab`) — este componente
 *   es presentacional y dispara `onChange` por cada keystroke.
 * - `data-testid="actas-search"` sigue la guía §7.3 (la barra de búsqueda
 *   principal de la tabla). `actas-fiscal-search` queda reservado para el
 *   picker de fiscal del formulario de upload (TASK-004b).
 */
export function ActasSearchBar({ value, onChange, onRefresh, isLoading }: Props) {
    return (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 min-w-[200px]">
                <Search
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                />
                <Input
                    data-testid="actas-search"
                    placeholder="Buscar por nombre, RIF o UUID…"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="pl-9 bg-background"
                    aria-label="Buscar actas de reparo"
                />
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={onRefresh}
                disabled={isLoading}
                data-testid="actas-refresh"
            >
                <RefreshCw
                    className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                />
                Actualizar
            </Button>
        </div>
    );
}
