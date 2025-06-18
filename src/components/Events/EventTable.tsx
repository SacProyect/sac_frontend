import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Event } from '@/types/event';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { deleteEvent, updateIva } from '../utils/api/taxpayerFunctions';

interface EventTableProps {
  rows: Event[];
  setRows: React.Dispatch<React.SetStateAction<Event[]>>;
  pdfMode?: boolean;
}

const typeMapping: { [key: string]: string } = {
  FINE: "MULTA",
  WARNING: "AVISO",
  PAYMENT_COMPROMISE: "COMPROMISO DE PAGO",
  payment: "PAGO"
};

const EventTable: React.FC<EventTableProps> = ({ rows, setRows, pdfMode }) => {
  const [sortColumn, setSortColumn] = useState<keyof Event>('type');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [eventIdToDelete, setEventIdToDelete] = useState<string | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Event>>({});
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { user } = useAuth();

  const columns = [
    { label: "Tipo", id: "type" },
    { label: "Contribuyente", id: "taxpayer" },
    { label: "Monto", id: "amount" },
    { label: "Fecha", id: "date" },
    { label: "Motivo", id: "description" },
    { label: "Estado", id: "debt" },
    { label: "Acciones", id: "options" },
  ];

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

  const handleSave = async () => {
    if (!editingRowId) return;
    try {
      // await updateIva({ ...editValues });
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

  const toggleMenu = (id: string) => {
    setActiveMenuId(prev => (prev === id ? null : id));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedOutsideAll = Object.values(menuRefs.current).every(
        ref => !ref?.contains(event.target as Node)
      );
      if (clickedOutsideAll) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full mx-auto overflow-auto lg:max-w-5xl custom-scroll">
      {pdfMode && <p className="py-4 text-lg">Historial de Multas</p>}
      <table className="relative w-full overflow-visible text-sm border-collapse">
        <thead className="text-white bg-[#2C3E50]">
          <tr>
            {columns.map((col, index) => (
              <th
                key={col.id}
                className={`px-4 py-2 font-semibold ${index === 0 ? 'rounded-tl-md' : index === columns.length - 1 ? 'rounded-tr-md' : ''
                  }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="overflow-visible">
          {sortedRows.map(row => (
            <tr key={row.id} className="border-b hover:bg-gray-100">
              {columns.map(col => (
                <td key={col.id} className="relative px-4 py-2">
                  {editingRowId === row.id && col.id !== 'options' ? (
                    <input
                      className="w-full px-2 py-1 border rounded"
                      value={String(editValues[col.id as keyof Event] ?? '')}
                      onChange={e => handleInputChange(col.id as keyof Event, e.target.value)}
                    />
                  ) : col.id === 'options' && user?.role === 'ADMIN' ? (
                    <div
                      className="relative inline-block"
                      ref={el => { menuRefs.current[row.id] = el; }}
                    >
                      <button onClick={() => toggleMenu(row.id)} className="text-gray-600 hover:text-gray-900">
                        ⋮
                      </button>
                      {activeMenuId === row.id && (
                        <div className="fixed z-50 mt-1 bg-white border rounded shadow-md">
                          <button
                            onClick={() => {
                              setEditingRowId(row.id);
                              setEditValues(row);
                              setActiveMenuId(null);
                            }}
                            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              setEventIdToDelete(row.id);
                              setActiveMenuId(null);
                            }}
                            className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  ) : col.id === 'type' ? (
                    typeMapping[row[col.id]] || row[col.id]
                  ) : col.id === 'date' ? (
                    new Date(row.date).toLocaleDateString()
                  ) : col.id === 'amount' ? (
                    `${row.amount} Bs`
                  ) : col.id === 'debt' ? (
                    (row.debt ?? 0) > 0 ? 'No pagada' : 'Pagada'
                  ) : (
                    String(row[col.id as keyof Event])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {editingRowId && (
        <div className="flex justify-end gap-4 mt-4">
          <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700">
            Guardar cambios
          </button>
          <button onClick={() => { setEditingRowId(null); setEditValues({}); }} className="px-4 py-2 text-sm border rounded">
            Cancelar
          </button>
        </div>
      )}

      {eventIdToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="p-6 bg-white rounded shadow-md">
            <p className="mb-4">¿Está seguro que desea eliminar el evento con ID: <strong>{eventIdToDelete}</strong>?</p>
            <div className="flex justify-center gap-4">
              <button onClick={confirmDelete} className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700">
                Confirmar
              </button>
              <button onClick={() => setEventIdToDelete(null)} className="px-4 py-2 border rounded">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventTable;
