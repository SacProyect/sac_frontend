<<<<<<< HEAD
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Event } from '@/types/event';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { deleteEvent, getTaxpayerForEvents, updateEvent, updateFinePayment } from '../utils/api/taxpayerFunctions';
import { Taxpayer } from '@/types/taxpayer';

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
  const [taxpayerArray, setTaxpayerArray] = useState<Taxpayer[]>([]);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    id: string;
    newStatus: "paid" | "not_paid";
  } | null>(null);
  const { user } = useAuth();

  let columns = [
    { label: "Tipo", id: "type" },
    { label: "Contribuyente", id: "taxpayer" },
    { label: "Monto", id: "amount" },
    { label: "Fecha", id: "date" },
    { label: "Motivo", id: "description" },
    { label: "Estado", id: "debt" },
  ];

  columns = user?.role === 'ADMIN'
    ? [...columns, { label: "Acciones", id: "options" }]
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

  const handleSave = async () => {
    if (!editingRowId) return;
    try {
      const cleanId = editingRowId;

      const { taxpayer, taxpayerId, date, officerId, ...rest } = editValues;
      const sanitizedPayload = {
        ...rest,
        id: cleanId,
        type: editValues.type, // aseguras que el type sí se mande
      };

      const updatedEvent = await updateEvent(sanitizedPayload);

      setRows(prev =>
        prev.map(row => (row.id === cleanId ? { ...row, ...updatedEvent } : row))
      );
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

  const handlePaymentChange = async (id: string, newStatus: "paid" | "not_paid"): Promise<boolean> => {
    try {
      await updateFinePayment(id, newStatus);
      toast.success("Estado de pago actualizado.");
      setRows(prevRows =>
        prevRows.map(row =>
          row.id.startsWith(id) ? { ...row, debt: newStatus === "paid" ? 0 : 1 } : row
        )
      );
      return true;
    } catch {
      toast.error("Error actualizando el pago de la multa.");
      return false;
    }
  };


  useEffect(() => {
    const fetchTaxpayers = async () => {
      try {
        const response = await getTaxpayerForEvents();
        setTaxpayerArray(response.data);
      } catch (e) {
        toast.error("No se pudieron obtener los contribuyentes.");
      }
    };

    fetchTaxpayers();
  }, []);


  return (
    <div className="w-full mx-auto overflow-auto lg:max-w-5xl custom-scroll">
      {pdfMode && <p className="py-4 text-lg">Historial de Multas</p>}
      <table className="relative w-full overflow-visible text-sm border-collapse">
        <thead className="text-white bg-[#2C3E50]">
          <tr>
            {columns.map((col, index) => (
              <th key={col.id} className={`px-4 py-2 font-semibold ${index === 0 ? 'rounded-tl-md' : index === columns.length - 1 ? 'rounded-tr-md' : ''}`}>
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
                  {editingRowId === row.id && col.id !== 'options' && !['type', 'taxpayer', 'date', "debt"].includes(col.id) ? (
                    <input
                      className="w-full px-2 py-1 border rounded"
                      value={String(editValues[col.id as keyof Event] ?? '')}
                      onChange={e => handleInputChange(col.id as keyof Event, e.target.value)}
                    />
                  ) : col.id === 'options' && !pdfMode && user?.role === 'ADMIN' ? (
                    <div className="relative inline-block" ref={el => { menuRefs.current[row.id] = el; }}>
                      <button onClick={() => toggleMenu(row.id)} className="text-gray-600 hover:text-gray-900">⋮</button>
                      {activeMenuId === row.id && (
                        <div className="fixed z-50 mt-1 bg-white border rounded shadow-md bottom-28 right-4 lg:bottom-4 lg:right-4">
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
                    row.type === "FINE" ? (
                      user?.role === "ADMIN" ||
                        (user?.role === "FISCAL" &&
                          taxpayerArray?.some(t => t.id === row.taxpayerId && t.officerId === user.id)) || (
                          user?.role === "SUPERVISOR" &&
                          (
                            taxpayerArray.some(t => t.id === row.taxpayerId && t.officerId === user.id) ||
                            user.supervised_members?.some(m =>
                              m.id === row.officerId
                            )
                          )
                        ) ? (
                        <select
                          value={(row.debt ?? 0) > 0 ? "not_paid" : "paid"}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const selected = e.target.value as "paid" | "not_paid";
                            if (selected !== ((row.debt ?? 0) > 0 ? "not_paid" : "paid")) {
                              setPendingStatusChange({ id: row.id, newStatus: selected });
                            }
                          }}
                          className={`rounded px-2 py-1 text-xs text-white cursor-pointer ${(row.debt ?? 0) > 0 ? 'bg-red-600' : 'bg-green-600'}`}
                        >
                          <option value="not_paid" className="text-white bg-red-600">No pagada</option>
                          <option value="paid" className="text-white bg-green-600">Pagada</option>
                        </select>
                      ) : ((row.debt ?? 0) > 0 ? 'No pagada' : 'Pagada')
                    ) : (
                      (row.debt ?? 0) > 0 ? 'No pagada' : 'Pagada'
                    )
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

      {pendingStatusChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-full max-w-sm p-6 bg-white rounded-md shadow-xl">
            <p className="mb-4 text-center text-gray-800">
              ¿Confirmas cambiar el estado a <strong>{pendingStatusChange.newStatus === "paid" ? "Pagada" : "No pagada"}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
                onClick={async () => {
                  const { id, newStatus } = pendingStatusChange;
                  const success = await handlePaymentChange(id, newStatus);
                  if (success) setPendingStatusChange(null);
                }}
              >
                Confirmar
              </button>
              <button
                className="px-4 py-2 border rounded"
                onClick={() => setPendingStatusChange(null)}
              >
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
=======
import React from 'react'
import { useState } from 'react'
import { Table } from 'react-aria-components'
import InfoTableHeader from '../UI/InfoTable/InfoTableHeader'
import { TableBody } from 'react-aria-components'
import { useMemo } from 'react'
import InfoTableColumn from '../UI/InfoTable/InfoTableColumn'
import InfoTableRow from '../UI/InfoTable/InfoTableRow'
import { Cell } from 'react-aria-components'
import toast from 'react-hot-toast'
import { updateFinePayment } from '../utils/api/taxpayerFunctions'
import { Event } from '@/types/event'


interface EventRow {
  [key: string]: any;
}

interface EventTableProps {
  rows: EventRow[];
  setRows: React.Dispatch<React.SetStateAction<Event[]>>;
  pdfMode?: boolean          // <-- nuevo prop
}

const typeMapping: { [key: string]: string } = {
  FINE: "MULTA",
  WARNING: "AVISO",
  PAYMENT_COMPROMISE: "COMPROMISO DE PAGO",
  payment: "PAGO"
};

const EventTable: React.FC<EventTableProps> = ({ rows, setRows, pdfMode }) => {

  const [sortDescriptor, setSortDescriptor] = useState<{ column: string, direction: "ascending" | "descending" }>({
    column: "type",
    direction: "ascending"
  })


  const columns = [
    { name: "tipo", id: "type", isRowHeader: true },
    { name: "Contribuyente", id: "taxpayer" },
    { name: "Monto", id: "amount" },
    { name: "Fecha", id: "date" },
    { name: "Motivo", id: "description" },
    { name: "Estado", id: "debt" },
  ]

  const sortedItems = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return [...rows].sort((a, b) => {
      const aValue = a[sortDescriptor.column];
      const bValue = b[sortDescriptor.column];

      const aNum = typeof aValue === 'string' && !Number.isNaN(parseFloat(aValue)) ? parseFloat(aValue) : aValue;
      const bNum = typeof bValue === 'string' && !Number.isNaN(parseFloat(bValue)) ? parseFloat(bValue) : bValue;

      if (typeof aNum === 'number' && typeof bNum === 'number') {
        return sortDescriptor.direction === 'ascending' ? aNum - bNum : bNum - aNum;
      } else {
        const first = String(aNum).toLowerCase();
        const second = String(bNum).toLowerCase();
        let cmp = first.localeCompare(second);
        return sortDescriptor.direction === 'descending' ? -cmp : cmp;
      }
    });
  }, [sortDescriptor, rows]);

  console.log("ITEMS: " + JSON.stringify(sortedItems));


  const handlePaymentChange = async (id: string, newStatus: "paid" | "not_paid"): Promise<boolean> => {
    try {
      const res = await updateFinePayment(id, newStatus);
      toast.success("Estado de pago actualizado.");

      setRows(prevRows =>
        prevRows.map(row =>
          row.id.startsWith(id) ? { ...row, debt: newStatus === "paid" ? 0 : 1 } : row
        )
      );

      return true;
    } catch (e) {
      toast.error("Error actualizando el pago de la multa.");
      return false;
    }
  };


  return (
    <div
      className={
        'pl-4 lg:pl-0 flex items-center justify-center max-w-full ' +
        (pdfMode
          ? 'overflow-x-auto text-xs lg:text-base flex-col'
          : 'max-h-[24rem] lg:max-h-[17rem] overflow-x-auto overflow-y-auto lg:overflow-x-hidden text-xs lg:text-base'
        ) +
        ' custom-scroll'
      }
    >
      {pdfMode && (
        <p className='py-8 text-lg'>Historial de multas</p>
      )}
      <Table
        aria-label={"Eventos"}
        selectionMode="multiple"
        selectionBehavior="replace"
        sortDescriptor={sortDescriptor}
        onSortChange={(descriptor) =>
          setSortDescriptor({
            column: String(descriptor.column),
            direction: descriptor.direction,
          })
        }
        className="overflow-y-auto max-w-full lg:max-w-[64rem] text-sm">
        <InfoTableHeader columns={columns}>
          {(column: { name: string; id: string; isRowHeader?: boolean }) => (
            <InfoTableColumn isRowHeader={column.isRowHeader} allowsSorting={column.id != "options"}>
              {column.name}
            </InfoTableColumn>
          )}
        </InfoTableHeader>
        <TableBody items={sortedItems}>
          {item => {
            const itemKey = item.id;
            const currentStatus = item.debt > 0 ? "not_paid" : "paid";

            return (
              <InfoTableRow columns={columns} key={itemKey}>
                {(column: { name: string; id: string; isRowHeader?: boolean }) =>
                  <Cell
                    className="px-4 py-8 whitespace-normal break-words max-w-[64rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-600 focus-visible:-outline-offset-4 group-selected:focus-visible:outline-white"
                  >
                    {
                      column.id === "type" ? (typeMapping[item[column.id]] || item[column.id]) :
                        column.id === "date" ? new Date(item.date).toLocaleDateString() :
                          column.id === "amount" ? `${item[column.id]} Bs` :
                            column.id === "description" ? (item.description || "") :
                              column.id === "debt" ? (
                                item.type === "FINE" ? (
                                  <select
                                    value={currentStatus}
                                    onChange={async (e) => {
                                      const value = e.target.value as "paid" | "not_paid";
                                      const [rawId] = item.id.split('_'); // Gets only the UUID before '_FINE'
                                      const success = await handlePaymentChange(rawId, value);
                                      if (success) {
                                        // Just update the rows directly, no need for the statusMap anymore
                                        setRows(prevRows =>
                                          prevRows.map(row =>
                                            row.id.startsWith(item.id) ? { ...row, debt: value === "paid" ? 0 : 1 } : row
                                          )
                                        );
                                      }
                                    }}
                                    className={`rounded px-2 py-1 text-xs text-white
                                    ${currentStatus === 'not_paid' ? 'bg-red-600' : 'bg-green-600'}
                                    `}
                                  >
                                    <option value="not_paid" className="text-white bg-red-600">No pagada</option>
                                    <option value="paid" className="text-white bg-green-600">Pagada</option>
                                  </select>
                                ) : (
                                  <span className="text-gray-700">—</span> // or show nothing, or the debt value
                                )
                              ) : item[column.id]
                    }
                  </Cell>
                }
              </InfoTableRow>
            );
          }}
        </TableBody>
      </Table>
    </div>
  )
}

export default EventTable
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
