import { Fines } from "@/App";
import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { Payment } from '../../types/payment'
import { Event } from "@/pages/Taxpayer/TaxpayerDetail";
import toast from "react-hot-toast";
import { getTaxpayerData } from "../utils/api/taxpayerFunctions";
import { useParams } from "react-router-dom";




interface IndividualStatsProps {
    fines: Fines,
    events: Event[],
    payments: Payment,
}

interface TaxpayerData {
    providenceNum: number,
    address: string,
    process: string,
    contract_type: string,
    rif: string,
    name: string,
}



export const IndividualStats = ({ fines, events, payments }: IndividualStatsProps) => {
    const { taxpayer } = useParams();
    const [taxpayerData, setTaxpayerData] = useState<TaxpayerData>()


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

    let compromises = 0;
    let compliance = 0;
    let nonCompliance = 0;


    events.forEach((event) => {
        if (event.type == "PAYMENT_COMPROMISE") {
            compromises += 1;
        }

        if (event.type == "FINE" && Number(event.debt) === 0) {
            compliance += 1;
        }

        if (event.type == "FINE" && Number(event.debt) > 0) {
            nonCompliance += 1;
        }
    })



    const dataMock = [
        { name: "CUMPLIMIENTO DE PAGOS", value: compliance, color: "#0080c1" },
        { name: "COMPROMISO DE PAGOS", value: compromises, color: "#737373" },
        { name: "INCUMPLIMIENTO DE PAGOS", value: nonCompliance, color: "#444444" },
    ];

    return (
        <div className="flex justify-center w-full min-h-[20vh] text-black mt-4">
            {/* Contenedor principal */}
            <div className="flex w-[900px] h-auto shadow-xl ">

                {/* Columna Izquierda - Datos del Contribuyente */}
                <div className="w-1/2 p-6">
                    <h1 className="mb-4 text-xl font-semibold uppercase">
                        Datos del contribuyente
                    </h1>

                    <div className="flex flex-col space-y-2 text-sm">
                        <p><span className="font-bold">NRO DE PROVIDENCIA:</span>{taxpayerData ? taxpayerData?.providenceNum: "No se pudo cargar la información"}</p>
                        <p><span className="font-bold">PROCEDIMIENTO:</span> {taxpayerData ? taxpayerData?.process: "No se pudo cargar la información"}</p>
                        <p><span className="font-bold">RAZÓN SOCIAL:</span> {taxpayerData ? taxpayerData?.name: "No se pudo cargar la información"}</p>
                        <p><span className="font-bold">RIF:</span> {taxpayerData ? taxpayerData?.rif: "No se pudo cargar la información"}</p>
                        <p><span className="font-bold">TIPO DE CONTRIBUYENTE:</span> {taxpayerData ? taxpayerData?.contract_type: "No se pudo cargar la información"}</p>
                        <p><span className="font-bold">Dirección:</span> {taxpayerData ? taxpayerData?.address: "No se pudo cargar la información"}</p>
                    </div>

                    <p className="mt-6 text-xs leading-5">
                        A continuación se puede observar el rendimiento individual del
                        contribuyente, la cantidad de pagos realizados a tiempo,
                        compromisos de pago e incumplimiento de los mismos.
                    </p>
                </div>

                {/* Columna Derecha - Bullets + Gráfica Pastel */}
                <div className="flex flex-col items-start w-1/2 p-6">
                    {/* Sección de bullets */}
                    <div className="flex flex-col mb-6 space-y-2">
                        <div className="flex items-center">
                            {/* Circulito Azul */}
                            <span
                                className="inline-block w-3 h-3 mr-2 rounded-full"
                                style={{ backgroundColor: "#0080c1" }}
                            />
                            <span className="text-sm">Cumplimiento de Pagos</span>
                        </div>
                        <div className="flex items-center">
                            {/* Circulito Gris */}
                            <span
                                className="inline-block w-3 h-3 mr-2 rounded-full"
                                style={{ backgroundColor: "#737373" }}
                            />
                            <span className="text-sm">Compromiso de Pagos</span>
                        </div>
                        <div className="flex items-center">
                            {/* Circulito gris oscuro */}
                            <span
                                className="inline-block w-3 h-3 mr-2 rounded-full"
                                style={{ backgroundColor: "#444444" }}
                            />
                            <span className="text-sm">Incumplimiento de Pagos</span>
                        </div>
                    </div>

                    {/* Gráfica estilo pastel */}
                    <div className="flex items-center justify-center w-full">
                        <PieChart width={300} height={240}>
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
            </div>
        </div>
    );
};
