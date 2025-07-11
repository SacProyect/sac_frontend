import React, { useState, useMemo } from 'react';
import { Controller, Control } from 'react-hook-form';
import { Taxpayer } from '../../types/taxpayer';
import { EventFormData } from '../Events/EventForm';
import { IvaReportFormData } from '../iva/IvaForm';
import { IslrReportFormData } from '../ISLR/IslrForm';
import { BsArrowDownSquareFill } from "react-icons/bs";


interface Props {
    control: Control<EventFormData | IvaReportFormData | IslrReportFormData>;
    name: keyof EventFormData;
    label: string;
    taxpayers?: Taxpayer[];
}

const TaxpayerList: React.FC<Props> = ({ control, name, label, taxpayers = [] }) => {
    const [inputValue, setInputValue] = useState('');
    const [isDropdownOpen, setDropdownOpen] = useState(false);

    const normalize = (str: string) =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const filteredTaxpayers = useMemo(() => {
        const query = normalize(inputValue);
        return taxpayers.filter((t) =>
            normalize(`${t.providenceNum} ${t.process} ${t.rif} ${t.name}`).includes(query)
        );
    }, [inputValue, taxpayers]);

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
                            value={taxpayers.find(t => t.id === field.value)?.name || inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                setDropdownOpen(true);
                            }}
                            onFocus={() => setDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                            className={`w-full p-2 pr-8 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Buscar contribuyente..."
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


                    {isDropdownOpen && filteredTaxpayers.length > 0 && (
                        <ul className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg max-h-40">
                            {filteredTaxpayers.map((taxpayer) => (
                                <li
                                    key={taxpayer.id}
                                    className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                                    onClick={() => {
                                        field.onChange(taxpayer.id);
                                        setInputValue(taxpayer.name);
                                        setDropdownOpen(false);
                                    }}
                                >
                                    <div className="font-semibold">{taxpayer.name}</div>
                                    <div className="text-sm text-gray-500">
                                        {taxpayer.rif} - {taxpayer.process} - {new Date(taxpayer.emition_date).toLocaleDateString('es-VE')}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {error && <p className="mt-1 text-sm text-red-500">{error.message}</p>}
                </div>
            )}
        />
    );
};

export default TaxpayerList;
