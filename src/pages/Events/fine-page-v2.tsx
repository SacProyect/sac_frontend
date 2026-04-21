import { useParams, Navigate, useLoaderData } from 'react-router-dom';
import { PageHeader } from '@/components/UI/v2';
import EventForm from '@/components/Events/event-form';
import { useAuth } from '@/hooks/use-auth';
import { AlertTriangle, Building2, Hash } from 'lucide-react';

export default function FinePageV2() {
  const { taxpayerId } = useParams();
  const { user } = useAuth();
  const data = useLoaderData() as { taxpayerData: any } | null;
  const taxpayerData = data?.taxpayerData;

  const isMyTaxpayer = user?.taxpayer?.some(t => t.id === taxpayerId) || taxpayerData?.user?.id === user?.id;
  const isAuthorized = user?.role === 'ADMIN' || isMyTaxpayer;

  if (!isAuthorized) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="space-y-5 sm:space-y-7 w-full max-w-full overflow-x-hidden">

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Registrar Multa</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Completa los campos para crear un nuevo registro de multa
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* Panel izquierdo: info del contribuyente (solo si llega por URL) */}
        {taxpayerData && (
          <div className="lg:col-span-1 rounded-2xl bg-slate-800/60 border border-slate-700/60 overflow-hidden">
            {/* Tira de color */}
            <div className="h-1.5 bg-gradient-to-r from-red-500/70 via-red-400/40 to-transparent" />
            <div className="p-5 space-y-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Contribuyente
              </p>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-700/60 text-slate-400 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight break-words">
                    {taxpayerData.name}
                  </p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{taxpayerData.rif}</p>
                </div>
              </div>

              {taxpayerData.providenceNum && (
                <div className="flex items-center gap-2 pt-3 border-t border-slate-700/40">
                  <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">N° Providencia</p>
                    <p className="text-xs font-semibold text-slate-300">{taxpayerData.providenceNum}</p>
                  </div>
                </div>
              )}

              {taxpayerData.process && (
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    taxpayerData.process === 'AF'  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                    taxpayerData.process === 'VDF' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' :
                    'bg-slate-700/60 text-slate-400 border border-slate-600/40'
                  }`}>
                    {taxpayerData.process}
                  </span>
                  {taxpayerData.emition_date && (
                    <span className="text-[10px] text-slate-500">
                      {new Date(taxpayerData.emition_date).toLocaleDateString('es-VE', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Formulario principal */}
        <div className={taxpayerData ? 'lg:col-span-2' : 'lg:col-span-3 max-w-2xl'}>
          <div className="rounded-2xl bg-slate-800/70 border border-slate-700/60 overflow-hidden backdrop-blur-sm">
            {/* Tira superior */}
            <div className="h-1 bg-gradient-to-r from-red-500 via-red-400/60 to-transparent" />

            {/* Cabecera */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-700/40">
              <div>
                <h2 className="text-base font-bold text-white">Nueva Multa</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {taxpayerId ? 'Registra una sanción para este contribuyente' : 'Busca y selecciona un contribuyente'}
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                Multa
              </span>
            </div>

            {/* Form */}
            <div className="px-5 py-5">
              <EventForm title="Multa" type="fine" taxpayerId={taxpayerId || ""} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
