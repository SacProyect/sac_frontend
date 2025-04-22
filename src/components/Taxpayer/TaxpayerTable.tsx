// import React from 'react'
import { Cell, Table, TableBody } from 'react-aria-components'
// import { useAuth } from '../../hooks/useAuth'
import InfoTableHeader from '../UI/InfoTable/InfoTableHeader'
import InfoTableColumn from '../UI/InfoTable/InfoTableColumn'
import InfoTableRow from '../UI/InfoTable/InfoTableRow'
import { useState } from 'react'
import { useMemo } from 'react'
import InfoTableOptMenu from '../UI/InfoTable/InfoTableOptMenu'
import { useEffect } from 'react'
import { Taxpayer } from '../../types/taxpayer'

// Define the type for each column in the table
interface Column {
    name: string;
    id: keyof Taxpayer | "options"; // Restrict `id` to known keys + "options"
    isRowHeader?: boolean;
}

// Define sorting descriptor type
interface SortDescriptor {
    column: keyof Taxpayer;
    direction: "ascending" | "descending";
}

// Define props type
interface TaxpayerTableProps {
    propRows: Taxpayer[];
}



const TaxpayerTable: React.FC<TaxpayerTableProps> = ({ propRows }) => {
    const [rows, setRows] = useState(propRows)
    const columns = [
        { name: "Nro. Providencia", id: "providenceNum", isRowHeader: true },
        { name: "Procedimiento", id: "process" },
        { name: "Razón Social", id: "name" },
        { name: "RIF", id: "rif" },
        { name: "Tipo de Contribuyente", id: "contract_type" },
        { name: "Dirección", id: "address" },
        { name: "Opciones", id: "options" },
    ]

    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "providenceNum",
        direction: "ascending"
    })

    const sortedItems = useMemo(() => {
        return [...rows].sort((a, b) => {
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

    const handleSortChange = (descriptor: { column: string | number, direction: "ascending" | "descending" }) => {
        setSortDescriptor({
            column: descriptor.column as keyof Taxpayer,
            direction: descriptor.direction
        })
    }


    return (
        <div className='min-w-[4rem] max-w-[24rem] min-h-[4rem] max-h-full  overflow-y-auto  overflow-x-auto lg:overflow-x-hidden lg:min-h-[24rem] lg:max-h-[50rem] lg:min-w-full lg:max-w-[80vw] pb-4 custom-scroll'>
            <Table
                aria-label='Contribuyentes'
                selectionMode="multiple"
                selectionBehavior="replace"
                sortDescriptor={sortDescriptor}
                onSortChange={handleSortChange}
                className="min-w-full table-fixed"
            >
                <InfoTableHeader columns={columns}>
                    {(column: Column) => (
                        <InfoTableColumn isRowHeader={column.isRowHeader} allowsSorting={column.id != "options"}>
                            {column.name}
                        </InfoTableColumn>
                    )}

                </InfoTableHeader>
                <TableBody items={sortedItems}>
                    {item => (
                        <InfoTableRow columns={columns}>
                            {(column: Column) =>
                                <Cell className={` pl-4 py-2 text-sm truncate focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-600 focus-visible:-outline-offset-4 group-selected:focus-visible:outline-white max-w-[200px] break-words whitespace-normal`}>
                                    {
                                        column.id != "options" ? String(item[column.id]) :
                                            <InfoTableOptMenu id={item.id} />
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

export default TaxpayerTable