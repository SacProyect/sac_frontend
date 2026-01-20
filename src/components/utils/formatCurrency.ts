/**
 * ✅ SANITIZACIÓN CRÍTICA: Formatea valores monetarios manejando NaN, null, undefined
 * @param amount - Valor a formatear (puede ser number, null, undefined, NaN)
 * @returns String formateado como moneda venezolana, o "Bs. 0,00" si el valor es inválido
 */
export const formatCurrency = (amount: number | null | undefined): string => {
    // Validar que el valor sea un número válido
    if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) {
        return new Intl.NumberFormat("es-VE", {
            style: "currency",
            currency: "VES",
            minimumFractionDigits: 0,
        }).format(0);
    }

    return new Intl.NumberFormat("es-VE", {
        style: "currency",
        currency: "VES",
        minimumFractionDigits: 0,
    }).format(amount);
};
