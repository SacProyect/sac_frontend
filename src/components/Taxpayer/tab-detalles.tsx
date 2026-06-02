import React from "react";
import { Settings, Edit2 } from "lucide-react";
import { IndividualStatsLeftSkeleton } from "@/components/stats/individual-stats";
import { ObservationsPanel } from "@/components/observations/observations-panel";
import { TaxpayerData } from "../stats/use-taxpayer-detail";

/* ─── Types ─────────────────────────────────────────────────── */

interface TabDetallesContribuyenteProps {
  taxpayerData: TaxpayerData | undefined;
  loadingDetails: boolean;
  events: Event[];
  observations: any[];
  canEditIndex: boolean;
  canEditTaxpayer: boolean;
  showEditModal: boolean;
  setShowEditModal: (v: boolean) => void;
  setNewIndexIva: (v: string) => void;
  setShowIndexModal: (v: boolean) => void;
  onTaxpayerDataUpdate: (data: TaxpayerData) => void;
  formatCurrency: (value: unknown) => string;
  fines: number;
  taxpayerId?: string;
}

/* ─── Component ──────────────────────────────────────────────── */

export function TabDetallesContribuyente({
  taxpayerData,
  loadingDetails,
  observations,
  canEditIndex,
  canEditTaxpayer,
  setShowEditModal,
  setNewIndexIva,
  setShowIndexModal,
  formatCurrency,
  fines,
  taxpayerId,
}: TabDetallesContribuyenteProps) {
  return (
    <div className="w-full text-slate-100 mt-4 px-4 sm:px-6 lg:px-0 lg:mt-0 overflow-x-hidden">
      <div className="flex flex-col lg:flex-row w-full max-w-full shadow-xl rounded-xl overflow-hidden border border-slate-700/90 bg-slate-800">

        {/* ── Columna Izquierda — Datos del Contribuyente ── */}
        {loadingDetails && !taxpayerData ? (
          <IndividualStatsLeftSkeleton />
        ) : (
          <div className="w-full min-w-0 p-4 sm:p-5 lg:p-6 lg:w-1/2 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-slate-700/80 bg-slate-800/90">

            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CONTRIBUYENTE</p>
                <p className="text-[15px] font-bold text-slate-100 leading-snug break-words">
                  {taxpayerData?.name ?? '—'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Contract type badge */}
                {taxpayerData?.contract_type && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${taxpayerData.contract_type === 'SPECIAL' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {taxpayerData.contract_type === 'SPECIAL' ? 'ESPECIAL' : 'ORDINARIO'}
                  </span>
                )}
                {canEditIndex && (
                  <button
                    type="button"
                    className="p-1 rounded-md border border-slate-600/30 bg-slate-900/50 text-slate-400 cursor-pointer transition-colors duration-150 flex items-center justify-center hover:bg-slate-700/30 hover:text-slate-200"
                    title="Editar índice IVA"
                    onClick={() => {
                      setNewIndexIva(taxpayerData?.currentEffectiveIndex != null ? String(taxpayerData.currentEffectiveIndex) : '');
                      setShowIndexModal(true);
                    }}
                  >
                    <Settings size={15} />
                  </button>
                )}

                {/* Botón Editar Contribuyente */}
                {canEditTaxpayer && taxpayerData && (
                  <button
                    type="button"
                    className="p-1 rounded-md border border-slate-600/30 bg-slate-900/50 text-slate-400 cursor-pointer transition-colors duration-150 flex items-center justify-center hover:bg-slate-700/30 hover:text-slate-200"
                    title="Editar Información"
                    onClick={() => setShowEditModal(true)}
                  >
                    <Edit2 size={15} />
                  </button>
                )}
              </div>
            </div>

            <hr className="h-px bg-slate-700/20 border-0 my-0.5" />

            {/* Fields grid — 3 groups */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
              {/* Grupo 1 — Identificación */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RIF</span>
                <span className="text-[13px] font-medium text-slate-100 leading-snug break-words" style={{fontFamily:'monospace'}}>{taxpayerData?.rif ?? '—'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">N° Providencia</span>
                <span className="text-[13px] font-medium text-slate-100 leading-snug break-words">{taxpayerData?.providenceNum ?? '—'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proceso</span>
                <span className="text-[13px] font-medium text-slate-100 leading-snug break-words">
                  {(() => {
                    const p = taxpayerData?.process;
                    if (!p) return '—';
                    const labels: Record<string, string> = {
                      FP: 'Fiscalización Parcial',
                      AF: 'Auditoría Fiscal',
                      VDF: 'Verificación de Datos Fiscales',
                    };
                    const colors: Record<string, string> = {
                      FP: '#facc15',
                      AF: '#f87171',
                      VDF: '#60a5fa',
                    };
                    const label = labels[p] ?? p;
                    const color = colors[p] ?? '#94a3b8';
                    return (
                      <span
                        className="inline-flex items-center rounded-full text-[11px] font-bold tracking-wide"
                        style={{
                          background: `${color}22`,
                          color,
                          border: `1px solid ${color}44`,
                        }}
                      >
                        {label}
                      </span>
                    );
                  })()}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 col-span-full">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Actividad Comercial</span>
                <span className="text-[13px] font-medium text-slate-100 leading-snug break-words">{taxpayerData?.taxpayer_category?.name ?? '—'}</span>
              </div>

              {/* Grupo 2 — Ubicación y control */}
              <div className="flex flex-col gap-0.5 mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Parroquia</span>
                <span className="text-[13px] font-medium text-slate-100 leading-snug break-words">{taxpayerData?.parish?.name ?? '—'}</span>
              </div>
              <div className="flex flex-col gap-0.5 mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fecha de Emisión</span>
                <span className="text-[13px] font-medium text-slate-100 leading-snug break-words">
                  {taxpayerData?.emition_date
                    ? new Date(taxpayerData.emition_date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado</span>
                <span className="text-[13px] font-medium text-slate-100 leading-snug break-words">
                  {(() => {
                    if (taxpayerData?.culminated) {
                      return (
                        <span className="inline-flex items-center rounded-full text-[11px] font-bold tracking-wide" style={{background:'#16a34a22',color:'#4ade80',border:'1px solid #16a34a44'}}>
                          Culminado
                        </span>
                      );
                    }
                    if (taxpayerData?.notified) {
                      return (
                        <span className="inline-flex items-center rounded-full text-[11px] font-bold tracking-wide" style={{background:'#2563eb22',color:'#60a5fa',border:'1px solid #2563eb44'}}>
                          Notificado
                        </span>
                      );
                    }
                    return (
                      <span className="inline-flex items-center rounded-full text-[11px] font-bold tracking-wide" style={{background:'#d9770622',color:'#fbbf24',border:'1px solid #d9770644'}}>
                        Pendiente
                      </span>
                    );
                  })()}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 col-span-full mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dirección</span>
                <span className="text-[13px] font-medium text-slate-100 leading-snug break-words" style={{fontSize:'12px'}}>{taxpayerData?.address ?? '—'}</span>
              </div>

              {/* Grupo 3 — Gestión fiscal */}
              <div className="flex flex-col gap-0.5 mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Multas</span>
                <span className="text-[13px] font-medium text-slate-100 leading-snug break-words">{fines}</span>
              </div>
              <div className="flex flex-col gap-0.5 mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Índice IVA Efectivo</span>
                <span className="text-[13px] font-medium text-slate-100 leading-snug break-words">{taxpayerData?.currentEffectiveIndex != null ? formatCurrency(taxpayerData.currentEffectiveIndex) : '—'}</span>
              </div>
              <div className="flex flex-col gap-0.5 mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Excedente IVA</span>
                <span className="text-[13px] font-medium text-slate-100 leading-snug break-words">{taxpayerData?.IVAReports?.[0]?.excess != null ? formatCurrency(taxpayerData.IVAReports[0].excess) : '—'}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Columna Derecha — Observaciones ── */}
        <div className="flex flex-col w-full min-w-0 lg:w-1/2 border-t lg:border-t-0 lg:border-l border-slate-700/50 min-h-[300px] lg:min-h-[420px] bg-slate-900/50">
          <ObservationsPanel taxpayerId={taxpayerId} initialObservations={observations ?? []} />
        </div>
      </div>
    </div>
  );
}
