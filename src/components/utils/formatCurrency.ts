/**
 * ✅ SANITIZACIÓN CRÍTICA: Formatea valores monetarios manejando NaN, null, undefined
 * @param amount - Valor a formatear (puede ser number, null, undefined, NaN)
 * @returns String formateado como moneda venezolana, o "Bs. 0,00" si el valor es inválido
 */
export const formatCurrency = (amount: unknown): string => {
    const n = typeof amount === "number" ? amount : Number(amount);

    // ✅ Seguro de vida visual (anti Bs.SNaN / null / undefined)
    if (amount === null || amount === undefined || Number.isNaN(n) || !Number.isFinite(n)) {
        return new Intl.NumberFormat("es-VE", {
            style: "currency",
            currency: "VES",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(0);
    }

    return new Intl.NumberFormat("es-VE", {
        style: "currency",
        currency: "VES",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
};
