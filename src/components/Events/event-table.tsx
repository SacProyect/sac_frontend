import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Event } from '@/types/event';
import { useAuth } from '@/hooks/use-auth';
import toast from 'react-hot-toast';
import { deleteEvent, updateEvent, updateFinePayment } from '../utils/api/taxpayer-functions';
import { Taxpayer } from '@/types/taxpayer';
import { decimalToNumber } from '../utils/number.utils';
import { MoreVertical, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/UI/dropdown-menu';
import { getTaxpayerForEvents } from '../utils/api/taxpayer-functions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/UI/dialog';
import { Button } from '@/components/UI/button';

interface EventTableProps {
  rows: Event[];
  setRows: React.Dispatch<React.SetStateAction<Event[]>>;
  pdfMode?: boolean;
  canEdit?: boolean;
}

const typeMapping: { [key: string]: string } = {
  FINE: 'MULTA',
  WARNING: 'AVISO',
  PAYMENT_COMPROMISE: 'COMPROMISO',
  payment: 'PAGO',
};

/** Left-strip color per event type */
const typeStrip: { [key: string]: string } = {
  FINE: '#f43f5e',
  WARNING: '#f59e0b',
  payment: '#10b981',
  PAYMENT_COMPROMISE: '#8b5cf6',
};

/** Badge style for type pill */
const typeBadge: { [key: string]: { bg: string; color: string } } = {
  FINE:               { bg: 'rgba(244,63,94,0.14)',   color: '#fda4af' },
  WARNING:            { bg: 'rgba(245,158,11,0.14)',   color: '#fde68a' },
  payment:            { bg: 'rgba(16,185,129,0.14)',   color: '#6ee7b7' },
  PAYMENT_COMPROMISE: { bg: 'rgba(139,92,246,0.14)',   color: '#c4b5fd' },
};

const EventTable: React.FC<EventTableProps> = ({ rows, setRows, pdfMode, canEdit }) => {
  const [sortColumn, setSortColumn] = useState<keyof Event>('type');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [eventIdToDelete, setEventIdToDelete] = useState<string | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Event>>({});
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    id: string;
    newStatus: 'paid' | 'not_paid';
  } | null>(null);
  const [paymentConfirmLoading, setPaymentConfirmLoading] = useState(false);
  const { user } = useAuth();
  const [taxpayerArray, setTaxpayerArray] = useState<Taxpayer[]>([]);

  let columns = [
    { label: 'Tipo', id: 'type' },
    { label: 'Monto', id: 'amount' },
    { label: 'Fecha', id: 'date' },
    { label: 'Motivo', id: 'description' },
    { label: 'Caso', id: 'tax_case_id' },
    { label: 'Estado', id: 'debt' },
  ];

  columns = canEdit
    ? [...columns, { label: '', id: 'options' }]
    : columns;

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return String(aVal).localeCompare(String(bVal));
    });
  }, [rows, sortColumn, sortDirection]);

  const handleInputChange = (field: keyof Event, value: string) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  const getEditInputValue = (row: Event, field: keyof Event) => {
    const currentValue = editValues[field] ?? row[field];
    if (field === 'amount') return String(decimalToNumber(currentValue));
    return String(currentValue ?? '');
  };

  const handleSave = async () => {
    if (!editingRowId) return;
    try {
      const { taxpayer, taxpayerId, date, officerId, ...rest } = editValues;
      const normalizedAmount =
        editValues.amount !== undefined
          ? Number(String(editValues.amount).replace(',', '.')) || decimalToNumber(editValues.amount)
          : undefined;
      const sanitizedPayload = {
        ...rest,
        ...(normalizedAmount !== undefined ? { amount: normalizedAmount } : {}),
        id: editingRowId,
        type: editValues.type,
      };
      const updatedEvent = await updateEvent(sanitizedPayload);
      setRows(prev => prev.map(row => (row.id === editingRowId ? { ...row, ...updatedEvent } : row)));
      toast.success('Evento actualizado');
      setEditingRowId(null);
      setEditValues({});
    } catch {
      toast.error('Error al guardar');
    }
  };

  const confirmDelete = async () => {
    if (!eventIdToDelete) return;
    try {
      await deleteEvent(eventIdToDelete);
      toast.success('Evento eliminado');
      setRows(prev => prev.filter(row => row.id !== eventIdToDelete));
      setEventIdToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  const handlePaymentChange = async (id: string, newStatus: 'paid' | 'not_paid'): Promise<boolean> => {
    try {
      await updateFinePayment(id, newStatus);
      toast.success('Estado de pago actualizado.');
      setRows(prevRows =>
        prevRows.map(row =>
          row.id.startsWith(id) ? { ...row, debt: newStatus === 'paid' ? 0 : 1 } : row
        )
      );
      return true;
    } catch {
      toast.error('Error actualizando el pago de la multa.');
      return false;
    }
  };


  useEffect(() => {
    const fetchTaxpayers = async () => {
      try {
        const response = await getTaxpayerForEvents();
        const body = response.data as { data?: Taxpayer[] } | Taxpayer[];
        setTaxpayerArray(Array.isArray(body) ? body : (body?.data ?? []));
      } catch (e) {
        toast.error("No se pudieron obtener los contribuyentes.");
      }
    };

    fetchTaxpayers();
  }, []);


  return (
    <>
      <div className="w-full overflow-x-auto scrollbar-thin font-sans">
        {pdfMode && <p className="py-4 text-lg text-slate-100">Historial de Multas</p>}

        <table className="w-full min-w-[600px] border-collapse text-[12.5px] table-layout-fixed">
          <thead>
            <tr className="bg-slate-950/90 border-b border-slate-700/9">
              <th className="w-[3px] p-0" />
              {columns.map(col => (
                <th
                  key={col.id}
                  style={col.id === 'options' ? { width: '60px' } : (col.id === 'date' ? { width: '120px' } : {})}
                  className={`py-2.5 px-3.5 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500 text-left whitespace-nowrap${col.id === 'amount' ? ' text-right' : col.id === 'options' ? ' text-center' : ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedRows.map(row => {
              const stripColor = typeStrip[row.type] ?? '#64748b';
              const badge = typeBadge[row.type];
              const isEditing = editingRowId === row.id;
              const isPaid = (row.debt ?? 0) === 0;

              const canChangeDebt = row.type === 'FINE' && !!canEdit;

              return (
                <tr key={row.id} className="border-b border-slate-800/7 transition-colors duration-150 relative hover:bg-slate-800/5 last:border-b-0">
                  {/* Color strip */}
                  <td className="w-[3px] p-0 relative">
                    <span className="absolute inset-0 w-[3px]" style={{ background: stripColor }} />
                  </td>

                  {columns.map(col => (
                    <td
                      key={col.id}
                      className={`px-3.5 py-3 text-slate-200 align-middle overflow-hidden text-ellipsis whitespace-nowrap${col.id === 'amount' ? ' text-right font-mono text-xs text-slate-400 tabular-nums' : col.id === 'description' ? ' text-slate-400 text-[11.5px]' : col.id === 'options' ? ' text-center table-cell [&>*]:mx-auto' : ''}`}
                    >
                      {/* Edit mode inputs */}
                      {isEditing && col.id !== 'options' && !['type', 'taxpayer', 'date', 'debt'].includes(col.id) ? (
                        <input
                          className="w-full py-1 px-2 bg-slate-700/30 border border-amber-400/40 rounded text-sm text-slate-200 outline-none box-border"
                          value={getEditInputValue(row, col.id as keyof Event)}
                          onChange={e => handleInputChange(col.id as keyof Event, e.target.value)}
                        />
                      ) : col.id === 'options' && !pdfMode && canEdit ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="w-7 h-7 rounded-md bg-transparent border border-slate-700/9 text-slate-500 flex items-center justify-center cursor-pointer transition-colors hover:bg-slate-700/10 hover:text-slate-200"
                              title="Opciones"
                            >
                              <MoreVertical size={13} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1e293b] border-slate-700 min-w-[140px] text-slate-200 p-1">
                            <DropdownMenuItem 
                              className="flex items-center gap-2 cursor-pointer text-blue-300 focus:bg-slate-800 focus:text-blue-200 rounded-md px-2 py-1.5"
                              onClick={() => {
                                setEditingRowId(row.id);
                                setEditValues(row);
                              }}
                            >
                              <Pencil size={12} /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="flex items-center gap-2 cursor-pointer text-rose-300 focus:bg-slate-800 focus:text-rose-200 rounded-md px-2 py-1.5"
                              onClick={() => setEventIdToDelete(row.id)}
                            >
                              <Trash2 size={12} /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : col.id === 'type' ? (
                        badge ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider whitespace-nowrap" style={{ background: badge.bg, color: badge.color }}>
                            {typeMapping[row.type] ?? row.type}
                          </span>
                        ) : (typeMapping[row.type] ?? row.type)
                      ) : col.id === 'date' ? (
                        new Date(row.date).toLocaleDateString('es-VE')
                      ) : col.id === 'amount' ? (
                        `${decimalToNumber(row.amount).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`
                      ) : col.id === 'debt' ? (
                        row.type === 'FINE' ? (
                          canChangeDebt ? (
                            isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/12 text-emerald-300" title="Multa pagada — no se puede revertir">
                                Pagada
                              </span>
                            ) : (
                              <select
                                className="appearance-none px-2 py-0.5 pl-2 pr-6 rounded-full text-[10px] font-bold tracking-wider leading-[1.35] outline-none cursor-pointer transition-all bg-red-900/35 border border-rose-400/50 text-rose-300 shadow-[0_1px_1px_rgba(0,0,0,0.3)] hover:border-rose-300/75 hover:bg-red-900/40 focus-visible:outline-2 focus-visible:outline-indigo-400/55 focus-visible:outline-offset-1"
                                style={{
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23fb7185' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: 'right 6px center',
                                  backgroundSize: '10px 10px',
                                }}
                                value="not_paid"
                                onClick={e => e.stopPropagation()}
                                onChange={e => {
                                  const selected = e.target.value as 'paid' | 'not_paid';
                                  if (selected === 'paid') {
                                    setPendingStatusChange({ id: row.id, newStatus: 'paid' });
                                  }
                                }}
                              >
                                <option value="not_paid" style={{ background: '#0f172a', color: '#e2e8f0', fontWeight: 600, fontSize: 12, padding: '6px 8px' }}>No pagada</option>
                                <option value="paid" style={{ background: '#022c22', color: '#6ee7b7', fontWeight: 600, fontSize: 12, padding: '6px 8px' }}>Pagada</option>
                              </select>
                            )
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isPaid ? 'bg-emerald-500/12 text-emerald-300' : 'bg-rose-500/12 text-rose-300'}`}>
                              {isPaid ? 'Pagada' : 'No pagada'}
                            </span>
                          )
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isPaid ? 'bg-emerald-500/12 text-emerald-300' : 'bg-rose-500/12 text-rose-300'}`}>
                            {isPaid ? 'Pagada' : 'No pagada'}
                          </span>
                        )
                      ) : col.id === 'tax_case_id' ? (
                        row.tax_case_id ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-900/30 text-blue-300">
                            Caso
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )
                      ) : (
                        String(row[col.id as keyof Event])
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Inline edit save bar */}
        {editingRowId && (
          <div className="flex justify-end gap-2 px-4 pt-2.5 pb-3.5 border-t border-slate-800/50">
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer border border-transparent transition-opacity hover:opacity-85 bg-transparent border-slate-700/20 text-slate-400"
              onClick={() => { setEditingRowId(null); setEditValues({}); }}
            >
              <X size={12} /> Cancelar
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer border border-transparent transition-opacity hover:opacity-85 bg-emerald-600 text-green-50"
              onClick={handleSave}
            >
              <Check size={12} /> Guardar cambios
            </button>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      <Dialog open={!!eventIdToDelete} onOpenChange={(open) => { if (!open) setEventIdToDelete(null); }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-slate-400">
              ¿Confirmar eliminación del evento?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEventIdToDelete(null)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <X size={12} /> Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 size={12} /> Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment status confirm modal (solo transición a Pagada) */}
      <Dialog open={!!pendingStatusChange} onOpenChange={(open) => { if (!open && !paymentConfirmLoading) setPendingStatusChange(null); }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle>Confirmar Pago</DialogTitle>
            <DialogDescription className="text-slate-400">
              ¿Confirmar que la multa queda como{' '}
              <strong className="text-emerald-300">Pagada</strong>?
              <br />
              <span className="text-xs text-slate-500">Esta acción no se puede deshacer.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={paymentConfirmLoading}
              onClick={() => {
                if (!paymentConfirmLoading) setPendingStatusChange(null);
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <X size={12} /> Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={paymentConfirmLoading}
              onClick={async () => {
                if (!pendingStatusChange || paymentConfirmLoading) return;
                setPaymentConfirmLoading(true);
                try {
                  const { id, newStatus } = pendingStatusChange;
                  const success = await handlePaymentChange(id, newStatus);
                  if (success) setPendingStatusChange(null);
                } finally {
                  setPaymentConfirmLoading(false);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {paymentConfirmLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin shrink-0" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check size={12} /> Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventTable;
