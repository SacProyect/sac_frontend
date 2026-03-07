import { decimalToNumber } from "./number.utils";

/**
 * ✅ SANITIZACIÓN CRÍTICA: Formatea valores monetarios manejando Decimal.js, NaN, null, undefined
 * @param amount - Valor a formatear (number, string, DecimalObject, null, undefined, NaN)
 * @returns String formateado como moneda venezolana, o "Bs. 0,00" si el valor es inválido
 */
export const formatCurrency = (amount: unknown): string => {
    const n = decimalToNumber(amount);

    // ✅ Seguro de vida visual (anti Bs.SNaN / null / undefined)
    if (Number.isNaN(n) || !Number.isFinite(n)) {
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
