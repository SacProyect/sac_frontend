/**
 * Año civil para cartera fiscal y KPI — alineado con el backend (`getFiscalStatsPeriod`: límites UTC 1 ene … 1 ene).
 * Usar siempre `getUTCFullYear()` para evitar desfaces el 31/12 local vs UTC.
 */

export function fiscalCarteraYearNow(): number {
  return new Date().getUTCFullYear();
}

/** Años seleccionables en revisión fiscal / estadísticas del fiscal (centrados en el año UTC actual). */
export function fiscalCarteraYearOptions(yearsBack = 4, yearsForward = 1): number[] {
  const current = fiscalCarteraYearNow();
  const out: number[] = [];
  for (let y = current + yearsForward; y >= current - yearsBack; y -= 1) {
    out.push(y);
  }
  return out;
}
