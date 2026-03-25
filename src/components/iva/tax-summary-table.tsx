import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IVAReports } from '@/types/iva-reports';
import toast from 'react-hot-toast';
import { deleteIva, updateIva } from '../utils/api/taxpayer-functions';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { decimalToNumber } from '../utils/number.utils';
import { MoreVertical, Pencil, Trash2, Check, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/UI/dropdown-menu';

interface Props {
    rows: IVAReports[];
    pdfMode?: boolean;
    setRows?: React.Dispatch<React.SetStateAction<IVAReports[]>>;
}

const TaxSummaryTable: React.FC<Props> = ({ rows, pdfMode, setRows }) => {
    const [reportIdToDelete, setReportIdToDelete] = useState<string | null>(null);
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<IVAReports>>({});
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (!user) navigate('/login');
    }, [user]);

    if (!user) return null;

    let columns: { name: string; id: keyof IVAReports | 'options' }[];

    if (user.role === 'FISCAL' || user.role === 'COORDINATOR' || user.role === 'SUPERVISOR') {
        columns = [
            { name: 'Fecha', id: 'date' },
            { name: 'IVA', id: 'iva' },
            { name: 'Exc. Crédito', id: 'excess' },
            { name: 'Compras', id: 'purchases' },
            { name: 'Ventas', id: 'sells' },
            { name: 'Pagado', id: 'paid' },
        ];
    } else if (user.role === 'ADMIN') {
        columns = [
            { name: 'Fecha', id: 'date' },
            { name: 'IVA', id: 'iva' },
            { name: 'Exc. Crédito', id: 'excess' },
            { name: 'Compras', id: 'purchases' },
            { name: 'Ventas', id: 'sells' },
            { name: 'Pagado', id: 'paid' },
            { name: '', id: 'options' },
        ];
    } else {
        columns = [];
    }

    const sortedItems = useMemo(() => {
        return [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [rows]);

    const processedItems = useMemo(() => {
        return sortedItems.map((item, index) => ({ ...item, _key: item.id || index.toString() }));
    }, [sortedItems]);

    const handleEdit = (item: IVAReports) => {
        setEditingRowId(item.id);
        setEditValues({ ...item });
    };

    const handleInputChange = (field: keyof IVAReports, value: string) => {
        setEditValues(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            if (!editingRowId) return;
            const payload = { ...editValues };
            await updateIva(payload);
            setRows?.(prev => prev.map(row => row.id === editingRowId ? { ...row, ...editValues } : row));
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
            setRows?.(prev => prev.filter(row => row.id !== reportIdToDelete));
            setReportIdToDelete(null);
        } catch (err: any) {
            toast.error(`Error: ${err.message || err}`);
        }
    };

    const numCols: (keyof IVAReports | 'options')[] = ['iva', 'excess', 'purchases', 'sells', 'paid'];

    return (
        <>
            <style>{`
                .et-wrap { --et-base:#0b1220;--et-surface:#111f32;--et-border:rgba(148,163,184,0.09);--et-border-row:rgba(148,163,184,0.07);--et-text-1:#e2e8f0;--et-text-2:#94a3b8;--et-text-3:#475569;--et-hover:rgba(148,163,184,0.05);--et-amber:#f59e0b;font-family:'Inter',system-ui,sans-serif;width:100%;overflow-x:auto;scrollbar-width:thin;scrollbar-color:var(--et-border) transparent; }
                .et-wrap::-webkit-scrollbar{height:4px;} .et-wrap::-webkit-scrollbar-thumb{background:var(--et-border);border-radius:2px;}
                .et-table{width:100%;min-width:520px;border-collapse:collapse;font-size:12.5px;}
                .et-thead tr{background:rgba(8,15,28,0.9);border-bottom:1px solid var(--et-border);}
                .et-th{padding:10px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--et-text-3);text-align:left;white-space:nowrap;}
                .et-th.num{text-align:right;} .et-th.center{text-align:center;}
                .et-tr{border-bottom:1px solid var(--et-border-row);transition:background 0.12s;}
                .et-tr:hover{background:var(--et-hover);} .et-tr:last-child{border-bottom:none;}
                .et-td{padding:10px 14px;color:var(--et-text-1);vertical-align:middle;}
                .et-td.num{text-align:right;font-family:'Courier New',monospace;font-size:12px;font-variant-numeric:tabular-nums;color:var(--et-text-2);}
                .et-td.center{text-align:center;}
                .et-edit-input{width:100%;padding:5px 8px;background:rgba(148,163,184,0.08);border:1px solid rgba(245,158,11,0.4);border-radius:5px;color:var(--et-text-1);font-size:12px;outline:none;box-sizing:border-box;}
                .et-paid-badge{display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:700;background:rgba(16,185,129,0.12);color:#6ee7b7;}
                .et-zero-val{color:var(--et-text-3);}
                .et-menu-btn{width:28px;height:28px;border-radius:6px;background:transparent;border:1px solid var(--et-border);color:var(--et-text-3);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background 0.12s,color 0.12s;}
                .et-menu-btn:hover{background:rgba(148,163,184,0.10);color:var(--et-text-1);}
                .et-menu-btn.active{background:rgba(245,158,11,0.10);color:var(--et-amber);border-color:rgba(245,158,11,0.25);}
                .et-dropdown{position:fixed;z-index:9999;background:#1e293b;border:1px solid rgba(148,163,184,0.15);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.4);min-width:140px;padding:4px;animation:etDropIn 0.12s ease;}
                @keyframes etDropIn{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:translateY(0);}}
                .et-drop-item{display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;border-radius:5px;background:transparent;border:none;font-size:12px;font-weight:500;cursor:pointer;transition:background 0.1s;text-align:left;}
                .et-drop-item.edit{color:#93c5fd;} .et-drop-item.edit:hover{background:rgba(59,130,246,0.10);}
                .et-drop-item.del{color:#fda4af;} .et-drop-item.del:hover{background:rgba(244,63,94,0.10);}
                .et-edit-bar{display:flex;justify-content:flex-end;gap:8px;padding:10px 16px 14px;border-top:1px solid var(--et-border);}
                .et-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:opacity 0.15s;}
                .et-btn:hover{opacity:0.85;}
                .et-btn.save{background:#059669;color:#f0fdf4;}
                .et-btn.cancel{background:transparent;border-color:rgba(148,163,184,0.2);color:#94a3b8;}
            `}</style>

            <div className="et-wrap">
                {pdfMode && <p className="py-8 text-lg text-slate-100">Historial de IVA</p>}

                <table className="et-table">
                    <thead className="et-thead">
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.id}
                                    className={`et-th${numCols.includes(col.id) ? ' num' : col.id === 'options' ? ' center' : ''}`}
                                >
                                    {col.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {processedItems.map(item => (
                            <tr key={item._key} className="et-tr">
                                {columns.map(col => {
                                    const isNum = numCols.includes(col.id);
                                    const isEditing = editingRowId === item.id;

                                    return (
                                        <td key={col.id} className={`et-td${isNum ? ' num' : col.id === 'options' ? ' center' : ''}`}>
                                            {isEditing && col.id !== 'options' ? (
                                                <input
                                                    className="et-edit-input"
                                                    value={String(editValues[col.id as keyof IVAReports] ?? '')}
                                                    onChange={e => handleInputChange(col.id as keyof IVAReports, e.target.value)}
                                                />
                                            ) : col.id === 'options' && !pdfMode && user?.role === 'ADMIN' ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="et-menu-btn" title="Opciones">
                                                            <MoreVertical size={13} />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[#1e293b] border-slate-700 min-w-[140px] text-slate-200 p-1">
                                                        <DropdownMenuItem 
                                                          className="flex items-center gap-2 cursor-pointer text-blue-300 focus:bg-slate-800 focus:text-blue-200 rounded-md px-2 py-1.5"
                                                          onClick={() => handleEdit(item)}
                                                        >
                                                            <Pencil size={12} /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                          className="flex items-center gap-2 cursor-pointer text-rose-300 focus:bg-slate-800 focus:text-rose-200 rounded-md px-2 py-1.5"
                                                          onClick={() => setReportIdToDelete(item.id)}
                                                        >
                                                            <Trash2 size={12} /> Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : col.id === 'date' ? (
                                                (() => {
                                                    const [y, m, d] = item.date.slice(0, 10).split('-');
                                                    return `${d}/${m}/${y}`;
                                                })()
                                            ) : col.id === 'paid' ? (
                                                (() => {
                                                    const val = decimalToNumber(item.paid);
                                                    return val > 0 ? (
                                                        <span className="et-paid-badge">
                                                            {val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    ) : (
                                                        <span className="et-zero-val">—</span>
                                                    );
                                                })()
                                            ) : isNum ? (
                                                decimalToNumber(item[col.id as keyof IVAReports]).toLocaleString('es-VE', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })
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

                {editingRowId && (
                    <div className="et-edit-bar">
                        <button className="et-btn cancel" onClick={handleCancel}><X size={12} /> Cancelar</button>
                        <button className="et-btn save" onClick={handleSave}><Check size={12} /> Guardar</button>
                    </div>
                )}
            </div>

            {reportIdToDelete && user?.role === 'ADMIN' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm p-6 rounded-xl" style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)' }}>
                        <p className="mb-4 text-sm text-slate-200">¿Eliminar este reporte de IVA?</p>
                        <div className="flex justify-end gap-3">
                            <button className="et-btn cancel" onClick={() => setReportIdToDelete(null)}><X size={12} /> Cancelar</button>
                            <button className="et-btn" style={{ background: '#e11d48', color: 'white' }} onClick={confirmDeleteReport}><Trash2 size={12} /> Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TaxSummaryTable;
