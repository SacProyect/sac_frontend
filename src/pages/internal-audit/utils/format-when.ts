export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-VE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

export function formatWindowLabel(fromIso: string, toIso: string): string {
  return `${formatWhen(fromIso)} → ${formatWhen(toIso)}`;
}
