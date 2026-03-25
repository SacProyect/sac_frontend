import React, { useEffect, useMemo, useRef, useState } from "react";
import { Event } from "@/types/event";
import toast from "react-hot-toast";
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
import { ObservationsPanel } from "@/components/observations/observations-panel";




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

    const parseDecimalLike = (value: unknown): number => {
        if (typeof value === "number") return value;
        if (typeof value === "string") {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : 0;
        }
        if (!value || typeof value !== "object") return 0;

        const maybeDecimal = value as { d?: unknown };
        if (!Array.isArray(maybeDecimal.d) || maybeDecimal.d.length === 0) return 0;
        const firstChunk = Number(maybeDecimal.d[0]);
        return Number.isFinite(firstChunk) ? firstChunk : 0;
    };

    const formatCurrency = (value: unknown) => {
        const amount = parseDecimalLike(value);
        return amount.toLocaleString("es-VE", { style: "currency", currency: "VES" });
    };



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
            buys += parseDecimalLike(rep.purchases);
            sells += parseDecimalLike(rep.sells);
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
                compras: parseDecimalLike(r.purchases),
                ventas: parseDecimalLike(r.sells),
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
        <div className="w-full text-white mt-4 px-0 sm:px-2 md:px-0 lg:mt-0 overflow-x-hidden">

          {/* ── Design tokens ── */}
          <style>{`
            .is-card {
              --card-bg: #0b1220;
              --card-border: rgba(148,163,184,0.22);
              --tag-bg: rgba(148,163,184,0.12);
              --label-color: #94a3b8;
              --value-color: #f8fafc;
              --accent: #1d4ed8;
              --accent-dim: rgba(29,78,216,0.08);
              --badge-special-bg: rgba(245,158,11,0.12);
              --badge-special-color: #b45309;
              --badge-ordinary-bg: rgba(16,185,129,0.10);
              --badge-ordinary-color: #065f46;
              --badge-notif-bg: rgba(16,185,129,0.10);
              --badge-notif-color: #065f46;
              --badge-pending-bg: rgba(239,68,68,0.08);
              --badge-pending-color: #b91c1c;
              font-family: 'Inter', system-ui, sans-serif;
            }
            .is-field { display: flex; flex-direction: column; gap: 2px; }
            .is-field-label {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.07em;
              color: var(--label-color);
            }
            .is-field-value {
              font-size: 13px;
              font-weight: 500;
              color: var(--value-color);
              line-height: 1.35;
              word-break: break-word;
            }
            .is-field-value.prominent {
              font-size: 15px;
              font-weight: 700;
            }
            .is-divider {
              height: 1px;
              background: var(--card-border);
              border: none;
              margin: 2px 0;
            }
            .is-badge {
              display: inline-flex; align-items: center;
              padding: 2px 8px;
              border-radius: 999px;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.03em;
            }
            .is-badge.special  { background: var(--badge-special-bg);  color: var(--badge-special-color); }
            .is-badge.ordinary { background: var(--badge-ordinary-bg); color: var(--badge-ordinary-color); }
            .is-badge.notif    { background: var(--badge-notif-bg);    color: var(--badge-notif-color); }
            .is-badge.pending  { background: var(--badge-pending-bg);  color: var(--badge-pending-color); }
            .is-badge.culminated { background: var(--badge-notif-bg); color: var(--badge-notif-color); }
            .is-badge.active     { background: var(--accent-dim); color: var(--accent); }
            .is-fase-strip { display: flex; flex-wrap: wrap; gap: 6px; }
            .is-fase-btn {
              padding: 4px 12px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              border: 1.5px solid rgba(29,78,216,0.25);
              background: var(--accent-dim);
              color: var(--accent);
              cursor: pointer;
              transition: background 0.15s, border-color 0.15s;
            }
            .is-fase-btn.active-fase {
              background: var(--accent);
              color: #fff;
              border-color: var(--accent);
            }
            .is-fase-btn:hover:not(.active-fase) { border-color: var(--accent); }
            .is-action-btn {
              padding: 6px 14px;
              border-radius: 7px;
              font-size: 12px;
              font-weight: 600;
              border: none;
              cursor: pointer;
              transition: opacity 0.15s;
            }
            .is-action-btn:hover { opacity: 0.85; }
            .is-action-btn.primary { background: #2563eb; color: #fff; }
            .is-action-btn.success { background: #059669; color: #fff; }
            .is-action-btn.ghost {
              background: transparent;
              border: 1.5px solid rgba(148,163,184,0.35);
              color: #cbd5e1;
            }
            /* settings cog */
            .is-cog-btn {
              padding: 5px;
              border-radius: 6px;
              border: 1px solid var(--card-border);
              background: #111827;
              color: #cbd5e1;
              cursor: pointer;
              transition: background 0.15s;
              display: flex; align-items: center; justify-content: center;
            }
            .is-cog-btn:hover { background: var(--tag-bg); }
            /* obs panel wrapper */
            .obs-panel-outer {
              background: #0f172a;
              border-radius: 0;
            }
            @media (min-width: 1024px) {
              .obs-panel-outer {
                border-radius: 0 12px 12px 0;
                border-left: 1px solid rgba(148,163,184,0.10);
              }
            }
          `}</style>

          <div className="is-card flex flex-col lg:flex-row w-full max-w-full xl:max-w-[960px] xl:mx-auto shadow-xl rounded-xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>

                {/* ── Columna Izquierda — Datos del Contribuyente ── */}
                <div className="w-full min-w-0 p-4 sm:p-5 lg:p-6 lg:w-[45%] flex flex-col gap-4">

                  {/* Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="is-field-label" style={{color:'var(--label-color)',fontSize:'10px'}}>CONTRIBUYENTE</p>
                      <p className="is-field-value prominent" style={{fontSize:'15px',fontWeight:700,color:'var(--value-color)'}}>
                        {taxpayerData?.name ?? '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Contract type badge */}
                      {taxpayerData?.contract_type && (
                        <span className={`is-badge ${taxpayerData.contract_type === 'SPECIAL' ? 'special' : 'ordinary'}`}>
                          {taxpayerData.contract_type === 'SPECIAL' ? 'ESPECIAL' : 'ORDINARIO'}
                        </span>
                      )}
                      {/* Culminated badge */}
                      {taxpayerData?.culminated && (
                        <span className="is-badge culminated">CULMINADO</span>
                      )}
                      {canEditIndex && (
                        <button
                          type="button"
                          className="is-cog-btn"
                          title="Editar índice IVA"
                          onClick={() => {
                            setNewIndexIva(taxpayerData?.currentEffectiveIndex != null ? String(taxpayerData.currentEffectiveIndex) : '');
                            setShowIndexModal(true);
                          }}
                        >
                          <Settings size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <hr className="is-divider" />

                  {/* Fields grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="is-field">
                      <span className="is-field-label">RIF</span>
                      <span className="is-field-value" style={{fontFamily:'monospace'}}>{taxpayerData?.rif ?? '—'}</span>
                    </div>
                    <div className="is-field">
                      <span className="is-field-label">N° Providencia</span>
                      <span className="is-field-value">{taxpayerData?.providenceNum ?? '—'}</span>
                    </div>
                    <div className="is-field">
                      <span className="is-field-label">Procedimiento</span>
                      <span className="is-field-value">{taxpayerData?.process ?? '—'}</span>
                    </div>
                    <div className="is-field">
                      <span className="is-field-label">Fase</span>
                      <span className="is-field-value">
                        {taxpayerData?.fase
                          ? <span className="is-badge active">{taxpayerData.fase.replace('_', ' ')}</span>
                          : '—'}
                      </span>
                    </div>
                    <div className="is-field col-span-2">
                      <span className="is-field-label">Actividad Comercial</span>
                      <span className="is-field-value">{taxpayerData?.taxpayer_category?.name ?? '—'}</span>
                    </div>
                    <div className="is-field">
                      <span className="is-field-label">Parroquia</span>
                      <span className="is-field-value">{taxpayerData?.parish?.name ?? '—'}</span>
                    </div>
                    <div className="is-field">
                      <span className="is-field-label">Multas</span>
                      <span className="is-field-value">{fines}</span>
                    </div>
                    <div className="is-field col-span-2">
                      <span className="is-field-label">Dirección</span>
                      <span className="is-field-value" style={{fontSize:'12px'}}>{taxpayerData?.address ?? '—'}</span>
                    </div>
                    <div className="is-field">
                      <span className="is-field-label">Fiscal Asignado</span>
                      <span className="is-field-value" style={{fontSize:'12px'}}>{taxpayerData?.user?.name ?? 'No asignado'}</span>
                    </div>
                    <div className="is-field">
                      <span className="is-field-label">Excedente IVA</span>
                      <span className="is-field-value">{taxpayerData?.IVAReports?.[0]?.excess != null ? formatCurrency(taxpayerData.IVAReports[0].excess) : '—'}</span>
                    </div>
                    <div className="is-field">
                      <span className="is-field-label">Fecha Procedimiento</span>
                      <span className="is-field-value" style={{fontSize:'12px'}}>
                        {taxpayerData?.emition_date
                          ? new Date(taxpayerData.emition_date).toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: 'numeric' })
                          : '—'}
                      </span>
                    </div>
                    <div className="is-field">
                      <span className="is-field-label">Notificación</span>
                      <span className="is-field-value" style={{fontSize:'12px'}}>
                        {taxpayerData?.notified && taxpayerData?.updated_at
                          ? new Date(taxpayerData.updated_at).toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: 'numeric' })
                          : (
                            <span className={`is-badge ${taxpayerData?.notified ? 'notif' : 'pending'}`}>
                              {taxpayerData?.notified ? 'Notificado' : 'Pendiente'}
                            </span>
                          )}
                      </span>
                    </div>
                  </div>

                  <hr className="is-divider" />

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {taxpayerData?.culminated === true ? (
                      <span className="is-badge culminated" style={{fontSize:'12px',padding:'4px 12px'}}>Procedimiento Culminado</span>
                    ) : (
                      ((
                        (user?.role === 'FISCAL' && user?.id === taxpayerData?.officerId) ||
                        (user?.role === 'COORDINATOR' && user?.id === taxpayerData?.user?.group?.coordinatorId) ||
                        (user?.role === 'SUPERVISOR' && (user?.id === taxpayerData?.officerId || user.supervised_members?.some((m) => m.id === taxpayerData?.officerId))) ||
                        user?.role === 'ADMIN'
                      ) && (
                        <button type="button" className="is-action-btn primary" onClick={() => handleCulminatedClick(true)}>
                          Culminar Procedimiento
                        </button>
                      ))
                    )}

                    {(
                      (user?.role === 'FISCAL' && taxpayerData?.officerId === user?.id) ||
                      user?.role === 'ADMIN' ||
                      (user?.role === 'SUPERVISOR' && (user?.id === taxpayerData?.officerId || user.supervised_members?.some(m => m.id === taxpayerData?.officerId)))
                    ) && !taxpayerData?.notified && (
                      <button type="button" className="is-action-btn ghost" onClick={() => handleNotifiedClick(true)}>
                        Reportar notificado
                      </button>
                    )}

                    {user?.role === 'ADMIN' && taxpayerData && taxpayerData.investigation_pdfs.length >= 1 && (
                      <button type="button" className="is-action-btn ghost" onClick={handleDownloadInvestigation}>
                        Descargar investigación
                      </button>
                    )}
                  </div>

                  {/* AF-specific: repair + fase */}
                  {taxpayerData?.process === 'AF' && (
                    <>
                      {taxpayerData.RepairReports.length > 0 ? (
                        <button type="button" className="is-action-btn ghost" onClick={() => handleDownloadRepair(taxpayerData.RepairReports[0].pdf_url)}>
                          Descargar acta de reparo
                        </button>
                      ) : (
                        user && taxpayerData.officerId === user.id && (
                          <div>
                            <button type="button" className="is-action-btn ghost" onClick={handleUploadClick}>Subir acta de reparo</button>
                            <input type="file" accept=".pdf" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                            {showModal && selectedFile && (
                              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={handleCancelSend}>
                                <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-xl" onClick={e => e.stopPropagation()}>
                                  <h2 className="mb-4 text-lg font-semibold">Confirmar Acta de Reparo</h2>
                                  <p className="mb-4 break-words">Archivo: <strong>{selectedFile.name}</strong></p>
                                  <div className="flex justify-end gap-2">
                                    <button type="button" className="is-action-btn ghost" onClick={handleCancelSend}>Cancelar</button>
                                    <button type="button" className="is-action-btn success" onClick={handleConfirmSend}>Subir archivo</button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      )}

                      {canEditFase && (
                        <>
                          <hr className="is-divider" />
                          <div>
                            <p className="is-field-label" style={{marginBottom:'8px'}}>AVANCE DE FASE</p>
                            <div className="is-fase-strip">
                              {fases.map(fase => (
                                <button key={fase} type="button"
                                  className={`is-fase-btn${taxpayerData?.fase === fase ? ' active-fase' : ''}`}
                                  onClick={() => handleFaseClick(fase)}>
                                  {fase.replace('FASE_', 'Fase ')}
                                </button>
                              ))}
                            </div>
                            {taxpayerData?.fase && (
                              <p className="text-xs italic mt-2" style={{color:'#64748b',lineHeight:1.5}}>
                                {taxpayerData.fase === 'FASE_1' && 'Notificación de providencia, acta de requerimientos, constancias y actas de recepción.'}
                                {taxpayerData.fase === 'FASE_2' && 'Análisis y desarrollo de hojas de trabajo y predeterminación con soportes.'}
                                {taxpayerData.fase === 'FASE_3' && 'Determinación y reparo definitivo: acta de reparo, informe y requerimiento finales.'}
                                {taxpayerData.fase === 'FASE_4' && 'Declaración sustitutiva; resolución de sanción de allanamiento; culminación de expediente.'}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* ── Columna Derecha — Observaciones ── */}
                <div className="obs-panel-outer flex flex-col w-full min-w-0 lg:w-[55%] border-t lg:border-t-0" style={{minHeight:'420px'}}>

                  <ObservationsPanel taxpayerId={taxpayer} />
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
