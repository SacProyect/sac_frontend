import { LayoutGrid, Table2 } from 'lucide-react';
import { Button } from '@/components/UI/button';
import type { ExpedientesViewMode } from './types';

type Props = {
    value: ExpedientesViewMode;
    onChange: (v: ExpedientesViewMode) => void;
};

/**
 * Toggle entre vista Cards y vista Tabla (guide §4.2.1, §7.4).
 *
 * - Persiste la elección en `localStorage` con la key
 *   `gestion-actas:expedientes:view`. La persistencia la gestiona el
 *   orquestador (`ExpedientesTab`); este componente es presentacional.
 * - Patrón visual replicado del legacy `casos-por-fiscal-section.tsx:173-194`:
 *   `flex rounded-md border border-border p-0.5 bg-muted/40`.
 *
 * Data-testids:
 * - `expedientes-view-cards`
 * - `expedientes-view-table`
 */
export function ExpedientesViewToggle({ value, onChange }: Props) {
    return (
        <div
            className="flex rounded-md border border-border p-0.5 bg-muted/40"
            role="group"
            aria-label="Cambiar vista"
        >
            <Button
                type="button"
                variant={value === 'cards' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 gap-1 px-2"
                onClick={() => onChange('cards')}
                aria-pressed={value === 'cards'}
                data-testid="expedientes-view-cards"
            >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                Tarjetas
            </Button>
            <Button
                type="button"
                variant={value === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 gap-1 px-2"
                onClick={() => onChange('table')}
                aria-pressed={value === 'table'}
                data-testid="expedientes-view-table"
            >
                <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
                Tabla
            </Button>
        </div>
    );
}
