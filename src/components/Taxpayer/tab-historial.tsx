import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/tabs';
import { Package, Receipt, FileSearch } from 'lucide-react';
import { EmptyState } from '@/components/UI/v2';
import EventTable from '@/components/Events/event-table';
import TaxSummaryTable from '@/components/iva/tax-summary-table';
import ISLRSummaryTable from '@/components/ISLR/islr-summary-table';
import CaseSelector from '@/components/Taxpayer/case-selector';
import { Event } from '@/types/event';
import { IVAReports } from '@/types/iva-reports';
import { ISLRReports } from '@/types/islr-reports';
import { TaxCase } from '@/types/tax-case';

/* ------------------------------------------------------------------ */
/*  TabHistorialExpediente                                             */
/*  Historial del expediente: selector de caso + sub-tabs de datos.    */
/* ------------------------------------------------------------------ */

export interface TabHistorialExpedienteProps {
  cases: TaxCase[];
  selectedCaseId: string | null;
  onSelectCase: (id: string | null) => void;
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  taxSummary: IVAReports[];
  setTaxSummary: React.Dispatch<React.SetStateAction<IVAReports[]>>;
  islrReports: ISLRReports[];
  setIslrReports: React.Dispatch<React.SetStateAction<ISLRReports[]>>;
  filteredEvents: Event[];
  onCreateCase: () => void;
  canEdit: boolean;
}

export default function TabHistorialExpediente({
  cases,
  selectedCaseId,
  onSelectCase,
  events,
  setEvents,
  taxSummary,
  setTaxSummary,
  islrReports,
  setIslrReports,
  filteredEvents,
  onCreateCase,
  canEdit,
}: TabHistorialExpedienteProps) {
  const [activeTab, setActiveTab] = useState('fine');

  return (
    <div className="space-y-4">
      {/* Selector de casos + botón Nuevo Caso */}
      <CaseSelector
        cases={cases}
        selectedCaseId={selectedCaseId}
        onSelect={onSelectCase}
        onCreateCase={onCreateCase}
      />

      {/* Sub-tabs compactos: Multas | IVA | ISLR */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900 border-slate-700 grid w-full grid-cols-3 h-auto flex-wrap gap-1 p-1">
          <TabsTrigger
            value="fine"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm min-h-[44px] py-2 touch-manipulation"
          >
            <Package className="h-4 w-4 mr-1 sm:mr-2 shrink-0" />
            <span className="truncate">Multas</span>
          </TabsTrigger>
          <TabsTrigger
            value="iva"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm min-h-[44px] py-2 touch-manipulation"
          >
            <Receipt className="h-4 w-4 mr-1 sm:mr-2 shrink-0" />
            <span className="truncate">IVA</span>
          </TabsTrigger>
          <TabsTrigger
            value="islr"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300 text-xs sm:text-sm min-h-[44px] py-2 touch-manipulation"
          >
            <FileSearch className="h-4 w-4 mr-1 sm:mr-2 shrink-0" />
            <span className="truncate">ISLR</span>
          </TabsTrigger>
        </TabsList>

        {/* ---- Multas / Eventos ---- */}
        <TabsContent value="fine" className="mt-4">
          <div className="compact-tables overflow-x-auto">
            {filteredEvents.length > 0 ? (
              <EventTable
                rows={filteredEvents}
                setRows={setEvents}
                canEdit={canEdit}
              />
            ) : (
              <EmptyState
                title="No hay eventos registrados"
                message="Agrega multas, avisos o pagos para ver el historial"
              />
            )}
          </div>
        </TabsContent>

        {/* ---- IVA ---- */}
        <TabsContent value="iva" className="mt-4">
          <div className="compact-tables overflow-x-auto">
            {taxSummary.length > 0 ? (
              <TaxSummaryTable
                rows={taxSummary}
                setRows={setTaxSummary}
                canEdit={canEdit}
              />
            ) : (
              <EmptyState
                title="No hay reportes de IVA"
                message="Agrega reportes de IVA para ver el historial"
              />
            )}
          </div>
        </TabsContent>

        {/* ---- ISLR ---- */}
        <TabsContent value="islr" className="mt-4">
          <div className="compact-tables overflow-x-auto">
            {islrReports.length > 0 ? (
              <ISLRSummaryTable
                rows={islrReports}
                setRows={setIslrReports}
                canEdit={canEdit}
              />
            ) : (
              <EmptyState
                title="No hay reportes de ISLR"
                message="Agrega declaraciones de ISLR para ver el historial"
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 
        Estilos inline para compactar tablas dentro de .compact-tables.
        Reducimos padding, fuente y espaciado para un layout más denso.
      */}
      <style>{`
        .compact-tables table {
          font-size: 0.8125rem;
        }
        .compact-tables thead th {
          padding: 0.5rem 0.75rem;
          font-size: 0.6875rem;
          letter-spacing: 0.05em;
        }
        .compact-tables tbody td {
          padding: 0.5rem 0.75rem;
        }
        .compact-tables tbody tr + tr {
          border-top-width: 1px;
        }
      `}</style>
    </div>
  );
}
