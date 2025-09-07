import React, { useEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Event } from "@/types/event";
import toast, { Toaster } from "react-hot-toast";
import { downloadInvestigationPdf, downloadRepairPdf, getTaxpayerData, modifyIndividualIndexIva, notifyTaxpayer, updateCulminated, updateFase, uploadRepairReport } from "../utils/api/taxpayerFunctions";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { IVAReports } from "@/types/IvaReports";
import { RepairReports } from "@/types/RepairReports";
import { InvestigationPdf } from "@/types/investigationPdf";
import { User } from "@/types/user";
import Decimal from "decimal.js";
import { getIndividualIvaReport } from "../utils/api/reportFunctions";
import { Parish, TaxpayerCategory } from "@/types/taxpayer";




interface IndividualStatsProps {
    events: Event[],
    IVAReports: IVAReports[],
}

interface TaxpayerData {
    providenceNum: number;
    address: string;
    process: string;
    contract_type: string;
    rif: string;
    name: string;
    description: string;
    fase: string;
    notified: Boolean;
    culminated: Boolean;
    RepairReports: RepairReports[];
    officerId: string;
    investigation_pdfs: InvestigationPdf[];
    user: User;
    IVAReports: IVAReports[];
    supervisorId?: string;
    category: TaxpayerCategory | null;
    parish: Parish | null;
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
    const [showCulminatedModal, setShowCulminatedModal] = useState(false);
    const [showNotifiedModal, setShowNotifiedModal] = useState(false);
    const [lineChartData, setLineChartData] = useState<{ month: string; variationFromPrevious: number }[]>([]);
    const [showIndexModal, setShowIndexModal] = useState(false);
    const [newIndexIva, setNewIndexIva] = useState("");




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
            buys += Number(rep.purchases) || 0;
            sells += Number(rep.sells) || 0;
        });
    }

    if (events && Array.isArray(events)) {
        events.forEach((event) => {
            if (event.type === "FINE") fines += 1;
        });
    }


    const dataMock = [
        {
            name: "COMPRAS (BS)",
            value: buys > 0 ? parseFloat(buys.toFixed(2)) : 1,
            formatted: buys.toLocaleString("es-VE", { style: "currency", currency: "VES" }),
            color: "#0080c1"
        },
        {
            name: "VENTAS (BS)",
            value: sells > 0 ? parseFloat(sells.toFixed(2)) : 1,
            formatted: sells.toLocaleString("es-VE", { style: "currency", currency: "VES" }),
            color: "#737373"
        },
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
        setShowCulminatedModal(true);
    };

    const confirmCulminated = async () => {
        if (!taxpayer) return;

        try {
            await updateCulminated(taxpayer, true);
            setTaxpayerData(prev => prev ? { ...prev, culminated: true } : prev);
            toast.success(`Procedimiento culminado de manera exitosa`);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Error desconocido al culminar procedimiento');
        } finally {
            setShowCulminatedModal(false);
        }
    };

    const handleNotifiedClick = async (notified: boolean) => {
        if (!taxpayer) return;
        setShowNotifiedModal(true);
    };

    const confirmNotified = async () => {
        if (!taxpayer) return;

        try {
            await notifyTaxpayer(taxpayer);
            setTaxpayerData(prev => prev ? { ...prev, notified: true } : prev);
            toast.success("¡Contribuyente reportado como notificado exitosamente!")
        } catch (e) {
            console.error(e);
            toast.error("Error al reportar al contribuyente como notificado")
        } finally {
            setShowNotifiedModal(false);
        }
    };

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

    const handleDownloadRepair = async (pdf_url: string) => {
        if (loading === true) return;
        setLoading(true);

        try {
            // Extraer la key del URL completo
            const key = pdf_url.replace("https://sacbucketgeneral.s3.amazonaws.com/", "");

            const response = await downloadRepairPdf(encodeURIComponent(key));

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

    const handleDownloadInvestigation = async () => {
        if (loading) return;
        setLoading(true);

        const pdfs = taxpayerData?.investigation_pdfs;
        const pdfsUrl = pdfs?.map((pdf) => pdf.pdf_url);

        try {
            if (pdfsUrl && pdfsUrl.length > 0) {
                for (const url of pdfsUrl) {
                    const key = url.replace("https://sacbucketgeneral.s3.amazonaws.com/", "");
                    const response = await downloadInvestigationPdf(key);
                    const signedUrl = response.data;

                    if (signedUrl) {
                        // Crear enlace de descarga
                        const link = document.createElement("a");
                        link.href = signedUrl;
                        link.download = key.split("/").pop() || "archivo.pdf"; // nombre del archivo
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } else {
                        toast.error("No se pudo generar el enlace de descarga");
                    }
                }
            }
        } catch (error) {
            console.error("No se pudo obtener la URL firmada", error);
            toast.error("Error al generar los enlaces de descarga.");
        } finally {
            setLoading(false);
        }
    };

    // console.log("Taxpayer data: " + JSON.stringify(taxpayerData))


    // Get the Monthly Variation of IVA for the taxpayer
    useEffect(() => {
        const fecthLineChartData = async () => {
            try {
                const response = await getIndividualIvaReport(taxpayer) as Record<string, { variationFromPrevious: string }>;

                const dataArray = Object.entries(response).map(([month, value]) => ({
                    month,
                    variationFromPrevious: parseFloat(value.variationFromPrevious) // Quita el % y lo convierte a número
                }));

                setLineChartData(dataArray);
            } catch (e) {
                console.error(e);
                toast.error("Ha ocurrido un error obteniendo el rendimiento mensual")
            }
        }
        fecthLineChartData()
    }, [])

    const submitNewIndexIva = async () => {
        if (!taxpayer || !newIndexIva) return;

        try {
            await modifyIndividualIndexIva(new Decimal(newIndexIva), taxpayer);
            toast.success("Índice de IVA actualizado exitosamente.");
            setShowIndexModal(false);

            const updatedData = await getTaxpayerData(taxpayer);
            setTaxpayerData(updatedData);
        } catch (e) {
            console.error(e);
            toast.error("Error al modificar el índice IVA");
        }
    };

    console.log(taxpayerData);

    // console.log(user)

    const canEditFase = (
        user?.role === "ADMIN" ||
        (user?.role === "COORDINATOR" && taxpayerData?.user.group?.coordinatorId === user.id) ||
        (user?.role === "SUPERVISOR" && taxpayerData?.user.supervisorId === user.id)
    ) && taxpayerData?.process === "AF";


    return (
        <div className="flex justify-center w-full min-h-[20vh] text-black mt-4 px-4 lg:px-0 lg:mt-0">
            {/* Contenedor principal con flex-col en mobile y flex-row en lg */}
            <div className="flex flex-col lg:flex-row w-full lg:w-[900px] h-full lg:h-[60vh] shadow-xl pb-0 lg:pb-4">

                {/* Columna Izquierda - Datos del Contribuyente */}
                <div className="w-full md:p-4 lg:p-4 lg:w-1/2">
                    <h1 className="mb-2 text-xl font-semibold uppercase lg:text-sm xl:text-2xl">
                        Datos del contribuyente
                    </h1>

                    <div className="flex flex-col space-y-2 text-xs xl:text-sm">
                        <p><span className="font-bold">NRO DE PROVIDENCIA:</span>{taxpayerData ? taxpayerData?.providenceNum : "No se pudo cargar la información"}</p>
                        <p><span className="font-bold">PROCEDIMIENTO:</span> {taxpayerData ? taxpayerData?.process : "No se pudo cargar la información"}</p>
                        <p><span className="font-bold">RAZÓN SOCIAL:</span> {taxpayerData ? taxpayerData?.name : "No se pudo cargar la información"}</p>
                        <p><span className="font-bold">RIF:</span> {taxpayerData ? taxpayerData?.rif : "No se pudo cargar la información"}</p>
                        <p className="font-bold">Actividad Comercial: {taxpayerData && taxpayerData.category && taxpayerData.category.name ? taxpayerData.category.name : "No se encontró la actividad comercial"}</p>
                        <p className="font-bold">Parroquia: {taxpayerData && taxpayerData.parish && taxpayerData.parish.name ? taxpayerData.parish.name : "No se encontró la parroquia"}</p>
                        <p><span className="font-bold">TIPO DE CONTRIBUYENTE:</span> {taxpayerData
                            ? taxpayerData.contract_type === "ORDINARY"
                                ? "ORDINARIO"
                                : taxpayerData.contract_type === "SPECIAL"
                                    ? "ESPECIAL"
                                    : taxpayerData.contract_type
                            : "No se pudo cargar la información"}</p>
                        <p><span className="font-bold">Dirección:</span> {taxpayerData ? taxpayerData?.address : "No se pudo cargar la información"}</p>
                        <p><span className="font-bold">Multas registradas:</span> {fines ? fines : "No se pudo cargar la información"}</p>
                        <p>
                            <span className="font-bold">Excedente de crédito actual:</span>{" "}
                            {taxpayerData?.IVAReports?.[0]?.excess != null
                                ? taxpayerData.IVAReports[0].excess.toString()
                                : "No se pudo cargar la información"}
                        </p>
                    </div>

                    {taxpayerData?.notified === true ? (
                        <div>
                            <p className="pt-2 text-xs font-semibold leading-5 max-w-[600px] max-h-[150px] overflow-auto whitespace-pre-wrap break-words">
                                Este contribuyente ha sido notificado exitosamente acerca de su procedimiento.
                            </p>
                        </div>

                    ) : (
                        <div>
                            <p className="pt-2 text-xs font-semibold leading-5 max-w-[600px] max-h-[150px] overflow-auto whitespace-pre-wrap break-words">
                                Este contribuyente aún no ha sido notificado acerca de su procedimiento.
                            </p>
                        </div>
                    )}

                    <div className={`flex items-center ${user?.role !== "ADMIN" ? "justify-start" : "justify-center"} space-x-4 text-center`}>

                        {taxpayerData?.culminated === true ? (
                            <div className="pt-2">
                                <p className="text-sm font-semibold leading-5 max-w-[600px] max-h-[150px] overflow-auto whitespace-pre-wrap break-words">
                                    Procedimiento Culminado.
                                </p>
                            </div>
                        ) : (
                            (user?.role === "FISCAL" && user?.id === taxpayerData?.officerId) ||
                            (user?.role === "COORDINATOR" && user?.id === taxpayerData?.user?.group?.coordinatorId) ||
                            (user?.role === "SUPERVISOR" && (user?.id === taxpayerData?.officerId || user.supervised_members?.some((member) => member.id === taxpayerData?.officerId))) ||
                            user?.role === "ADMIN"
                        ) && (
                            <div className="pt-2">
                                <button
                                    className="px-2 py-1 text-white bg-[#3498db] text-xs xl:text-sm"
                                    onClick={() => handleCulminatedClick(true)}
                                >
                                    Culminar Procedimiento
                                </button>
                            </div>
                        )}

                        {user?.role === "ADMIN" && taxpayerData && taxpayerData?.investigation_pdfs.length >= 1 && (
                            <div className="pt-2">
                                <button className="px-2 py-1 text-white bg-[#3498db] text-xs xl:text-sm" onClick={() => handleDownloadInvestigation()}>Descargar investigación</button>
                            </div>
                        )}

                    </div>

                    {taxpayerData?.process === "AF" && (
                        taxpayerData.RepairReports.length > 0 ? (
                            <div className="pt-2 ">
                                <button className="px-2 py-1 text-white bg-[#3498db]" onClick={() => handleDownloadRepair(taxpayerData.RepairReports[0].pdf_url)}>Descargar acta de Reparo</button>
                            </div>
                        ) : (
                            user && taxpayerData.officerId === user.id && (
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
                        )
                    )}

                    {user?.role === "COORDINATOR" && (
                        <div className="pt-2">
                            <button
                                className="px-2 py-1 text-white bg-[#3498db]"
                                onClick={() => setShowIndexModal(true)}
                            >
                                Modificar índice IVA
                            </button>
                        </div>
                    )}

                    {canEditFase && (
                        <div className="flex items-end justify-around w-full gap-2 text-xs pr-14 mt-14 lg:mt-2 xl:pt-8">
                            {fases.map((fase) => (
                                <button
                                    key={fase}
                                    onClick={() => handleFaseClick(fase)}
                                    className={`px-2 py-1 lg:py-0 xl:py-1 rounded font-semibold text-white transition 
                    ${taxpayerData?.fase === fase ? "bg-green-600" : "bg-[#3498db] hover:bg-blue-700"}`}
                                >
                                    {fase.replace("FASE_", "FASE ")}
                                </button>
                            ))}
                        </div>
                    )}

                    {taxpayerData?.fase && taxpayerData.process === "AF" && (
                        <div className="w-full pt-4 mt-2 text-sm italic text-left text-gray-700 pr-14 lg:pr-0 lg:pt-0 xl:pt-8">
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

                {/* Columna Derecha - Bullets + Gráfica Pastel */}
                <div className="flex flex-col w-full lg:w-1/2 p-0 mt-6 lg:mt-0 h-auto lg:h-[13rem] md:h-full">

                    <div className="flex flex-row flex-wrap items-center justify-between w-full gap-2 px-2 py-1 md:px-4 lg:px-2">
                        {/* Botón de notificación */}
                        {(
                            (user?.role === "FISCAL" && taxpayerData?.officerId === user.id) ||
                            user?.role === "ADMIN" ||
                            (
                                user?.role === "SUPERVISOR" &&
                                (
                                    user.id === taxpayerData?.officerId ||
                                    user.supervised_members?.some(member => member.id === taxpayerData?.officerId)
                                )
                            )
                        ) && !taxpayerData?.notified && (
                                <button
                                    className="px-3 py-1 bg-[#3498db] text-white text-sm font-medium rounded"
                                    onClick={() => handleNotifiedClick(true)}
                                >
                                    Reportar como notificado
                                </button>
                            )}

                        {/* Leyenda de compras y ventas */}
                        <div className="flex flex-row items-center gap-4 text-sm">
                            <div className="flex items-center">
                                <span className="inline-block w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: "#0080c1" }} />
                                COMPRAS (BS.S)
                            </div>
                            <div className="flex items-center">
                                <span className="inline-block w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: "#737373" }} />
                                VENTAS (BS.S)
                            </div>
                        </div>
                    </div>

                    {dataMock.some(item => item.value > 0) && (
                        <div className="flex justify-center items-center w-full h-full lg:w-[30vw] md:h-full lg:h-[20vh]">
                            <ResponsiveContainer width="100%" height="100%" aspect={2}>
                                <PieChart>
                                    <Pie
                                        data={dataMock}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        className="text-xs"
                                        outerRadius={50}
                                        label={({ value }) =>
                                            value.toLocaleString("es-VE", {
                                                style: "currency",
                                                currency: "VES",
                                                maximumFractionDigits: 0,
                                            })
                                        }
                                    >
                                        {dataMock.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) =>
                                            value.toLocaleString("es-VE", { style: "currency", currency: "VES", minimumFractionDigits: 2 })}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <div className="w-full lg:px-4 mt-6 md:mt-0 lg:mt-4 md:mb-4 lg:mb-0 md:h-[50vh] h-full lg:h-[20vh]">
                        <h3 className="mb-2 text-sm font-semibold text-center">
                            Variación de rendimiento mensual
                        </h3>
                        <ResponsiveContainer width="100%" aspect={2} className="h-[5vh]">
                            <LineChart data={lineChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" fontSize={10} />
                                <YAxis fontSize={10} />
                                <Tooltip />
                                <Line type="monotone" dataKey="variationFromPrevious" stroke="#3498db" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>


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


            {showCulminatedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="flex flex-col items-center justify-center w-full max-w-sm p-6 text-center bg-white shadow-lg rounded-xl">
                        <h2 className="mb-4 text-lg font-semibold text-center text-blue-600">Confirmar Culminación</h2>
                        <p className="mb-4 text-sm text-gray-700">¿Deseas marcar el procedimiento de este contribuyente como culminado?</p>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setShowCulminatedModal(false)} className="px-4 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700">Cancelar</button>
                            <button onClick={confirmCulminated} className="px-4 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {showNotifiedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="flex flex-col items-center justify-center w-full max-w-sm p-6 text-center bg-white shadow-lg rounded-xl">
                        <h2 className="mb-4 text-lg font-semibold text-center text-blue-600">Confirmar Notificación</h2>
                        <p className="mb-4 text-sm text-gray-700">¿Deseas reportar al contribuyente como notificado?</p>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setShowNotifiedModal(false)} className="px-4 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700">Cancelar</button>
                            <button onClick={confirmNotified} className="px-4 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {showIndexModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="w-full max-w-sm p-6 bg-white shadow-lg rounded-xl">
                        <h2 className="mb-4 text-lg font-semibold text-center">Modificar índice IVA</h2>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Nuevo monto IVA"
                            value={newIndexIva}
                            onChange={(e) => setNewIndexIva(e.target.value)}
                            className="w-full px-3 py-2 mb-4 border rounded"
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowIndexModal(false)}
                                className="px-4 py-1 text-sm text-gray-700 border border-gray-400 rounded hover:bg-gray-100"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={submitNewIndexIva}
                                className="px-4 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                            >
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>

    );
};
