import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Control, useForm } from 'react-hook-form';
import { Taxpayer } from '@/types/taxpayer';
import TaxpayerCombobox from '../UI/TaxpayerCombobox';
import { EventFormData } from '../Events/EventForm';
import toast from 'react-hot-toast';
import { createISLR } from '../utils/api/taxpayerFunctions';
import Decimal from 'decimal.js';
import { IvaReportFormData } from '../iva/IvaForm';

export interface IslrReportFormData {
    taxpayerId: string;
    incomes: string; // ← texto para permitir , o .
    costs: string;
    expent: string;
    emition_date: string;
    paid: string;
}

function IslrForm() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [filter, setFilter] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) {
            navigate("/login");
        }
    }, [user, navigate]);

    if (!user) return null;

    let taxpayerArray: Taxpayer[] = [];
    if (user.role === "ADMIN") {
        taxpayerArray = user.taxpayer;
    } else if (user.role === "FISCAL") {
        taxpayerArray = user.taxpayer.filter((t) => t.officerId === user.id);
    } else if (user.role === "COORDINATOR") {
        taxpayerArray = user.taxpayer.filter((t) => t.user?.group?.coordinatorId === user.id);
    } else if (user.role === "SUPERVISOR") {
        taxpayerArray = user.taxpayer.filter((t) => t.officerId === user.id);
    }

    const {
        register,
        handleSubmit,
        formState: { errors },
        control,
        setValue,
        reset,
        watch,
    } = useForm<IslrReportFormData>({
        mode: "onChange",
        defaultValues: {
            taxpayerId: "",
        },
    });

    const onSubmit = async (data: IslrReportFormData) => {
        try {
            const formattedData = {
                taxpayerId: data.taxpayerId,
                incomes: new Decimal(data.incomes.replace(",", ".")).toString(),
                costs: new Decimal(data.costs.replace(",", ".")).toString(),
                expent: new Decimal(data.expent.replace(",", ".")).toString(),
                emition_date: new Date(data.emition_date).toISOString(),
                paid: new Decimal(data.paid.replace(",", ".")).toString(),
            };

            console.log("Sending ISLR report:", formattedData);
            const report = await createISLR(formattedData);
            if (report) toast.success("Reporte ISLR creado exitosamente");
            reset();
            await refreshUser();
        } catch (e: any) {
            console.error("Error creating ISLR report:", e);
            toast.error(e.message);
        }
    };

    const filteredTaxpayers = useMemo(() => {
        return taxpayerArray.filter(t =>
            `${t.providenceNum} ${t.process} ${t.rif} ${t.name}`.toLowerCase().includes(filter.toLowerCase())
        );
    }, [taxpayerArray, filter]);

    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="flex items-center justify-center w-full h-full lg:h-[100vh] pt-10 lg:pt-0">
            <form
                onSubmit={handleSubmit(onSubmit, (formErrors) => {
                    console.error("Errores de validación:", formErrors);
                })}
                className="flex flex-col w-[90vw] sm:w-[60vw] md:w-[40vw] lg:w-[35vw] bg-white border border-gray-100 rounded-2xl shadow-xl p-8 space-y-6"
            >
                <h1 className="text-xl font-semibold text-center text-gray-800">Agregar Reporte de ISLR</h1>

                <div className="relative">
                    <label className="block mb-1 text-sm font-medium text-gray-600">Buscar Contribuyente</label>
                    <input
                        type="text"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Buscar por nombre, RIF o número de providencia"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {showSuggestions && (
                        <div ref={menuRef} className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg max-h-60">
                            {filteredTaxpayers.length > 0 ? (
                                filteredTaxpayers.map((t) => (
                                    <div
                                        key={t.id}
                                        onClick={() => {
                                            setValue("taxpayerId", t.id);
                                            setFilter(t.name); // ← aquí antes lo borrabas con setFilter('')
                                            setShowSuggestions(false);
                                        }}
                                        className={`px-4 py-2 text-sm cursor-pointer transition-all hover:bg-blue-100 ${watch("taxpayerId") === t.id ? "bg-blue-200" : ""
                                            }`}
                                    >
                                        <div className="font-semibold">{t.name}</div>
                                        <div className="text-xs text-gray-500">{t.rif} — {t.process}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-2 text-sm text-gray-500">No se encontraron resultados</div>
                            )}
                        </div>
                    )}
                </div>
                <input type="hidden" {...register("taxpayerId", { required: "Este campo es obligatorio" })} />


                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Ingresos (BS)</label>
                    <input
                        type="text"
                        {...register("incomes", {
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


                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Costos (BS)</label>
                    <input
                        type="text"
                        {...register("costs", {
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
                        placeholder="Ej: 500,75"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Gastos (BS)</label>
                    <input
                        type="text"
                        {...register("expent", {
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
                        placeholder="Ej: 250.00"
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

                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Fecha de Emisión</label>
                    <input
                        type="date"
                        {...register("emition_date", {
                            required: "Este campo es obligatorio",
                            validate: (value) =>
                                !isNaN(Date.parse(value)) || "Fecha inválida",
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

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

export default IslrForm;
