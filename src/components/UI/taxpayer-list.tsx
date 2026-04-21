import React, { useState, useMemo, useDeferredValue, useCallback, useRef, useEffect } from 'react';
import { Controller, Control } from 'react-hook-form';
import { Taxpayer } from '../../types/taxpayer';
import { EventFormData } from '../Events/event-form';
import { IvaReportFormData } from '../iva/iva-form';
import { IslrReportFormData } from '../ISLR/islr-form';

const normalize = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

interface Props {
    control: Control<EventFormData | IvaReportFormData | IslrReportFormData>;
    name: keyof EventFormData;
    label: string;
    taxpayers?: Taxpayer[];
    onSearchChange?: (value: string) => void;
    searchLoading?: boolean;
    placeholder?: string;
    onLoadMore?: () => void;
    hasMore?: boolean;
    loadingMore?: boolean;
}

const TaxpayerList: React.FC<Props> = React.memo(({ control, name, label, taxpayers = [], onSearchChange, searchLoading, placeholder = 'Buscar contribuyente...', onLoadMore, hasMore, loadingMore }) => {
    const [inputValue, setInputValue] = useState('');
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isWaitingForBackend, setIsWaitingForBackend] = useState(false);
    const listRef = useRef<HTMLUListElement>(null);

    const deferredInput = useDeferredValue(inputValue);

    // Detectar cuando el usuario está escribiendo y esperando respuesta del backend
    useEffect(() => {
        // Si hay input del usuario y hay una función de búsqueda, estamos esperando al backend
        if (inputValue.trim().length > 0 && !!onSearchChange) {
            setIsWaitingForBackend(true);
        } else {
            setIsWaitingForBackend(false);
        }
    }, [inputValue, onSearchChange]);

    // Cuando searchLoading cambia a false, significa que el backend respondió
    useEffect(() => {
        if (!searchLoading && isWaitingForBackend) {
            setIsWaitingForBackend(false);
        }
    }, [searchLoading, isWaitingForBackend]);

    const handleScroll = useCallback(() => {
        const el = listRef.current;
        if (!el || !onLoadMore || !hasMore || loadingMore) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const threshold = 40;
        if (scrollTop + clientHeight >= scrollHeight - threshold) {
            onLoadMore();
        }
    }, [onLoadMore, hasMore, loadingMore]);

    /**
     * Filtrado de contribuyentes:
     * - Si hay búsqueda del backend activa (searchLoading o input del usuario con onSearchChange),
     *   mostramos los resultados del backend directamente SIN filtrar localmente.
     * - Solo filtramos localmente cuando NO hay búsqueda del backend (modo paginación simple).
     */
    const isBackendSearchActive = deferredInput.trim().length > 0 && !!onSearchChange;

    const filteredTaxpayers = useMemo(() => {
        // Si hay búsqueda del backend, mostrar resultados directamente
        if (isBackendSearchActive) {
            return taxpayers;
        }
        // Solo filtrar localmente cuando NO hay búsqueda del backend
        const query = normalize(deferredInput);
        return taxpayers.filter((t) =>
            normalize(`${t.providenceNum} ${t.process} ${t.rif} ${t.name}`).includes(query)
        );
    }, [deferredInput, taxpayers, isBackendSearchActive]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, onChange: (val: string) => void) => {
        const val = e.target.value;
        setInputValue(val);
        setDropdownOpen(true);
        onChange("");
        onSearchChange?.(val);
    }, [onSearchChange]);

    const handleSelect = useCallback((taxpayer: Taxpayer, onChange: (val: string) => void) => {
        onChange(taxpayer.id);
        setInputValue(taxpayer.name);
        setDropdownOpen(false);
    }, []);

    return (
        <Controller
            control={control}
            name={name}
            rules={{ required: 'Este campo es obligatorio' }}
            render={({ field, fieldState: { error } }) => (
                <div className="relative w-full">
                    <label className="block mb-1 text-sm font-medium text-gray-700">{label}</label>
                    <div className="relative w-full">
                        <input
                            type="text"
                            value={inputValue || taxpayers.find(t => t.id === field.value)?.name || ""}
                            onChange={(e) => handleInputChange(e, field.onChange)}
                            onFocus={() => setDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                            className={`w-full p-2 pr-8 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder={placeholder}
                        />
                        <div className="absolute inset-y-0 z-50 flex items-center justify-center text-center right-2">
                            <button
                                type="button"
                                className="px-0 py-0 w-7 h-7 rounded-lg text-xs bg-[#3498db] text-white content-center cursor-pointer"
                                onClick={() => setDropdownOpen(true)}
                            >
                                ▼
                            </button>
                        </div>
                    </div>

                    {isDropdownOpen && (
                        <>
                            {/* Estado: Cargando búsqueda del backend */}
                            {(searchLoading || isWaitingForBackend) && isBackendSearchActive ? (
                                <div className="absolute z-10 w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-lg text-sm text-gray-500 flex items-center gap-2">
                                    <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></span>
                                    Buscando contribuyentes...
                                </div>
                            ) : filteredTaxpayers.length > 0 ? (
                        <ul
                            ref={listRef}
                            className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg max-h-40"
                            onScroll={handleScroll}
                        >
                            {filteredTaxpayers.map((taxpayer) => {
                                const currentYear = new Date().getFullYear();
                                const year = taxpayer.emition_date ? new Date(taxpayer.emition_date).getFullYear() : 0;
                                const isCurrentYear = year === currentYear;

                                return (
                                    <li
                                        key={taxpayer.id}
                                        className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                                        onClick={() => handleSelect(taxpayer, field.onChange)}
                                    >
                                        <div className="font-semibold">{taxpayer.name}</div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm text-gray-500">{taxpayer.rif}</span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="text-sm text-gray-500">{taxpayer.process}</span>
                                            {/* Fecha de emisión con indicador de año actual */}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                                isCurrentYear
                                                    ? 'bg-emerald-100 text-emerald-600'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {taxpayer.emition_date
                                                    ? new Date(taxpayer.emition_date).toLocaleDateString('es-VE', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })
                                                    : 'Sin fecha'}
                                                {isCurrentYear && ' ✓'}
                                            </span>
                                        </div>
                                    </li>
                                );
                            })}
                            {loadingMore && (
                                <li className="px-3 py-2 text-sm text-gray-500 text-center">
                                    Cargando...
                                </li>
                            )}
                        </ul>
                            ) : isBackendSearchActive && !searchLoading && !isWaitingForBackend ? (
                                // Mostrar mensaje cuando el backend respondió y no hay resultados
                                <div className="absolute z-10 w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-lg text-sm text-gray-500">
                                    No se encontraron contribuyentes
                                </div>
                            ) : null}
                        </>
                    )}

                    {error && <p className="mt-1 text-sm text-red-500">{error.message}</p>}
                </div>
            )}
        />
    );
});

export default TaxpayerList;
