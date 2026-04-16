import { useState } from 'react';
import { useParams, useNavigate, useLoaderData, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  AlertTriangle, 
  DollarSign, 
  FileText, 
  Package,
  Receipt,
  FileSearch
} from 'lucide-react';
import { IndividualStats } from '@/components/stats/individual-stats';
import EventTable from '@/components/Events/event-table';
import TaxSummaryTable from '@/components/iva/tax-summary-table';
import ISLRSummaryTable from '@/components/ISLR/islr-summary-table';
import { Event } from '@/types/event';
import { IVAReports } from '@/types/iva-reports';
import { ISLRReports } from '@/types/islr-reports';
import { Fines } from '@/pages/router';
import { Payment } from '@/types/payment';
import { PageHeader, EmptyState, BackButton } from '@/components/UI/v2';
import { deleteTaxpayer } from '@/components/utils/api/taxpayer-functions';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/UI/dialog';

export default function TaxpayerDetailV2() {
  const { taxpayer } = useParams<{ taxpayer: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    events: initialEvents, 
    fines, 
    payments, 
    taxSummary: initialTaxSummary, 
    islrReports: initialIslrReports,
    taxpayerData
  } = useLoaderData() as { 
    events: Event[]; 
    fines: Fines; 
    payments: Payment; 
    taxSummary: IVAReports[]; 
    islrReports: ISLRReports[];
    taxpayerData: any;
  };

  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [taxSummary, setTaxSummary] = useState<IVAReports[]>(initialTaxSummary);
  const [islrReports, setIslrReports] = useState<ISLRReports[]>(initialIslrReports);
  const [activeTab, setActiveTab] = useState('fine');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isMyTaxpayer = user?.taxpayer?.some(t => t.id === taxpayer) || taxpayerData?.user?.id === user?.id;
  const canSeeAllOptions = user.role === "ADMIN" || isMyTaxpayer;
  const isHighRole = user.role === 'ADMIN' || user.role === 'COORDINATOR' || user.role === 'SUPERVISOR';
  const isAssignedFiscal =
    user.role === 'FISCAL' &&
    (taxpayerData?.officerId === user.id || taxpayerData?.user?.id === user.id || isMyTaxpayer);
  const canDeleteTaxpayer = isHighRole || isAssignedFiscal;

  const handleDeleteTaxpayer = async () => {
    if (!taxpayer || isDeleting || !canDeleteTaxpayer) return;

    try {
      setIsDeleting(true);
      const res = await deleteTaxpayer(taxpayer);
      if (!res) {
        toast.error('No se pudo eliminar el contribuyente.');
        return;
      }
      toast.success('Contribuyente eliminado correctamente.');
      setDeleteConfirmOpen(false);
      navigate('/admin');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo eliminar el contribuyente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const quickActions = [
    { name: 'Aviso', path: `/warning/${taxpayer}`, icon: Bell, color: '#f59e0b', ring: 'rgba(245,158,11,0.25)', text: '#fde68a' },
    { name: 'Multa', path: `/fine/${taxpayer}`, icon: AlertTriangle, color: '#f43f5e', ring: 'rgba(244,63,94,0.22)', text: '#fda4af' },
    { name: 'Pago', path: `/payment/${taxpayer}`, icon: DollarSign, color: '#10b981', ring: 'rgba(16,185,129,0.22)', text: '#6ee7b7' },
    { name: 'Compromiso de pago', path: `/payment_compromise/${taxpayer}`, icon: FileText, color: '#8b5cf6', ring: 'rgba(139,92,246,0.22)', text: '#c4b5fd' },
  ].filter(() => canSeeAllOptions);

  const tabs = [
    { id: 'fine', label: 'Multas', icon: Package },
    { id: 'iva', label: 'IVA', icon: Receipt },
    { id: 'islr', label: 'ISLR', icon: FileSearch },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 w-full max-w-full overflow-x-hidden">
      <style>{`
        /* ── Design tokens ── */
        .dp-root {
          --dp-base: #080f1c;
          --dp-surface: #0d1826;
          --dp-surface-2: #111f32;
          --dp-border: rgba(148,163,184,0.10);
          --dp-border-em: rgba(245,158,11,0.20);
          --dp-amber: #f59e0b;
          --dp-text-1: #f1f5f9;
          --dp-text-2: #94a3b8;
          --dp-text-3: #475569;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ── Quick Actions bar ── */
        .dp-actions-bar {
          background: var(--dp-surface);
          border: 1px solid var(--dp-border);
          border-radius: 12px;
          padding: 14px 16px;
        }
        .dp-actions-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--dp-text-3);
          margin-bottom: 16px;
          text-align: center;
        }
        .dp-actions-row {
          display: flex;
          gap: 12px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          padding-bottom: 4px;
        }
        .dp-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          border: 1px solid transparent;
          text-decoration: none;
          transition: opacity 0.15s, transform 0.1s;
          flex-shrink: 0;
        }
        .dp-action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .dp-action-btn:active { transform: translateY(0); }

        /* ── Underline Tabs ── */
        .dp-tabs-wrap {
          background: var(--dp-surface);
          border: 1px solid var(--dp-border);
          border-radius: 12px;
          overflow: hidden;
        }
        .dp-tabs-bar {
          display: flex;
          border-bottom: 1px solid var(--dp-border);
          padding: 0 4px;
        }
        .dp-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 12px 16px;
          font-size: 12px;
          font-weight: 600;
          color: var(--dp-text-3);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
          margin-bottom: -1px;
          white-space: nowrap;
        }
        .dp-tab-btn:hover { color: var(--dp-text-2); }
        .dp-tab-btn.active {
          color: var(--dp-amber);
          border-bottom-color: var(--dp-amber);
        }
        .dp-tab-icon {
          width: 14px; height: 14px;
          flex-shrink: 0;
        }
        .dp-tab-content {
          padding: 0;
        }
      `}</style>

      <div className="dp-root p-4 sm:p-6 md:p-8 w-full">
      <div className="max-w-[960px] mx-auto w-full">
        <PageHeader 
          title="Detalle del Contribuyente" 
          description="Gestión integral de expedientes y registros fiscales"
          action={<BackButton to="/admin" />}
        />

        <IndividualStats 
          events={events} 
          IVAReports={initialTaxSummary} 
          taxpayerData={taxpayerData}
        />

        {/* ── Acciones Rápidas ── */}
        {quickActions.length > 0 && (
          <div className="dp-actions-bar mt-4">
            <p className="dp-actions-label">Acciones Rápidas</p>
            <div className="dp-actions-row">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.name}
                    to={action.path}
                    className="dp-action-btn"
                    style={{
                      background: action.ring,
                      border: `1px solid ${action.ring}`,
                      color: action.text,
                    }}
                  >
                    <Icon size={13} style={{ color: action.color, flexShrink: 0 }} />
                    {action.name}
                  </Link>
                );
              })}
              {canDeleteTaxpayer && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={isDeleting}
                  className="dp-action-btn"
                  style={{
                    background: 'rgba(239,68,68,0.18)',
                    border: '1px solid rgba(239,68,68,0.35)',
                    color: '#fecaca',
                    opacity: isDeleting ? 0.7 : 1,
                  }}
                  title={isDeleting ? 'Eliminando...' : 'Eliminar contribuyente'}
                >
                  <AlertTriangle size={13} style={{ color: '#f87171', flexShrink: 0 }} />
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              )}
            </div>
          </div>
        )}

        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription className="text-slate-300">
                Esta acción eliminará el contribuyente de forma permanente y no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-md border border-slate-600 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteTaxpayer}
                disabled={isDeleting}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Historial ── */}
        <div className="dp-tabs-wrap mt-4">
          {/* Tab bar */}
          <div className="dp-tabs-bar">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`dp-tab-btn${activeTab === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="dp-tab-icon" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="dp-tab-content">
            {activeTab === 'fine' && (
              events.length > 0 ? (
                <EventTable rows={events} setRows={setEvents} canEdit={canSeeAllOptions} />
              ) : (
                <div className="px-4 py-6">
                  <EmptyState
                    title="No hay eventos registrados"
                    message="Agrega multas, avisos o pagos para ver el historial"
                  />
                </div>
              )
            )}

            {activeTab === 'iva' && (
              taxSummary.length > 0 ? (
                <TaxSummaryTable rows={taxSummary} setRows={setTaxSummary} canEdit={canSeeAllOptions} />
              ) : (
                <div className="px-4 py-6">
                  <EmptyState
                    title="No hay reportes de IVA"
                    message="Agrega reportes de IVA para ver el historial"
                  />
                </div>
              )
            )}

            {activeTab === 'islr' && (
              islrReports.length > 0 ? (
                <ISLRSummaryTable rows={islrReports} setRows={setIslrReports} canEdit={canSeeAllOptions} />
              ) : (
                <div className="px-4 py-6">
                  <EmptyState
                    title="No hay reportes de ISLR"
                    message="Agrega declaraciones de ISLR para ver el historial"
                  />
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
