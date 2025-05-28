import React, { useState, useMemo, useEffect, useRef } from 'react';
import InfoTableOptMenu from '../UI/InfoTable/InfoTableOptMenu';
import { Taxpayer } from '../../types/taxpayer';

interface TaxpayerTableProps {
    propRows: Taxpayer[];
}

const columns = [
    { label: 'Nro. Providencia', id: 'providenceNum' },
    { label: 'Procedimiento', id: 'process' },
    { label: 'Razón Social', id: 'name' },
    { label: 'RIF', id: 'rif' },
    { label: 'Tipo de Contribuyente', id: 'contract_type' },
    { label: 'Dirección', id: 'address' },
    { label: 'Fecha de Emisión', id: 'emition_date' },
    { label: 'Fiscal', id: 'officerName' },
    { label: 'Opciones', id: 'options' },
];

const TaxpayerTable: React.FC<TaxpayerTableProps> = ({ propRows }) => {
    const [rows, setRows] = useState<Taxpayer[]>([]);
    const [visibleCount, setVisibleCount] = useState(25);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadingMoreLock = useRef(false); // lock para evitar múltiples cargas simultáneas

    useEffect(() => {
        // Ordena las filas por providenceNum
        const sorted = [...propRows].sort((a, b) => Number(a.providenceNum) - Number(b.providenceNum));
        setRows(sorted);
    }, [propRows]);

    const visibleRows = useMemo(() => rows.slice(0, visibleCount), [rows, visibleCount]);

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
                if (distanceToBottom < 100 && visibleCount < rows.length) {
                    loadingMoreLock.current = true; // bloqueamos
                    setIsLoadingMore(true);

                    // Simula carga asincrónica
                    setTimeout(() => {
                        setVisibleCount((prev) => Math.min(prev + 25, rows.length));
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
    }, [visibleCount, rows.length, isLoadingMore]);



    return (
        <div ref={containerRef} className="overflow-auto h-[70vh] lg:h-[83.5vh] w-[80vw] custom-scroll">
            <div className="flex flex-col min-w-full text-xs">
                {/* HEADER */}
                <div
                    className="sticky top-0 z-10 bg-[#363F4B] rounded-t-lg text-white text-center min-w-max flex lg:grid"
                    style={{
                        // Solo en lg: divide el ancho total disponible en partes iguales
                        // Usa una columna por cada item en columns[]
                        gridTemplateColumns: `repeat(${columns.length}, 0.8fr)`
                    }}
                >
                    {columns.map((col) => (
                        <div
                            key={col.id}
                            className="px-1 pl-4 py-1 font-semibold min-w-[10rem] 
                            lg:min-w-0 lg:px-2 lg:py-2 lg:whitespace-nowrap"
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
                                    <InfoTableOptMenu id={item.id} />
                                ) : col.id === 'emition_date' ? (
                                    new Date(item.emition_date).toLocaleDateString()
                                ) : col.id === "contract_type" ? (
                                    item.contract_type === "ORDINARY" ? "ORDINARIO" : "ESPECIAL"
                                ) : (
                                    String(item[col.id as keyof Taxpayer])
                                );

                            return (
                                <div
                                    key={col.id}
                                    className="px-1 pl-4 py-1 break-words whitespace-normal min-w-[10rem] 
                                    lg:min-w-0 lg:px-2 lg:py-2 lg:break-words "
                                >
                                    {value}
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

export default TaxpayerTable;
