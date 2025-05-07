import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Control, useForm } from 'react-hook-form';
import { Taxpayer } from '@/types/taxpayer';
import TaxpayerCombobox from '../UI/TaxpayerCombobox';
import { EventFormData } from '../Events/EventForm';
import toast from 'react-hot-toast';
import { createIVA } from '../utils/api/taxpayerFunctions';

export interface IvaReportFormData {
    taxpayerId: string;
    iva: number;
    purchases: number;
    sells: number;
    excess?: number;
    date: string;
}

interface IvaFormProps {
    taxpayerId?: string;
}

function IvaForm({ taxpayerId = "" }: IvaFormProps) {
    const { user } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (!user) {
            navigate("/login");
        }
    }, [user, navigate]);

    if (!user) return null;

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
    } = useForm<IvaReportFormData>({
        mode: "onChange",
        defaultValues: {
            taxpayerId: "",
            iva: 0,
            purchases: 0,
            sells: 0,
            date: "",
        },
    });

    const onSubmit = async (data: IvaReportFormData) => {
        try {
            const report = await createIVA(data);
            if (report) {
                reset();
                toast.success("Reporte creado exitosamente");
            }
        } catch (e) {
            console.error("Error creating IVA report:", e);
            toast.error("Error al enviar el formulario");
        }
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedMonth = e.target.value;
        const currentYear = new Date().getFullYear();
        const isoDate = new Date(`${currentYear}-${selectedMonth}-01`).toISOString();
        setValue("date", isoDate);
    };

    return (
        <div className="w-full h-full flex items-center justify-center">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col w-[90vw] sm:w-[60vw] md:w-[40vw] h-full lg:[45vw] lg:h-[75vh] bg-white border border-gray-100 rounded-2xl shadow-xl p-8 space-y-6"
            >
                <h1 className="text-center text-xl font-semibold text-gray-800">Agregar Reporte de IVA</h1>

                {taxpayerId === "" && (
                    <TaxpayerCombobox
                        name="taxpayerId"
                        control={control as Control<IvaReportFormData | EventFormData>}
                        label="Contribuyente"
                        taxpayers={taxpayerArray}
                    />
                )}



                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Monto de IVA (BS)</label>
                    <input
                        type="number"
                        {...register("iva", {
                            required: "Este campo es obligatorio",
                            valueAsNumber: true,
                            min: { value: 0, message: "Debe ser un valor positivo" },
                        })}
                        placeholder="Introduzca el monto de IVA..."
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Compras</label>
                    <input
                        type="number"
                        {...register("purchases", {
                            required: "Este campo es obligatorio",
                            valueAsNumber: true,
                        })}
                        placeholder="Monto de compras..."
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Ventas</label>
                    <input
                        type="number"
                        {...register("sells", {
                            required: "Este campo es obligatorio",
                            valueAsNumber: true,
                        })}
                        placeholder="Monto de ventas..."
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Excedente (BS)</label>
                    <input
                        type="number"
                        {...register("excess")}
                        placeholder="Monto de excedente (opcional)..."
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <input type="hidden" {...register("date", { required: true })} />
                    <label className="block text-sm font-medium text-gray-600 mb-1">Mes</label>
                    <select
                        onChange={handleMonthChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    >
                        <option value="">Seleccione un mes</option>
                        {[...Array(12)].map((_, index) => (
                            <option key={index} value={(index + 1).toString().padStart(2, '0')}>
                                {new Date(0, index).toLocaleString('es-ES', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="submit"
                    className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                >
                    Enviar
                </button>
            </form>
        </div>
    );
}

export default IvaForm;
