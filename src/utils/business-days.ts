/**
 * Utilidades de cálculo de días hábiles para el frontend.
 * Replica la lógica del backend excluyendo fines de semana y feriados venezolanos.
 */

const VENEZUELAN_HOLIDAYS: Record<number, string[]> = {
  2025: [
    '2025-01-01', '2025-03-03', '2025-03-04', '2025-04-17', '2025-04-18',
    '2025-05-01', '2025-07-05', '2025-07-24', '2025-10-12', '2025-12-25',
  ],
  2026: [
    '2026-01-01', '2026-02-23', '2026-02-24', '2026-04-02', '2026-04-03',
    '2026-05-01', '2026-07-05', '2026-07-24', '2026-10-12', '2026-12-25',
  ],
  2027: [
    '2027-01-01', '2027-02-15', '2027-02-16', '2027-03-25', '2027-03-26',
    '2027-05-01', '2027-07-05', '2027-07-24', '2027-10-11', '2027-12-25',
  ],
};

function buildHolidaySet(): Set<string> {
  const set = new Set<string>();
  for (const holidays of Object.values(VENEZUELAN_HOLIDAYS)) {
    for (const h of holidays) set.add(h);
  }
  return set;
}

const HOLIDAY_SET = buildHolidaySet();

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isBusinessDay(date: Date): boolean {
  if (isWeekend(date)) return false;
  return !HOLIDAY_SET.has(formatDateKey(date));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Cuenta días hábiles entre dos fechas (excluyendo ambas).
 */
function countBusinessDays(from: Date, to: Date): number {
  const fromDate = startOfDay(from);
  const toDate = startOfDay(to);
  if (toDate <= fromDate) return 0;

  let count = 0;
  let current = addDays(fromDate, 1);
  while (current < toDate) {
    if (isBusinessDay(current)) count++;
    current = addDays(current, 1);
  }
  return count;
}

/**
 * Calcula cuántos días hábiles faltan desde hoy hasta una fecha objetivo.
 * Retorna negativo si ya pasó.
 */
export function businessDaysUntil(targetDate: string | Date): number {
  const today = startOfDay(new Date());
  const target = startOfDay(typeof targetDate === 'string' ? new Date(targetDate) : targetDate);

  if (target < today) return -countBusinessDays(target, today);
  if (target.getTime() === today.getTime()) return 0;
  return countBusinessDays(today, target);
}

/**
 * Retorna un objeto con información legible del vencimiento.
 */
export function getExpirationInfo(fechaVencimiento: string | null): {
  daysRemaining: number;
  label: string;
  urgency: 'safe' | 'warning' | 'danger' | 'expired' | 'none';
} {
  if (!fechaVencimiento) {
    return { daysRemaining: 0, label: 'Sin plazo', urgency: 'none' };
  }

  const days = businessDaysUntil(fechaVencimiento);

  if (days < 0) return { daysRemaining: days, label: 'Vencido', urgency: 'expired' };
  if (days === 0) return { daysRemaining: 0, label: 'Vence hoy', urgency: 'danger' };
  if (days === 1) return { daysRemaining: 1, label: '1 día hábil', urgency: 'warning' };
  if (days <= 5) return { daysRemaining: days, label: `${days} días hábiles`, urgency: 'warning' };
  return { daysRemaining: days, label: `${days} días hábiles`, urgency: 'safe' };
}
