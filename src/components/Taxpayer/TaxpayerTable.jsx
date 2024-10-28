import React from 'react'
import { Cell, Table, TableBody } from 'react-aria-components'
import { useAuth } from '../../hooks/useAuth'
import InfoTableHeader from '../UI/InfoTable/InfoTableHeader'
import InfoTableColumn from '../UI/InfoTable/InfoTableColumn'
import InfoTableRow from '../UI/InfoTable/InfoTableRow'
import { useState } from 'react'
import { useMemo } from 'react'
import InfoTableOptMenu from '../UI/InfoTable/InfoTableOptMenu'
import { useEffect } from 'react'

const TaxpayerTable = ({ propRows }) => {
    const [rows, setRows] = useState(propRows)
    const columns = [
        { name: "Nro. Providencia", id: "nroProvidencia", isRowHeader: true },
        { name: "Procedimiento", id: "procedimiento" },
        { name: "Razón Social", id: "nombre" },
        { name: "RIF", id: "rif" },
        { name: "Tipo de Contribuyente", id: "tipoContrato" },
        { name: "Opciones", id: "options" },
    ]

    const [sortDescriptor, setSortDescriptor] = useState({
        column: "nroProvidencia",
        direction: "ascending"
    })

    const sortedItems = useMemo(() => {
        return rows.sort((a, b) => {
            const first = `${a[sortDescriptor.column]}`
            const second = `${b[sortDescriptor.column]}`
            let cmp = first.localeCompare(second)

            if (sortDescriptor.direction === 'descending') {
                cmp *= -1;
            }
            return cmp;
        })
    }, [sortDescriptor, rows])

    useEffect(() => { setRows(propRows) }, [propRows])
    return (
        <Table
            aria-label='Contribuyentes'
            selectionMode="multiple"
            selectionBehavior="replace"
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            className="border-separate border-spacing-0"
        >
            <InfoTableHeader columns={columns}>
                {column => (
                    <InfoTableColumn isRowHeader={column.isRowHeader} allowsSorting={column.id != "options"}>
                        {column.name}
                    </InfoTableColumn>
                )}

            </InfoTableHeader>
            <TableBody items={sortedItems}>
                {item => (
                    <InfoTableRow columns={columns}>
                        {column =>
                            <Cell className={`px-4 py-2 truncate focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-600 focus-visible:-outline-offset-4 group-selected:focus-visible:outline-white`}>
                                {
                                    column.id != "options" ? item[column.id] :
                                        <InfoTableOptMenu id={item.id} />
                                }
                            </Cell>
                        }
                    </InfoTableRow>
                )}

            </TableBody>
        </Table>
    )
}

export default TaxpayerTable