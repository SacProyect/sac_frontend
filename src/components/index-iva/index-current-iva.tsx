import React, { useEffect, useState } from 'react';
import { getIndexIva } from '../utils/api/taxpayer-functions';
import { ShieldCheck, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { contract_type } from '@/types/taxpayer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface IndexIva {
  id: string;
  contract_type: contract_type;
  base_amount: string;
  created_at: string;
  expires_at: string | null;
  updated_at: string;
}

/**
 * IndexCurrentIva — Stat-row compacto que muestra los índices IVA vigentes en Bs.
 */
export default function IndexCurrentIva() {
  const [indices, setIndices] = useState<IndexIva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIndices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getIndexIva();
      const sortedData = Array.isArray(data)
        ? [...data].sort((a, b) =>
            a.contract_type === contract_type.ORDINARY ? -1
            : b.contract_type === contract_type.ORDINARY ? 1
            : 0
          )
        : [];
      setIndices(sortedData);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los índices actuales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndices();
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="flex-1 h-16 rounded-xl bg-slate-900/40 border border-slate-800 animate-pulse flex items-center px-4 gap-3"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-800/80" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2 w-24 rounded bg-slate-800/80" />
              <div className="h-2 w-16 rounded bg-slate-800/60" />
            </div>
            <div className="h-4 w-20 rounded bg-slate-800/60" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mb-6 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-950/30 border border-rose-500/15 text-rose-400">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span className="text-xs font-semibold flex-1">{error}</span>
        <button
          onClick={fetchIndices}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Reintentar
        </button>
      </div>
    );
  }

  // Empty state
  if (indices.length === 0) {
    return (
      <div className="mb-6 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-500">
        <span className="text-xs">No hay índices de IVA registrados aún.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
      {indices.map((index) => {
        const isSpecial = index.contract_type === contract_type.SPECIAL;
        const accentBorder = isSpecial
          ? 'border-emerald-500/20 hover:border-emerald-500/40'
          : 'border-indigo-500/20 hover:border-indigo-500/40';
        const barColor = isSpecial ? 'bg-emerald-500' : 'bg-indigo-500';
        const iconBg = isSpecial ? 'bg-emerald-500/10' : 'bg-indigo-500/10';
        const iconColor = isSpecial ? 'text-emerald-400' : 'text-indigo-400';
        const amountColor = isSpecial ? 'text-emerald-300' : 'text-indigo-300';
        const typeLabel = isSpecial ? 'Contribuyente Especial' : 'Contribuyente Ordinario';

        const amount = parseFloat(index.base_amount).toLocaleString('es-VE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        return (
          <div
            key={index.id}
            className={`flex-1 relative flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/40 border ${accentBorder} transition-colors duration-200 overflow-hidden`}
          >
            {/* Barra lateral de acento */}
            <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-e-full ${barColor} opacity-70`} />

            {/* Icono tipo */}
            <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
              {isSpecial
                ? <ShieldCheck className={`w-3.5 h-3.5 ${iconColor}`} />
                : <FileText className={`w-3.5 h-3.5 ${iconColor}`} />
              }
            </div>

            {/* Etiquetas */}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">
                {typeLabel}
              </span>
              <span className="text-[9px] text-slate-300 mt-0.5">
                Act. {format(new Date(index.updated_at), "dd MMM yyyy", { locale: es })}
              </span>
            </div>

            {/* Monto en Bs. */}
            <div className="flex items-baseline gap-1 shrink-0">
              <span className="text-[9px] font-bold text-slate-500 leading-none">Bs.</span>
              <span className={`text-base font-black font-mono tracking-tight leading-none ${amountColor}`}>
                {amount}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
