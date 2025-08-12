

// Utils: normalize strings for accent-insensitive and case-insensitive matching
// (e.g., "Árbol" -> "arbol", "Ñandú" -> "nandu")
export const normalize = (s: string) =>
    s
        .normalize('NFD')                         // split letters and diacritics
        .replace(/[\u0300-\u036f]/g, '')         // remove diacritics
        .toLowerCase()
        .trim();