import React from 'react'
import { useState } from 'react'
import { Table } from 'react-aria-components'
import InfoTableHeader from '../UI/InfoTable/InfoTableHeader'
import { TableBody } from 'react-aria-components'
import { useMemo } from 'react'
import InfoTableColumn from '../UI/InfoTable/InfoTableColumn'
import InfoTableRow from '../UI/InfoTable/InfoTableRow'
import { Cell } from 'react-aria-components'


interface EventRow {
  [key: string]: any;
}

interface EventTableProps {
  propRows: EventRow[];
}

const typeMapping: { [key: string]: string } = {
  FINE: "MULTA",
  WARNING: "AVISO",
  PAYMENT_COMPROMISE: "COMPROMISO DE PAGO",
  payment: "PAGO"
};

const EventTable: React.FC<EventTableProps> = ({ propRows }) => {

  const [sortDescriptor, setSortDescriptor] = useState<{ column: string, direction: "ascending" | "descending" }>({
    column: "type",
    direction: "ascending"
  })
  const columns = [
    { name: "tipo", id: "type", isRowHeader: true },
    { name: "Contribuyente", id: "taxpayer" },
    { name: "Monto", id: "amount" },
    { name: "Fecha", id: "date" },
  ]


  const sortedItems = useMemo(() => {
    if (!Array.isArray(propRows)) return []; // Ensure propRows is an array
    return propRows.sort((a, b) => {
      const aValue = a[sortDescriptor.column];
      const bValue = b[sortDescriptor.column];

      // Convert to numbers if the values are numeric strings
      const aNum = typeof aValue === 'string' && !Number.isNaN(parseFloat(aValue)) ? parseFloat(aValue) : aValue;
      const bNum = typeof bValue === 'string' && !Number.isNaN(parseFloat(bValue)) ? parseFloat(bValue) : bValue;

      // Check if both values are numbers
      if (typeof aNum === 'number' && typeof bNum === 'number') {
        return sortDescriptor.direction === 'ascending' ? aNum - bNum : bNum - aNum;
      } else {
        // Convert to string for comparison
        const first = String(aNum).toLowerCase(); // Convert to string and lowercase for consistent comparison
        const second = String(bNum).toLowerCase();
        let cmp = first.localeCompare(second);
        return sortDescriptor.direction === 'descending' ? -cmp : cmp;
      }
    });
  }, [sortDescriptor, propRows]);

  return (
    <div className='pl-4 lg:pl-0 max-w-[24rem] lg:max-w-full max-h-[24rem] lg:max-h-[25rem] overflow-x-auto overflow-y-auto lg:overflow-x-hidden text-xs lg:text-base flex  custom-scroll'>
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
        className="overflow-y-auto max-w-[22rem]">
        <InfoTableHeader columns={columns}>
          {(column: { name: string; id: string; isRowHeader?: boolean }) => (
            <InfoTableColumn isRowHeader={column.isRowHeader} allowsSorting={column.id != "options"}>
              {column.name}
            </InfoTableColumn>
          )}
        </InfoTableHeader>
        <TableBody items={sortedItems} >
          {item => (
            <InfoTableRow columns={columns} key={`${item.type}_${item.id}`}>
              {(column: { name: string; id: string; isRowHeader?: boolean }) =>
                <Cell className={`px-4 py-2 truncate focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-600 focus-visible:-outline-offset-4 group-selected:focus-visible:outline-white`}>
                  {
                    column.id == "type"
                      ? typeMapping[item[column.id]] || item[column.id]
                      : column.id != "date"
                        ? item[column.id] : new Date(item.date).toLocaleDateString()
                  }
                </Cell>
              }
            </InfoTableRow>
          )}

        </TableBody>
      </Table>
    </div>
  )
}

export default EventTable