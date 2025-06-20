import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IVAReports } from '@/types/IvaReports';
import toast from 'react-hot-toast';
import { deleteIva, updateIva } from '../utils/api/taxpayerFunctions';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface Props {
    rows: IVAReports[];
    pdfMode?: boolean;
    setRows: React.Dispatch<React.SetStateAction<IVAReports[]>>;
}

const TaxSummaryTable: React.FC<Props> = ({ rows, pdfMode, setRows }) => {
    const [reportIdToDelete, setReportIdToDelete] = useState<string | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<IVAReports>>({});
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
    const navigate = useNavigate();

    const { user } = useAuth();
    if (!user) {
        navigate("/login");
        return;
    }

    let columns: { name: string; id: keyof IVAReports | 'options' }[];

    if (user.role === "FISCAL" || user.role === "COORDINATOR" || user.role === "SUPERVISOR") {
        columns = [
            { name: 'Fecha', id: 'date' },
            { name: 'IVA', id: 'iva' },
            { name: 'Excedente de Crédito', id: 'excess' },
            { name: 'Compras', id: 'purchases' },
            { name: 'Ventas', id: 'sells' },
            { name: 'Recaudado', id: 'paid' },
        ];
    } else if (user.role === "ADMIN") {
        columns = [
            { name: 'Fecha', id: 'date' },
            { name: 'IVA', id: 'iva' },
            { name: 'Excedente de Crédito', id: 'excess' },
            { name: 'Compras', id: 'purchases' },
            { name: 'Ventas', id: 'sells' },
            { name: 'Recaudado', id: 'paid' },
            { name: 'Acciones', id: 'options' },
        ];
    } else {
        columns = [

        ]
    }





    const sortedItems = useMemo(() => {
        return [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [rows]);

    const processedItems = useMemo(() => {
        return sortedItems.map((item, index) => ({ ...item, _key: item.id || index.toString() }));
    }, [sortedItems]);

    const toggleMenu = (id: string, buttonRef: HTMLButtonElement | null) => {
        if (activeMenuId === id) {
            setActiveMenuId(null);
            return;
        }

        if (buttonRef) {
            const rect = buttonRef.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 4,
                left: rect.right - 160,
            });
        }

        setActiveMenuId(id);
    };

    const handleEdit = (item: IVAReports) => {
        setEditingRowId(item.id);
        setEditValues({ ...item });
        setActiveMenuId(null);
    };

    const handleInputChange = (field: keyof IVAReports, value: string) => {
        setEditValues((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            if (!editingRowId) return;
            const payload = { ...editValues };
            await updateIva(payload);

            setRows(prev => prev.map(row => row.id === editingRowId ? { ...row, ...editValues } : row))

            toast.success('Cambios guardados');
            setEditingRowId(null);
            setEditValues({});
        } catch {
            toast.error('Error al guardar');
        }
    };

    const handleCancel = () => {
        setEditingRowId(null);
        setEditValues({});
    };

    const confirmDeleteReport = async () => {
        if (!reportIdToDelete) return;
        try {
            await deleteIva(reportIdToDelete);
            toast.success('Reporte eliminado');
            setReportIdToDelete(null);
        } catch (err: any) {
            toast.error(`Error: ${err.message || err}`);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as HTMLElement)?.closest('.menu-dropdown')) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="w-full px-4 overflow-auto text-sm custom-scroll">
            {pdfMode && <p className="py-8 text-lg">Historial de IVA</p>}
            <table className="min-w-full text-left border-collapse">
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
                    {processedItems.map((item) => (
                        <tr key={item._key} className="hover:bg-gray-50">
                            {columns.map((col) => {
                                const buttonRef = useRef<HTMLButtonElement | null>(null);
                                return (
                                    <td key={col.id} className="relative px-4 py-2 border-b border-gray-100 whitespace-nowrap">
                                        {editingRowId === item.id && col.id !== 'options' ? (
                                            <input
                                                value={String(editValues[col.id as keyof IVAReports] ?? '')}
                                                onChange={(e) => handleInputChange(col.id as keyof IVAReports, e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                            />
                                        ) : col.id === 'options' && !pdfMode && user?.role === 'ADMIN' ? (
                                            <div className="relative inline-block">
                                                <button
                                                    ref={buttonRef}
                                                    onClick={() => toggleMenu(item.id, buttonRef.current)}
                                                    className="text-gray-600 hover:text-gray-900"
                                                >
                                                    ⋮
                                                </button>
                                            </div>
                                        ) : col.id === 'date' ? (
                                            (() => {
                                                const [y, m, d] = item.date.slice(0, 10).split('-');
                                                return `${d}/${m}/${y}`;
                                            })()
                                        ) : (
                                            String(item[col.id as keyof IVAReports])
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            {activeMenuId && dropdownPos && (
                <div
                    className="fixed z-[9999] w-40 bg-white border border-gray-200 rounded-md shadow-lg menu-dropdown"
                    style={{ top: dropdownPos.top, left: dropdownPos.left }}
                >
                    <button
                        onClick={() => {
                            const row = rows.find(r => r.id === activeMenuId);
                            if (row) {
                                handleEdit(row);
                            }
                        }}
                        className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                    >
                        Editar
                    </button>
                    <button
                        onClick={() => {
                            setReportIdToDelete(activeMenuId);
                            setActiveMenuId(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
                    >
                        Eliminar
                    </button>
                </div>
            )}

            {editingRowId && (
                <div className="flex justify-end gap-4 mt-4">
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                    >
                        Guardar cambios
                    </button>
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm border border-gray-400 rounded hover:bg-gray-100"
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {reportIdToDelete && user?.role === 'ADMIN' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="max-w-sm p-6 text-center bg-white rounded shadow-md">
                        <p className="mb-4 text-sm">
                            ¿Está seguro que desea eliminar el reporte con ID:{' '}
                            <strong>{reportIdToDelete}</strong>?
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
    );
};

export default TaxSummaryTable;
