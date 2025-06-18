// src/components/iva/TaxSummaryTable.tsx
import React, { useMemo, useState } from 'react'
import { Table, TableBody, Cell } from 'react-aria-components'
import InfoTableHeader from '../UI/InfoTable/InfoTableHeader'
import InfoTableColumn from '../UI/InfoTable/InfoTableColumn'
import InfoTableRow from '../UI/InfoTable/InfoTableRow'
import { IVAReports } from '@/types/IvaReports'
import toast from 'react-hot-toast'
import { deleteIva } from '../utils/api/taxpayerFunctions'
import { useAuth } from '@/hooks/useAuth'

interface Props {
    rows: IVAReports[]
    pdfMode?: boolean
}

const TaxSummaryTable: React.FC<Props> = ({ rows, pdfMode }) => {
    const [reportIdToDelete, setReportIdToDelete] = useState<string | null>(null);
    const { user } = useAuth();

    const [sortDescriptor, setSortDescriptor] = useState<{
        column: keyof IVAReports
        direction: 'ascending' | 'descending'
    }>({ column: 'date', direction: 'descending' })

    const columns: { name: string; id: keyof IVAReports | "options" }[] = [
        { name: 'Fecha', id: 'date' },
        { name: 'IVA', id: 'iva' },
        { name: 'Excedente de Crédito', id: 'excess' },
        { name: 'Compras', id: 'purchases' },
        { name: 'Ventas', id: 'sells' },
        { name: 'Recaudado', id: 'paid' },
        { name: "Acciones", id: "options" },
    ]

    console.log(rows)

    const sortedItems = useMemo(() => {
        return [...rows].sort((a, b) => {
            let aVal: any = a[sortDescriptor.column]
            let bVal: any = b[sortDescriptor.column]

            if (sortDescriptor.column === 'date') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
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

    const confirmDeleteReport = async () => {
        if (!reportIdToDelete) return;
        try {
            await deleteIva(reportIdToDelete); // ⚠️ Tú importas esta función
            toast.success("Reporte de IVA eliminado correctamente.");
            // Si necesitas actualizar los rows desde props, deberías recibir también setRows como prop.
            setReportIdToDelete(null);
        } catch (err: any) {
            toast.error(`Error al eliminar el reporte de IVA: ${err.message || err}`);
        }
    };

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
                            {(col: { name: string; id: keyof IVAReports | "options" }) => (
                                <Cell className="px-4 py-2 whitespace-nowrap">
                                    {col.id === 'date'
                                        ? (() => {
                                            const [y, m, d] = item.date.slice(0, 10).split("-");
                                            return `${d}/${m}/${y}`;
                                        })()
                                        : col.id === 'iva'
                                            ? `${item.iva} BS`
                                            : col.id === 'excess'
                                                ? `${item.excess ?? 0} BS`
                                                : col.id === 'options'
                                                    ? (
                                                        !pdfMode && (
                                                            <button
                                                                onClick={() => setReportIdToDelete(item.id)}
                                                                className="text-red-600 hover:underline"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        )
                                                    )
                                                    : String(item[col.id])}
                                </Cell>
                            )}
                        </InfoTableRow>
                    )}
                </TableBody>
            </Table>
            {reportIdToDelete && user && user.role === "ADMIN" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="max-w-sm p-6 text-center bg-white rounded shadow-md">
                        <p className="mb-4 text-sm">
                            ¿Está seguro que desea eliminar el reporte con ID: <strong>{reportIdToDelete}</strong>?
                        </p>
                        <div className="flex justify-center gap-4 mt-4">
                            <button
                                onClick={confirmDeleteReport}
                                className="px-4 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                            >
                                Confirmar
                            </button>
                            <button
                                onClick={() => setReportIdToDelete(null)}
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

export default TaxSummaryTable
