import { Fines } from "@/App";
import React, { useEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { Payment } from '../../types/payment'
import { Event } from "@/types/event";
import toast from "react-hot-toast";
import { downloadPdf, getTaxpayerData, notifyTaxpayer, updateCulminated, updateFase, uploadRepairReport } from "../utils/api/taxpayerFunctions";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { IVAReports } from "@/types/IvaReports";
import { RepairReports } from "@/types/RepairReports";




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
    culminated: Boolean,
    RepairReports: RepairReports[],
}



export const IndividualStats = ({ events, IVAReports }: IndividualStatsProps) => {
    const { taxpayer } = useParams();
    const [taxpayerData, setTaxpayerData] = useState<TaxpayerData>()
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showModal, setShowModal] = useState(false); // Nuevo estado para mostrar modal
    const [loading, setLoading] = useState(false);
    const [faseToChange, setFaseToChange] = useState<string | null>(null);
    const [showFaseModal, setShowFaseModal] = useState(false);



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
        { name: "COMPRAS (BS)", value: buys > 0 ? buys : 1, color: "#0080c1" },
        { name: "VENTAS (BS)", value: sells > 0 ? sells : 1, color: "#737373" },
    ];



    const fases = ["FASE_1", "FASE_2", "FASE_3", "FASE_4"];

    const handleFaseClick = (fase: string) => {
        if (!taxpayer || !fase || taxpayerData?.fase === fase) return;

        setFaseToChange(fase);
        setShowFaseModal(true); // Mostrar modal de confirmación
    };

    const confirmFaseChange = async () => {
        if (!taxpayer || !faseToChange) return;

        try {
            await updateFase(taxpayer, faseToChange);
            setTaxpayerData(prev => prev ? { ...prev, fase: faseToChange } : prev);
            toast.success(`Fase actualizada a ${faseToChange}`);
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar la fase");
        } finally {
            setShowFaseModal(false);
            setFaseToChange(null);
        }
    };

    const handleCulminatedClick = async (culminated: boolean) => {
        if (!taxpayer) return;

        try {
            await updateCulminated(taxpayer, culminated);
            setTaxpayerData(prev => prev ? { ...prev, culminated } : prev);
            toast.success(`Procedimiento culminado de manera exitosa`);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Error desconocido al culminar procedimiento');
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

    // Referencia al input file oculto
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Función que se llama al hacer click en el botón "Subir acta de reparación"
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    // Función que se llama al seleccionar archivo
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
            setShowModal(true); // Mostrar modal
        }
    };

    // Función para enviar el archivo al backend
    const handleSendFile = async () => {
        if (!selectedFile || !taxpayer) {
            toast.error("No se ha seleccionado archivo o no hay contribuyente.");
            return;
        }

        try {
            await uploadRepairReport(taxpayer, selectedFile);
            toast.success("Acta de reparación subida correctamente.");
            setSelectedFile(null);

            // Refrescar datos después de subir
            const data = await getTaxpayerData(taxpayer);
            setTaxpayerData(data);
        } catch (error) {
            console.error(error);
            toast.error("Error al subir el acta de reparación.");
        }
    };

    // Enviar archivo y cerrar modal
    const handleConfirmSend = async () => {
        await handleSendFile();
        setShowModal(false);
    };

    // Cancelar subida y cerrar modal
    const handleCancelSend = () => {
        setSelectedFile(null);
        setShowModal(false);
    };

    const handleDownload = async (pdf_url: string) => {
        if (loading === true) return;
        setLoading(true);

        try {
            // Extraer la key del URL completo
            const key = pdf_url.replace("https://sacbucketgeneral.s3.amazonaws.com/", "");

            const response = await downloadPdf(encodeURIComponent(key));

            // console.log(response);

            const signedUrl = response.data;

            // Abrir la URL en una nueva pestaña
            if (signedUrl) {
                window.open(signedUrl, "_blank");
            } else {
                toast.error("No se pudo generar el enlace de descarga");
            }
        } catch (error) {
            console.error("No se pudo obtener la URL firmada", error);
            alert("Error al generar el enlace de descarga.");
        } finally {
            setLoading(false);
        }
    };



    console.log("DATA: " + JSON.stringify(taxpayerData))


    return (
        <div className="flex justify-center w-full min-h-[20vh] text-black mt-4 px-4 lg:px-0">
            {/* Contenedor principal con flex-col en mobile y flex-row en lg */}
            <div className="flex flex-col lg:flex-row w-full lg:w-[900px] h-full shadow-xl pb-0 lg:pb-4">

                {/* Columna Izquierda - Datos del Contribuyente */}
                <div className="w-full p-6 lg:w-1/2">
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
                            <p className="pt-2 text-sm font-semibold leading-5 max-w-[600px] max-h-[150px] overflow-auto whitespace-pre-wrap break-words">
                                Este contribuyente ha sido notificado exitosamente acerca de su procedimiento.
                            </p>
                        </div>

                    ) : (
                        <div>
                            <p className="pt-2 text-sm font-semibold leading-5 max-w-[600px] max-h-[150px] overflow-auto whitespace-pre-wrap break-words">
                                Este contribuyente aún no ha sido notificado acerca de su procedimiento.
                            </p>
                        </div>
                    )}

                    {taxpayerData?.culminated === true ? (
                        <div className="pt-2">
                            <p className=" text-sm font-semibold leading-5 max-w-[600px] max-h-[150px] overflow-auto whitespace-pre-wrap break-words">
                                Procedimiento Culminado.
                            </p>
                        </div>

                    ) : (
                        <div className="pt-2">
                            <button className="px-2 py-1 text-white bg-[#3498db]" onClick={() => handleCulminatedClick(true)}>Culminar Procedimiento </button>
                        </div>
                    )}

                    {taxpayerData?.process === "AF" && (
                        taxpayerData.RepairReports.length > 0 ? (
                            <div className="pt-2">
                                <button className="px-4 py-1 text-white bg-[#3498db]" onClick={() => handleDownload(taxpayerData.RepairReports[0].pdf_url)}>Descargar acta de Reparo</button>
                            </div>
                        ) : (
                            <div className="pt-2">
                                {/* Botón para abrir selector de archivo */}
                                <button
                                    className="px-2 py-1 bg-[#3498db] text-white"
                                    onClick={handleUploadClick}
                                >
                                    Subir acta de reparo
                                </button>

                                {/* Input file oculto */}
                                <input
                                    type="file"
                                    accept=".pdf"         // Solo PDF
                                    ref={fileInputRef}
                                    style={{ display: "none" }}
                                    onChange={handleFileChange}
                                // No se pone "multiple" para limitar a un solo archivo
                                />

                                {/* Mostrar archivo seleccionado y botón para enviar */}
                                {/* Modal */}
                                {showModal && selectedFile && (
                                    <div
                                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                                        onClick={handleCancelSend} // clic fuera cierra modal
                                    >
                                        <div
                                            className="p-6 bg-white rounded-lg w-80"
                                            onClick={e => e.stopPropagation()} // evitar cerrar modal al hacer clic dentro
                                        >
                                            <h2 className="mb-4 text-lg font-semibold">Confirmar Acta de Reparo a Subir</h2>
                                            <p className="mb-4 break-words">Archivo seleccionado: <strong>{selectedFile.name}</strong></p>

                                            <div className="flex justify-end space-x-4">
                                                <button
                                                    className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
                                                    onClick={handleConfirmSend}
                                                >
                                                    Subir archivo
                                                </button>
                                                <button
                                                    className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
                                                    onClick={handleCancelSend}
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>

                {/* Columna Derecha - Bullets + Gráfica Pastel */}
                <div className="flex flex-col w-full lg:w-1/2 p-0 mt-6 lg:mt-0 h-auto lg:h-[13rem]">

                    {(user?.role === "FISCAL" || user?.role === "ADMIN") && taxpayerData?.notified === false && (
                        <div className="flex items-end justify-end w-full mb-4">
                            <button
                                className="px-2 py-1 bg-[#3498db] text-white font-semibold"
                                onClick={() => handleNotifiedClick(true)}
                            >
                                Reportar como notificado
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col pt-0 lg:flex-row lg:pt-4">

                        <div className="flex flex-row p-4 mb-4 space-x-6 lg:flex-col lg:mb-0 lg:space-x-0 lg:space-y-2">
                            <div className="flex items-center">
                                <span
                                    className="inline-block w-3 h-3 mr-2 rounded-full"
                                    style={{ backgroundColor: "#0080c1" }}
                                />
                                <span className="text-sm">COMPRAS (BS)</span>
                            </div>
                            <div className="flex items-center">
                                <span
                                    className="inline-block w-3 h-3 mr-2 rounded-full"
                                    style={{ backgroundColor: "#737373" }}
                                />
                                <span className="text-sm">VENTAS (BS)</span>
                            </div>
                        </div>

                        {dataMock.some(item => item.value > 0) && (
                            <div className="flex justify-center w-full lg:w-auto">
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
                        )}
                    </div>

                    {(user?.role === "COORDINATOR" || user?.role === "ADMIN") && taxpayerData?.process === "AF" &&
                        <div className="flex items-end justify-end w-full gap-2 pr-14 mt-14">
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

                    {taxpayerData?.fase && taxpayerData.process === "AF" && (
                        <div className="w-full pt-4 mt-2 text-sm italic text-right text-gray-700 pr-14">
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
            {showFaseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="w-full max-w-sm p-6 bg-white shadow-lg rounded-xl">
                        <h2 className="mb-4 text-lg font-semibold text-center">Confirmar cambio de fase</h2>
                        <p className="mb-4 text-sm text-gray-700">
                            ¿Estás seguro de que deseas cambiar la fase de la auditoría fiscal?
                        </p>
                        <p className="mb-2 text-sm">
                            <span className="font-bold">Fase actual:</span> {taxpayerData?.fase.replace("_", " ")}
                        </p>
                        <p className="mb-4 text-sm">
                            <span className="font-bold">Nueva fase:</span> {faseToChange?.replace("_", " ")}
                        </p>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setShowFaseModal(false);
                                    setFaseToChange(null);
                                }}
                                className="px-4 py-1 text-sm text-gray-700 border border-gray-400 rounded hover:bg-gray-100"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmFaseChange}
                                className="px-4 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
};
