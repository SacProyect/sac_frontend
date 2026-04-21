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

/**
 * Formatea un número como moneda venezolana (Bs.)
 * Usa punto como separador de miles y coma como separador decimal (formato es-VE)
 * @param value - Número o string a formatear
 * @param decimals - Cantidad de decimales (default: 2)
 * @returns String formateado (ej: "1.234,56" o "Bs. 1.234,56")
 */
export function formatBs(
  value: number | string | undefined,
  decimals: number = 2,
  showPrefix: boolean = false
): string {
  if (value === undefined || value === null || value === '') return '';

  const num = typeof value === 'string' ? parseBs(value) : Number(value);

  if (isNaN(num)) return '';

  const formatted = num.toLocaleString('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showPrefix ? `Bs. ${formatted}` : formatted;
}

/**
 * Convierte texto de monto a número (es-VE: miles con punto, decimales con coma; también acepta 1234.56)
 */
export function parseBs(value: string): number {
  if (!value || value.trim() === '') return NaN;

  let clean = value.replace(/^Bs\.\s?/i, '').trim();
  const lastComma = clean.lastIndexOf(',');
  const lastDot = clean.lastIndexOf('.');

  if (lastComma >= 0 && lastDot >= 0) {
    // Ambos: el separador más a la derecha es el decimal
    if (lastComma > lastDot) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (lastComma >= 0) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (lastDot >= 0) {
    const parts = clean.split('.');
    if (parts.length === 2) {
      const frac = parts[1];
      // Un solo punto y 1–2 decimales → decimal estilo US (ej. 99.50)
      if (frac.length > 0 && frac.length <= 2 && /^\d+$/.test(frac)) {
        return parseFloat(clean);
      }
    }
    // Resto: puntos como miles (1.234.567)
    clean = clean.replace(/\./g, '');
  }

  const n = parseFloat(clean);
  return n;
}

/**
 * Formatea un input de monto mientras se escribe
 * Mantiene el cursor en la posición correcta
 * @param value - Valor actual del input
 * @returns objeto con el valor formateado y el número
 */
export function formatBsInput(value: string): { formatted: string; numeric: number } {
  const numeric = parseBs(value);
  
  if (isNaN(numeric)) {
    return { formatted: value.replace(/[^0-9.,]/g, ''), numeric: NaN };
  }
  
  // Si termina en coma o punto, mantenerlo para permitir escribir decimales
  const endsWithDecimal = /[.,]$/.test(value);
  const hasDecimal = numeric % 1 !== 0 || value.includes(',') || /\.\d+$/.test(value);
  
  let formatted = formatBs(numeric, hasDecimal ? 2 : 0);
  
  if (endsWithDecimal && !formatted.includes(',')) {
    formatted += ',';
  }
  
  return { formatted, numeric };
}