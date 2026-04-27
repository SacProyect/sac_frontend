import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/UI/dialog';
import { Badge } from '@/components/UI/badge';
import { Link } from 'react-router-dom';
import { ExternalLink, Loader2, MapPin, Calendar } from 'lucide-react';
import {
  getFiscalKpiBreakdown,
  type FiscalKpiBreakdownCategory,
} from '@/components/utils/api/report-functions';
import toast from 'react-hot-toast';

const TITLES: Record<FiscalKpiBreakdownCategory, string> = {
  assigned: 'Contribuyentes asignados',
  active: 'Procesos activos',
  completed: 'Procesos completados',
  notified: 'Procesos notificados',
};

function parseMoney(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  if (!val || typeof val !== 'object') return 0;
  const o = val as Record<string, unknown>;
  const numArr = (o.d || o.c) as string[] | undefined;
  if (numArr) {
    const sign = (o.s as number) ?? 1;
    return parseFloat(numArr.join('')) * sign;
  }
  return 0;
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' })
    .format(val)
    .replace('VES', 'Bs.S');
}

export interface FiscalKpiBreakdownRow {
  id: string;
  name: string;
  rif: string;
  address?: string;
  emition_date?: string;
  fase?: string;
  process?: string;
  culminated?: boolean;
  /** Presente cuando el listado viene de la API completa (modal y tabla comparten criterios). */
  notified?: boolean;
  totalCollected?: unknown;
  collectedIva?: unknown;
  collectedIslr?: unknown;
  collectedFines?: unknown;
}

function rowsForCategory(
  rows: FiscalKpiBreakdownRow[],
  category: FiscalKpiBreakdownCategory,
): FiscalKpiBreakdownRow[] {
  switch (category) {
    case 'assigned':
      return rows;
    case 'active':
      return rows.filter((r) => r.culminated !== true);
    case 'completed':
      return rows.filter((r) => r.culminated === true);
    case 'notified':
      return rows.filter((r) => r.notified === true);
    default:
      return [];
  }
}

interface FiscalKpiBreakdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fiscalId: string;
  year: number;
  category: FiscalKpiBreakdownCategory | null;
  /** Si falla el GET de detalle, se filtran estas filas (p. ej. lista ya cargada en Exploración de Fiscal). */
  fallbackTaxpayers?: FiscalKpiBreakdownRow[];
}

export function FiscalKpiBreakdownDialog({
  open,
  onOpenChange,
  fiscalId,
  year,
  category,
  fallbackTaxpayers,
}: FiscalKpiBreakdownDialogProps) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<FiscalKpiBreakdownRow[]>([]);

  useEffect(() => {
    if (!open || !category || !fiscalId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getFiscalKpiBreakdown(fiscalId, category, year);
        if (!cancelled) {
          setRows(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          const fb =
            fallbackTaxpayers?.length && category
              ? rowsForCategory(fallbackTaxpayers, category)
              : [];
          if (fb.length) {
            setRows(fb);
            toast.error(
              'No se pudo contactar el servicio de detalle. Mostrando datos ya cargados en esta vista.'
            );
          } else {
            setRows([]);
            toast.error('No se pudo cargar el detalle. Intenta de nuevo.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, category, fiscalId, year]);

  const title = category ? TITLES[category] : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="text-white text-left">{title}</DialogTitle>
          <DialogDescription className="text-slate-400 text-left text-xs">
            Casos del período según el año seleccionado (misma lógica que los totales del encabezado).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-[120px]">
          {loading && (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Cargando…</span>
            </div>
          )}

          {!loading && rows.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-10">No hay registros en esta categoría.</p>
          )}

          {!loading &&
            rows.map((row, idx) => (
              <div
                key={row.id || idx}
                className="mb-3 rounded-lg border border-slate-700 bg-slate-800/80 p-3 text-sm last:mb-0"
              >
                <div className="flex justify-between gap-2 items-start">
                  <div>
                    <p className="font-medium text-white text-sm">{row.name || '—'}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{row.rif || '—'}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {row.fase && (
                        <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-300">
                          {row.fase}
                        </Badge>
                      )}
                      {row.process && (
                        <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                          {row.process}
                        </Badge>
                      )}
                      {row.culminated && (
                        <Badge className="text-[10px] bg-blue-900/60 text-blue-200 border-blue-800">Culminado</Badge>
                      )}
                      {row.notified && (
                        <Badge className="text-[10px] bg-orange-900/60 text-orange-200 border-orange-800">Notificado</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-emerald-400 font-semibold text-xs">{formatCurrency(parseMoney(row.totalCollected))}</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-0.5">Total</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 border-t border-slate-700/50 pt-2">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {row.address || '—'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {row.emition_date
                      ? new Date(row.emition_date).toLocaleDateString('es-VE')
                      : '—'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 mt-2 text-[10px]">
                  <span className="text-slate-500">
                    IVA{' '}
                    <span className="text-slate-300">{formatCurrency(parseMoney(row.collectedIva))}</span>
                  </span>
                  <span className="text-slate-500">
                    ISLR{' '}
                    <span className="text-slate-300">{formatCurrency(parseMoney(row.collectedIslr))}</span>
                  </span>
                  <span className="text-slate-500">
                    Multas{' '}
                    <span className="text-orange-300/90">{formatCurrency(parseMoney(row.collectedFines))}</span>
                  </span>
                </div>
                {row.id && (
                  <div className="mt-3 pt-2 border-t border-slate-700/50">
                    <Link
                      to={`/taxpayer/${row.id}`}
                      onClick={() => onOpenChange(false)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Ver ficha del contribuyente
                      <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
                    </Link>
                  </div>
                )}
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
