<<<<<<< HEAD
import React, { useState, useMemo, useEffect, useRef } from 'react';
import InfoTableOptMenu from '../UI/InfoTable/InfoTableOptMenu';
import { Parish, Taxpayer } from '../../types/taxpayer';
import { useAuth } from '@/hooks/useAuth';
import { getParishList, getTaxpayerCategories, updateTaxpayer } from '../utils/api/taxpayerFunctions';
import toast from 'react-hot-toast';
import { TaxpayerCategories } from '@/types/taxpayerCategories';

interface TaxpayerTableProps {
    propRows: Taxpayer[];
    visibleCount: number;
    setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
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

const TaxpayerTable: React.FC<TaxpayerTableProps> = ({ propRows, visibleCount, setVisibleCount }) => {
    const { user } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadingMoreLock = useRef(false); // lock para evitar múltiples cargas simultáneas
    const [editingRows, setEditingRows] = useState<{ [key: string]: Partial<Taxpayer> }>({});;
    const [parishList, setParishList] = useState<Parish[]>([]);
    const [taxpayerCategories, setTaxpayerCategories] = useState<TaxpayerCategories[]>([]);
    const [rows, setRows] = useState<Taxpayer[]>(propRows);

    let nonEditableCols: string[] = [];
    if (user?.role === "ADMIN") {
        nonEditableCols = [
            "options",
            "user.name",
            "contract_type",
            "providenceNum",
            "emition_date",
        ];
    } else {
        nonEditableCols = [
            "options",
            "user.name",
            "contract_type",
            "providenceNum",
            "emition_date",
            "process",
            "name",
            "rif",
            "address"
        ];
    }

    useEffect(() => {
        setRows(propRows);
    }, [propRows]);

    // console.log(propRows)

    const visibleRows = useMemo(() => {
        const sorted = [...rows].sort((a, b) => Number(a.providenceNum) - Number(b.providenceNum));
        return sorted.slice(0, visibleCount);
    }, [rows, visibleCount]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        let debounceTimeout: ReturnType<typeof setTimeout>;

        const handleScroll = () => {
            // Debounce para no disparar muchas veces el evento
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                if (loadingMoreLock.current || isLoadingMore) return;

                const scrollTop = el.scrollTop;
                const scrollHeight = el.scrollHeight;
                const clientHeight = el.clientHeight;

                // Distancia desde el scroll al final
                const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

                // Si estamos a menos de 100px del fondo y hay más filas para cargar
                if (distanceToBottom < 100 && visibleCount < propRows.length) {
                    loadingMoreLock.current = true; // bloqueamos
                    setIsLoadingMore(true);

                    // Simula carga asincrónica
                    setTimeout(() => {
                        setVisibleCount((prev) => Math.min(prev + 25, propRows.length));
                        setIsLoadingMore(false);
                        loadingMoreLock.current = false; // desbloqueamos
                    }, 500);
                }
            }, 150); // 150ms debounce, ajusta si quieres
        };

        el.addEventListener('scroll', handleScroll);

