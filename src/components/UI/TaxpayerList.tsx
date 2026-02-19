import React, { useState, useMemo, useDeferredValue, useCallback, useRef } from 'react';
import { Controller, Control } from 'react-hook-form';
import { Taxpayer } from '../../types/taxpayer';
import { EventFormData } from '../Events/EventForm';
import { IvaReportFormData } from '../iva/IvaForm';
import { IslrReportFormData } from '../ISLR/IslrForm';

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
    const listRef = useRef<HTMLUListElement>(null);

    const deferredInput = useDeferredValue(inputValue);

    const handleScroll = useCallback(() => {
        const el = listRef.current;
        if (!el || !onLoadMore || !hasMore || loadingMore) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const threshold = 40;
        if (scrollTop + clientHeight >= scrollHeight - threshold) {
            onLoadMore();
        }
    }, [onLoadMore, hasMore, loadingMore]);

    const filteredTaxpayers = useMemo(() => {
        const query = normalize(deferredInput);
        return taxpayers.filter((t) =>
            normalize(`${t.providenceNum} ${t.process} ${t.rif} ${t.name}`).includes(query)
        );
    }, [deferredInput, taxpayers]);

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
                            {searchLoading && filteredTaxpayers.length === 0 ? (
                                <div className="absolute z-10 w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-lg text-sm text-gray-500">
                                    Buscando...
                                </div>
                            ) : filteredTaxpayers.length > 0 ? (
                        <ul
                            ref={listRef}
                            className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg max-h-40"
                            onScroll={handleScroll}
                        >
                            {filteredTaxpayers.map((taxpayer) => (
                                <li
                                    key={taxpayer.id}
                                    className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                                    onClick={() => handleSelect(taxpayer, field.onChange)}
                                >
                                    <div className="font-semibold">{taxpayer.name}</div>
                                    <div className="text-sm text-gray-500">
                                        {taxpayer.rif} - {taxpayer.process} - {taxpayer.emition_date}
                                    </div>
                                </li>
                            ))}
                            {loadingMore && (
                                <li className="px-3 py-2 text-sm text-gray-500 text-center">
                                    Cargando...
                                </li>
                            )}
                        </ul>
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
