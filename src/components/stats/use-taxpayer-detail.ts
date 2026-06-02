import { useCallback, useEffect, useMemo, useRef, useState, type RefObject, type ChangeEvent } from "react";
import toast from "react-hot-toast";
import Decimal from "decimal.js";
import {
  downloadInvestigationPdf,
  downloadRepairPdf,
  getTaxpayerData,
  modifyIndividualIndexIva,
  notifyTaxpayer,
  updateCulminated,
  updateFase,
  uploadRepairReport,
} from "../utils/api/taxpayer-functions";
import { IVAReports } from "@/types/iva-reports";
import { RepairReports } from "@/types/repair-reports";
import { InvestigationPdf } from "@/types/investigation-pdf";
import { User } from "@/types/user";
import { Parish, TaxpayerCategory } from "@/types/taxpayer";

/* ------------------------------------------------------------------ */
/*  Exported types                                                     */
/* ------------------------------------------------------------------ */

export interface TaxpayerData {
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
  emition_date?: string | Date;
  updated_at?: string | Date;
  /** Indice efectivo (Soberano): propio o general, ya resuelto por el backend. */
  currentEffectiveIndex?: number | null;
}

export interface TaxpayerSummaryStrip {
  rif: string;
  fase: string;
  notified: boolean;
  notificationLabel: string;
}

/* ------------------------------------------------------------------ */
/*  Hook params & return                                               */
/* ------------------------------------------------------------------ */

export interface UseTaxpayerDetailParams {
  taxpayerId: string | undefined;
  taxpayerDataFromLoader?: TaxpayerData;
  user: any; // del hook useAuth — se recibe como parametro
  onTaxpayerDataLoaded?: (summary: TaxpayerSummaryStrip | null) => void;
}

export interface UseTaxpayerDetailReturn {
  // Estados
  taxpayerData: TaxpayerData | undefined;
  loadingDetails: boolean;
  selectedFile: File | null;
  showModal: boolean;
  loading: boolean;
  faseToChange: string | null;
  showFaseModal: boolean;
  showCulminatedModal: boolean;
  showNotifiedModal: boolean;
  showIndexModal: boolean;
  showEditModal: boolean;
  newIndexIva: string;
  fileInputRef: RefObject<HTMLInputElement>;
  fases: string[];

  // Setters para estados controlados por el componente
  setShowFaseModal: (v: boolean) => void;
  setShowCulminatedModal: (v: boolean) => void;
  setShowNotifiedModal: (v: boolean) => void;
  setShowIndexModal: (v: boolean) => void;
  setShowEditModal: (v: boolean) => void;
  setShowModal: (v: boolean) => void;
  setNewIndexIva: (v: string) => void;
  setFaseToChange: (v: string | null) => void;
  setSelectedFile: (v: File | null) => void;
  setTaxpayerData: (v: TaxpayerData | undefined) => void;

  // Handlers
  handleFaseClick: (fase: string) => void;
  confirmFaseChange: () => Promise<void>;
  handleCulminatedClick: (culminated: boolean) => void;
  confirmCulminated: () => Promise<void>;
  handleNotifiedClick: (notified: boolean) => void;
  confirmNotified: () => Promise<void>;
  handleUploadClick: () => void;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSendFile: () => Promise<void>;
  handleConfirmSend: () => Promise<void>;
  handleCancelSend: () => void;
  handleDownloadRepair: (pdf_url: string) => Promise<void>;
  handleDownloadInvestigation: () => Promise<void>;
  submitNewIndexIva: () => Promise<void>;

  // Helpers
  formatCurrency: (value: unknown) => string;
  parseDecimalLike: (value: unknown) => number;