        return () => {
            clearTimeout(debounceTimeout);
            el.removeEventListener('scroll', handleScroll);
        };
    }, [visibleCount, propRows.length, isLoadingMore]);

    useEffect(() => {
        const fetchCategoriesAndParish = async () => {
            try {
                const parish = await getParishList();
                setParishList(parish.data);
            } catch (err) {
                console.error("Error al obtener parroquias:", err);
                toast.error("No se pudo obtener la lista de parroquias");
            }

            try {
                const categories = await getTaxpayerCategories();
                setTaxpayerCategories(categories.data);
            } catch (err) {
                console.error("Error al obtener actividad comercial:", err);
                toast.error("No se pudo obtener la lista de actividad comercial");
            }
        };

        if (user) {
            fetchCategoriesAndParish();
        }
    }, [user]);

    const handleSave = async (id: string) => {
        try {
            const edited = editingRows[id];
            if (!edited) return;

            // Construir payload para el backend
            const payload: Record<string, any> = {
                ...edited,
                parish_id: edited.parish?.id,
                taxpayer_category_id: edited.taxpayer_category?.id,
            };

            delete payload.parish;
            delete payload.category;


            // 🔹 Llamar API
            await updateTaxpayer(id, payload);

            // 🔹 Actualizar la fila en el estado local
            setRows((prev) =>
                prev.map((row) =>
                    row.id === id
                        ? {
                            ...row,
                            ...edited,
                            parish: parishList.find((p) => p.id === edited.parish?.id) ?? row.parish,
                            category:
                                taxpayerCategories.find((c) => c.id === edited.taxpayer_category?.id) ??
                                row.taxpayer_category,
                        }
                        : row
                )
            );

            // 🔹 Quitar modo edición
            setEditingRows((prev) => {
                const { [id]: _, ...rest } = prev;
                return rest;
            });

            toast.success("Contribuyente actualizado correctamente ✅");
        } catch (err) {
            console.error("Error actualizando contribuyente", err);
            toast.error("❌ Error al actualizar contribuyente");
        }
    };

    const handleCancel = (id: string) => {
        setEditingRows((prev) => {
            const { [id]: _, ...rest } = prev;
            return rest;
        });
    };






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
                    className="sticky top-0 z-10 bg-[#363F4B] rounded-t-lg text-white text-center min-w-max flex lg:grid"
                    style={{
                        // Solo en lg: divide el ancho total disponible en partes iguales
                        // Usa una columna por cada item en columns[]
                        gridTemplateColumns: `repeat(${columns.length}, 0.4fr)`
                    }}
                >
                    {columns.map((col) => (
                        <div
                            key={col.id}
                            className="px-1 pl-4 py-1 font-semibold min-w-[10rem] 
                            lg:min-w-0 xl:min-w-[3rem] lg:px-2 lg:py-2 lg:whitespace-nowrap"
                        >
                            {col.label}
                        </div>
                    ))}
                </div>

                {/* BODY */}
                {visibleRows.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center text-center transition-colors hover:bg-blue-50 lg:grid"
                        style={{
                            // Igual que el header: mismas columnas
                            gridTemplateColumns: `repeat(${columns.length}, 0.8fr)`
                        }}
                    >
                        {columns.map((col) => {
                            const value =
                                col.id === 'options' ? (
                                    editingRows[item.id] ? (
                                        <div className="flex flex-col justify-center gap-2">
                                            <button
                                                onClick={() => handleSave(item.id)}
                                                className="px-2 py-1 text-xs text-white bg-green-500 rounded"
                                            >
                                                Guardar
                                            </button>
                                            <button
                                                onClick={() => handleCancel(item.id)}
                                                className="px-2 py-1 text-xs text-white bg-gray-400 rounded"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <InfoTableOptMenu id={item.id} setEditingRows={setEditingRows} />
                                    )
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
                                    className="px-1 pl-4 py-1 break-words whitespace-normal min-w-[10rem] 
                                    lg:min-w-0 lg:px-2 lg:py-2 lg:break-words "
                                >
                                    {editingRows[item.id] && !nonEditableCols.includes(col.id) ? (
                                        col.id === "parish" ? (
                                            <select
                                                className="w-full px-2 py-1 text-xs border"
                                                value={
                                                    editingRows[item.id]?.parish?.id ??
                                                    item.parish?.id ??
                                                    ""
                                                }
                                                onChange={(e) => {
                                                    const selected = parishList.find((p) => p.id === e.target.value);
                                                    if (!selected) return;
                                                    setEditingRows((prev) => ({
                                                        ...prev,
                                                        [item.id]: {
                                                            ...prev[item.id],
                                                            parish: { id: selected.id, name: selected.name }, // ✅ guardar id y name
                                                        },
                                                    }));
                                                }}
                                            >
                                                <option value="">Seleccione una parroquia</option>
                                                {parishList.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : col.id === "taxpayer_category" ? (
                                            <select
                                                className="w-full px-2 py-1 text-xs border"
                                                value={
                                                    editingRows[item.id]?.taxpayer_category?.id ??
                                                    item.taxpayer_category?.id ??
                                                    ""
                                                }
                                                onChange={(e) => {
                                                    const selected = taxpayerCategories.find((c) => c.id === e.target.value);
                                                    if (!selected) return;
                                                    setEditingRows((prev) => ({
                                                        ...prev,
                                                        [item.id]: {
                                                            ...prev[item.id],
                                                            taxpayer_category: { id: selected.id, name: selected.name }, // ✅ guardar id y name
                                                        },
                                                    }));
                                                }}
                                            >
                                                <option value="">Seleccione una actividad</option>
                                                {taxpayerCategories.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                className="w-full px-2 py-1 text-xs border"
                                                value={String(
                                                    editingRows[item.id][col.id as keyof Taxpayer] ??
                                                    item[col.id as keyof Taxpayer] ??
                                                    ""
                                                )}
                                                onChange={(e) =>
                                                    setEditingRows((prev) => ({
                                                        ...prev,
                                                        [item.id]: {
                                                            ...prev[item.id],
                                                            [col.id]: e.target.value,
                                                        },
                                                    }))
                                                }
                                            />
                                        )
                                    ) : (
                                        value
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}

                {/* Loader */}
                {isLoadingMore && (
                    <div className="flex justify-center py-2">
                        <div className="w-5 h-5 border-2 border-blue-500 rounded-full border-t-transparent animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(TaxpayerTable);
=======
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
        <Table
            aria-label='Contribuyentes'
            selectionMode="multiple"
            selectionBehavior="replace"
            sortDescriptor={sortDescriptor}
            onSortChange={handleSortChange}
            className=""
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
                            <Cell className={` pl-4 text-sm truncate focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-600 focus-visible:-outline-offset-4 group-selected:focus-visible:outline-white`}>
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
    )
}

export default TaxpayerTable
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
