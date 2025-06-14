// src/components/iva/TaxSummaryTable.tsx
import React, { useMemo, useState } from 'react'
import { Table, TableBody, Cell } from 'react-aria-components'
import InfoTableHeader from '../UI/InfoTable/InfoTableHeader'
import InfoTableColumn from '../UI/InfoTable/InfoTableColumn'
import InfoTableRow from '../UI/InfoTable/InfoTableRow'
import { IVAReports } from '@/types/IvaReports'

interface Props {
    rows: IVAReports[]
    pdfMode?: boolean
}

const TaxSummaryTable: React.FC<Props> = ({ rows, pdfMode }) => {
    const [sortDescriptor, setSortDescriptor] = useState<{
        column: keyof IVAReports
        direction: 'ascending' | 'descending'
    }>({ column: 'date', direction: 'descending' })

    const columns: { name: string; id: keyof IVAReports }[] = [
        { name: 'Fecha', id: 'date' },
        { name: 'IVA', id: 'iva' },
        { name: 'Excedente de Crédito', id: 'excess' },
        { name: 'Compras', id: 'purchases' },
        { name: 'Ventas', id: 'sells' },
        { name: 'Recaudado', id: 'paid' },
    ]

    console.log(rows)

    const sortedItems = useMemo(() => {
        return [...rows].sort((a, b) => {
            let aVal: any = a[sortDescriptor.column]
            let bVal: any = b[sortDescriptor.column]

            if (sortDescriptor.column === 'date') {
                aVal = new Date(aVal).getTime()
                bVal = new Date(bVal).getTime()
            }

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDescriptor.direction === 'ascending'
                    ? aVal - bVal
                    : bVal - aVal
            }

            return (
                String(aVal ?? '').localeCompare(String(bVal ?? '')) *
                (sortDescriptor.direction === 'ascending' ? 1 : -1)
            )
        })
    }, [rows, sortDescriptor])

    const processedItems = useMemo(() => {
        return sortedItems.map((item, index) => ({
            ...item,
            _key: item.id || index.toString(),
        }));
    }, [sortedItems]);

    return (
        <div className="w-full lg:h-[30vh] overflow-auto text-sm custom-scroll px-4">
            {pdfMode && (
                <p className='py-8 text-lg'>Historial de IVA</p>
            )}
            <Table
                aria-label="Resumen de IVA"
                selectionMode="none"
                sortDescriptor={sortDescriptor}
                onSortChange={d =>
                    setSortDescriptor({
                        column: d.column as keyof IVAReports,
                        direction: d.direction,
                    })
                }
                className="min-w-full"
            >
                <InfoTableHeader columns={columns}>
                    {(col: { name: string; id: keyof IVAReports }) => (
                        <InfoTableColumn
                            key={col.id}
                            allowsSorting
                            isRowHeader={col.id === 'date'}
                        >
                            {col.name}
                        </InfoTableColumn>
                    )}
                </InfoTableHeader>

                <TableBody items={processedItems}>
                    {(item: IVAReports & { _key: string }) => (
                        <InfoTableRow key={item._key} id={item.id} columns={columns}>
                            {(col: { name: string; id: keyof IVAReports }) => (
                                <Cell className="px-4 py-2 whitespace-nowrap">
                                    {col.id === 'date'
                                        ? new Date(item.date).toLocaleDateString()
                                        : col.id === 'iva'
                                            ? `${item.iva} BS`
                                            : col.id === 'excess'
                                                ? `${item.excess ?? 0} BS`
                                                : String(item[col.id])}
                                </Cell>
                            )}
                        </InfoTableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

export default TaxSummaryTable
