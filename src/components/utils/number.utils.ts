/**
 * ✅ SANITIZACIÓN CRÍTICA: Convierte objetos Decimal.js a number manejando NaN, null, undefined
 * El backend retorna montos en formato Decimal.js: { s: sign, e: exponent, d: digits[] }
 * Formula: value = s * d_concatenated * 10^(e - d_concatenated.length + 1)
 * @param val - Valor a transformar (number, string, objetct o undefined)
 * @returns number
 */
export function decimalToNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  if (typeof val === 'object' && val !== null && 's' in val && 'e' in val && 'd' in val) {
    const d = val as { s: number; e: number; d: number[] };
    if (!Array.isArray(d.d) || d.d.length === 0) return 0;
    // Concatenar grupos de dígitos (d[0] sin padding, d[1..n] con padding de 7)
    let str = d.d[0].toString();
    for (let i = 1; i < d.d.length; i++) {
      str += d.d[i].toString().padStart(7, '0');
    }
    const exp = d.e - str.length + 1;
    const result = parseFloat(str) * Math.pow(10, exp);
    return d.s * result;
  }
  return 0;
}

export function isNumeric(n: any) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}