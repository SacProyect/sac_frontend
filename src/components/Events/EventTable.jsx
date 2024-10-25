import React from 'react'
import { useState } from 'react'
import { Table } from 'react-aria-components'
import InfoTableHeader from '../UI/InfoTable/InfoTableHeader'
import { TableBody } from 'react-aria-components'
import { useMemo } from 'react'
import InfoTableColumn from '../UI/InfoTable/InfoTableColumn'
import InfoTableRow from '../UI/InfoTable/InfoTableRow'
import { Cell } from 'react-aria-components'
import InfoTableOptMenu from '../UI/InfoTable/InfoTableOptMenu'

const EventTable = ({ propRows }) => {

  const [sortDescriptor, setSortDescriptor] = useState({
    column: "tipo",
    direction: "ascending"
  })
  const columns = [
    { name: "Tipo", id: "tipo", isRowHeader: true },
    { name: "Contribuyente", id: "contribuyente" },
    { name: "Monto", id: "monto" },
    { name: "Fecha", id: "fecha" },

  ]

  const sortedItems = useMemo(() => {
    return propRows.sort((a, b) => {
      const aValue = a[sortDescriptor.column];
      const bValue = b[sortDescriptor.column];

      // Convert to numbers if the values are numeric strings
      const aNum = typeof aValue === 'string' && !isNaN(aValue) ? parseFloat(aValue) : aValue;
      const bNum = typeof bValue === 'string' && !isNaN(bValue) ? parseFloat(bValue) : bValue;

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
    <Table
      aria-label={"Eventos"}
      selectionMode="multiple"
      selectionBehavior="replace"
      sortDescriptor={sortDescriptor}
      onSortChange={setSortDescriptor}
      className="border-separate border-spacing-0">
      <InfoTableHeader columns={columns}>
        {column => (
          <InfoTableColumn isRowHeader={column.isRowHeader} allowsSorting={column.id != "options"}>
            {column.name}
          </InfoTableColumn>
        )}
      </InfoTableHeader>
      <TableBody items={sortedItems}>
        {item => (
          <InfoTableRow columns={columns} key={`${item.tipo}_${item.id}`}>
            {column =>
              <Cell className={`px-4 py-2 truncate focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-600 focus-visible:-outline-offset-4 group-selected:focus-visible:outline-white`}>
                {
                  column.id != "fecha" ? item[column.id] : new Date(item.fecha).toLocaleDateString()
                }
              </Cell>
            }
          </InfoTableRow>
        )}

      </TableBody>
    </Table>
  )
}

export default EventTable