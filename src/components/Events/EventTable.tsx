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
import { deleteEvent, updateFinePayment } from '../utils/api/taxpayerFunctions'
import { Event } from '@/types/event'
import { useAuth } from '@/hooks/useAuth'


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

  const [eventIdToDelete, setEventIdToDelete] = useState<string | null>(null);
  const { user } = useAuth();




  const columns = [
    { name: "tipo", id: "type", isRowHeader: true },
    { name: "Contribuyente", id: "taxpayer" },
    { name: "Monto", id: "amount" },
    { name: "Fecha", id: "date" },
    { name: "Motivo", id: "description" },
    { name: "Estado", id: "debt" },
    { name: "Acciones", id: "options" },
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

  const handleDeleteEvent = (id: string) => {
    setEventIdToDelete(id);
  };

  const confirmDeleteEvent = async () => {
    if (!eventIdToDelete) return;

    try {
      await deleteEvent(eventIdToDelete.split('_')[0]); // importa manualmente esta función
      toast.success("Evento eliminado correctamente.");
      setRows(prev => prev.filter(row => row.id !== eventIdToDelete));
      setEventIdToDelete(null);
    } catch (error: any) {
      toast.error(`Error al eliminar el evento: ${error.message || error}`);
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
                    className=" px-4 lg:px-2 py-8 text-xs max-w-[20rem] truncate whitespace-normal break-words focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-600 focus-visible:-outline-offset-4 group-selected:focus-visible:outline-white"
                  >
                    {
                      column.id === "type" ? (typeMapping[item[column.id]] || item[column.id]) :
                        column.id === "options" ? (
                          !pdfMode && user && user?.role === "ADMIN" && (
                            <button
                              onClick={() => handleDeleteEvent(item.id)}
                              className="text-red-600 hover:underline"
                            >
                              Eliminar
                            </button>
                          )
                        ) :
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

      {eventIdToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="max-w-sm p-6 text-center bg-white rounded shadow-md">
            <p className="mb-4 text-sm">
              ¿Está seguro que desea eliminar el evento con ID: <strong>{eventIdToDelete}</strong>?
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={confirmDeleteEvent}
                className="px-4 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
              >
                Confirmar
              </button>
              <button
                onClick={() => setEventIdToDelete(null)}
                className="px-4 py-1 text-sm text-gray-700 border border-gray-400 rounded hover:bg-gray-100"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventTable