import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ISLRReports } from '@/types/islr-reports';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import { deleteISLR, updateIslrReport } from '../utils/api/taxpayer-functions';

interface Props {
    rows: ISLRReports[];
    pdfMode?: boolean;
    setRows?: React.Dispatch<React.SetStateAction<ISLRReports[]>>
}

const ISLRSummaryTable: React.FC<Props> = ({ rows, pdfMode, setRows }) => {
    const [reportIdToDelete, setReportIdToDelete] = useState<string | null>(null);
    const [rowEditingId, setRowEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<ISLRReports>>({});
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);


    const { user, refreshUser } = useAuth();
    const [sortDescriptor, setSortDescriptor] = useState<{
        column: keyof ISLRReports;
        direction: 'ascending' | 'descending';
    }>({ column: 'emition_date', direction: 'descending' });

    const columns: { name: string; id: string }[] = [
        { name: 'Contribuyente', id: 'taxpayer.name' },
        { name: 'Tipo', id: 'taxpayer.process' },
        { name: 'Ingresos', id: 'incomes' },
        { name: 'Gastos', id: 'expent' },
        { name: 'Costos', id: 'costs' },
        { name: 'Pagado', id: 'paid' },
        { name: 'Fecha de Emisión', id: 'emition_date' },
        { name: 'Acciones', id: 'options' },
    ];

    const sortedItems = useMemo(() => {
        return [...rows].sort((a, b) => {
            let aVal: any = a[sortDescriptor.column];
            let bVal: any = b[sortDescriptor.column];

            if (sortDescriptor.column === 'emition_date') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            }

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDescriptor.direction === 'ascending' ? aVal - bVal : bVal - aVal;
            }

            return (
                String(aVal ?? '').localeCompare(String(bVal ?? '')) *
                (sortDescriptor.direction === 'ascending' ? 1 : -1)
            );
        });
    }, [rows, sortDescriptor]);

    const confirmDelete = async () => {
        if (!reportIdToDelete) return;
        try {
            await deleteISLR(reportIdToDelete);
            toast.success("Reporte de ISLR eliminado correctamente.");
            setReportIdToDelete(null);
            refreshUser();
        } catch (err: any) {
            toast.error(`Error al eliminar: ${err.message || err}`);
        }
    };


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowActionsMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSaveEdit = async () => {
        if (!rowEditingId) return;
        try {
            const formattedValues = Object.fromEntries(
                Object.entries(editValues).filter(([key]) => key !== 'id' && key !== 'emition_date' && key !== 'updatedAt' && key !== 'taxpayer' && key !== 'taxpayerId').map(([key, value]) => [key, Number(String(value).replace(',', '.'))])
            );

            // console.log(formattedValues);

            await updateIslrReport(rowEditingId, formattedValues);

            setRows?.(prev => prev.map(row => row.id === rowEditingId ? { ...row, ...formattedValues } : row));
            toast.success("Reporte actualizado correctamente.");
            setRowEditingId(null);
            setEditValues({});
            refreshUser();
        } catch (err: any) {
            toast.error(`Error al guardar: ${err.message || err}`);
        }
    };

    return (
        <div className="w-full lg:h-[30vh] overflow-auto text-sm custom-scroll px-4 lg:pt-8">
            {pdfMode && <p className='py-8 text-lg'>Historial de ISLR</p>}
            <table className="min-w-full border-collapse table-auto">
                <thead className="w-full bg-[#2C3E50]">
                    <tr>
                        {columns.map((col, idx) => {
                            const isFirst = idx === 0;
                            const isLast = idx === columns.length - 1;
                            return (
                                <th
                                    key={col.id}
                                    className={`px-4 py-2 font-semibold text-white border-b border-gray-300 ${isFirst ? 'rounded-tl-md' : ''} ${isLast ? 'rounded-tr-md' : ''}`}
                                >
                                    {col.name}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {sortedItems.map((item, index) => (
                        <tr key={item.id || index} className="border-b hover:bg-gray-100">
                            {columns.map(col => {
                                const id = col.id;
                                let value: React.ReactNode;

                                if (id === 'emition_date') {
                                    value = new Date(item.emition_date).toLocaleDateString();
                                } else if (id === 'incomes' || id === 'expent' || id === 'costs') {
                                    value = rowEditingId === item.id ? (
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            className="w-full px-2 py-1 border rounded"
                                            value={String(editValues[id as keyof ISLRReports] ?? '')}
                                            onChange={(e) => {
                                                const rawValue = e.target.value.replace(',', '.'); // convierte coma en punto
                                                if (/^\d*\.?\d*$/.test(rawValue)) { // permite solo números y un punto
                                                    setEditValues(prev => ({
                                                        ...prev,
                                                        [id]: rawValue // guardamos como string por ahora
                                                    }));
                                                }
                                            }}
                                        />
                                    ) : (
                                        `${Number(item[id as keyof ISLRReports]).toLocaleString()} BS`
                                    );
                                } else if (id === 'taxpayer.name') {
                                    value = item.taxpayer.name;
                                } else if (id === 'taxpayer.process') {
                                    value = item.taxpayer.process;
                                } else if (id === 'paid') {
                                    value = `${Number(item.paid).toLocaleString()} BS`;
                                } else if (id === 'options') {
                                    value =
                                        !pdfMode && user?.role === "ADMIN" ? (
                                            <div className='relative'>
                                                <button onClick={() => setShowActionsMenu(!showActionsMenu)}>
                                                    ⋮
                                                </button>
                                                {showActionsMenu && (
                                                    <div ref={menuRef} className='absolute flex flex-col bg-white rounded-md top-8'>
                                                        <button onClick={() => {
                                                            setRowEditingId(item.id);
                                                            setEditValues(item);
                                                        }}>Modificar</button>
                                                        <button onClick={() => setReportIdToDelete(item.id)}
                                                            className="text-red-600 hover:underline"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                        ) : null;
                                } else {
                                    value = String(item[id as keyof ISLRReports] ?? '');
                                }

                                return (
                                    <td key={id} className="px-4 py-2 whitespace-nowrap">
                                        {value}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            {rowEditingId && (
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                        Guardar
                    </button>
                    <button
                        onClick={() => {
                            setRowEditingId(null);
                            setEditValues({});
                        }}
                        className="px-4 py-2 text-sm text-gray-700 border border-gray-400 rounded hover:bg-gray-100"
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {reportIdToDelete && user?.role === "ADMIN" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="max-w-sm p-6 text-center bg-white rounded shadow-md">
                        <p className="mb-4 text-sm">
                            ¿Está seguro que desea eliminar el reporte con ID: <strong>{reportIdToDelete}</strong>?
                        </p>
                        <div className="flex justify-center gap-4 mt-4">
                            <button
                                onClick={confirmDelete}
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
    );
};

export default ISLRSummaryTable;
