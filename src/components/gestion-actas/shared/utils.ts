/**
 * Utilidades compartidas para los componentes de gestión de actas.
 */

/**
 * Extrae un mensaje de error legible de un error desconocido.
 * Usado en dialogs de edición, eliminación y vinculación.
 */
export function extractMessage(e: unknown, fallback: string): string {
    if (e instanceof Error) return e.message;
    if (typeof e === 'object' && e !== null) {
        const maybe = (e as { response?: { data?: { error?: string } } }).response?.data?.error;
        if (typeof maybe === 'string') return maybe;
    }
    return fallback;
}

/**
 * Normaliza un string de monto: reemplaza coma por punto decimal.
 * Devuelve undefined si el input está vacío.
 */
export function toAmountString(raw: string): string | undefined {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    return trimmed.replace(',', '.');
}
