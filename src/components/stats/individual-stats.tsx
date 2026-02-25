import React, { useEffect, useMemo, useRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import { Event } from "@/types/event";
import toast, { Toaster } from "react-hot-toast";
import { downloadInvestigationPdf, downloadRepairPdf, getTaxpayerData, modifyIndividualIndexIva, notifyTaxpayer, updateCulminated, updateFase, uploadRepairReport } from "../utils/api/taxpayer-functions";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { IVAReports } from "@/types/iva-reports";
import { RepairReports } from "@/types/repair-reports";
import { InvestigationPdf } from "@/types/investigation-pdf";
import { User } from "@/types/user";
import Decimal from "decimal.js";
import { Parish, TaxpayerCategory } from "@/types/taxpayer";
import { Settings } from "lucide-react";




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
    taxpayer_category: TaxpayerCategory | null;
    parish: Parish | null;
    emition_date?: string | Date;  // ✅ Fecha del procedimiento
    updated_at?: string | Date;    // ✅ Fecha de última actualización (usada para fecha de notificación)
    /** Índice efectivo (Soberano): propio o general, ya resuelto por el backend. */
    currentEffectiveIndex?: number | null;
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


    // Datos para el gráfico de barras: compras y ventas por mes (desde IVAReports)
    const barChartData = useMemo(() => {
        if (!IVAReports || !Array.isArray(IVAReports) || IVAReports.length === 0) return [];
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const sorted = [...IVAReports].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return sorted.map((r) => {
            const d = new Date(r.date);
            const monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            return {
                month: monthLabel,
                compras: Number(r.purchases) || 0,
                ventas: Number(r.sells) || 0,
            };
        });
    }, [IVAReports]);

    // Índice meta para la ReferenceLine: propio (currentEffectiveIndex) o null si no hay
    const indexMeta = taxpayerData?.currentEffectiveIndex != null && taxpayerData.currentEffectiveIndex > 0
        ? taxpayerData.currentEffectiveIndex
        : null;

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

    const canEditFase = (
        user?.role === "ADMIN" ||
        (user?.role === "COORDINATOR" && taxpayerData?.user.group?.coordinatorId === user.id) ||
        (user?.role === "SUPERVISOR" && taxpayerData?.user.supervisorId === user.id)
    ) && taxpayerData?.process === "AF";

    const canEditIndex = user?.role === "ADMIN" || user?.role === "SUPERVISOR" || user?.role === "COORDINATOR" || user?.role === "FISCAL";


    return (
        <div className="w-full min-h-[20vh] text-black mt-4 px-3 sm:px-6 md:px-8 lg:px-0 lg:mt-0 overflow-x-hidden">
            <div className="flex flex-col lg:flex-row w-full max-w-full lg:max-w-[900px] lg:mx-auto min-h-0 shadow-xl rounded-lg lg:rounded-xl pb-4 lg:pb-4 bg-white/95 lg:bg-white">

                {/* Columna Izquierda - Datos del Contribuyente */}
                <div className="w-full min-w-0 p-4 sm:p-5 lg:p-6 lg:w-1/2">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h1 className="text-base sm:text-lg md:text-xl font-semibold uppercase tracking-tight">
                            Datos del contribuyente
                        </h1>
                        {canEditIndex && (
                            <button
                                type="button"
                                onClick={() => {
                                    setNewIndexIva(taxpayerData?.currentEffectiveIndex != null ? String(taxpayerData.currentEffectiveIndex) : "");
                                    setShowIndexModal(true);
                                }}
                                className="p-2 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-colors shadow-sm touch-manipulation min-h-[44px] min-w-[44px]"
                                title="Editar índice IVA (meta mensual)"
                                aria-label="Editar índice IVA"
                            >
                                <Settings className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col space-y-1.5 sm:space-y-2 text-xs sm:text-sm break-words">
                        <p className="break-words"><span className="font-bold">NRO DE PROVIDENCIA:</span> {taxpayerData ? taxpayerData?.providenceNum : "—"}</p>
                        <p className="break-words"><span className="font-bold">PROCEDIMIENTO:</span> {taxpayerData ? taxpayerData?.process : "—"}</p>
                        <p className="break-words"><span className="font-bold">RAZÓN SOCIAL:</span> {taxpayerData ? taxpayerData?.name : "—"}</p>
                        <p className="break-words"><span className="font-bold">RIF:</span> {taxpayerData ? taxpayerData?.rif : "—"}</p>
                        <p className="break-words font-bold">Actividad Comercial: {taxpayerData?.taxpayer_category?.name ?? "—"}</p>
                        <p className="break-words font-bold">Parroquia: {taxpayerData?.parish?.name ?? "—"}</p>
                        <p className="break-words"><span className="font-bold">TIPO:</span> {taxpayerData?.contract_type === "ORDINARY" ? "ORDINARIO" : taxpayerData?.contract_type === "SPECIAL" ? "ESPECIAL" : taxpayerData?.contract_type ?? "—"}</p>
                        <p className="break-words"><span className="font-bold">Dirección:</span> {taxpayerData?.address ?? "—"}</p>
                        <p className="break-words"><span className="font-bold">FISCAL ASIGNADO:</span> {taxpayerData?.user?.name ?? "No asignado"}</p>
                        <p className="break-words"><span className="font-bold">FECHA PROCEDIMIENTO:</span> {taxpayerData?.emition_date ? new Date(taxpayerData.emition_date).toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: 'numeric' }) : "—"}</p>
                        <p className="break-words"><span className="font-bold">FECHA NOTIFICACIÓN:</span> {taxpayerData?.notified && taxpayerData?.updated_at ? new Date(taxpayerData.updated_at).toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: 'numeric' }) : taxpayerData?.notified ? "Notificado" : "No notificado"}</p>
                        <p className="break-words"><span className="font-bold">Multas:</span> {fines ?? "—"}</p>
                        <p className="break-words"><span className="font-bold">Excedente crédito:</span> {taxpayerData?.IVAReports?.[0]?.excess != null ? taxpayerData.IVAReports[0].excess.toString() : "—"}</p>
                    </div>

                    {taxpayerData?.notified === true ? (
                        <p className="pt-2 text-xs sm:text-sm font-semibold leading-snug text-green-800 max-h-[80px] overflow-y-auto">
                            Este contribuyente ha sido notificado exitosamente acerca de su procedimiento.
                        </p>
                    ) : (
                        <p className="pt-2 text-xs sm:text-sm font-semibold leading-snug text-slate-700 max-h-[80px] overflow-y-auto">
                            Este contribuyente aún no ha sido notificado acerca de su procedimiento.
                        </p>
                    )}

                    <div className="pt-3 flex flex-wrap items-center gap-2">
                        {taxpayerData?.culminated === true ? (
                            <p className="text-sm font-semibold text-green-700">
                                Procedimiento Culminado.
                            </p>
                        ) : (
                            (user?.role === "FISCAL" && user?.id === taxpayerData?.officerId) ||
                            (user?.role === "COORDINATOR" && user?.id === taxpayerData?.user?.group?.coordinatorId) ||
                            (user?.role === "SUPERVISOR" && (user?.id === taxpayerData?.officerId || user.supervised_members?.some((member) => member.id === taxpayerData?.officerId))) ||
                            user?.role === "ADMIN"
                        ) && (
                            <button
                                type="button"
                                className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
                                onClick={() => handleCulminatedClick(true)}
                            >
                                Culminar Procedimiento
                            </button>
                        )}

                        {user?.role === "ADMIN" && taxpayerData && taxpayerData?.investigation_pdfs.length >= 1 && (
                            <button
                                type="button"
                                className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 transition-colors touch-manipulation"
                                onClick={() => handleDownloadInvestigation()}
                            >
                                Descargar investigación
                            </button>
                        )}
                    </div>

                    {taxpayerData?.process === "AF" && (
                        taxpayerData.RepairReports.length > 0 ? (
                            <div className="pt-2">
                                <button
                                    type="button"
                                    className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 transition-colors touch-manipulation"
                                    onClick={() => handleDownloadRepair(taxpayerData.RepairReports[0].pdf_url)}
                                >
                                    Descargar acta de reparo
                                </button>
                            </div>
                        ) : (
                            user && taxpayerData.officerId === user.id && (
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 transition-colors touch-manipulation"
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
                                            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 overflow-y-auto"
                                            onClick={handleCancelSend}
                                        >
                                            <div
                                                className="w-full max-w-sm p-4 sm:p-6 bg-white rounded-xl shadow-xl my-auto"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <h2 className="mb-4 text-lg font-semibold">Confirmar Acta de Reparo a Subir</h2>
                                                <p className="mb-4 break-words">Archivo seleccionado: <strong>{selectedFile.name}</strong></p>

                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                                        onClick={handleCancelSend}
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700"
                                                        onClick={handleConfirmSend}
                                                    >
                                                        Subir archivo
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        )
                    )}

                    {canEditFase && (
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                            {fases.map((fase) => (
                                <button
                                    key={fase}
                                    type="button"
                                    className={`min-h-[44px] px-3 py-2.5 sm:py-2 text-sm font-medium rounded-md transition-colors touch-manipulation flex-1 min-w-[72px] sm:flex-none ${
                                        taxpayerData?.fase === fase
                                            ? "bg-green-600 text-white shadow-sm"
                                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                    }`}
                                    onClick={() => handleFaseClick(fase)}
                                >
                                    {fase.replace("FASE_", "FASE ")}
                                </button>
                            ))}
                        </div>
                    )}

                    {taxpayerData?.fase && taxpayerData.process === "AF" && (
                        <div className="w-full pt-4 mt-2 text-xs sm:text-sm italic text-left text-gray-700">
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

                {/* Columna Derecha - Gráficas */}
                <div className="flex flex-col w-full min-w-0 lg:w-1/2 p-4 sm:p-5 lg:p-6 pt-0 lg:pt-6 lg:mt-0 border-t lg:border-t-0 lg:border-l border-slate-200">

                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 pb-3">
                        {(
                            (user?.role === "FISCAL" && taxpayerData?.officerId === user.id) ||
                            user?.role === "ADMIN" ||
                            (user?.role === "SUPERVISOR" && (user.id === taxpayerData?.officerId || user.supervised_members?.some(member => member.id === taxpayerData?.officerId)))
                        ) && !taxpayerData?.notified && (
                            <button
                                type="button"
                                className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 transition-colors touch-manipulation"
                                onClick={() => handleNotifiedClick(true)}
                            >
                                Reportar como notificado
                            </button>
                        )}

                        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: "#0080c1" }} />
                                Compras (BS)
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: "#737373" }} />
                                Ventas (BS)
                            </span>
                        </div>
                    </div>

                    {dataMock.some(item => item.value > 0) && (
                        <div className="flex justify-center items-center w-full min-h-[180px] sm:min-h-[200px] lg:min-h-[12rem]">
                            <ResponsiveContainer width="100%" height={200}>
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

                    <div className="w-full mt-4 sm:mt-6 min-h-[220px] sm:min-h-[260px]">
                        <h3 className="mb-2 text-sm font-semibold text-center text-slate-800">
                            Compras vs. Ventas vs. Índice (meta)
                        </h3>
                        <div className="w-full h-[220px] sm:h-[260px] lg:h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {barChartData.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-sm text-slate-500">
                                    Sin reportes IVA mensuales para mostrar
                                </div>
                            ) : (
                            <BarChart
                                data={barChartData}
                                margin={{ top: 12, right: 12, left: 8, bottom: 8 }}
                            >
                                <CartesianGrid strokeDasharray="2 2" stroke="#334155" opacity={0.4} vertical={false} />
                                <XAxis dataKey="month" fontSize={11} tick={{ fill: "#94a3b8" }} />
                                <YAxis fontSize={11} tick={{ fill: "#94a3b8" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "6px" }}
                                    labelStyle={{ color: "#e2e8f0" }}
                                    formatter={(value: number, name: string) => [value.toLocaleString("es-VE", { style: "currency", currency: "VES", maximumFractionDigits: 0 }), name === "compras" ? "Compras" : name === "ventas" ? "Ventas" : name]}
                                />
                                {indexMeta != null && (
                                    <ReferenceLine
                                        y={indexMeta}
                                        stroke="#eab308"
                                        strokeWidth={1.5}
                                        strokeDasharray="4 3"
                                        label={{ value: "Meta (índice)", position: "right", fill: "#eab308", fontSize: 10 }}
                                    />
                                )}
                                <Bar dataKey="compras" name="Compras" fill="#0080c1" radius={[2, 2, 0, 0]} maxBarSize={36} />
                                <Bar dataKey="ventas" name="Ventas" fill="#1f2937" radius={[2, 2, 0, 0]} maxBarSize={36} />
                            </BarChart>
                            )}
                        </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#0080c1]" /> Compras</span>
                            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#1f2937]" /> Ventas</span>
                            {indexMeta != null && <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 border border-[#eab308] border-dashed" /> Meta (índice)</span>}
                        </div>
                    </div>


                </div>
            </div>
            {showFaseModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/50 overflow-y-auto">
                    <div className="w-full max-w-sm p-4 sm:p-6 bg-white shadow-xl rounded-t-2xl sm:rounded-xl max-h-[90vh] overflow-y-auto">
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
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowFaseModal(false);
                                    setFaseToChange(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmFaseChange}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {showCulminatedModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/50 overflow-y-auto">
                    <div className="flex flex-col items-center justify-center w-full max-w-sm p-4 sm:p-6 text-center bg-white shadow-xl rounded-t-2xl sm:rounded-xl">
                        <h2 className="mb-4 text-lg font-semibold text-center text-blue-600">Confirmar Culminación</h2>
                        <p className="mb-4 text-sm text-gray-700">¿Deseas marcar el procedimiento de este contribuyente como culminado?</p>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowCulminatedModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
                            <button type="button" onClick={confirmCulminated} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {showNotifiedModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/50 overflow-y-auto">
                    <div className="flex flex-col items-center justify-center w-full max-w-sm p-4 sm:p-6 text-center bg-white shadow-xl rounded-t-2xl sm:rounded-xl">
                        <h2 className="mb-4 text-lg font-semibold text-center text-blue-600">Confirmar Notificación</h2>
                        <p className="mb-4 text-sm text-gray-700">¿Deseas reportar al contribuyente como notificado?</p>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowNotifiedModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
                            <button type="button" onClick={confirmNotified} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {showIndexModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/50 overflow-y-auto" onClick={() => setShowIndexModal(false)}>
                    <div className="w-full max-w-sm p-4 sm:p-6 bg-white shadow-xl rounded-t-2xl sm:rounded-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h2 className="mb-4 text-lg font-semibold text-center">Editar índice IVA (meta mensual)</h2>
                        <label htmlFor="index-iva-input" className="block mb-1 text-sm text-gray-700">
                            Nuevo monto meta mensual (BS)
                        </label>
                        <input
                            id="index-iva-input"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Ej. 1500"
                            value={newIndexIva}
                            onChange={(e) => setNewIndexIva(e.target.value)}
                            className="w-full px-3 py-2 mb-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowIndexModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={submitNewIndexIva}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>

    );
};
