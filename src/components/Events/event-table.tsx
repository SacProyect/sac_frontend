import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Event } from '@/types/event';
import { useAuth } from '@/hooks/use-auth';
import toast from 'react-hot-toast';
import { deleteEvent, updateEvent, updateFinePayment } from '../utils/api/taxpayer-functions';
import { Taxpayer } from '@/types/taxpayer';
import { decimalToNumber } from '../utils/number.utils';
import { MoreVertical, Pencil, Trash2, Check, X, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/UI/dropdown-menu';
import { getTaxpayerForEvents } from '../utils/api/taxpayer-functions';

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
  const { user } = useAuth();
  const [taxpayerArray, setTaxpayerArray] = useState<Taxpayer[]>([]);

  let columns = [
    { label: 'Tipo', id: 'type' },
    { label: 'Monto', id: 'amount' },
    { label: 'Fecha', id: 'date' },
    { label: 'Motivo', id: 'description' },
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
        setTaxpayerArray(response.data ?? []);
      } catch (e) {
        toast.error("No se pudieron obtener los contribuyentes.");
      }
    };

    fetchTaxpayers();
  }, []);


  return (
    <>
      <style>{`
        /* ── EventTable tokens ── */
        .et-wrap {
          --et-base: #0b1220;
          --et-surface: #111f32;
          --et-border: rgba(148,163,184,0.09);
          --et-border-row: rgba(148,163,184,0.07);
          --et-text-1: #e2e8f0;
          --et-text-2: #94a3b8;
          --et-text-3: #475569;
          --et-hover: rgba(148,163,184,0.05);
          --et-amber: #f59e0b;
          font-family: 'Inter', system-ui, sans-serif;
          width: 100%;
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: var(--et-border) transparent;
        }
        .et-wrap::-webkit-scrollbar { height: 4px; }
        .et-wrap::-webkit-scrollbar-thumb { background: var(--et-border); border-radius: 2px; }

        .et-table {
          width: 100%;
          min-width: 600px;
          border-collapse: collapse;
          font-size: 12.5px;
          table-layout: fixed; /* Added for sizing consistency */
        }

        /* ── Header ── */
        .et-thead tr {
          background: rgba(8,15,28,0.9);
          border-bottom: 1px solid var(--et-border);
        }
        .et-th {
          padding: 10px 14px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--et-text-3);
          text-align: left;
          white-space: nowrap;
        }
        .et-th.num { text-align: right; }
        .et-th.center { text-align: center; }

        /* ── Rows ── */
        .et-tr {
          border-bottom: 1px solid var(--et-border-row);
          transition: background 0.12s;
          position: relative;
        }
        .et-tr:hover { background: var(--et-hover); }
        .et-tr:last-child { border-bottom: none; }

        /* Strip cell */
        .et-td-strip {
          width: 3px;
          padding: 0;
          position: relative;
        }
        .et-strip {
          position: absolute;
          inset: 0;
          width: 3px;
        }

        .et-td {
          padding: 12px 14px;
          color: var(--et-text-1);
          vertical-align: middle;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .et-td.num {
          text-align: right;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          font-variant-numeric: tabular-nums;
          color: var(--et-text-2);
        }
        .et-td.muted { color: var(--et-text-2); font-size: 11.5px; }
        .et-td.center { 
          text-align: center;
          display: table-cell;
        }
        .et-td.center > * {
          margin: 0 auto;
        }

        /* ── Type badge ── */
        .et-type-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        /* ── Debt badge ── */
        .et-debt-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
        }
        .et-debt-badge.paid {
          background: rgba(16,185,129,0.12);
          color: #6ee7b7;
        }
        .et-debt-badge.unpaid {
          background: rgba(244,63,94,0.12);
          color: #fda4af;
        }

        /* ── Debt select ── */
        .et-debt-select {
          appearance: none;
          -webkit-appearance: none;
          padding: 3px 22px 3px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          border: none;
          outline: none;
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 6px center;
        }
        .et-debt-select.paid {
          background-color: rgba(16,185,129,0.12);
          color: #6ee7b7;
        }
        .et-debt-select.unpaid {
          background-color: rgba(244,63,94,0.12);
          color: #fda4af;
        }

        /* ── Edit input ── */
        .et-edit-input {
          width: 100%;
          padding: 5px 8px;
          background: rgba(148,163,184,0.08);
          border: 1px solid rgba(245,158,11,0.4);
          border-radius: 5px;
          color: var(--et-text-1);
          font-size: 12px;
          outline: none;
          box-sizing: border-box;
        }

        /* ── Menu button ── */
        .et-menu-btn {
          width: 28px; height: 28px;
          border-radius: 6px;
          background: transparent;
          border: 1px solid var(--et-border);
          color: var(--et-text-3);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.12s, color 0.12s;
        }
        .et-menu-btn:hover {
          background: rgba(148,163,184,0.10);
          color: var(--et-text-1);
        }
        .et-menu-btn.active {
          background: rgba(245,158,11,0.10);
          color: var(--et-amber);
          border-color: rgba(245,158,11,0.25);
        }

        /* ── Dropdown ── */
        .et-dropdown {
          position: fixed;
          z-index: 9999;
          background: #1e293b;
          border: 1px solid rgba(148,163,184,0.15);
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          min-width: 140px;
          padding: 4px;
          animation: etDropIn 0.12s ease;
        }
        @keyframes etDropIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .et-drop-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 7px 10px;
          border-radius: 5px;
          background: transparent;
          border: none;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.1s;
          text-align: left;
        }
        .et-drop-item.edit { color: #93c5fd; }
        .et-drop-item.edit:hover { background: rgba(59,130,246,0.10); }
        .et-drop-item.del  { color: #fda4af; }
        .et-drop-item.del:hover { background: rgba(244,63,94,0.10); }

        /* ── Inline edit bar ── */
        .et-edit-bar {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 10px 16px 14px;
          border-top: 1px solid var(--et-border);
        }
        .et-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          transition: opacity 0.15s;
        }
        .et-btn:hover { opacity: 0.85; }
        .et-btn.save { background: #059669; color: #f0fdf4; }
        .et-btn.cancel { background: transparent; border-color: rgba(148,163,184,0.2); color: #94a3b8; }
      `}</style>

      <div className="et-wrap">
        {pdfMode && <p className="py-4 text-lg text-slate-100">Historial de Multas</p>}

        <table className="et-table">
          <thead className="et-thead">
            <tr>
              <th style={{ width: 3, padding: 0 }} />
              {columns.map(col => (
                <th
                  key={col.id}
                  style={col.id === 'options' ? { width: '60px' } : (col.id === 'date' ? { width: '120px' } : {})}
                  className={`et-th${col.id === 'amount' ? ' num' : col.id === 'options' ? ' center' : ''}`}
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
                <tr key={row.id} className="et-tr">
                  {/* Color strip */}
                  <td className="et-td-strip">
                    <span className="et-strip" style={{ background: stripColor }} />
                  </td>

                  {columns.map(col => (
                    <td
                      key={col.id}
                      className={`et-td${col.id === 'amount' ? ' num' : col.id === 'description' ? ' muted' : col.id === 'options' ? ' center' : ''}`}
                    >
                      {/* Edit mode inputs */}
                      {isEditing && col.id !== 'options' && !['type', 'taxpayer', 'date', 'debt'].includes(col.id) ? (
                        <input
                          className="et-edit-input"
                          value={getEditInputValue(row, col.id as keyof Event)}
                          onChange={e => handleInputChange(col.id as keyof Event, e.target.value)}
                        />
                      ) : col.id === 'options' && !pdfMode && canEdit ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="et-menu-btn" title="Opciones">
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
                          <span className="et-type-badge" style={{ background: badge.bg, color: badge.color }}>
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
                            <select
                              className={`et-debt-select${isPaid ? ' paid' : ' unpaid'}`}
                              value={isPaid ? 'paid' : 'not_paid'}
                              onClick={e => e.stopPropagation()}
                              onChange={e => {
                                const selected = e.target.value as 'paid' | 'not_paid';
                                if (selected !== (isPaid ? 'paid' : 'not_paid')) {
                                  setPendingStatusChange({ id: row.id, newStatus: selected });
                                }
                              }}
                            >
                              <option value="not_paid">No pagada</option>
                              <option value="paid">Pagada</option>
                            </select>
                          ) : (
                            <span className={`et-debt-badge${isPaid ? ' paid' : ' unpaid'}`}>
                              {isPaid ? 'Pagada' : 'No pagada'}
                            </span>
                          )
                        ) : (
                          <span className={`et-debt-badge${isPaid ? ' paid' : ' unpaid'}`}>
                            {isPaid ? 'Pagada' : 'No pagada'}
                          </span>
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
          <div className="et-edit-bar">
            <button className="et-btn cancel" onClick={() => { setEditingRowId(null); setEditValues({}); }}>
              <X size={12} /> Cancelar
            </button>
            <button className="et-btn save" onClick={handleSave}>
              <Check size={12} /> Guardar cambios
            </button>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {eventIdToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm p-6 rounded-xl" style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)' }}>
            <p className="mb-4 text-sm text-slate-200">
              ¿Confirmar eliminación del evento?
            </p>
            <div className="flex justify-end gap-3">
              <button className="et-btn cancel" onClick={() => setEventIdToDelete(null)}><X size={12} /> Cancelar</button>
              <button className="et-btn" style={{ background: '#e11d48', color: 'white' }} onClick={confirmDelete}><Trash2 size={12} /> Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment status confirm modal */}
      {pendingStatusChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm p-6 rounded-xl" style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)' }}>
            <p className="mb-4 text-sm text-center text-slate-200">
              ¿Cambiar estado a{' '}
              <strong style={{ color: pendingStatusChange.newStatus === 'paid' ? '#6ee7b7' : '#fda4af' }}>
                {pendingStatusChange.newStatus === 'paid' ? 'Pagada' : 'No pagada'}
              </strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button className="et-btn cancel" onClick={() => setPendingStatusChange(null)}><X size={12} /> Cancelar</button>
              <button
                className="et-btn save"
                onClick={async () => {
                  const { id, newStatus } = pendingStatusChange;
                  const success = await handlePaymentChange(id, newStatus);
                  if (success) setPendingStatusChange(null);
                }}
              >
                <Check size={12} /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventTable;
