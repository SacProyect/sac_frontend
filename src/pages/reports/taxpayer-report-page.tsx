import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/UI/card';
import { Badge } from '@/components/UI/badge';
import { Button } from '@/components/UI/button';
import { PageHeader } from '@/components/UI/v2';
import {
  ChevronLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  DollarSign,
  TrendingUp,
  User,
  Calendar,
  MapPin,
  Hash,
  Layers,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getFineHistory,
  getPaymentHistory,
  getPendingEvents,
  getIndividualIvaReport,
} from '@/components/utils/api/report-functions';
import { getIslrReports, getTaxHistory } from '@/components/utils/api/report-functions';
import { getTaxpayerData } from '@/components/utils/api/report-functions';

// ─── Decimal.js converter ────────────────────────────────────────────────────
// El backend retorna montos en formato Decimal.js: { s: sign, e: exponent, d: digits[] }
// Formula: value = s * d_concatenated * 10^(e - d_concatenated.length + 1)
function decimalToNumber(val: unknown): number {
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

// ─── Types ──────────────────────────────────────────────────────────────────
interface TaxpayerDetail {
  id: string;
  name: string;
  rif: string;
  address?: string;
  process?: string;
  contract_type?: string;
  status?: boolean;
  fase?: string;
  notified?: boolean;
  culminated?: boolean;
  emition_date?: string;
  providenceNum?: string;
  user?: { name: string; id: string };
  parish?: { name: string };
  taxpayer_category?: { name: string };
  index_iva?: unknown;
  repair_reports?: { id: string; pdf_url: string }[];
  investigation_pdfs?: { id: string; pdf_url: string }[];
}

interface FineRecord {
  id: string;
  date: string;
  amount: unknown;
  type: string;
  status: boolean;
  debt?: unknown;
  description?: string;
  expires_at?: string;
}

interface FineApiResponse {
  FINEs?: FineRecord[];
  fines_quantity?: number;
  total_amount?: unknown;
}

interface PaymentRecord {
  id: string;
  date: string;
  amount: unknown;
  status?: boolean;
}

interface PaymentApiResponse {
  payments?: PaymentRecord[];
  payments_number?: number;
  total_amount?: unknown;
  compliance_rate?: unknown;
  average_delay?: number;
  last_payments?: PaymentRecord[];
}

interface IvaRecord {
  id: string;
  date: string;
  sells: unknown;
  purchases: unknown;
  iva?: unknown;
  excess?: unknown;
  paid?: unknown;
}

interface IslrRecord {
  id: string;
  emition_date: string;
  incomes: unknown;
  costs: unknown;
  expent?: unknown;
  paid?: unknown;
  taxpayer?: { name: string; process: string };
}

interface MonthlyIvaPerformance {
  performance: string;
  variationFromPrevious: string;
}

type IvaReport = Record<string, MonthlyIvaPerformance>;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (val: unknown) => {
  const n = decimalToNumber(val);
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (d?: string) => (d ? d.slice(0, 10) : '—');

const processLabel: Record<string, string> = {
  AF: 'Auditoría Fiscal',
  VDF: 'Deberes Formales',
  FP: 'Fiscalización de Pago',
};

const faseLabel: Record<string, string> = {
  FASE_1: 'Fase 1',
  FASE_2: 'Fase 2',
  FASE_3: 'Fase 3',
};

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const MONTHS_LABEL: Record<string, string> = {
  enero: 'Ene', febrero: 'Feb', marzo: 'Mar', abril: 'Abr',
  mayo: 'May', junio: 'Jun', julio: 'Jul', agosto: 'Ago',
  septiembre: 'Sep', octubre: 'Oct', noviembre: 'Nov', diciembre: 'Dic',
};

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color = 'text-white', sub }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; color?: string; sub?: string;
}) {
  return (
    <Card className="bg-slate-800 border-slate-700 p-4 flex items-start gap-3 hover:border-slate-600 transition-all">
      <div className="text-slate-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="bg-slate-800/60 border-slate-700 p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
        <span className="text-indigo-400">{icon}</span>
        <h3 className="font-semibold text-slate-200 text-sm uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </Card>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p className="text-slate-500 text-sm text-center py-5 italic">{msg}</p>;
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function TaxpayerReportPage() {
  const { taxpayer: taxpayerId } = useParams<{ taxpayer: string }>();
  const navigate = useNavigate();

  const [taxpayer, setTaxpayer] = useState<TaxpayerDetail | null>(null);
  const [fineResp, setFineResp] = useState<FineApiResponse>({});
  const [payResp, setPayResp] = useState<PaymentApiResponse>({});
  const [pending, setPending] = useState<unknown[]>([]);
  const [ivaRecords, setIvaRecords] = useState<IvaRecord[]>([]);
  const [ivaPerf, setIvaPerf] = useState<IvaReport>({});
  const [islr, setIslr] = useState<IslrRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taxpayerId) return;

    const load = async () => {
      setLoading(true);
      try {
        const [detailRes, fineRes, payRes, pendRes, ivaPerfRes, islrRes, taxSumRes] =
          await Promise.allSettled([
            getTaxpayerData(taxpayerId),          // /taxpayer/data/:id
            getFineHistory(taxpayerId),            // /reports/fine/:id
            getPaymentHistory(taxpayerId),         // /reports/payments/:id
            getPendingEvents(taxpayerId),          // /reports/pending/:id
            getIndividualIvaReport(taxpayerId),    // /reports/individual-iva-report/:id
            getIslrReports(taxpayerId),            // /taxpayer/get-islr/:id
            getTaxHistory(taxpayerId),             // /taxpayer/getTaxSummary/:id
          ]);

        if (detailRes.status === 'fulfilled') setTaxpayer(detailRes.value);
        else toast.error('No se pudo cargar la información del contribuyente.');

        // Multas: { FINEs: [...], fines_quantity, total_amount }
        if (fineRes.status === 'fulfilled') {
          const raw = fineRes.value;
          setFineResp(typeof raw === 'object' && raw !== null && 'FINEs' in raw ? raw : { FINEs: Array.isArray(raw) ? raw : [] });
        }

        // Pagos: { payments: [...], total_amount, compliance_rate, ... }
        if (payRes.status === 'fulfilled') {
          const raw = payRes.value;
          setPayResp(typeof raw === 'object' && raw !== null && 'payments' in raw ? raw : { payments: [] });
        }

        // Pendientes: []
        if (pendRes.status === 'fulfilled') setPending(Array.isArray(pendRes.value) ? pendRes.value : []);

        // IVA Performance: { enero: { performance, variationFromPrevious }, ... }
        if (ivaPerfRes.status === 'fulfilled' && typeof ivaPerfRes.value === 'object') {
          setIvaPerf(ivaPerfRes.value as IvaReport);
        }

        // ISLR: array de reportes con campos Decimal.js
        if (islrRes.status === 'fulfilled') {
          const raw = islrRes.value?.data ?? islrRes.value;
          setIslr(Array.isArray(raw) ? raw : []);
        }

        // IVA Records: array de registros mensuales con campos Decimal.js
        if (taxSumRes.status === 'fulfilled') {
          const raw = taxSumRes.value?.data ?? taxSumRes.value;
          setIvaRecords(Array.isArray(raw) ? raw : []);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [taxpayerId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <svg className="w-8 h-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm">Cargando reporte...</p>
      </div>
    );
  }

  if (!taxpayer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
        <AlertTriangle className="w-10 h-10 text-yellow-500" />
        <p>No se encontró información para este contribuyente.</p>
        <Button variant="outline" onClick={() => navigate('/gen-reports')}
          className="border-slate-600 text-slate-300 bg-transparent hover:bg-slate-700">
          <ChevronLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
      </div>
    );
  }

  // ── Computed values ──────────────────────────────────────────────────────
  const fines: FineRecord[] = fineResp.FINEs ?? [];
  const payments: PaymentRecord[] = payResp.payments ?? [];
  const totalFinesAmount = decimalToNumber(fineResp.total_amount);
  const totalPaymentsAmount = decimalToNumber(payResp.total_amount);
  const complianceRate = decimalToNumber(payResp.compliance_rate);

  // ── IVA Performance ──────────────────────────────────────────────────────
  const ivaPerfEntries = MONTHS_ES.map((m) => {
    const entry = ivaPerf[m];
    const perf = parseFloat(entry?.performance ?? '0') || 0;
    const variation = parseFloat(entry?.variationFromPrevious ?? '0') || 0;
    return { month: m, label: MONTHS_LABEL[m], perf, variation };
  });
  const hasIvaPerf = ivaPerfEntries.some((e) => e.perf !== 0 || e.variation !== 0);

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <PageHeader title="Reporte del Contribuyente" description={taxpayer.name} />
        <Button variant="outline" onClick={() => navigate('/gen-reports')}
          className="border-slate-600 text-slate-300 bg-transparent hover:bg-slate-700 shrink-0">
          <ChevronLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-slate-800 border-slate-700 p-5">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-bold text-white">{taxpayer.name}</h2>
            <p className="text-indigo-400 font-mono text-sm">{taxpayer.rif}</p>
            {taxpayer.address && (
              <p className="text-slate-400 text-sm flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />{taxpayer.address}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {taxpayer.process && (
                <Badge className="bg-blue-900/50 text-blue-200 border-blue-800">
                  {processLabel[taxpayer.process] ?? taxpayer.process}
                </Badge>
              )}
              {taxpayer.contract_type && (
                <Badge className={taxpayer.contract_type === 'SPECIAL'
                  ? 'bg-purple-900/50 text-purple-200 border-purple-800'
                  : 'bg-slate-700 text-slate-300 border-slate-600'}>
                  {taxpayer.contract_type === 'SPECIAL' ? 'Especial' : 'Ordinario'}
                </Badge>
              )}
              {taxpayer.status !== undefined && (
                <Badge className={taxpayer.status
                  ? 'bg-green-900/50 text-green-200 border-green-800'
                  : 'bg-red-900/50 text-red-200 border-red-800'}>
                  {taxpayer.status ? 'Activo' : 'Inactivo'}
                </Badge>
              )}
              {taxpayer.culminated && <Badge className="bg-emerald-900/50 text-emerald-200 border-emerald-800">Culminado</Badge>}
              {taxpayer.notified && <Badge className="bg-yellow-900/50 text-yellow-200 border-yellow-800">Notificado</Badge>}
              {taxpayer.fase && (
                <Badge className="bg-slate-700 text-slate-300 border-slate-600">
                  {faseLabel[taxpayer.fase] ?? taxpayer.fase}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm text-slate-400 md:items-end">
            {taxpayer.user?.name && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 shrink-0" />
                <span>{taxpayer.user.name}</span>
              </div>
            )}
            {taxpayer.parish?.name && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{taxpayer.parish.name}</span>
              </div>
            )}
            {taxpayer.emition_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>{fmtDate(taxpayer.emition_date)}</span>
              </div>
            )}
            {taxpayer.taxpayer_category?.name && (
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 shrink-0" />
                <span>{taxpayer.taxpayer_category.name}</span>
              </div>
            )}
            {taxpayer.providenceNum && (
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 shrink-0" />
                <span className="font-mono text-xs">{taxpayer.providenceNum}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Total Multas"
          value={`Bs. ${fmt(totalFinesAmount)}`}
          color="text-red-400"
          sub={`${fines.length} multa${fines.length !== 1 ? 's' : ''}`}
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Pendiente"
          value={pending.length === 0 ? 'Al día' : `${pending.length} evento${pending.length !== 1 ? 's' : ''}`}
          color={pending.length === 0 ? 'text-green-400' : 'text-yellow-400'}
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Total Pagado"
          value={`Bs. ${fmt(totalPaymentsAmount)}`}
          color="text-green-400"
          sub={`${payments.length} pago${payments.length !== 1 ? 's' : ''}`}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Tasa de Cumplimiento"
          value={`${fmt(complianceRate)}%`}
          color={complianceRate >= 80 ? 'text-green-400' : complianceRate >= 50 ? 'text-yellow-400' : 'text-red-400'}
          sub={payResp.average_delay ? `Retraso prom.: ${payResp.average_delay}d` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pendientes */}
        <Section title="Eventos Pendientes" icon={<Clock className="w-4 h-4" />}>
          {pending.length === 0 ? (
            <div className="flex items-center justify-center gap-2 text-green-400 text-sm py-5">
              <CheckCircle className="w-4 h-4" /> Sin deudas pendientes
            </div>
          ) : (
            <div className="space-y-2">
              {(pending as FineRecord[]).map((e, i) => (
                <div key={e.id ?? i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-yellow-800/40">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{e.type}</p>
                    {e.date && <p className="text-xs text-slate-500">{fmtDate(e.date)}</p>}
                  </div>
                  <span className="text-yellow-400 font-bold text-sm">Bs. {fmt(e.debt ?? e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Historial de Multas */}
        <Section title={`Multas (${fines.length})`} icon={<AlertTriangle className="w-4 h-4" />}>
          {fines.length === 0 ? (
            <Empty msg="Sin multas registradas" />
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {fines.map((f) => (
                <div key={f.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={f.status
                          ? 'bg-green-900/50 text-green-200 border-green-800 text-[10px]'
                          : 'bg-red-900/50 text-red-200 border-red-800 text-[10px]'}>
                          {f.status ? 'Pagada' : 'Sin pagar'}
                        </Badge>
                        <span className="text-xs text-slate-500">{fmtDate(f.date)}</span>
                        {f.expires_at && <span className="text-xs text-slate-500">Vence: {fmtDate(f.expires_at)}</span>}
                      </div>
                      {f.description && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{f.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-red-400 font-bold text-sm">Bs. {fmt(f.amount)}</p>
                      {decimalToNumber(f.debt) > 0 && (
                        <p className="text-yellow-400 text-xs">Deuda: Bs. {fmt(f.debt)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {fineResp.fines_quantity !== undefined && (
            <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-700">
              <span>Cantidad total: <strong className="text-slate-300">{fineResp.fines_quantity}</strong></span>
              <span>Monto total: <strong className="text-red-400">Bs. {fmt(fineResp.total_amount)}</strong></span>
            </div>
          )}
        </Section>

        {/* Historial de Pagos */}
        <Section title={`Pagos (${payments.length})`} icon={<DollarSign className="w-4 h-4" />}>
          {payments.length === 0 ? (
            <Empty msg="Sin pagos registrados" />
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-400">{fmtDate(p.date)}</p>
                  <p className="text-green-400 font-bold text-sm">Bs. {fmt(p.amount)}</p>
                </div>
              ))}
            </div>
          )}
          {payments.length > 0 && (
            <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-700">
              <span>Número de pagos: <strong className="text-slate-300">{payResp.payments_number ?? payments.length}</strong></span>
              <span>Total: <strong className="text-green-400">Bs. {fmt(payResp.total_amount)}</strong></span>
            </div>
          )}
        </Section>

        {/* Reportes IVA */}
        <Section title={`Registros IVA (${ivaRecords.length})`} icon={<TrendingUp className="w-4 h-4" />}>
          {ivaRecords.length === 0 ? (
            <Empty msg="Sin reportes de IVA" />
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {[...ivaRecords].sort((a, b) => b.date.localeCompare(a.date)).map((r) => (
                <div key={r.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-semibold text-slate-300">{fmtDate(r.date)}</p>
                    {decimalToNumber(r.iva) > 0 && (
                      <span className="text-indigo-400 font-bold text-xs">IVA: Bs. {fmt(r.iva)}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>Ventas: <strong className="text-slate-200">Bs. {fmt(r.sells)}</strong></span>
                    <span>Compras: <strong className="text-slate-200">Bs. {fmt(r.purchases)}</strong></span>
                    {decimalToNumber(r.paid) > 0 && (
                      <span>Pagado: <strong className="text-green-400">Bs. {fmt(r.paid)}</strong></span>
                    )}
                    {decimalToNumber(r.excess) > 0 && (
                      <span>Excedente: <strong className="text-yellow-400">Bs. {fmt(r.excess)}</strong></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* IVA Performance mensual */}
      {hasIvaPerf && (
        <Section title="Rendimiento IVA por mes" icon={<BarChart3 className="w-4 h-4" />}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {ivaPerfEntries.map(({ month, label, perf, variation }) => {
              const perfStr = perf !== 0 ? `${perf.toFixed(2)}%` : '—';
              const isUp = variation > 0;
              const isDown = variation < 0;
              return (
                <div key={month} className="flex flex-col items-center p-2.5 bg-slate-900/50 rounded-lg border border-slate-700/50 gap-1">
                  <p className="text-xs text-slate-500 font-semibold uppercase">{label}</p>
                  <p className={`text-sm font-bold ${perf > 0 ? 'text-indigo-400' : 'text-slate-500'}`}>{perfStr}</p>
                  {variation !== 0 && (
                    <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-slate-500'}`}>
                      {isUp ? <ArrowUpRight className="w-3 h-3" /> : isDown ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      {Math.abs(variation).toFixed(2)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Reportes ISLR */}
      {islr.length > 0 && (
        <Section title={`Reportes ISLR (${islr.length})`} icon={<FileText className="w-4 h-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {islr.map((r) => (
              <div key={r.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-semibold">{fmtDate(r.emition_date)}</p>
                  {r.taxpayer?.process && (
                    <Badge className="bg-blue-900/40 text-blue-200 border-blue-800 text-[10px]">
                      {processLabel[r.taxpayer.process] ?? r.taxpayer.process}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <span>Ingresos: <strong className="text-slate-200">Bs. {fmt(r.incomes)}</strong></span>
                  <span>Costos: <strong className="text-slate-200">Bs. {fmt(r.costs)}</strong></span>
                  {r.expent !== undefined && (
                    <span>Gastos: <strong className="text-slate-200">Bs. {fmt(r.expent)}</strong></span>
                  )}
                  {r.paid !== undefined && (
                    <span>Pagado: <strong className="text-green-400">Bs. {fmt(r.paid)}</strong></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* PDFs adjuntos */}
      {((taxpayer.repair_reports?.length ?? 0) > 0 || (taxpayer.investigation_pdfs?.length ?? 0) > 0) && (
        <Section title="Documentos Adjuntos" icon={<FileText className="w-4 h-4" />}>
          <div className="flex flex-wrap gap-3">
            {taxpayer.repair_reports?.map((pdf, i) => (
              <a key={pdf.id} href={pdf.pdf_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-600/40 rounded-lg text-indigo-300 text-sm hover:bg-indigo-600/40 transition-all">
                <FileText className="w-4 h-4" /> Reparación #{i + 1}
              </a>
            ))}
            {taxpayer.investigation_pdfs?.map((pdf, i) => (
              <a key={pdf.id} href={pdf.pdf_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-600/40 rounded-lg text-purple-300 text-sm hover:bg-purple-600/40 transition-all">
                <FileText className="w-4 h-4" /> Investigación #{i + 1}
              </a>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
