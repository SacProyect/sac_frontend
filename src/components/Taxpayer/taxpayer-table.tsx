import React, { useState, useMemo, useEffect, useRef } from 'react'; // useRef kept for containerRef (overflow scroll)
import InfoTableOptMenu from '../UI/InfoTable/info-table-opt-menu';
import { Parish, Taxpayer } from '../../types/taxpayer';
import { useAuth } from '@/hooks/use-auth';
import { getParishList, getTaxpayerCategories, updateTaxpayer } from '../utils/api/taxpayer-functions';
import toast from 'react-hot-toast';
import { TaxpayerCategories } from '@/types/taxpayer-categories';
import { EditTaxpayerModal } from './edit-taxpayer-modal';

interface TaxpayerTableProps {
    propRows: Taxpayer[];
}

const columns = [
    { label: 'Nro. Providencia', id: 'providenceNum' },
    { label: 'Procedimiento', id: 'process' },
    { label: 'Razón Social', id: 'name' },
    { label: 'RIF', id: 'rif' },
    { label: 'Tipo de Contr.', id: 'contract_type' },
    { label: 'Dirección', id: 'address' },
    { label: 'Fecha de Emisión', id: 'emition_date' },
    { label: 'Parroquia', id: 'parish' },
    { label: 'Actividad C.', id: 'taxpayer_category' },
    { label: 'Fiscal', id: 'user.name' },
    { label: 'Opciones', id: 'options' },
];

const TaxpayerTable: React.FC<TaxpayerTableProps> = ({ propRows }) => {
    const { user } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const [editingTaxpayer, setEditingTaxpayer] = useState<Taxpayer | null>(null);
    const [rows, setRows] = useState<Taxpayer[]>(propRows);

    useEffect(() => {
        setRows(propRows);
    }, [propRows]);

    // Todos los registros de la página actual se muestran (paginación del servidor)
    const visibleRows = useMemo(() => {
        return [...rows].sort((a, b) => Number(a.providenceNum) - Number(b.providenceNum));
    }, [rows]);






    return (
        <div
            ref={containerRef}
            className="overflow-auto w-full lg:w-[80vw] xl:w-[80vw] custom-scroll"
            style={{
                height: 'calc(100vh - 165px)' // puedes ajustar a 110px o 140px si aún ves scroll
            }}
        >
            <div className="flex flex-col min-w-full text-xs">
                {/* HEADER */}
                <div
                    className="hidden sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md rounded-t-xl text-slate-400 text-[10px] h-10 uppercase tracking-widest font-bold min-w-max md:flex md:grid border-b border-slate-800/50"
                    style={{
                        gridTemplateColumns: `repeat(${columns.length}, 0.8fr)`
                    }}
                >
                    {columns.map((col) => (
                        <div
                            key={col.id}
                            className="px-4 flex items-center justify-center text-center"
                        >
                            {col.label}
                        </div>
                    ))}
                </div>

                {/* BODY */}
                {visibleRows.map((item) => (
                    <div
                        key={item.id}
                        className="flex flex-col p-4 mb-4 bg-slate-900/30 rounded-xl border border-slate-800/50 shadow-lg transition-all hover:bg-indigo-500/5 hover:border-indigo-500/20 group md:grid md:p-0 md:mb-0 md:rounded-none md:shadow-none md:border-b md:border-slate-800/30"
                        style={{
                            gridTemplateColumns: `repeat(${columns.length}, 0.8fr)`
                        }}
                    >
                        {columns.map((col) => {
                            const isOptionsCol = col.id === 'options';
                            const isMyTaxpayer = item.user?.id === user?.id || user?.taxpayer?.some(t => t.id === item.id);
                            const canEdit = user?.role === "ADMIN" || isMyTaxpayer;

                            const value =
                                col.id === 'options' ? (
                                    <InfoTableOptMenu id={item.id} onEditClick={() => setEditingTaxpayer(item)} canEdit={!!canEdit} />
                                ) : col.id === 'emition_date' ? (
                                    new Date(item.emition_date).toLocaleDateString()
                                ) : col.id === "taxpayer_category" ? (
                                    item.taxpayer_category?.name ?? "No se encontró la actividad comercial"
                                ) : col.id === "parish" ? (
                                    item.parish?.name ?? "No se encontró la parroquia"
                                ) : col.id === "contract_type" ? (
                                    item.contract_type === "ORDINARY" ? "ORDINARIO" : "ESPECIAL"
                                ) : col.id === 'user.name' ? (
                                    item.user?.name ?? '—'
                                ) : (
                                    String(item[col.id as keyof Taxpayer])
                                );

                            return (
                                <div
                                    key={col.id}
                                    className={`px-4 py-3 md:px-2 md:py-3 ${
                                        isOptionsCol
                                            ? 'flex items-center justify-end md:justify-center'
                                            : 'flex justify-between text-left md:block md:text-center'
                                    } text-slate-300 text-[11px] font-medium transition-colors group-hover:text-slate-100`}
                                >
                                    {!isOptionsCol && (
                                        <span className="font-bold text-slate-500 md:hidden uppercase tracking-tighter mr-2">{col.label}:</span>
                                    )}
                                    {isOptionsCol ? (
                                        <div className="flex items-center justify-center w-full">
                                            {value}
                                        </div>
                                    ) : (
                                        <span className="w-full text-right md:text-center">{value}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}

            </div>

            {editingTaxpayer && (
                <EditTaxpayerModal
                    isOpen={!!editingTaxpayer}
                    onClose={() => setEditingTaxpayer(null)}
                    taxpayerData={editingTaxpayer}
                    onSuccess={(updatedData) => {
                        setRows(prev => prev.map(r => r.id === updatedData.id ? { ...r, ...updatedData } : r));
                        setEditingTaxpayer(null);
                    }}
                />
            )}
        </div>
    );
};

export default React.memo(TaxpayerTable);
