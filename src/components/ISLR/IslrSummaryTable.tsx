// src/components/islr/ISLRSummaryTable.tsx
import React, { useMemo, useState } from 'react'
import { Table, TableBody, Cell } from 'react-aria-components'
import InfoTableHeader from '../UI/InfoTable/InfoTableHeader'
import InfoTableColumn from '../UI/InfoTable/InfoTableColumn'
import InfoTableRow from '../UI/InfoTable/InfoTableRow'
import { ISLRReports } from '@/types/ISLRReports'

interface Props {
    rows: ISLRReports[]
    pdfMode?: boolean
}

const ISLRSummaryTable: React.FC<Props> = ({ rows, pdfMode }) => {
    const [sortDescriptor, setSortDescriptor] = useState<{
        column: keyof ISLRReports
        direction: 'ascending' | 'descending'
    }>({ column: 'emition_date', direction: 'descending' })

    const columns: { name: string; id: string }[] = [
        { name: 'Contribuyente', id: 'taxpayer.name' },
        { name: 'Tipo', id: 'taxpayer.process' },
        { name: 'Ingresos', id: 'incomes' },
        { name: 'Gastos', id: 'expent' },
        { name: 'Costos', id: 'costs' },
        { name: 'Fecha de Emisión', id: 'emition_date' },
    ]

    const sortedItems = useMemo(() => {
        return [...rows].sort((a, b) => {
            let aVal: any = a[sortDescriptor.column]
            let bVal: any = b[sortDescriptor.column]

            if (sortDescriptor.column === 'emition_date') {
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
        }))
    }, [sortedItems])

    return (
        <div className="w-full lg:h-[37vh] overflow-auto text-sm custom-scroll px-4">
            {pdfMode && (
                <p className='py-8 text-lg'>Historial de ISLR</p>
            )}
            <Table
                aria-label="Resumen de ISLR"
                selectionMode="none"
                sortDescriptor={sortDescriptor}
                onSortChange={d =>
                    setSortDescriptor({
                        column: d.column as keyof ISLRReports,
                        direction: d.direction,
                    })
                }
                className="min-w-full"
            >
                <InfoTableHeader columns={columns}>
                    {(col: { name: string; id: string }) => (
                        <InfoTableColumn
                            key={col.id}
                            allowsSorting
                            isRowHeader={col.id === 'emition_date'}
                        >
                            {col.name}
                        </InfoTableColumn>
                    )}
                </InfoTableHeader>

                <TableBody items={processedItems}>
                    {(item: ISLRReports & { _key: string }) => (
                        <InfoTableRow key={item._key} id={item.id} columns={columns}>
                            {(col: { name: string; id: string }) => (
                                <Cell className="px-4 py-2 whitespace-nowrap">
                                    {(() => {
                                        const { id } = col

                                        if (id === 'emition_date') {
                                            return new Date(item.emition_date).toLocaleDateString()
                                        }

                                        if (id === 'incomes' || id === 'expent' || id === 'costs') {
                                            return `${item[id as keyof ISLRReports]} BS`
                                        }

                                        if (id === 'taxpayer.name') {
                                            return item.taxpayer.name
                                        }

                                        if (id === 'taxpayer.process') {
                                            return item.taxpayer.process
                                        }

                                        return String(item[id as keyof ISLRReports] ?? '')
                                    })()}
                                </Cell>
                            )}
                        </InfoTableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

export default ISLRSummaryTable
