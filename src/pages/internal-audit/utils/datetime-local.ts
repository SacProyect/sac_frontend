/** Convierte ISO a valor para `<input type="datetime-local" />` (hora local). */
export function isoToDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Valor del input datetime-local → ISO UTC. */
export function datetimeLocalValueToIso(localValue: string): string {
  const d = new Date(localValue);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function defaultAuditWindow(): { fromIso: string; toIso: string } {
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { fromIso: from.toISOString(), toIso: to.toISOString() };
}
