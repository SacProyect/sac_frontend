import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { fadeInSection, staggerContainer, staggerItem, bannerEnter } from "@/lib/motion";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/UI/table";
import { Button } from "@/components/UI/button";
import { Badge } from "@/components/UI/badge";
import { Input } from "@/components/UI/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/UI/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/UI/select";
import { Label } from "@/components/UI/label";
import { Textarea } from "@/components/UI/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/UI/dropdown-menu";
import {
    Search,
    Plus,
    Upload,
    Download,
    MoreHorizontal,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    FileSpreadsheet,
    Loader2,
    Zap,
    ArrowRight,
    CheckCircle2,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import toast from "react-hot-toast";
import type { Entidad, CreateEntidadPayload, EntidadFilters } from "@/types/entidad";
import {
    listEntidades,
    createEntidad,
    updateEntidad,
    deleteEntidad,
    importEntidadesXlsx,
    exportEntidadesXlsx,
    getNextEnrichmentEntity,
    updateEnrichmentFields,
} from "@/components/utils/api/entidad-functions";
import { getEntidadParroquias, getEntidadOrdinarioEspecialList } from "@/components/utils/api/entidad-functions";

// ─── EMPTY FORM STATE ───────────────────────────────────────
const emptyForm: CreateEntidadPayload = {
    rif: "",
    razon_social: "",
    gerencia_dependencia: "",
    parroquia: "",
    municipio: "",
    estado: "",
    tipo_contribuyente: "",
    situacion: "",
    flag_rif_vencido: "",
    estado_rif: "",
    telefono: "",
    actividad_economica: "",
    correo: "",
    observacion: "",
    tiene_maquina_fiscal: "",
    tipo_facturacion: "",
    abierto_cerrado: "",
    fecha_censo: "",
    grupo: "",
    ordinario_especial: "",
    sistema_homologado: "",
    boleta_comparecencia: "",
};

// ─── HELPER: extract error message ──────────────────────────
function extractMessage(e: unknown, fallback: string): string {
    if (e && typeof e === "object" && "message" in e) {
        return String((e as { message: unknown }).message);
    }
    return fallback;
}

// ─── MAIN COMPONENT ─────────────────────────────────────────
export function EntidadesTab() {
    // Data state
    const [entidades, setEntidades] = useState<Entidad[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(20);

    // Search & Filters
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);
    const [filterParroquia, setFilterParroquia] = useState<string>("");
    const [filterMunicipio, setFilterMunicipio] = useState<string>("");
    const [filterEstado, setFilterEstado] = useState<string>("");
    const [filterSituacion, setFilterSituacion] = useState<string>("");
    const [filterGrupo, setFilterGrupo] = useState<string>("");
    const [filterMaquinaFiscal, setFilterMaquinaFiscal] = useState<string>("");
    const [filterTipoFacturacion, setFilterTipoFacturacion] = useState<string>("");
    const [filterAbiertoCerrado, setFilterAbiertoCerrado] = useState<string>("");
    const [filterOrdinarioEspecial, setFilterOrdinarioEspecial] = useState<string>("");
    const [filterFechaDesde, setFilterFechaDesde] = useState<string>("");
    const [filterFechaHasta, setFilterFechaHasta] = useState<string>("");

    // Parroquia list for filter dropdown
    const [parroquias, setParroquias] = useState<string[]>([]);

    // Ordinario/Especial list for filter dropdown
    const [ordinarioEspecialList, setOrdinarioEspecialList] = useState<string[]>([]);

    // Dialog states
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [formData, setFormData] = useState<CreateEntidadPayload>({ ...emptyForm });
    const [editingEntidad, setEditingEntidad] = useState<Entidad | null>(null);
    const [deletingEntidad, setDeletingEntidad] = useState<Entidad | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Import state
    const [isImporting, setIsImporting] = useState(false);

    // Enrichment mode state
    const [enrichmentMode, setEnrichmentMode] = useState(false);
    const [enrichmentEntity, setEnrichmentEntity] = useState<Entidad | null>(null);
    const [enrichmentPending, setEnrichmentPending] = useState(0);
    const [enrichmentCompleted, setEnrichmentCompleted] = useState(0);
    const [enrichmentLoading, setEnrichmentLoading] = useState(false);
    const [enrichmentSaving, setEnrichmentSaving] = useState(false);

    // Enrichment form values
    const [enrichTieneMaquina, setEnrichTieneMaquina] = useState("");
    const [enrichTipoFacturacion, setEnrichTipoFacturacion] = useState("");
    const [enrichAbiertoCerrado, setEnrichAbiertoCerrado] = useState("");
    const [enrichFechaCenso, setEnrichFechaCenso] = useState("");
    const [enrichGrupo, setEnrichGrupo] = useState("");
    const [enrichOrdinarioEspecial, setEnrichOrdinarioEspecial] = useState("");
    const [enrichSistemaHomologado, setEnrichSistemaHomologado] = useState("");
    const [enrichBoletaComparecencia, setEnrichBoletaComparecencia] = useState("");
    const [enrichTipoComparecencia, setEnrichTipoComparecencia] = useState("");
    const [enrichObservaciones, setEnrichObservaciones] = useState("");
    const [enrichCorreo, setEnrichCorreo] = useState("");
    const [enrichTelefono, setEnrichTelefono] = useState("");

    // Enrichment search
    const [enrichmentSearch, setEnrichmentSearch] = useState("");

    const reducedMotion = usePrefersReducedMotion();

    // ─── FETCH DATA ──────────────────────────────────────────
    const fetchData = useCallback(async (signal?: AbortSignal) => {
        setIsLoading(true);
        try {
            const filters: EntidadFilters = { page, limit };
            if (debouncedSearch) {
                filters.search = debouncedSearch;
            }
            if (filterParroquia && filterParroquia !== "all") filters.parroquia = filterParroquia;
            if (filterMunicipio && filterMunicipio !== "all") filters.municipio = filterMunicipio;
            if (filterEstado && filterEstado !== "all") filters.estado = filterEstado;
            if (filterSituacion && filterSituacion !== "all") filters.situacion = filterSituacion;
            if (filterGrupo && filterGrupo !== "all") filters.grupo = filterGrupo;
            if (filterMaquinaFiscal && filterMaquinaFiscal !== "all") filters.tiene_maquina_fiscal = filterMaquinaFiscal;
            if (filterTipoFacturacion && filterTipoFacturacion !== "all") filters.tipo_facturacion = filterTipoFacturacion;
            if (filterAbiertoCerrado && filterAbiertoCerrado !== "all") filters.abierto_cerrado = filterAbiertoCerrado;
            if (filterOrdinarioEspecial && filterOrdinarioEspecial !== "all") filters.ordinario_especial = filterOrdinarioEspecial;
            if (filterFechaDesde) filters.fecha_censo_desde = filterFechaDesde;
            if (filterFechaHasta) filters.fecha_censo_hasta = filterFechaHasta;

            const result = await listEntidades(filters, signal);
            setEntidades(result.data);
            setTotal(result.pagination.total);
            setTotalPages(result.pagination.totalPages);
        } catch (error: any) {
            if (error?.name === "Cancel" || error?.message === "canceled" || error instanceof DOMException && error.name === "AbortError") return;
            toast.error(extractMessage(error, "Error al cargar entidades"));
        } finally {
            if (!signal?.aborted) setIsLoading(false);
        }
    }, [page, limit, debouncedSearch, filterParroquia, filterMunicipio, filterEstado, filterSituacion, filterGrupo, filterMaquinaFiscal, filterTipoFacturacion, filterAbiertoCerrado, filterOrdinarioEspecial, filterFechaDesde, filterFechaHasta]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, filterParroquia, filterMunicipio, filterEstado, filterSituacion, filterGrupo, filterMaquinaFiscal, filterTipoFacturacion, filterAbiertoCerrado, filterOrdinarioEspecial, filterFechaDesde, filterFechaHasta]);

    // Fetch data with cancellation
    useEffect(() => {
        if (enrichmentMode) return;
        const controller = new AbortController();
        fetchData(controller.signal);
        return () => controller.abort();
    }, [fetchData, enrichmentMode]);

    // Load parroquia list for filter dropdown — AbortController prevents stale response from overwriting state
    useEffect(() => {
        const controller = new AbortController();
        getEntidadParroquias()
            .then((res) => {
                if (controller.signal.aborted) return;
                const data = Array.isArray(res) ? res : res?.data;
                if (Array.isArray(data)) setParroquias(data);
            })
            .catch(() => {});
        return () => controller.abort();
    }, []);

    // Load ordinario/especial list for filter dropdown — AbortController prevents stale response from overwriting state
    useEffect(() => {
        const controller = new AbortController();
        getEntidadOrdinarioEspecialList()
            .then((res) => {
                if (controller.signal.aborted) return;
                const data = Array.isArray(res) ? res : res?.data;
                if (Array.isArray(data)) setOrdinarioEspecialList(data);
            })
            .catch(() => {});
        return () => controller.abort();
    }, []);

    // ─── ENRICHMENT ──────────────────────────────────────────
    const loadNextEnrichment = useCallback(async (search?: string) => {
        setEnrichmentLoading(true);
        try {
            if (search) {
                const result = await listEntidades({ search, pending_enrichment: true, page: 1, limit: 1 });
                if (result.data.length > 0) {
                    const entidad = result.data[0];
                    setEnrichmentEntity(entidad);
                    const counts = await listEntidades({ pending_enrichment: true, page: 1, limit: 1 });
                    setEnrichmentPending(counts.pagination.total);
                    setEnrichmentCompleted(0);
                    setEnrichTieneMaquina(entidad.tiene_maquina_fiscal || "");
                    setEnrichTipoFacturacion(entidad.tipo_facturacion || "");
                    setEnrichAbiertoCerrado(entidad.abierto_cerrado || "");
                    setEnrichFechaCenso(entidad.fecha_censo || "");
                    setEnrichGrupo(entidad.grupo || "");
                    setEnrichOrdinarioEspecial(entidad.ordinario_especial || "");
                    setEnrichSistemaHomologado(entidad.sistema_homologado || "");
                    setEnrichBoletaComparecencia(entidad.boleta_comparecencia || "");
                    setEnrichTipoComparecencia(entidad.tipo_comparecencia || "");
                    setEnrichObservaciones(entidad.observacion || "");
                    setEnrichCorreo(entidad.correo || "");
                    setEnrichTelefono(entidad.telefono || "");
                } else {
                    setEnrichmentEntity(null);
                    toast("No se encontraron entidades pendientes con ese criterio");
                }
            } else {
                const result = await getNextEnrichmentEntity();
                setEnrichmentEntity(result.data);
                setEnrichmentPending(result.total_pending);
                setEnrichmentCompleted(result.completed);
                setEnrichTieneMaquina(result.data?.tiene_maquina_fiscal || "");
                setEnrichTipoFacturacion(result.data?.tipo_facturacion || "");
                setEnrichAbiertoCerrado(result.data?.abierto_cerrado || "");
                setEnrichFechaCenso(result.data?.fecha_censo || "");
                setEnrichGrupo(result.data?.grupo || "");
                setEnrichOrdinarioEspecial(result.data?.ordinario_especial || "");
                setEnrichSistemaHomologado(result.data?.sistema_homologado || "");
                setEnrichBoletaComparecencia(result.data?.boleta_comparecencia || "");
                setEnrichTipoComparecencia(result.data?.tipo_comparecencia || "");
                setEnrichObservaciones(result.data?.observacion || "");
                setEnrichCorreo(result.data?.correo || "");
                setEnrichTelefono(result.data?.telefono || "");
            }
        } catch (error: any) {
            if (error?.name === "Cancel" || error?.message === "canceled") return;
            toast.error(extractMessage(error, "Error al cargar entidad"));
        } finally {
            setEnrichmentLoading(false);
        }
    }, []);

    useEffect(() => {
        if (enrichmentMode) {
            // Solo cargar contadores, NO auto-cargar entidad
            const fetchCounts = async () => {
                try {
                    const counts = await listEntidades({ pending_enrichment: true, page: 1, limit: 1 });
                    setEnrichmentPending(counts.pagination.total);
                    setEnrichmentCompleted(0);
                } catch {}
            };
            fetchCounts();
            setEnrichmentEntity(null);
            setEnrichmentSearch("");
        }
    }, [enrichmentMode]);

    const handleEnrichmentSave = async () => {
        if (!enrichmentEntity) return;
        setEnrichmentSaving(true);
        try {
            await updateEnrichmentFields(enrichmentEntity.id, {
                tiene_maquina_fiscal: enrichTieneMaquina,
                tipo_facturacion: enrichTipoFacturacion,
                abierto_cerrado: enrichAbiertoCerrado,
                fecha_censo: enrichFechaCenso,
                grupo: enrichGrupo,
                ordinario_especial: enrichOrdinarioEspecial,
                sistema_homologado: enrichSistemaHomologado,
                boleta_comparecencia: enrichBoletaComparecencia,
                tipo_comparecencia: enrichTipoComparecencia,
                observacion: enrichObservaciones,
                correo: enrichCorreo,
                telefono: enrichTelefono,
            });
            toast.success("Guardado ✓");
            await loadNextEnrichment();
        } catch (error) {
            toast.error(extractMessage(error, "Error al guardar"));
        } finally {
            setEnrichmentSaving(false);
        }
    };

    // ─── CRUD ────────────────────────────────────────────────
    const handleCreate = async () => {
        if (!formData.rif || !formData.razon_social) {
            toast.error("RIF y Razón Social son obligatorios");
            return;
        }
        setIsSubmitting(true);
        try {
            await createEntidad(formData);
            toast.success("Entidad creada correctamente");
            setCreateOpen(false);
            setFormData({ ...emptyForm });
            fetchData();
        } catch (error) {
            toast.error(extractMessage(error, "Error al crear entidad"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEdit = (entidad: Entidad) => {
        setEditingEntidad(entidad);
        setFormData({
            rif: entidad.rif,
            razon_social: entidad.razon_social,
            gerencia_dependencia: entidad.gerencia_dependencia || "",
            parroquia: entidad.parroquia || "",
            municipio: entidad.municipio || "",
            estado: entidad.estado || "",
            tipo_contribuyente: entidad.tipo_contribuyente || "",
            situacion: entidad.situacion || "",
            flag_rif_vencido: entidad.flag_rif_vencido || "",
            estado_rif: entidad.estado_rif || "",
            telefono: entidad.telefono || "",
            actividad_economica: entidad.actividad_economica || "",
            correo: entidad.correo || "",
            observacion: entidad.observacion || "",
            tiene_maquina_fiscal: entidad.tiene_maquina_fiscal || "",
            tipo_facturacion: entidad.tipo_facturacion || "",
            abierto_cerrado: entidad.abierto_cerrado || "",
            fecha_censo: entidad.fecha_censo || "",
            grupo: entidad.grupo || "",
            ordinario_especial: entidad.ordinario_especial || "",
            sistema_homologado: entidad.sistema_homologado || "",
            boleta_comparecencia: entidad.boleta_comparecencia || "",
            tipo_comparecencia: entidad.tipo_comparecencia || "",
        });
        setEditOpen(true);
    };

    const handleEdit = async () => {
        if (!editingEntidad) return;
        setIsSubmitting(true);
        try {
            await updateEntidad(editingEntidad.id, formData);
            toast.success("Entidad actualizada correctamente");
            setEditOpen(false);
            setEditingEntidad(null);
            fetchData();
        } catch (error) {
            toast.error(extractMessage(error, "Error al actualizar entidad"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingEntidad) return;
        setIsSubmitting(true);
        try {
            await deleteEntidad(deletingEntidad.id);
            toast.success("Entidad eliminada correctamente");
            setDeleteOpen(false);
            setDeletingEntidad(null);
            fetchData();
        } catch (error) {
            toast.error(extractMessage(error, "Error al eliminar entidad"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        try {
            const result = await importEntidadesXlsx(file);
            toast.success(
                `Importados: ${result.data.imported} de ${result.data.totalRows} filas` +
                (result.data.errors.length > 0 ? ` (${result.data.errors.length} errores)` : "")
            );
            fetchData();
        } catch (error) {
            toast.error(extractMessage(error, "Error al importar archivo"));
        } finally {
            setIsImporting(false);
            e.target.value = "";
        }
    };

    const handleExport = async () => {
        try {
            await exportEntidadesXlsx({
                parroquia: filterParroquia && filterParroquia !== "all" ? filterParroquia : undefined,
                municipio: filterMunicipio && filterMunicipio !== "all" ? filterMunicipio : undefined,
                estado: filterEstado && filterEstado !== "all" ? filterEstado : undefined,
                situacion: filterSituacion && filterSituacion !== "all" ? filterSituacion : undefined,
                grupo: filterGrupo && filterGrupo !== "all" ? filterGrupo : undefined,
            });
            toast.success("Archivo descargado correctamente");
        } catch (error) {
            toast.error(extractMessage(error, "Error al exportar"));
        }
    };

    // ─── RENDER ──────────────────────────────────────────────
    return (
        <div className="space-y-4">
            {/* ─── TOOLBAR ──────────────────────────────────── */}
            <motion.div {...fadeInSection(reducedMotion)} className="flex flex-col gap-3">
                {!enrichmentMode && (
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Buscar por RIF o razón social..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 sm:w-72 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500"
                            />
                        </div>

                        <Select value={filterParroquia} onValueChange={setFilterParroquia}>
                            <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-slate-200">
                                <SelectValue placeholder="Parroquia" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="all">Todas</SelectItem>
                                {parroquias.map((p) => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterGrupo} onValueChange={setFilterGrupo}>
                            <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-slate-200">
                                <SelectValue placeholder="Grupo" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="all">Todos</SelectItem>
                                {["GRUPO 1","GRUPO 2","GRUPO 3","GRUPO 4","GRUPO 5","GRUPO 6","GRUPO 7"].map(g => (
                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterMaquinaFiscal} onValueChange={setFilterMaquinaFiscal}>
                            <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-slate-200">
                                <SelectValue placeholder="Máq. Fiscal" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="Sí">Sí</SelectItem>
                                <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterTipoFacturacion} onValueChange={setFilterTipoFacturacion}>
                            <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-slate-200">
                                <SelectValue placeholder="Tipo Fact." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="IMPRESORA FISCAL">Impresora Fiscal</SelectItem>
                                <SelectItem value="REGISTRADORA">Registradora</SelectItem>
                                <SelectItem value="FORMA LIBRE">Forma Libre</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterAbiertoCerrado} onValueChange={setFilterAbiertoCerrado}>
                            <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-slate-200">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="ABIERTO">Abierto</SelectItem>
                                <SelectItem value="CERRADO">Cerrado</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterOrdinarioEspecial} onValueChange={setFilterOrdinarioEspecial}>
                            <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-slate-200">
                                <SelectValue placeholder="Ord./Esp." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="all">Todos</SelectItem>
                                {ordinarioEspecialList.map((v) => (
                                    <SelectItem key={v} value={v}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <input
                            type="date"
                            value={filterFechaDesde}
                            onChange={(e) => setFilterFechaDesde(e.target.value)}
                            placeholder="Desde"
                            className="w-36 bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-3 py-2 text-sm"
                        />
                        <input
                            type="date"
                            value={filterFechaHasta}
                            onChange={(e) => setFilterFechaHasta(e.target.value)}
                            placeholder="Hasta"
                            className="w-36 bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-3 py-2 text-sm"
                        />
                    </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                    {enrichmentMode ? (
                        <>
                            <span className="text-sm text-slate-400">
                                {enrichmentCompleted} completados · {enrichmentPending} pendientes
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-700 text-slate-300 hover:bg-slate-700"
                                onClick={() => {
                                    setEnrichmentMode(false);
                                    setEnrichmentEntity(null);
                                    setEnrichmentSearch("");
                                    fetchData();
                                }}
                            >
                                Salir del modo Actualizar
                            </Button>
                        </>
                    ) : (
                        <>
                            <label>
                                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={isImporting} />
                                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-700" disabled={isImporting} asChild>
                                    <span>
                                        {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                        Importar
                                    </span>
                                </Button>
                            </label>
                            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-700" onClick={handleExport}>
                                <Download className="mr-2 h-4 w-4" />
                                Exportar
                            </Button>
                            <Button variant="outline" size="sm" className="border-amber-600/50 text-amber-400 hover:bg-amber-900/30" onClick={() => setEnrichmentMode(true)}>
                                <Zap className="mr-2 h-4 w-4" />
                                Actualizar
                            </Button>
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { setFormData({ ...emptyForm }); setCreateOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva Entidad
                            </Button>
                        </>
                    )}
                </div>
            </motion.div>

            {/* ─── ENRICHMENT MODE ─────────────────────────── */}
            {enrichmentMode ? (
                <motion.div {...fadeInSection(reducedMotion)} className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
                    {/* Search bar */}
                    <div className="mb-4">
                        <div className="flex gap-2 max-w-md">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Buscar por RIF o razón social..."
                                    value={enrichmentSearch}
                                    onChange={(e) => setEnrichmentSearch(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); loadNextEnrichment(enrichmentSearch || undefined); } }}
                                    className="w-full pl-9 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500"
                                />
                            </div>
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0" onClick={() => loadNextEnrichment(enrichmentSearch || undefined)}>
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {enrichmentLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                        </div>
                    ) : !enrichmentEntity ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <CheckCircle2 className="h-12 w-12 text-green-400 mb-3" />
                            <h3 className="text-lg font-semibold text-slate-200">¡Completado!</h3>
                            <p className="text-slate-400 mt-1">Todas las entidades tienen sus campos completados.</p>
                            <p className="text-slate-500 text-sm mt-2">Total procesados: {enrichmentCompleted}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* LEFT: Entity Info + Quick Controls */}
                            <div className="space-y-4">
                                {/* Entity Card */}
                                <motion.div {...fadeInSection(reducedMotion)} className="rounded-lg bg-slate-900/50 border border-slate-700 p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">RIF</p>
                                            <p className="text-lg font-mono font-bold text-slate-100">{enrichmentEntity.rif}</p>
                                        </div>
                                        <Badge variant="outline" className={enrichmentEntity.estado_rif?.toUpperCase() === "VIGENTE" ? "border-green-600/50 text-green-400" : "border-slate-600 text-slate-400"}>
                                            {enrichmentEntity.estado_rif || "Sin estado"}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-slate-300 mt-2">{enrichmentEntity.razon_social}</p>
                                    {enrichmentEntity.gerencia_dependencia && <p className="text-xs text-slate-500 mt-1">{enrichmentEntity.gerencia_dependencia}</p>}
                                </motion.div>

                                {/* Quick Controls */}
                                <motion.div {...staggerContainer(reducedMotion)} className="grid grid-cols-2 gap-3">
                                    {/* 1. Abierto / Cerrado */}
                                    <motion.div {...staggerItem(reducedMotion)} className="space-y-1">
                                        <Label className="text-slate-400 text-xs">Abierto / Cerrado</Label>
                                        <div className="flex gap-1">
                                            <Button variant={enrichAbiertoCerrado === "ABIERTO" ? "default" : "outline"} size="sm" className={`flex-1 text-xs h-8 ${enrichAbiertoCerrado === "ABIERTO" ? "bg-green-600 hover:bg-green-700" : "border-slate-700 text-slate-300"}`} onClick={() => setEnrichAbiertoCerrado("ABIERTO")}>Abierto</Button>
                                            <Button variant={enrichAbiertoCerrado === "CERRADO" ? "default" : "outline"} size="sm" className={`flex-1 text-xs h-8 ${enrichAbiertoCerrado === "CERRADO" ? "bg-red-600 hover:bg-red-700" : "border-slate-700 text-slate-300"}`} onClick={() => setEnrichAbiertoCerrado("CERRADO")}>Cerrado</Button>
                                        </div>
                                    </motion.div>

                                    {/* 2. Ordinario / Especial */}
                                    <motion.div {...staggerItem(reducedMotion)} className="space-y-1">
                                        <Label className="text-slate-400 text-xs">Ordinario / Especial</Label>
                                        <div className="flex gap-1">
                                            <Button variant={enrichOrdinarioEspecial === "ORDINARIO" ? "default" : "outline"} size="sm" className={`flex-1 text-xs h-8 ${enrichOrdinarioEspecial === "ORDINARIO" ? "bg-green-600 hover:bg-green-700" : "border-slate-700 text-slate-300"}`} onClick={() => setEnrichOrdinarioEspecial("ORDINARIO")}>Ordinario</Button>
                                            <Button variant={enrichOrdinarioEspecial === "ESPECIAL" ? "default" : "outline"} size="sm" className={`flex-1 text-xs h-8 ${enrichOrdinarioEspecial === "ESPECIAL" ? "bg-purple-600 hover:bg-purple-700" : "border-slate-700 text-slate-300"}`} onClick={() => setEnrichOrdinarioEspecial("ESPECIAL")}>Especial</Button>
                                        </div>
                                    </motion.div>

                                    {/* 3. ¿Máquina Fiscal? → auto-setea tipo_facturacion */}
                                    <motion.div {...staggerItem(reducedMotion)} className="space-y-1">
                                        <Label className="text-slate-400 text-xs">¿Máquina Fiscal?</Label>
                                        <div className="flex gap-1">
                                            <Button variant={enrichTieneMaquina === "Sí" ? "default" : "outline"} size="sm" className={`flex-1 text-xs h-8 ${enrichTieneMaquina === "Sí" ? "bg-green-600 hover:bg-green-700" : "border-slate-700 text-slate-300"}`} onClick={() => { setEnrichTieneMaquina("Sí"); setEnrichTipoFacturacion("IMPRESORA FISCAL"); }}>Sí</Button>
                                            <Button variant={enrichTieneMaquina === "No" ? "default" : "outline"} size="sm" className={`flex-1 text-xs h-8 ${enrichTieneMaquina === "No" ? "bg-red-600 hover:bg-red-700" : "border-slate-700 text-slate-300"}`} onClick={() => { setEnrichTieneMaquina("No"); setEnrichTipoFacturacion(""); }}>No</Button>
                                        </div>
                                    </motion.div>

                                    {/* 4. Tipo Facturación — solo si NO tiene máquina fiscal */}
                                    {enrichTieneMaquina === "No" && (
                                        <motion.div {...staggerItem(reducedMotion)} className="space-y-1">
                                            <Label className="text-slate-400 text-xs">Tipo Facturación</Label>
                                            <div className="flex flex-wrap gap-1">

                                                <Button variant={enrichTipoFacturacion === "REGISTRADORA" ? "default" : "outline"} size="sm" className={`text-xs h-8 ${enrichTipoFacturacion === "REGISTRADORA" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-700 text-slate-300"}`} onClick={() => setEnrichTipoFacturacion("REGISTRADORA")}>Registradora</Button>
                                                <Button variant={enrichTipoFacturacion === "FACTURACIÓN DIGITAL" ? "default" : "outline"} size="sm" className={`text-xs h-8 ${enrichTipoFacturacion === "FACTURACIÓN DIGITAL" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-700 text-slate-300"}`} onClick={() => setEnrichTipoFacturacion("FACTURACIÓN DIGITAL")}>Digital</Button>
                                                <Button variant={enrichTipoFacturacion === "FORMA LIBRE" ? "default" : "outline"} size="sm" className={`text-xs h-8 ${enrichTipoFacturacion === "FORMA LIBRE" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-700 text-slate-300"}`} onClick={() => setEnrichTipoFacturacion("FORMA LIBRE")}>Forma Libre</Button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 5. Sistema Homologado — solo si tipo = FORMA LIBRE */}
                                    {enrichTipoFacturacion === "FORMA LIBRE" && (
                                        <motion.div {...staggerItem(reducedMotion)} className="space-y-1">
                                            <Label className="text-slate-400 text-xs">¿Sistema Homologado?</Label>
                                            <div className="flex gap-1">
                                                <Button variant={enrichSistemaHomologado === "Sí" ? "default" : "outline"} size="sm" className={`flex-1 text-xs h-8 ${enrichSistemaHomologado === "Sí" ? "bg-green-600 hover:bg-green-700" : "border-slate-700 text-slate-300"}`} onClick={() => setEnrichSistemaHomologado("Sí")}>Sí</Button>
                                                <Button variant={enrichSistemaHomologado === "No" ? "default" : "outline"} size="sm" className={`flex-1 text-xs h-8 ${enrichSistemaHomologado === "No" ? "bg-red-600 hover:bg-red-700" : "border-slate-700 text-slate-300"}`} onClick={() => setEnrichSistemaHomologado("No")}>No</Button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 6. Boleta Comparecencia */}
                                    <motion.div {...staggerItem(reducedMotion)} className="space-y-1">
                                        <Label className="text-slate-400 text-xs">Boleta Comparecencia</Label>
                                        <div className="flex gap-1">
                                            <Button variant={enrichBoletaComparecencia === "SÍ" ? "default" : "outline"} size="sm" className={`flex-1 text-xs h-8 ${enrichBoletaComparecencia === "SÍ" ? "bg-green-600 hover:bg-green-700" : "border-slate-700 text-slate-300"}`} onClick={() => { setEnrichBoletaComparecencia("SÍ"); if (!enrichTipoComparecencia) setEnrichTipoComparecencia("CORREO"); }}>Sí</Button>
                                            <Button variant={enrichBoletaComparecencia === "NO" ? "default" : "outline"} size="sm" className={`flex-1 text-xs h-8 ${enrichBoletaComparecencia === "NO" ? "bg-red-600 hover:bg-red-700" : "border-slate-700 text-slate-300"}`} onClick={() => { setEnrichBoletaComparecencia("NO"); setEnrichTipoComparecencia(""); }}>No</Button>
                                        </div>
                                    </motion.div>

                                    {/* 7. Tipo Comparecencia — solo si boleta = SÍ */}
                                    {enrichBoletaComparecencia === "SÍ" && (
                                        <motion.div {...staggerItem(reducedMotion)} className="space-y-1">
                                            <Label className="text-slate-400 text-xs">Tipo Comparecencia</Label>
                                            <div className="flex gap-1">
                                                <Button variant={enrichTipoComparecencia === "CORREO" ? "default" : "outline"} size="sm" className={`flex-1 text-xs h-8 ${enrichTipoComparecencia === "CORREO" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-700 text-slate-300"}`} onClick={() => setEnrichTipoComparecencia("CORREO")}>Correo</Button>
                                                <Button variant={enrichTipoComparecencia === "PRESENCIAL" ? "default" : "outline"} size="sm" className={`flex-1 text-xs h-8 ${enrichTipoComparecencia === "PRESENCIAL" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-700 text-slate-300"}`} onClick={() => setEnrichTipoComparecencia("PRESENCIAL")}>Presencial</Button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 8. Grupo */}
                                    <motion.div {...staggerItem(reducedMotion)} className="space-y-1">
                                        <Label className="text-slate-400 text-xs">Grupo</Label>
                                        <Select value={enrichGrupo} onValueChange={setEnrichGrupo}>
                                            <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200 h-8 text-xs"><SelectValue placeholder="..." /></SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700">
                                                {["GRUPO 1","GRUPO 2","GRUPO 3","GRUPO 4","GRUPO 5","GRUPO 6","GRUPO 7"].map(g => (
                                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </motion.div>

                                    {/* 9. Fecha Notificado */}
                                    <motion.div {...staggerItem(reducedMotion)} className="space-y-1">
                                        <Label className="text-slate-400 text-xs">Fecha Notificado</Label>
                                        <Input type="date" value={enrichFechaCenso} onChange={(e) => setEnrichFechaCenso(e.target.value)} className="bg-slate-900 border-slate-700 text-slate-200 h-8 text-xs" />
                                    </motion.div>
                                </motion.div>
                            </div>

                            {/* RIGHT: Contact + Notes */}
                            <motion.div {...staggerContainer(reducedMotion)} className="space-y-4">
                                <motion.div {...staggerItem(reducedMotion)} className="space-y-1.5">
                                    <Label className="text-slate-400 text-xs">Teléfono</Label>
                                    <Input value={enrichTelefono} onChange={(e) => setEnrichTelefono(e.target.value)} placeholder="Teléfono..." className="bg-slate-900 border-slate-700 text-slate-200 text-sm" />
                                </motion.div>
                                <motion.div {...staggerItem(reducedMotion)} className="space-y-1.5">
                                    <Label className="text-slate-400 text-xs">Correo</Label>
                                    <Input value={enrichCorreo} onChange={(e) => setEnrichCorreo(e.target.value)} placeholder="Correo..." className="bg-slate-900 border-slate-700 text-slate-200 text-sm" />
                                </motion.div>
                                <motion.div {...staggerItem(reducedMotion)} className="space-y-1.5">
                                    <Label className="text-slate-400 text-xs">Observaciones</Label>
                                    <Textarea value={enrichObservaciones} onChange={(e) => setEnrichObservaciones(e.target.value)} rows={6} placeholder="Notas..." className="bg-slate-900 border-slate-700 text-slate-200 text-sm resize-none" />
                                </motion.div>
                            </motion.div>
                        </div>
                    )}

                    {/* Save Button */}
                    {!enrichmentLoading && enrichmentEntity && (
                        <motion.div {...fadeInSection(reducedMotion)} className="mt-6">
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11" onClick={handleEnrichmentSave} disabled={enrichmentSaving}>
                                {enrichmentSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                                Guardar y Siguiente
                            </Button>
                        </motion.div>
                    )}
                </motion.div>
            ) : (
                <>
                    {/* ─── TABLE ────────────────────────────────── */}
                    <div className="rounded-lg border border-slate-700 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
                                    <TableHead className="text-slate-400 text-xs">RIF</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Razón Social</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Parroquia</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Grupo</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Ord/Esp</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Máq. Fiscal</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Tipo Fact.</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Estado</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Boleta</TableHead>
                                    <TableHead className="text-slate-400 text-xs w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i} className="border-slate-700/50">
                                            {Array.from({ length: 10 }).map((_, j) => (
                                                <TableCell key={j} className="py-3"><div className="h-4 w-full rounded bg-slate-700/50 animate-pulse" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : entidades.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                                            <FileSpreadsheet className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                            No se encontraron entidades
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    entidades.map((e) => (
                                        <TableRow key={e.id} className="border-slate-700/50 hover:bg-slate-800/30">
                                            <TableCell className="text-slate-200 font-mono text-sm">{e.rif}</TableCell>
                                            <TableCell className="text-slate-200 max-w-[180px] truncate">{e.razon_social}</TableCell>
                                            <TableCell className="text-slate-400 text-sm">{e.parroquia || "—"}</TableCell>
                                            <TableCell className="text-slate-400 text-sm">{e.grupo || "—"}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={e.ordinario_especial === "ESPECIAL" ? "border-amber-600/50 text-amber-400" : "border-slate-600 text-slate-400"}>
                                                    {e.ordinario_especial || "—"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={e.tiene_maquina_fiscal === "Sí" ? "border-green-600/50 text-green-400" : e.tiene_maquina_fiscal === "No" ? "border-red-600/50 text-red-400" : "border-slate-600 text-slate-400"}>
                                                    {e.tiene_maquina_fiscal || "—"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-400 text-sm">{e.tipo_facturacion || "—"}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={e.abierto_cerrado === "ABIERTO" ? "border-green-600/50 text-green-400" : e.abierto_cerrado === "CERRADO" ? "border-red-600/50 text-red-400" : "border-slate-600 text-slate-400"}>
                                                    {e.abierto_cerrado || "—"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={e.boleta_comparecencia === "SÍ" ? "border-blue-600/50 text-blue-400" : "border-slate-600 text-slate-400"}>
                                                    {e.boleta_comparecencia || "—"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                                        <DropdownMenuItem onClick={() => openEdit(e)} className="text-slate-300 hover:bg-slate-700 cursor-pointer">
                                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => { setDeletingEntidad(e); setDeleteOpen(true); }} className="text-red-400 hover:bg-slate-700 cursor-pointer">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* ─── PAGINATION ───────────────────────────────── */}
                    <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>Mostrando {entidades.length} de {total} entidades</span>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span>Página {page} de {totalPages}</span>
                            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* ─── CREATE DIALOG ────────────────────────────── */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-slate-200 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nueva Entidad</DialogTitle>
                        <DialogDescription className="text-slate-400">Complete los datos para registrar una nueva entidad.</DialogDescription>
                    </DialogHeader>
                    <EntityForm data={formData} onChange={setFormData} />
                    <DialogFooter>
                        <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => setCreateOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleCreate} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Crear
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── EDIT DIALOG ──────────────────────────────── */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-slate-200 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Entidad</DialogTitle>
                        <DialogDescription className="text-slate-400">Modifique los datos de la entidad.</DialogDescription>
                    </DialogHeader>
                    <EntityForm data={formData} onChange={setFormData} />
                    <DialogFooter>
                        <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => setEditOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleEdit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── DELETE DIALOG ────────────────────────────── */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-slate-200">
                    <DialogHeader>
                        <DialogTitle>Eliminar Entidad</DialogTitle>
                        <DialogDescription className="text-slate-400">¿Está seguro que desea eliminar esta entidad?</DialogDescription>
                    </DialogHeader>
                    {deletingEntidad && (
                        <div className="rounded-lg bg-slate-900/50 p-3 text-sm">
                            <p><span className="text-slate-500">RIF:</span> <span className="text-slate-200 font-mono">{deletingEntidad.rif}</span></p>
                            <p><span className="text-slate-500">Razón Social:</span> <span className="text-slate-200">{deletingEntidad.razon_social}</span></p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => setDeleteOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── ENTITY FORM SUBCOMPONENT ───────────────────────────────
function EntityForm({ data, onChange }: { data: CreateEntidadPayload; onChange: (data: CreateEntidadPayload) => void }) {
    const update = (field: keyof CreateEntidadPayload, value: string) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <Label className="text-slate-400">RIF *</Label>
                <Input value={data.rif} onChange={(e) => update("rif", e.target.value)} placeholder="Ej: J-12345678-9" className="bg-slate-900 border-slate-700 text-slate-200" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Razón Social *</Label>
                <Input value={data.razon_social} onChange={(e) => update("razon_social", e.target.value)} placeholder="Nombre de la empresa" className="bg-slate-900 border-slate-700 text-slate-200" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Gerencia / Dependencia</Label>
                <Input value={data.gerencia_dependencia || ""} onChange={(e) => update("gerencia_dependencia", e.target.value)} className="bg-slate-900 border-slate-700 text-slate-200" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Parroquia</Label>
                <Input value={data.parroquia || ""} onChange={(e) => update("parroquia", e.target.value)} className="bg-slate-900 border-slate-700 text-slate-200" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Municipio</Label>
                <Input value={data.municipio || ""} onChange={(e) => update("municipio", e.target.value)} className="bg-slate-900 border-slate-700 text-slate-200" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Estado</Label>
                <Input value={data.estado || ""} onChange={(e) => update("estado", e.target.value)} className="bg-slate-900 border-slate-700 text-slate-200" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Tipo Contribuyente</Label>
                <Input value={data.tipo_contribuyente || ""} onChange={(e) => update("tipo_contribuyente", e.target.value)} className="bg-slate-900 border-slate-700 text-slate-200" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Situación</Label>
                <Input value={data.situacion || ""} onChange={(e) => update("situacion", e.target.value)} className="bg-slate-900 border-slate-700 text-slate-200" />
            </div>

            {/* Enrichment Fields */}
            <div className="sm:col-span-2 border-t border-slate-700 pt-4 mt-2">
                <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Campos de Enriquecimiento</p>
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">¿Máquina Fiscal?</Label>
                <Select value={data.tiene_maquina_fiscal || ""} onValueChange={(v) => update("tiene_maquina_fiscal", v)}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200"><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="Sí">Sí</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Tipo Facturación</Label>
                <Select value={data.tipo_facturacion || ""} onValueChange={(v) => update("tipo_facturacion", v)}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200"><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="IMPRESORA FISCAL">Impresora Fiscal</SelectItem>
                        <SelectItem value="REGISTRADORA">Registradora</SelectItem>
                        <SelectItem value="FORMA LIBRE">Forma Libre</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {data.tipo_facturacion === "FORMA LIBRE" && (
                <div className="space-y-1.5">
                    <Label className="text-slate-400">¿Sistema Homologado?</Label>
                    <Select value={data.sistema_homologado || ""} onValueChange={(v) => update("sistema_homologado", v)}>
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200"><SelectValue placeholder="..." /></SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="Sí">Sí</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
            <div className="space-y-1.5">
                <Label className="text-slate-400">Ordinario / Especial</Label>
                <Select value={data.ordinario_especial || ""} onValueChange={(v) => update("ordinario_especial", v)}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200"><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="ORDINARIO">Ordinario</SelectItem>
                        <SelectItem value="ESPECIAL">Especial</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Boleta Comparecencia</Label>
                <Select value={data.boleta_comparecencia || ""} onValueChange={(v) => update("boleta_comparecencia", v)}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200"><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="SÍ">Sí</SelectItem>
                        <SelectItem value="NO">No</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {data.boleta_comparecencia === "SÍ" && (
                <div className="space-y-1.5">
                    <Label className="text-slate-400">Tipo Comparecencia</Label>
                    <Select value={data.tipo_comparecencia || ""} onValueChange={(v) => update("tipo_comparecencia", v)}>
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200"><SelectValue placeholder="..." /></SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="CORREO">Correo</SelectItem>
                            <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
            <div className="space-y-1.5">
                <Label className="text-slate-400">Abierto / Cerrado</Label>
                <Select value={data.abierto_cerrado || ""} onValueChange={(v) => update("abierto_cerrado", v)}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200"><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="ABIERTO">Abierto</SelectItem>
                        <SelectItem value="CERRADO">Cerrado</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Grupo</Label>
                <Select value={data.grupo || ""} onValueChange={(v) => update("grupo", v)}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200"><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                        {["GRUPO 1","GRUPO 2","GRUPO 3","GRUPO 4","GRUPO 5","GRUPO 6","GRUPO 7"].map(g => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Fecha Notificado</Label>
                <Input type="date" value={data.fecha_censo || ""} onChange={(e) => update("fecha_censo", e.target.value)} className="bg-slate-900 border-slate-700 text-slate-200" />
            </div>

            {/* Contact & Notes */}
            <div className="space-y-1.5">
                <Label className="text-slate-400">Teléfono</Label>
                <Input value={data.telefono || ""} onChange={(e) => update("telefono", e.target.value)} className="bg-slate-900 border-slate-700 text-slate-200" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Correo</Label>
                <Input value={data.correo || ""} onChange={(e) => update("correo", e.target.value)} placeholder="correo@ejemplo.com" className="bg-slate-900 border-slate-700 text-slate-200" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-slate-400">Observación</Label>
                <Textarea value={data.observacion || ""} onChange={(e) => update("observacion", e.target.value)} rows={3} className="bg-slate-900 border-slate-700 text-slate-200 resize-none" />
            </div>
        </div>
    );
}
