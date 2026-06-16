import { useState, useEffect, useCallback } from "react";
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

    // Enrichment search
    const [enrichmentSearch, setEnrichmentSearch] = useState("");

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

            const result = await listEntidades(filters, signal);
            setEntidades(result.data);
            setTotal(result.pagination.total);
            setTotalPages(result.pagination.totalPages);
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            toast.error(extractMessage(error, "Error al cargar entidades"));
        } finally {
            if (!signal?.aborted) setIsLoading(false);
        }
    }, [page, limit, debouncedSearch, filterParroquia, filterMunicipio, filterEstado, filterSituacion]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, filterParroquia, filterMunicipio, filterEstado, filterSituacion]);

    // Fetch data with cancellation
    useEffect(() => {
        if (enrichmentMode) return; // Don't fetch table when in enrichment mode
        const controller = new AbortController();
        fetchData(controller.signal);
        return () => controller.abort();
    }, [fetchData, enrichmentMode]);

    // ─── ENRICHMENT: Load next entity ─────────────────────────
    const loadNextEnrichment = useCallback(async (search?: string) => {
        setEnrichmentLoading(true);
        try {
            // If search is provided, use the list endpoint with search filter
            if (search) {
                const result = await listEntidades({ search, pending_enrichment: true, page: 1, limit: 1 });
                if (result.data.length > 0) {
                    const entidad = result.data[0];
                    setEnrichmentEntity(entidad);
                    // Count pending from all (not filtered)
                    const counts = await listEntidades({ pending_enrichment: true, page: 1, limit: 1 });
                    setEnrichmentPending(counts.pagination.total);
                    setEnrichmentCompleted(0); // We don't know exact count in search mode
                    setEnrichTieneMaquina(entidad.tiene_maquina_fiscal || "");
                    setEnrichTipoFacturacion(entidad.tipo_facturacion || "");
                    setEnrichAbiertoCerrado(entidad.abierto_cerrado || "");
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
            }
        } catch (error) {
            toast.error(extractMessage(error, "Error al cargar entidad"));
        } finally {
            setEnrichmentLoading(false);
        }
    }, []);

    // Don't auto-load when entering enrichment mode — user must click "Buscar"

    // Manual search — only triggered by button click

    // ─── ENRICHMENT: Save and advance ─────────────────────────
    const handleEnrichmentSave = async () => {
        if (!enrichmentEntity) return;
        setEnrichmentSaving(true);
        try {
            await updateEnrichmentFields(enrichmentEntity.id, {
                tiene_maquina_fiscal: enrichTieneMaquina,
                tipo_facturacion: enrichTipoFacturacion,
                abierto_cerrado: enrichAbiertoCerrado,
            });
            toast.success("Guardado ✓");
            await loadNextEnrichment();
        } catch (error) {
            toast.error(extractMessage(error, "Error al guardar"));
        } finally {
            setEnrichmentSaving(false);
        }
    };

    // ─── CREATE ──────────────────────────────────────────────
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

    // ─── EDIT ────────────────────────────────────────────────
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

    // ─── DELETE ──────────────────────────────────────────────
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

    // ─── IMPORT ──────────────────────────────────────────────
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

    // ─── EXPORT ──────────────────────────────────────────────
    const handleExport = async () => {
        try {
            await exportEntidadesXlsx({
                parroquia: filterParroquia && filterParroquia !== "all" ? filterParroquia : undefined,
                municipio: filterMunicipio && filterMunicipio !== "all" ? filterMunicipio : undefined,
                estado: filterEstado && filterEstado !== "all" ? filterEstado : undefined,
                situacion: filterSituacion && filterSituacion !== "all" ? filterSituacion : undefined,
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    {!enrichmentMode && (
                        <>
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
                                <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-slate-200">
                                    <SelectValue placeholder="Parroquia" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="all">Todas</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filterEstado} onValueChange={setFilterEstado}>
                                <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-slate-200">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="all">Todos</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filterSituacion} onValueChange={setFilterSituacion}>
                                <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-slate-200">
                                    <SelectValue placeholder="Situación" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="all">Todas</SelectItem>
                                </SelectContent>
                            </Select>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
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
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    className="hidden"
                                    onChange={handleImport}
                                    disabled={isImporting}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-700 text-slate-300 hover:bg-slate-700"
                                    disabled={isImporting}
                                    asChild
                                >
                                    <span>
                                        {isImporting ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Upload className="mr-2 h-4 w-4" />
                                        )}
                                        Importar
                                    </span>
                                </Button>
                            </label>

                            <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-700 text-slate-300 hover:bg-slate-700"
                                onClick={handleExport}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Exportar
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="border-amber-600/50 text-amber-400 hover:bg-amber-900/30"
                                onClick={() => setEnrichmentMode(true)}
                            >
                                <Zap className="mr-2 h-4 w-4" />
                                Actualizar
                            </Button>

                            <Button
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={() => {
                                    setFormData({ ...emptyForm });
                                    setCreateOpen(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva Entidad
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* ─── ENRICHMENT MODE ─────────────────────────── */}
            {enrichmentMode ? (
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
                    {/* Search bar in enrichment mode */}
                    <div className="mb-4">
                        <div className="flex gap-2 max-w-md">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Buscar por RIF o razón social..."
                                    value={enrichmentSearch}
                                    onChange={(e) => setEnrichmentSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            loadNextEnrichment(enrichmentSearch || undefined);
                                        }
                                    }}
                                    className="w-full pl-9 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500"
                                />
                            </div>
                            <Button
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                                onClick={() => loadNextEnrichment(enrichmentSearch || undefined)}
                            >
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
                            <p className="text-slate-400 mt-1">
                                Todas las entidades tienen sus campos de enriquecimiento completados.
                            </p>
                            <p className="text-slate-500 text-sm mt-2">
                                Total procesados: {enrichmentCompleted}
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto space-y-6">
                            {/* Entity Info Card */}
                            <div className="rounded-lg bg-slate-900/50 border border-slate-700 p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">RIF</p>
                                        <p className="text-lg font-mono font-bold text-slate-100">{enrichmentEntity.rif}</p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={
                                            enrichmentEntity.estado_rif?.toUpperCase() === "VIGENTE"
                                                ? "border-green-600/50 text-green-400"
                                                : "border-slate-600 text-slate-400"
                                        }
                                    >
                                        {enrichmentEntity.estado_rif || "Sin estado"}
                                    </Badge>
                                </div>
                                <p className="text-sm text-slate-300 mt-2">{enrichmentEntity.razon_social}</p>
                                {enrichmentEntity.gerencia_dependencia && (
                                    <p className="text-xs text-slate-500 mt-1">{enrichmentEntity.gerencia_dependencia}</p>
                                )}
                            </div>

                            {/* Quick Select Controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Tiene Máquina Fiscal */}
                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-sm">¿Tiene Máquina Fiscal?</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={enrichTieneMaquina === "Sí" ? "default" : "outline"}
                                            size="sm"
                                            className={`flex-1 ${
                                                enrichTieneMaquina === "Sí"
                                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                                    : "border-slate-700 text-slate-300 hover:bg-slate-700"
                                            }`}
                                            onClick={() => setEnrichTieneMaquina("Sí")}
                                        >
                                            Sí
                                        </Button>
                                        <Button
                                            variant={enrichTieneMaquina === "No" ? "default" : "outline"}
                                            size="sm"
                                            className={`flex-1 ${
                                                enrichTieneMaquina === "No"
                                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                                    : "border-slate-700 text-slate-300 hover:bg-slate-700"
                                            }`}
                                            onClick={() => setEnrichTieneMaquina("No")}
                                        >
                                            No
                                        </Button>
                                    </div>
                                </div>

                                {/* Tipo Facturación */}
                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-sm">Tipo Facturación</Label>
                                    <Select value={enrichTipoFacturacion} onValueChange={setEnrichTipoFacturacion}>
                                        <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700">
                                            <SelectItem value="MAQUINA FISCAL">Máquina Fiscal</SelectItem>
                                            <SelectItem value="PROVEEDOR">Proveedor</SelectItem>
                                            <SelectItem value="NINGUNO">Ninguno</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Abierto / Cerrado */}
                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-sm">Estado</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={enrichAbiertoCerrado === "ABIERTO" ? "default" : "outline"}
                                            size="sm"
                                            className={`flex-1 ${
                                                enrichAbiertoCerrado === "ABIERTO"
                                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                                    : "border-slate-700 text-slate-300 hover:bg-slate-700"
                                            }`}
                                            onClick={() => setEnrichAbiertoCerrado("ABIERTO")}
                                        >
                                            Abierto
                                        </Button>
                                        <Button
                                            variant={enrichAbiertoCerrado === "CERRADO" ? "default" : "outline"}
                                            size="sm"
                                            className={`flex-1 ${
                                                enrichAbiertoCerrado === "CERRADO"
                                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                                    : "border-slate-700 text-slate-300 hover:bg-slate-700"
                                            }`}
                                            onClick={() => setEnrichAbiertoCerrado("CERRADO")}
                                        >
                                            Cerrado
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Save & Next Button */}
                            <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11"
                                onClick={handleEnrichmentSave}
                                disabled={enrichmentSaving || !enrichTieneMaquina || !enrichTipoFacturacion || !enrichAbiertoCerrado}
                            >
                                {enrichmentSaving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                )}
                                Guardar y Siguiente
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* ─── TABLE ────────────────────────────────── */}
                    <div className="rounded-lg border border-slate-700 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
                                    <TableHead className="text-slate-400 text-xs">RIF</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Razón Social</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Gerencia</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Parroquia</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Municipio</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Estado</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Situación</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Estado RIF</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Máq. Fiscal</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Tipo Fact.</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Estado</TableHead>
                                    <TableHead className="text-slate-400 text-xs w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i} className="border-slate-700/50">
                                            {Array.from({ length: 12 }).map((_, j) => (
                                                <TableCell key={j} className="py-3">
                                                    <div className="h-4 w-full rounded bg-slate-700/50 animate-pulse" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : entidades.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={12} className="text-center py-8 text-slate-500">
                                            <FileSpreadsheet className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                            No se encontraron entidades
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    entidades.map((e) => (
                                        <TableRow
                                            key={e.id}
                                            className="border-slate-700/50 hover:bg-slate-800/30"
                                        >
                                            <TableCell className="text-slate-200 font-mono text-sm">
                                                {e.rif}
                                            </TableCell>
                                            <TableCell className="text-slate-200 max-w-[200px] truncate">
                                                {e.razon_social}
                                            </TableCell>
                                            <TableCell className="text-slate-400 text-sm max-w-[150px] truncate">
                                                {e.gerencia_dependencia || "—"}
                                            </TableCell>
                                            <TableCell className="text-slate-400 text-sm">
                                                {e.parroquia || "—"}
                                            </TableCell>
                                            <TableCell className="text-slate-400 text-sm">
                                                {e.municipio || "—"}
                                            </TableCell>
                                            <TableCell className="text-slate-400 text-sm">
                                                {e.estado || "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        e.situacion?.toLowerCase().includes("activo")
                                                            ? "border-green-600/50 text-green-400"
                                                            : e.situacion?.toLowerCase().includes("inactivo")
                                                            ? "border-red-600/50 text-red-400"
                                                            : "border-slate-600 text-slate-400"
                                                    }
                                                >
                                                    {e.situacion || "—"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        e.estado_rif?.toUpperCase() === "VIGENTE"
                                                            ? "border-green-600/50 text-green-400"
                                                            : e.estado_rif?.toUpperCase()?.includes("VENC")
                                                            ? "border-red-600/50 text-red-400"
                                                            : "border-slate-600 text-slate-400"
                                                    }
                                                >
                                                    {e.estado_rif || "—"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        e.tiene_maquina_fiscal === "Sí"
                                                            ? "border-green-600/50 text-green-400"
                                                            : e.tiene_maquina_fiscal === "No"
                                                            ? "border-red-600/50 text-red-400"
                                                            : "border-slate-600 text-slate-400"
                                                    }
                                                >
                                                    {e.tiene_maquina_fiscal || "—"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-400 text-sm">
                                                {e.tipo_facturacion || "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        e.abierto_cerrado === "ABIERTO"
                                                            ? "border-green-600/50 text-green-400"
                                                            : e.abierto_cerrado === "CERRADO"
                                                            ? "border-red-600/50 text-red-400"
                                                            : "border-slate-600 text-slate-400"
                                                    }
                                                >
                                                    {e.abierto_cerrado || "—"}
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
                                                        <DropdownMenuItem
                                                            onClick={() => openEdit(e)}
                                                            className="text-slate-300 hover:bg-slate-700 cursor-pointer"
                                                        >
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setDeletingEntidad(e);
                                                                setDeleteOpen(true);
                                                            }}
                                                            className="text-red-400 hover:bg-slate-700 cursor-pointer"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Eliminar
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
                        <span>
                            Mostrando {entidades.length} de {total} entidades
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-700 text-slate-300"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span>
                                Página {page} de {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-700 text-slate-300"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            >
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
                        <DialogDescription className="text-slate-400">
                            Complete los datos para registrar una nueva entidad.
                        </DialogDescription>
                    </DialogHeader>
                    <EntityForm
                        data={formData}
                        onChange={setFormData}
                    />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="border-slate-700 text-slate-300"
                            onClick={() => setCreateOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={handleCreate}
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── EDIT DIALOG ──────────────────────────────── */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-slate-200 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Entidad</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Modifique los datos de la entidad.
                        </DialogDescription>
                    </DialogHeader>
                    <EntityForm
                        data={formData}
                        onChange={setFormData}
                    />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="border-slate-700 text-slate-300"
                            onClick={() => setEditOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={handleEdit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── DELETE DIALOG ────────────────────────────── */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-slate-200">
                    <DialogHeader>
                        <DialogTitle>Eliminar Entidad</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            ¿Está seguro que desea eliminar esta entidad? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    {deletingEntidad && (
                        <div className="rounded-lg bg-slate-900/50 p-3 text-sm">
                            <p><span className="text-slate-500">RIF:</span> <span className="text-slate-200 font-mono">{deletingEntidad.rif}</span></p>
                            <p><span className="text-slate-500">Razón Social:</span> <span className="text-slate-200">{deletingEntidad.razon_social}</span></p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="border-slate-700 text-slate-300"
                            onClick={() => setDeleteOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── ENTITY FORM SUBCOMPONENT ───────────────────────────────
function EntityForm({
    data,
    onChange,
}: {
    data: CreateEntidadPayload;
    onChange: (data: CreateEntidadPayload) => void;
}) {
    const update = (field: keyof CreateEntidadPayload, value: string) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <Label className="text-slate-400">RIF *</Label>
                <Input
                    value={data.rif}
                    onChange={(e) => update("rif", e.target.value)}
                    placeholder="Ej: J-12345678-9"
                    className="bg-slate-900 border-slate-700 text-slate-200"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Razón Social *</Label>
                <Input
                    value={data.razon_social}
                    onChange={(e) => update("razon_social", e.target.value)}
                    placeholder="Nombre de la empresa"
                    className="bg-slate-900 border-slate-700 text-slate-200"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Gerencia / Dependencia</Label>
                <Input
                    value={data.gerencia_dependencia || ""}
                    onChange={(e) => update("gerencia_dependencia", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-200"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Parroquia</Label>
                <Input
                    value={data.parroquia || ""}
                    onChange={(e) => update("parroquia", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-200"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Municipio</Label>
                <Input
                    value={data.municipio || ""}
                    onChange={(e) => update("municipio", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-200"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Estado</Label>
                <Input
                    value={data.estado || ""}
                    onChange={(e) => update("estado", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-200"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Tipo Contribuyente</Label>
                <Input
                    value={data.tipo_contribuyente || ""}
                    onChange={(e) => update("tipo_contribuyente", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-200"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Situación</Label>
                <Input
                    value={data.situacion || ""}
                    onChange={(e) => update("situacion", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-200"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Flag RIF Vencido</Label>
                <Input
                    value={data.flag_rif_vencido || ""}
                    onChange={(e) => update("flag_rif_vencido", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-200"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Estado RIF</Label>
                <Input
                    value={data.estado_rif || ""}
                    onChange={(e) => update("estado_rif", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-200"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Teléfono</Label>
                <Input
                    value={data.telefono || ""}
                    onChange={(e) => update("telefono", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-200"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Actividad Económica</Label>
                <Input
                    value={data.actividad_economica || ""}
                    onChange={(e) => update("actividad_economica", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-200"
                />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-slate-400">Correo</Label>
                <Input
                    value={data.correo || ""}
                    onChange={(e) => update("correo", e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="bg-slate-900 border-slate-700 text-slate-200"
                />
            </div>

            {/* ─── NEW ENRICHMENT FIELDS ────────────────────── */}
            <div className="sm:col-span-2 border-t border-slate-700 pt-4 mt-2">
                <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Campos de Enriquecimiento</p>
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">¿Tiene Máquina Fiscal?</Label>
                <Select value={data.tiene_maquina_fiscal || ""} onValueChange={(v) => update("tiene_maquina_fiscal", v)}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                        <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="Sí">Sí</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Tipo Facturación</Label>
                <Select value={data.tipo_facturacion || ""} onValueChange={(v) => update("tipo_facturacion", v)}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                        <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="MAQUINA FISCAL">Máquina Fiscal</SelectItem>
                        <SelectItem value="PROVEEDOR">Proveedor</SelectItem>
                        <SelectItem value="NINGUNO">Ninguno</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Estado</Label>
                <Select value={data.abierto_cerrado || ""} onValueChange={(v) => update("abierto_cerrado", v)}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                        <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="ABIERTO">Abierto</SelectItem>
                        <SelectItem value="CERRADO">Cerrado</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-slate-400">Observación</Label>
                <Textarea
                    value={data.observacion || ""}
                    onChange={(e) => update("observacion", e.target.value)}
                    rows={3}
                    className="bg-slate-900 border-slate-700 text-slate-200 resize-none"
                />
            </div>
        </div>
    );
}
