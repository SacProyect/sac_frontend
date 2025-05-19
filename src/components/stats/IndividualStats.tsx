import { Fines } from "@/App";
import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { Payment } from '../../types/payment'
import { Event } from "@/types/event";
import toast from "react-hot-toast";
import { getTaxpayerData, notifyTaxpayer, updateFase } from "../utils/api/taxpayerFunctions";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { IVAReports } from "@/types/IvaReports";




interface IndividualStatsProps {
    events: Event[],
    IVAReports: IVAReports[],
}

interface TaxpayerData {
    providenceNum: number,
    address: string,
    process: string,
    contract_type: string,
    rif: string,
    name: string,
    description: string,
    fase: string,
    notified: Boolean,
}



export const IndividualStats = ({ events, IVAReports }: IndividualStatsProps) => {
    const { taxpayer } = useParams();
    const [taxpayerData, setTaxpayerData] = useState<TaxpayerData>()
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        navigate("/login");
        return null;
    }


    useEffect(() => {
        const fetchData = async () => {
            try {

                if (taxpayer) {
                    const data = await getTaxpayerData(taxpayer);


                    setTaxpayerData(data);
                }

            } catch (e) {
                console.error(e);
                toast.error("Ha ocurrido un error obteniendo los datos del contribuyente")
            }
        }
        fetchData()


    }, [])

    let fines = 0;


    let buys = 0;
    let sells = 0;
    if (IVAReports && Array.isArray(IVAReports)) {
        IVAReports.forEach((rep) => {
            buys += rep.purchases;
            sells += rep.sells;
        });
    }

    if (events && Array.isArray(events)) {
        events.forEach((event) => {
            if (event.type === "FINE") fines += 1;
        });
    }




    const dataMock = [
        { name: "COMPRAS (BS)", value: buys > 0 ? buys : 0, color: "#0080c1" },
        { name: "VENTAS (BS)", value: sells > 0 ? sells : 0, color: "#737373" },
    ];



    const fases = ["FASE_1", "FASE_2", "FASE_3", "FASE_4"];


    const handleFaseClick = async (fase: string) => {
        if (!taxpayer || !fase || taxpayerData?.fase === fase) return;

        try {
            await updateFase(taxpayer, fase);
            setTaxpayerData(prev => prev ? { ...prev, fase } : prev);
            toast.success(`Fase actualizada a ${fase}`);
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar la fase");
        }
    };

    const handleNotifiedClick = async (notified: boolean) => {
        if (!taxpayer) return;

        try {

            await notifyTaxpayer(taxpayer);
            setTaxpayerData(prev => prev ? { ...prev, notified } : prev);
            toast.success("¡Contribuyente reportado como notificado exitosamente!")

        } catch (e) {
            console.error(e);
            toast.error("Error al reportar al contribuyente como notificado")
        }

    }


    return (
        <div className="flex justify-center w-full min-h-[20vh] text-black mt-4 px-4 lg:px-0">
            {/* Contenedor principal */}
            <div className="flex w-full lg:w-[900px] h-full shadow-xl pb-0 lg:pb-12 ">

                {/* Columna Izquierda - Datos del Contribuyente */}
                <div className="w-1/2 p-6">
                    <h1 className="mb-4 text-xl font-semibold uppercase">
                        Datos del contribuyente
                    </h1>

                    <div className="flex flex-col space-y-2 text-sm">
                        <p><span className="font-bold">NRO DE PROVIDENCIA:</span>{taxpayerData ? taxpayerData?.providenceNum : "No se pudo cargar la información"}</p>
                        <p><span className="font-bold">PROCEDIMIENTO:</span> {taxpayerData ? taxpayerData?.process : "No se pudo cargar la información"}</p>
                        <p><span className="font-bold">RAZÓN SOCIAL:</span> {taxpayerData ? taxpayerData?.name : "No se pudo cargar la información"}</p>
                        <p><span className="font-bold">RIF:</span> {taxpayerData ? taxpayerData?.rif : "No se pudo cargar la información"}</p>
                        <p><span className="font-bold">TIPO DE CONTRIBUYENTE:</span> {taxpayerData
                            ? taxpayerData.contract_type === "ORDINARY"
                                ? "ORDINARIO"
                                : taxpayerData.contract_type === "SPECIAL"
                                    ? "ESPECIAL"
                                    : taxpayerData.contract_type
                            : "No se pudo cargar la información"}</p>
                        <p><span className="font-bold">Dirección:</span> {taxpayerData ? taxpayerData?.address : "No se pudo cargar la información"}</p>
                        <p><span className="font-bold">Multas registradas:</span> {fines ? fines : "No se pudo cargar la información"}</p>
                    </div>

                    {taxpayerData?.notified === true ? (
                        <div>
                            <p className="mt-6 text-xs leading-5 max-w-[600px] max-h-[150px] overflow-auto whitespace-pre-wrap break-words">
                                Este contribuyente ha sido notificado exitosamente acerca de su procedimiento.
                            </p>
                        </div>

                    ) : (
                        <div>
                            <p className="mt-6 text-xs leading-5 max-w-[600px] max-h-[150px] overflow-auto whitespace-pre-wrap break-words">
                                Este contribuyente aún no ha sido notificado acerca de su procedimiento.
                            </p>
                        </div>
                    )}
                </div>



                {/* Columna Derecha - Bullets + Gráfica Pastel */}
                <div className="flex flex-col items-start w-1/2 p-0 h-[13rem]">
                    {(user?.role === "FISCAL" || user?.role === "ADMIN") && taxpayerData?.notified === false && (
                        <div className="flex items-end justify-end w-full">
                            <button
                                className="px-2 py-1 bg-[#3498db] text-white font-semibold"
                                onClick={() => handleNotifiedClick(true)}
                            >
                                Reportar como notificado
                            </button>
                        </div>
                    )}


                    {/* Sección de bullets */}
                    <div className="flex pt-0 lg:pt-4 sm:flex-col lg:flex-row">
                        <div className="flex flex-col p-4 mb-0 space-y-2">
                            <div className="flex items-center">
                                {/* Circulito Azul */}
                                <span
                                    className="inline-block w-3 h-3 mr-2 rounded-full"
                                    style={{ backgroundColor: "#0080c1" }}
                                />
                                <span className="text-sm">COMPRAS (BS)</span>
                            </div>
                            <div className="flex items-center">
                                {/* Circulito Gris */}
                                <span
                                    className="inline-block w-3 h-3 mr-2 rounded-full"
                                    style={{ backgroundColor: "#737373" }}
                                />
                                <span className="text-sm">VENTAS (BS)</span>
                            </div>
                        </div>

                        {/* Gráfica estilo pastel */}
                        {dataMock.some(item => item.value > 0) && (
                            <div className="flex items-center justify-center w-full">
                                <div className="">
                                    <PieChart width={300} height={200}>
                                        <Pie
                                            data={dataMock}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label
                                        >
                                            {dataMock.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </div>
                            </div>
                        )}
                    </div>



                    {user?.role === "COORDINATOR" || user?.role === "ADMIN" && taxpayerData?.process == "AF" &&
                        <div className="flex items-end justify-end w-full gap-2 pr-2 mt-4">
                            {fases.map((fase) => (
                                <button
                                    key={fase}
                                    onClick={() => handleFaseClick(fase)}
                                    className={`px-2 py-1 rounded font-semibold text-white transition 
                ${taxpayerData?.fase === fase ? "bg-green-600" : "bg-[#3498db] hover:bg-blue-700"}`}
                                >
                                    {fase.replace("FASE_", "FASE ")}
                                </button>
                            ))}
                        </div>
                    }


                    {taxpayerData?.fase && taxpayerData.process == "AF" && (
                        <div className="w-full pr-2 mt-2 text-sm italic text-right text-gray-700">
                            {taxpayerData.fase === "FASE_1" && (
                                <p className="text-xs">
                                    FASE 1: Notificación de providencia. Realizar acta de requerimientos. Actas Constancias y Actas de Recepción. Se debe realizar un informe si no se notifica en el lapso de 20 días.
                                </p>)
                            }
                            {taxpayerData.fase === "FASE_2" && (
                                <p className="text-xs">
                                    FASE 2: Análisis y Desarrollo de hojas de trabajo y una breve predeterminación (con su respectivo soporte).
                                </p>)
                            }
                            {taxpayerData.fase === "FASE_3" && (
                                <p className="text-xs">
                                    FASE 3: Determinación y reparo definitivo (Acta de reparo, informe y requerimiento finales)
                                </p>)
                            }
                            {taxpayerData.fase === "FASE_4" && (
                                <p className="text-xs">
                                    FASE 4: Declaración de sustitutiva; resolución de imposición de sanción de allanamiento; culminación de expediente.
                                </p>)
                            }
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
