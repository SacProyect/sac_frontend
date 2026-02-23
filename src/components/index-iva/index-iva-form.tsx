import { useForm } from "react-hook-form";
import { useState } from "react";
import toast from "react-hot-toast";
import { createIndexIva } from "../utils/api/taxpayer-functions";
import Decimal from "decimal.js";

type IndexIvaFormData = {
    ordinaryAmount: Decimal;
    specialAmount: Decimal;
    created_at?: string;
    expires_at?: string;
};

function IndexIvaForm() {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isValid },
    } = useForm<IndexIvaFormData>({
        mode: "onChange",
        defaultValues: {
            ordinaryAmount: 0,
            specialAmount: 0,
        },
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (data: IndexIvaFormData) => {
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            const response = await createIndexIva(data);

            reset()

            toast.success("Índices de IVA actualizados correctamente");
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar los índices de IVA");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-md p-6 mx-auto bg-white rounded-lg shadow h-[40vh] md:h-full lg:h-[40vh] md:mt-6 flex flex-col items-center justify-center">
            <h2 className="mb-6 text-2xl font-bold text-center text-black">
                Actualizar Índices de IVA
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* ORDINARY */}
                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                        Índice IVA - Ordinario (Bs.S)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        {...register("ordinaryAmount", {
                            required: "Este campo es obligatorio",
                            min: { value: 0, message: "Debe ser mayor o igual a cero" },
                        })}
                        className="w-full h-12 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-200 focus:border-blue-400"
                    />
                    {errors.ordinaryAmount && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.ordinaryAmount.message}
                        </p>
                    )}
                </div>

                {/* SPECIAL */}
                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                        Índice IVA - Especial (Bs.S)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        {...register("specialAmount", {
                            required: "Este campo es obligatorio",
                            min: { value: 0, message: "Debe ser mayor o igual a cero" },
                        })}
                        className="w-full h-12 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-200 focus:border-blue-400"
                    />
                    {errors.specialAmount && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.specialAmount.message}
                        </p>
                    )}
                </div>

                {/* SUBMIT */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={!isValid || isSubmitting}
                        className="w-full p-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        Guardar
                    </button>
                </div>
            </form>
        </div>
    );
}

export default IndexIvaForm;
