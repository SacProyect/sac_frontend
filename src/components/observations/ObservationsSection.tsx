import React, { useEffect, useState } from 'react'
import { TbEdit } from "react-icons/tb";
import { deleteObservations, getObservations, updateObservation } from '../utils/api/taxpayerFunctions';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

interface Observation {
    id: string;
    description: string;
    date: string;
}

interface ObservationsSectionProps {
    taxpayerId: string | undefined;
    refreshKey: number; // ✅ new prop
}

function ObservationsSection({ taxpayerId, refreshKey }: ObservationsSectionProps) {
    const [observations, setObservations] = useState<Observation[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedDescription, setEditedDescription] = useState<string>("");

    const { user } = useAuth()

    useEffect(() => {
        if (!taxpayerId) return;


        const fetchObservations = async () => {
            try {
                setLoading(true);
                const response = await getObservations(taxpayerId);
                setObservations(response);
            } catch (error) {
                toast.error("No se pudieron obtener las observaciones de este contribuyente");
            } finally {
                setLoading(false);
            }
        };

        fetchObservations();
    }, [taxpayerId, refreshKey]);


    const handleDelete = async (id: string) => {
        const confirm = window.confirm("¿Estás seguro de que deseas eliminar esta observación?");
        if (!confirm) return;

        try {
            const response = await deleteObservations(id);
            if (response) {
                toast.success(`¡Observación con id: ${response.id} eliminada correctamente!`);
                setObservations(prev => prev.filter(obs => obs.id !== id));
            } else {
                toast.error("La respuesta no contiene datos válidos.");
            }
        } catch (e: any) {
            toast.error(e.message || "Error al eliminar");
        }
    };

    const handleUpdate = async (id: string) => {
        try {
            const response = await updateObservation(id, editedDescription);
            if (response) {
                toast.success("¡Observación actualizada correctamente!");
                setObservations(prev =>
                    prev.map(obs => obs.id === id ? { ...obs, description: editedDescription } : obs)
                );
                setEditingId(null);
            }
        } catch (e: any) {
            toast.error(e.message || "Error al actualizar");
        }
    };



    return (
        <section className="w-full h-full lg:w-[82vw] lg:h-[75vh] pb-4">
            <div className="flex flex-col items-center w-full h-full px-4 overflow-y-auto sm:px-6 md:px-8">

                {/* Sub-Title */}
                <div className="w-full max-w-3xl">
                    <p className="text-lg sm:text-xl font-semibold mb-4 text-[#475569]">
                        Observaciones ({observations.length})
                    </p>
                </div>

                {/* Loader / Empty State */}
                {loading ? (
                    <p className="text-sm text-gray-500">Cargando observaciones...</p>
                ) : observations.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay observaciones registradas.</p>
                ) : (
                    <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2">
                        {observations.map((obs) => (
                            <div
                                key={obs.id}
                                className="w-full border border-gray-200 rounded-md shadow-md"
                            >
                                <div className="w-full h-full px-4 pt-4 pb-2">
                                    <div className="min-h-[5rem] lg:h-[70%]">
                                        {editingId === obs.id ? (
                                            <textarea
                                                className="w-full p-2 text-sm border border-gray-300 rounded"
                                                value={editedDescription}
                                                onChange={(e) => setEditedDescription(e.target.value)}
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-700">{obs.description}</p>
                                        )}
                                        <div className="pt-2 pb-2">
                                            <p className="text-xs text-gray-600">Fecha: {obs.date.slice(0, 10)}</p>
                                        </div>
                                    </div>
                                    {user && user.role === "ADMIN" && (
                                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t-2 border-gray-100 lg:h-[30%]">
                                            {editingId === obs.id ? (
                                                <>
                                                    <button
                                                        className="h-[2rem] px-3 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                                                        onClick={() => handleUpdate(obs.id)}
                                                    >
                                                        Guardar
                                                    </button>
                                                    <button
                                                        className="h-[2rem] px-3 text-xs text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                                                        onClick={() => setEditingId(null)}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center h-[2rem] px-2 text-gray-500 border border-gray-200 rounded-md">
                                                        <TbEdit size={15} />
                                                        <button
                                                            className="pl-1 pr-0 text-xs sm:text-sm"
                                                            onClick={() => {
                                                                setEditingId(obs.id);
                                                                setEditedDescription(obs.description);
                                                            }}
                                                        >
                                                            Modificar
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center h-[2rem] px-2 text-red-500 border border-gray-200 rounded-md">
                                                        <TbEdit size={15} />
                                                        <button
                                                            className="pl-1 pr-0 text-xs sm:text-sm"
                                                            onClick={() => handleDelete(obs.id)}
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>

    );
}

export default ObservationsSection;
