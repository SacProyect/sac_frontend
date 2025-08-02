import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import FormContainer from '../UI/FormContainer';
import { useNavigate } from 'react-router-dom';
// import { createTaxpayerCensus } from '../utils/api/taxpayerCensusFunctions';
import toast from 'react-hot-toast';
import { createTaxpayerCensus } from '../utils/api/taxpayerCensusFunctions';
import { useState } from 'react';

export type NewTaxpayerCensus = {
    number: number;
    process: 'FP';
    name: string;
    rif: string;
    type: 'ORDINARY' | 'SPECIAL';
    address: string;
    emition_date: string;
    userId: string;
};

function TaxpayerCensusForm() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [rifPrefix, setRifPrefix] = useState("J");

    if (!user) {
        navigate("/login");
        return null;
    }

    const { register, handleSubmit, reset, formState: { errors } } = useForm<NewTaxpayerCensus>({
        defaultValues: {
            number: -1,
            process: 'FP',
            name: '',
            rif: '',
            type: 'ORDINARY',
            address: 'Caracas',
            emition_date: '',
            userId: user.id
        }
    });

    const onSubmit = async (data: NewTaxpayerCensus) => {
        try {
            // Combine prefix and RIF digits
            const completeRif = rifPrefix + data.rif;

            // Replace rif in data object
            const payload = { ...data, rif: completeRif };

            const response = await createTaxpayerCensus(payload);

            if (!response.success) {
                // console.error("New taxpayer: " + JSON.stringify(response));

                toast.error(response.message || "Error al crear el contribuyente.");
                return;

            }

            toast.success("Contribuyente para censo creado exitosamente");
            reset();
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Error inesperado. Intente de nuevo.");
        }
    };

    return (
        <div className='flex items-center justify-center text-xs'>
            <FormContainer>
                <h2 className="mb-10 text-2xl font-bold text-center">Crear Nuevo Contribuyente (Censo)</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    <div>
                        <label htmlFor="number">Número de providencia</label>
                        <input
                            id="number"
                            type="number"
                            {...register("number", { required: "Required field", min: { value: 0, message: "El número de providencia debe ser positivo" } },)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded"
                        />
                        {errors.number && <span className="text-sm text-red-600">{errors.number.message}</span>}
                    </div>

                    <div>
                        <label htmlFor="process">Procedimiento</label>
                        <select
                            id="process"
                            {...register("process", { required: "Required field" })}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded"
                        >
                            <option value="FP">FP</option>
                        </select>
                        {errors.process && <span className="text-sm text-red-600">{errors.process.message}</span>}
                    </div>

                    <div>
                        <label htmlFor="name">Razón Social</label>
                        <input
                            id="name"
                            type="text"
                            {...register("name", { required: "Required field" })}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded"
                        />
                        {errors.name && <span className="text-sm text-red-600">{errors.name.message}</span>}
                    </div>

                    <div>
                        <label htmlFor="rif">RIF</label>
                        <div className="flex items-center space-x-2">
                            <select
                                id="rif-prefix"
                                onChange={(e) => setRifPrefix(e.target.value)}
                                className="px-2 py-2 bg-white border border-gray-300 rounded"
                            >
                                <option value="J">J</option>
                                <option value="V">V</option>
                                <option value="E">E</option>
                                <option value="G">G</option>
                                <option value="P">P</option>
                            </select>

                            <input
                                id="rif"
                                type="text"
                                placeholder="Ingrese los 9 dígitos que le siguen a la letra del RIF"
                                {...register("rif", {
                                    required: "Required field",
                                    pattern: {
                                        value: /^\d{9}$/,
                                        message: "El rif debe contener 9 dígitos exactos además del prefijo"
                                    }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded"
                            />
                        </div>
                        {errors.rif && <span className="text-sm text-red-600">{errors.rif.message}</span>}
                    </div>

                    <div>
                        <label htmlFor="type">Tipo</label>
                        <select
                            id="type"
                            {...register("type", { required: "Required field" })}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded"
                        >
                            <option value="ORDINARY" label='ORDINARIO'>ORDINARY</option>
                            <option value="SPECIAL" label='ESPECIAL'>SPECIAL</option>
                        </select>
                        {errors.type && <span className="text-sm text-red-600">{errors.type.message}</span>}
                    </div>

                    <div>
                        <label htmlFor="address">Dirección</label>
                        <input
                            id="address"
                            type="text"
                            {...register("address", { required: "Required field" })}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded"
                        />
                        {errors.address && <span className="text-sm text-red-600">{errors.address.message}</span>}
                    </div>

                    <div>
                        <label htmlFor="emition_date">Fecha de emisión</label>
                        <input
                            id="emition_date"
                            type="date"
                            {...register("emition_date", { required: "Required field" })}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded"
                        />
                        {errors.emition_date && <span className="text-sm text-red-600">{errors.emition_date.message}</span>}
                    </div>

                    <button
                        type="submit"
                        className="w-full p-2 mt-4 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        Enviar
                    </button>
                </form>
            </FormContainer>
        </div>
    );
}

export default TaxpayerCensusForm;
