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
import { PageHeader, EmptyState } from '@/components/UI/v2';

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
    islrReports: initialIslrReports 
  } = useLoaderData() as { 
    events: Event[]; 
    fines: Fines; 
    payments: Payment; 
    taxSummary: IVAReports[]; 
    islrReports: ISLRReports[] 
  };

  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [taxSummary, setTaxSummary] = useState<IVAReports[]>(initialTaxSummary);
  const [islrReports, setIslrReports] = useState<ISLRReports[]>(initialIslrReports);
  const [activeTab, setActiveTab] = useState('fine');

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const matchedTaxpayer = user?.taxpayer?.find(t => t.id === taxpayer);
  const canSeeAllOptions = 
    user.role === "ADMIN" || (matchedTaxpayer && matchedTaxpayer.officerId === user.id);

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
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--dp-text-3);
          margin-bottom: 10px;
        }
        .dp-actions-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        .dp-actions-row::-webkit-scrollbar { display: none; }
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

      <div className="dp-root">
        <PageHeader
          title="Detalle del Contribuyente"
          description="Información completa y gestión de eventos"
        />

        <IndividualStats events={events} IVAReports={taxSummary} />

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
            </div>
          </div>
        )}

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
                <EventTable rows={events} setRows={setEvents} />
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
                <TaxSummaryTable rows={taxSummary} setRows={setTaxSummary} />
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
                <ISLRSummaryTable rows={islrReports} setRows={setIslrReports} />
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
  );
}
