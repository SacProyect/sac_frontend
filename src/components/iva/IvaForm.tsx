import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Control, useForm } from 'react-hook-form';
import { Taxpayer } from '@/types/taxpayer';
import TaxpayerCombobox from '../UI/TaxpayerCombobox';
import { EventFormData } from '../Events/EventForm';
import toast from 'react-hot-toast';
import { createIVA } from '../utils/api/taxpayerFunctions';
import { IslrReportFormData } from '../ISLR/IslrForm';
import Decimal from 'decimal.js';

export interface IvaReportFormData {
    taxpayerId: string;
    iva?: number;
    purchases: number;
    sells: number;
    excess?: number;
    date: string;
    paid: string;
}


function IvaForm() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [nextAllowedMonth, setNextAllowedMonth] = useState<number | null>(null);
    const [nextAllowedYear, setNextAllowedYear] = useState<number | null>(null);
    const [filter, setFilter] = useState('');
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate("/login");
        }
    }, [user, navigate]);

    if (!user) return null;

    useEffect(() => {
        refreshUser();
    }, [])


    let taxpayerArray: Taxpayer[] = [];
    if (user.role === "ADMIN" || user.role === "FISCAL") {
        taxpayerArray = user.taxpayer;
    } else if (user.role === "COORDINATOR") {
        taxpayerArray = user.coordinatedGroup.members
            ? user.coordinatedGroup.members.flatMap((member) => member.taxpayer || [])
            : [];
    }

    const {
        register,
        handleSubmit,
        formState: { errors },
        control,
        setValue,
        reset,
        watch,
    } = useForm<IvaReportFormData>({
        mode: "onChange",
        defaultValues: {
            taxpayerId: "",
            date: "",
        },
    });

    const onSubmit = async (data: IvaReportFormData) => {
        console.log("Submitting data:", data);

        if (data.iva && data.excess) {
            toast.error("No puede ingresar IVA y excedente al mismo tiempo.");
            return;
        }

        const formattedData = { ...data, paid: new Decimal(data.paid.replace(",", ".")).toString(), }

        try {
            const report = await createIVA(formattedData);
            if (report) {
                reset();
                await refreshUser();
                setTimeout(() => {
                    setValue("taxpayerId", data.taxpayerId); // volver a establecer contribuyente
                }, 500); // esperar un poco antes de restablecer valor para recalcular
                toast.success("Reporte creado exitosamente");
            }
        } catch (e: any) {
            console.error("Error creating IVA report:", e);
            toast.error(e.message);
        }
    };

    const ivaValue = watch("iva");
    const excessValue = watch("excess");
    const dateValue = watch('date');


    console.log("TAXPAYERS: " + JSON.stringify(taxpayerArray));

    const taxpayerId = watch("taxpayerId");

    const selectedTaxpayer = taxpayerArray.find(t => t.id === taxpayerId);

    const calculatedExcess =
        selectedTaxpayer?.IVAReports?.slice().sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0]?.excess || 0;


    // Recalcular mes siguiente cuando cambie el contribuyente
    useEffect(() => {
        if (!selectedTaxpayer) {
            setNextAllowedMonth(null);
            setNextAllowedYear(null);
            setValue('date', '');
            return;
        }

        const sorted = [...(selectedTaxpayer.IVAReports || [])]
            .sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

        let year: number;
        let monthNumber: number;

        if (sorted.length === 0) {
            // Sin reportes: enero del año actual
            const now = new Date();
            year = now.getFullYear();
            monthNumber = 1;
        } else {
            // Extraemos mes/año del último reporte desde el string
            const [yearStr, monthStr] = sorted[0].date.split('-');
            const lastMonth = parseInt(monthStr, 10); // 1–12
            year = parseInt(yearStr, 10);
            monthNumber = lastMonth + 1;
            if (monthNumber > 12) {
                monthNumber = 1;
                year += 1;
            }
        }

        setNextAllowedMonth(monthNumber);
        setNextAllowedYear(year);

        // Creamos un Date en UTC para el primer día de ese mes
        const isoDate = new Date(Date.UTC(year, monthNumber - 1, 1)).toISOString();
        // Ejemplo resultante: "2025-05-01T00:00:00.000Z"

        setValue('date', isoDate);
    }, [selectedTaxpayer, setValue]);

    const filteredTaxpayers = taxpayerArray.filter(t =>
        `${t.name} ${t.rif} ${t.process} ${t.providenceNum}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <div className="flex items-center justify-center w-full h-full lg:h-[100vh] pt-10 lg:pt-0">
            <form
                onSubmit={handleSubmit(onSubmit, (formErrors) => {
                    console.error("Errores de validación:", formErrors);
                })}
                className="flex flex-col w-[90vw] sm:w-[60vw] md:w-[40vw] lg:w-[35vw] bg-white border border-gray-100 rounded-2xl shadow-xl p-8 space-y-6"
            >
                <h1 className="text-xl font-semibold text-center text-gray-800">Agregar Reporte de IVA</h1>

                <div className="relative">
                    <label className="block mb-1 text-sm font-medium text-gray-600">Contribuyente</label>
                    <input
                        type="text"
                        placeholder="Buscar contribuyente..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setShowDropdown(true)}
                        className="w-full px-3 py-2 mb-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="hidden"
                        {...register("taxpayerId", { required: "Este campo es obligatorio" })}
                        value={selectedId}
                    />
                    {errors.taxpayerId && (
                        <p className="mt-1 text-xs text-red-500">{errors.taxpayerId.message}</p>
                    )}
                    {showDropdown && filteredTaxpayers.length > 0 && (
                        <div className="absolute z-10 w-full overflow-y-auto bg-white border border-gray-300 rounded-md shadow-md max-h-52">
                            {filteredTaxpayers.map((t) => (
                                <div
                                    key={t.id}
                                    onClick={() => {
                                        setSearch(`${t.name} — ${t.process} — ${t.providenceNum}`);
                                        setValue("taxpayerId", t.id);
                                        setSelectedId(t.id);
                                        setShowDropdown(false);
                                    }}
                                    className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-500 hover:text-white"
                                >
                                    {t.name} — {t.process} — {t.providenceNum}
                                </div>
                            ))}
                        </div>
                    )}
                </div>



                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Monto de IVA (BS)</label>
                    <input
                        type="number"
                        {...register("iva", {
                            required: excessValue ? false : "Este campo es obligatorio",
                            valueAsNumber: true,
                            min: { value: 0, message: "Debe ser un valor positivo" },
                        })}
                        placeholder="Introduzca el monto de IVA..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={typeof excessValue === "number" && !isNaN(excessValue) && excessValue > 0}
                    />
                    {typeof excessValue === "number" && !isNaN(excessValue) && excessValue > 0 && (
                        <p className="mt-1 text-xs text-yellow-600">
                            Este campo está deshabilitado porque ya se introdujo un excedente de crédito.
                        </p>
                    )}
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Compras (BS)</label>
                    <input
                        type="number"
                        {...register("purchases", {
                            required: "Este campo es obligatorio",
                            valueAsNumber: true,
                        })}
                        placeholder="Monto de compras..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Ventas (BS)</label>
                    <input
                        type="number"
                        {...register("sells", {
                            required: "Este campo es obligatorio",
                            valueAsNumber: true,
                        })}
                        placeholder="Monto de ventas..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Recaudado (BS)</label>
                    <input
                        type="text"
                        {...register("paid", {
                            required: "Este campo es obligatorio",
                            pattern: {
                                value: /^[0-9.,]+$/,
                                message: "Solo se permiten números, puntos o comas"
                            },
                            validate: (value) => {
                                const parsed = parseFloat(value.replace(",", "."));
                                return !isNaN(parsed) && parsed >= 0 || "Debe ser un número válido y positivo";
                            }
                        })}
                        placeholder="Ej: 1000.50"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {(calculatedExcess === 0 || calculatedExcess === undefined) && (
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-600">Excedente (BS)</label>
                        <input
                            type="number"
                            {...register("excess", {
                                valueAsNumber: true,
                            })}
                            placeholder="Monto de excedente (opcional)..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200"
                            disabled={typeof ivaValue === "number" && !isNaN(ivaValue) && ivaValue > 0}
                        />
                        {typeof ivaValue === "number" && !isNaN(ivaValue) && ivaValue > 0 && (
                            <p className="mt-1 text-xs text-yellow-600">
                                Este campo está deshabilitado porque ya se introdujo un monto de IVA.
                            </p>
                        )}
                    </div>
                )}

                {calculatedExcess > 0 && taxpayerId !== "" && (
                    <div>
                        <p className='text-sm'>Excedente de crédito: {calculatedExcess}</p>
                    </div>
                )}


                <input
                    type="hidden"
                    {...register('date', { required: true })}
                />


                {nextAllowedMonth !== null && nextAllowedYear !== null && (
                    <p className="mt-1 text-sm text-gray-600">
                        La fecha del reporte debe ser del mes de: <strong>
                            {new Date(nextAllowedYear, nextAllowedMonth - 1)
                                .toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                        </strong>
                    </p>
                )}



                <button
                    type="submit"
                    className="w-full py-2 mt-4 text-sm font-medium text-white transition bg-blue-500 rounded-lg hover:bg-blue-600"
                >
                    Enviar
                </button>
            </form>
        </div>
    );
}

export default IvaForm;