  // Permisos
  canEditFase: boolean;
  canEditIndex: boolean;
  canEditTaxpayer: boolean;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useTaxpayerDetail({
  taxpayerId,
  taxpayerDataFromLoader,
  user,
  onTaxpayerDataLoaded,
}: UseTaxpayerDetailParams): UseTaxpayerDetailReturn {
  /* ---------- State ---------- */
  const [taxpayerData, setTaxpayerData] = useState<TaxpayerData | undefined>(
    taxpayerDataFromLoader
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [faseToChange, setFaseToChange] = useState<string | null>(null);
  const [showFaseModal, setShowFaseModal] = useState(false);
  const [showCulminatedModal, setShowCulminatedModal] = useState(false);
  const [showNotifiedModal, setShowNotifiedModal] = useState(false);
  const [showIndexModal, setShowIndexModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newIndexIva, setNewIndexIva] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------- Effects ---------- */

  // Cargar datos si no vienen del loader
  useEffect(() => {
    if (taxpayerDataFromLoader) {
      setTaxpayerData(taxpayerDataFromLoader);
      setLoadingDetails(false);
      return;
    }

    const fetchData = async () => {
      try {
        if (taxpayerId) {
          const data = await getTaxpayerData(taxpayerId);
          setTaxpayerData(data);
        }
      } catch (e) {
        console.error(e);
        toast.error(
          "Ha ocurrido un error obteniendo los datos del contribuyente"
        );
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchData();
  }, [taxpayerId, taxpayerDataFromLoader]);

  // Notificar al componente padre cuando los datos estan listos
  useEffect(() => {
    if (!onTaxpayerDataLoaded) return;
    if (loadingDetails) return;
    if (!taxpayerData) {
      onTaxpayerDataLoaded(null);
      return;
    }
    onTaxpayerDataLoaded({
      rif: taxpayerData.rif ?? "\u2014",
      fase: taxpayerData.fase ?? "\u2014",
      notified: !!taxpayerData.notified,
      notificationLabel:
        taxpayerData.notified && taxpayerData.updated_at
          ? new Date(taxpayerData.updated_at).toLocaleDateString("es-VE", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : taxpayerData.notified
            ? "Notificado"
            : "Pendiente",
    });
  }, [loadingDetails, taxpayerData, onTaxpayerDataLoaded]);

  /* ---------- Helpers ---------- */

  const parseDecimalLike = useCallback((value: unknown): number => {
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
  }, []);

  const formatCurrency = useCallback(
    (value: unknown) => {
      const amount = parseDecimalLike(value);
      return amount.toLocaleString("es-VE", {
        style: "currency",
        currency: "VES",
      });
    },
    [parseDecimalLike]
  );

  /* ---------- Permissions ---------- */

  const canEditTaxpayer =
    user?.role === "ADMIN" ||
    user?.id === taxpayerData?.officerId ||
    user?.taxpayer?.some((t: any) => t.id === taxpayerId);

  const canEditFase =
    (user?.role === "ADMIN" ||
      (user?.role === "COORDINATOR" &&
        taxpayerData?.user.group?.coordinatorId === user.id) ||
      (user?.role === "SUPERVISOR" &&
        taxpayerData?.user.supervisorId === user.id)) &&
    taxpayerData?.process === "AF";

  const canEditIndex =
    user?.role === "ADMIN" ||
    user?.role === "SUPERVISOR" ||
    user?.role === "COORDINATOR" ||
    user?.role === "FISCAL";

  const fases = useMemo(
    () => ["FASE_1", "FASE_2", "FASE_3", "FASE_4"],
    []
  );

  /* ---------- Handlers ---------- */

  const handleFaseClick = useCallback(
    (fase: string) => {
      if (!taxpayerId || !fase || taxpayerData?.fase === fase) return;
      setFaseToChange(fase);
      setShowFaseModal(true);
    },
    [taxpayerId, taxpayerData?.fase]
  );

  const confirmFaseChange = useCallback(async () => {
    if (!taxpayerId || !faseToChange) return;

    try {
      await updateFase(taxpayerId, faseToChange);
      setTaxpayerData((prev) =>
        prev ? { ...prev, fase: faseToChange } : prev
      );
      toast.success(`Fase actualizada a ${faseToChange}`);
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar la fase");
    } finally {
      setShowFaseModal(false);
      setFaseToChange(null);
    }
  }, [taxpayerId, faseToChange]);

  const handleCulminatedClick = useCallback(
    (_culminated: boolean) => {
      if (!taxpayerId) return;
      setShowCulminatedModal(true);
    },
    [taxpayerId]
  );

  const confirmCulminated = useCallback(async () => {
    if (!taxpayerId) return;

    try {
      await updateCulminated(taxpayerId, true);
      setTaxpayerData((prev) =>
        prev ? { ...prev, culminated: true } : prev
      );
      toast.success("Procedimiento culminado de manera exitosa");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Error desconocido al culminar procedimiento");
    } finally {
      setShowCulminatedModal(false);
    }
  }, [taxpayerId]);

  const handleNotifiedClick = useCallback(
    (_notified: boolean) => {
      if (!taxpayerId) return;
      setShowNotifiedModal(true);
    },
    [taxpayerId]
  );

  const confirmNotified = useCallback(async () => {
    if (!taxpayerId) return;

    try {
      await notifyTaxpayer(taxpayerId);
      setTaxpayerData((prev) =>
        prev ? { ...prev, notified: true } : prev
      );
      toast.success(
        "\u00a1Contribuyente reportado como notificado exitosamente!"
      );
    } catch (e) {
      console.error(e);
      toast.error("Error al reportar al contribuyente como notificado");
    } finally {
      setShowNotifiedModal(false);
    }
  }, [taxpayerId]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
        setSelectedFile(event.target.files[0]);
        setShowModal(true);
      }
    },
    []
  );

  const handleSendFile = useCallback(async () => {
    if (!selectedFile || !taxpayerId) {
      toast.error("No se ha seleccionado archivo o no hay contribuyente.");
      return;
    }

    try {
      await uploadRepairReport(taxpayerId, selectedFile);
      toast.success("Acta de reparacion subida correctamente.");
      setSelectedFile(null);

      // Refrescar datos despues de subir
      const data = await getTaxpayerData(taxpayerId);
      setTaxpayerData(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al subir el acta de reparacion.");
    }
  }, [selectedFile, taxpayerId]);

  const handleConfirmSend = useCallback(async () => {
    await handleSendFile();
    setShowModal(false);
  }, [handleSendFile]);

  const handleCancelSend = useCallback(() => {
    setSelectedFile(null);
    setShowModal(false);
  }, []);

  const handleDownloadRepair = useCallback(
    async (pdf_url: string) => {
      if (loading === true) return;
      setLoading(true);

      try {
        const key = pdf_url.replace(
          "https://sacbucketgeneral.s3.amazonaws.com/",
          ""
        );
        const response = await downloadRepairPdf(encodeURIComponent(key));
        const signedUrl = response.data;

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
    },
    [loading]
  );

  const handleDownloadInvestigation = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    const pdfs = taxpayerData?.investigation_pdfs;
    const pdfsUrl = pdfs?.map((pdf) => pdf.pdf_url);

    try {
      if (pdfsUrl && pdfsUrl.length > 0) {
        for (const url of pdfsUrl) {
          const key = url.replace(
            "https://sacbucketgeneral.s3.amazonaws.com/",
            ""
          );
          const response = await downloadInvestigationPdf(key);
          const signedUrl = response.data;

          if (signedUrl) {
            const link = document.createElement("a");
            link.href = signedUrl;
            link.download = key.split("/").pop() || "archivo.pdf";
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
  }, [loading, taxpayerData?.investigation_pdfs]);

  const submitNewIndexIva = useCallback(async () => {
    if (!taxpayerId || !newIndexIva) return;

    try {
      await modifyIndividualIndexIva(new Decimal(newIndexIva), taxpayerId);
      toast.success("Indice de IVA actualizado exitosamente.");
      setShowIndexModal(false);

      const updatedData = await getTaxpayerData(taxpayerId);
      setTaxpayerData(updatedData);
    } catch (e) {
      console.error(e);
      toast.error("Error al modificar el indice IVA");
    }
  }, [taxpayerId, newIndexIva]);

  /* ---------- Return ---------- */

  return {
    // Estados
    taxpayerData,
    loadingDetails,
    selectedFile,
    showModal,
    loading,
    faseToChange,
    showFaseModal,
    showCulminatedModal,
    showNotifiedModal,
    showIndexModal,
    showEditModal,
    newIndexIva,
    fileInputRef,
    fases,

    // Setters
    setShowFaseModal,
    setShowCulminatedModal,
    setShowNotifiedModal,
    setShowIndexModal,
    setShowEditModal,
    setShowModal,
    setNewIndexIva,
    setFaseToChange,
    setSelectedFile,
    setTaxpayerData,

    // Handlers
    handleFaseClick,
    confirmFaseChange,
    handleCulminatedClick,
    confirmCulminated,
    handleNotifiedClick,
    confirmNotified,
    handleUploadClick,
    handleFileChange,
    handleSendFile,
    handleConfirmSend,
    handleCancelSend,
    handleDownloadRepair,
    handleDownloadInvestigation,
    submitNewIndexIva,

    // Helpers
    formatCurrency,
    parseDecimalLike,

    // Permisos
    canEditFase,
    canEditIndex,
    canEditTaxpayer,
  };
}
