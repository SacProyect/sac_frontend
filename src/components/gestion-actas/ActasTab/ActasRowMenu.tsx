import { Link2, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/UI/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/UI/dropdown-menu';
import type { ActaReparo } from './types';

/* -------------------------------------------------------------------------- */
/* Props                                                                      */
/* -------------------------------------------------------------------------- */

type Props = {
    row: ActaReparo;
    onEdit: () => void;
    onLink: () => void;
    onDelete: () => void;
};

/* -------------------------------------------------------------------------- */
/* Componente público                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Menú contextual de acciones por fila de la tabla de Actas de Reparo.
 *
 * - Renderiza un único trigger con icono `MoreVertical` en la celda de
 *   Acciones.
 * - Tres acciones: Editar, Vincular a operativo, Eliminar.
 * - "Vincular" se deshabilita (con `disabled` real, no `aria-disabled`)
 *   cuando la fila ya está vinculada a un operativo.
 * - Cada `DropdownMenuItem` lleva su `data-testid` siguiendo la
 *   convención `actas-{acción}-{id}` del guide §7.3.
 */
export function ActasRowMenu({ row, onEdit, onLink, onDelete }: Props) {
    const vinculado = row.vinculadoAOperativo;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="h-7 w-7"
                    aria-label={`Acciones del acta ${row.contribuyente}`}
                    data-testid={`actas-row-${row.id}-menu`}
                >
                    <MoreVertical className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
                <DropdownMenuItem
                    onSelect={onEdit}
                    data-testid={`actas-edit-${row.id}`}
                >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                    onSelect={onLink}
                    disabled={vinculado}
                    data-testid={`actas-link-${row.id}`}
                >
                    <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Vincular a operativo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onSelect={onDelete}
                    data-testid={`actas-delete-${row.id}`}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Eliminar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
