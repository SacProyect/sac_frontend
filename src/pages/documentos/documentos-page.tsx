import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/UI/v2";
import { Button } from "@/components/UI/button";
import { Input } from "@/components/UI/input";
import { Card, CardContent } from "@/components/UI/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/UI/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/UI/tabs";
import { Badge } from "@/components/UI/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/UI/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/UI/dialog";
import { Skeleton } from "@/components/UI/skeleton";
import {
  listDocuments,
  deleteDocument,
  downloadDocument,
  changeDocumentScope,
  listFiscalGroups,
  listAdminUnits,
  listDocumentCategories,
  shareDocumentWithPrincipal,
  revokeDocumentAccess,
  formatFileSize,
  getScopeLabel,
  getFileIcon,
  type ListDocumentsQuery,
} from "@/components/utils/api/documentos-functions";
import type { 
  DocumentItem, 
  DocumentScope, 
  DocumentTab, 
  FiscalGroupInfo, 
  AdminUnitInfo,
  DocumentCategoryInfo 
} from "@/types/documents";
import { 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  FileText, 
  Share2, 
  X, 
  Users, 
  Building2, 
  ShieldCheck,
  Tag,
  Lock,
  Info,
  Filter
} from "lucide-react";
import toast from "react-hot-toast";

const TAB_LABELS: Record<string, string> = {
  mine: "Mis documentos",
  shared: "Compartidos conmigo",
  all: "Todos los compartidos",
};

const SCOPE_BADGE_CLASSES: Record<string, string> = {
  PRIVATE: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  SHARED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

export default function DocumentosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = (searchParams.get("tab") as DocumentTab) || "mine";

  const role = user?.role ?? "";

  // Determinar tabs según rol
  const tabs = useMemo(() => {
    if (role === "ADMIN") {
      return ["mine", "shared", "all"] as DocumentTab[];
    }
    return ["mine", "shared"] as DocumentTab[];
  }, [role]);

  // Asegurar que el tab actual sea válido
  const currentTab = tabs.includes(tabParam) ? tabParam : (tabs[0] ?? "mine");

  // Estados
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Master Data
  const [categories, setCategories] = useState<DocumentCategoryInfo[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  // Modal de detalle
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Modal de compartir
  const [shareOpen, setShareOpen] = useState(false);
  const [fiscalGroups, setFiscalGroups] = useState<FiscalGroupInfo[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [adminUnits, setAdminUnits] = useState<AdminUnitInfo[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const fetchDocuments = useCallback(
    async (overrideTab?: DocumentTab) => {
      try {
        setLoading(true);
        setError("");
        const query: ListDocumentsQuery = {
          tab: overrideTab ?? currentTab,
          page,
          pageSize,
        };
        if (q.trim()) query.q = q.trim();
        if (categoryId !== "all") query.categoryId = categoryId;
        if (desde) query.desde = desde;
        if (hasta) query.hasta = hasta;

        const result = await listDocuments(query);
        setItems(Array.isArray(result.items) ? result.items : []);
        setTotal(typeof result.total === "number" ? result.total : 0);
      } catch (e: any) {
        setError(e?.message ?? "No se pudieron cargar los documentos.");
      } finally {
        setLoading(false);
      }
    },
    [currentTab, page, pageSize, q, categoryId, desde, hasta],
  );

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Cargar categorías una sola vez
  useEffect(() => {
    setLoadingCats(true);
    listDocumentCategories()
      .then(res => setCategories(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments();
  };

  const clearFilters = () => {
    setQ("");
    setCategoryId("all");
    setDesde("");
    setHasta("");
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este documento?")) return;
    try {
      setBusy(id);
      await deleteDocument(id);
      toast.success("Documento eliminado");
      setDetailOpen(false);
      fetchDocuments();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo eliminar.");
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const result = await downloadDocument(id);
      if (result?.data?.url) {
        window.open(result.data.url, "_blank");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo descargar.");
    }
  };

  const handleChangeScope = async (id: string, scope: DocumentScope) => {
    try {
      setBusy(`scope-${id}`);
      await changeDocumentScope(id, scope);
      toast.success("Visibilidad actualizada");
      setDetailOpen(false);
      fetchDocuments();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo actualizar.");
    } finally {
      setBusy(null);
    }
  };

  // Abrir modal de compartir
  const openShareModal = async (doc: DocumentItem) => {
    setSelectedDoc(doc);
    
    // Grupos seleccionados (legacy + new)
    const currentGroupIds = new Set(doc.sharedWith?.map((s) => s.fiscalGroup.id) ?? []);
    doc.accessRecords?.filter(r => r.principalType === "FISCAL_GROUP").forEach(r => currentGroupIds.add(r.principalId));
    setSelectedGroups(Array.from(currentGroupIds));

    // Unidades seleccionadas
    setSelectedUnits(doc.accessRecords?.filter(r => r.principalType === "ADMIN_UNIT").map(r => r.principalId) ?? []);
    
    setShareOpen(true);

    if (fiscalGroups.length === 0) {
      setLoadingGroups(true);
      listFiscalGroups()
        .then((res) => setFiscalGroups(res.data ?? []))
        .catch(() => {})
        .finally(() => setLoadingGroups(false));
    }

    if (adminUnits.length === 0) {
      setLoadingUnits(true);
      listAdminUnits()
        .then((res) => setAdminUnits(res.data ?? []))
        .catch(() => {})
        .finally(() => setLoadingUnits(false));
    }
  };

  // Guardar cambios de compartición
  const handleSaveShare = async () => {
    if (!selectedDoc) return;
    try {
      setBusy(`share-${selectedDoc.id}`);

      // Manejar Coordinaciones
      const currentGroupIds = new Set(selectedDoc.sharedWith?.map((s) => s.fiscalGroup.id) ?? []);
      selectedDoc.accessRecords?.filter(r => r.principalType === "FISCAL_GROUP").forEach(r => currentGroupIds.add(r.principalId));
      
      const groupsToAdd = selectedGroups.filter(id => !currentGroupIds.has(id));
      const groupsToRemove = Array.from(currentGroupIds).filter(id => !selectedGroups.includes(id));

      for (const id of groupsToAdd) {
        await shareDocumentWithPrincipal(selectedDoc.id, { principalType: "FISCAL_GROUP", principalId: id });
      }
      for (const id of groupsToRemove) {
        await revokeDocumentAccess(selectedDoc.id, "FISCAL_GROUP", id);
      }

      // Manejar Unidades Administrativas
      const currentUnitIds = selectedDoc.accessRecords?.filter(r => r.principalType === "ADMIN_UNIT").map(r => r.principalId) ?? [];
      const unitsToAdd = selectedUnits.filter(id => !currentUnitIds.includes(id));
      const unitsToRemove = currentUnitIds.filter(id => !selectedUnits.includes(id));

      for (const id of unitsToAdd) {
        await shareDocumentWithPrincipal(selectedDoc.id, { principalType: "ADMIN_UNIT", principalId: id });
      }
      for (const id of unitsToRemove) {
        await revokeDocumentAccess(selectedDoc.id, "ADMIN_UNIT", id);
      }

      toast.success("Compartición actualizada");
      setShareOpen(false);
      setDetailOpen(false);
      fetchDocuments();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al actualizar compartición");
    } finally {
      setBusy(null);
    }
  };

  const getMimeLabel = (mime: string): string => {
    if (mime.includes("pdf")) return "PDF";
    if (mime.includes("word") || mime.includes("document")) return "DOCX";
    if (mime.includes("excel") || mime.includes("spreadsheet")) return "XLSX";
    if (mime.includes("image")) return "IMG";
    if (mime.includes("text")) return "TXT";
    return "FILE";
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <PageHeader
        title="Documentos"
        description="Administración de archivos y permisos"
        action={
          <Button 
            className="rounded-xl shadow-lg shadow-indigo-500/20" 
            onClick={() => navigate("/documentos/subir")}
          >
            <Upload className="w-4 h-4 mr-2" />
            Subir nuevo
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4">
        {/* Barra superior: Tabs + Búsqueda + Filtros */}
        <Card className="rounded-2xl border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col lg:flex-row gap-4 justify-between">
            <Tabs 
              value={currentTab} 
              onValueChange={(v) => setSearchParams({ tab: v })}
              className="w-fit"
            >
              <TabsList className="bg-muted/50 p-1 rounded-xl">
                {tabs.map((t) => (
                  <TabsTrigger 
                    key={t} 
                    value={t} 
                    className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    {TAB_LABELS[t]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <form onSubmit={handleSearch} className="flex flex-wrap gap-2 items-center">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9 bg-muted/30 border-none rounded-xl"
                />
              </div>

              <div className="w-[180px]">
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="bg-muted/30 border-none rounded-xl">
                    <div className="flex items-center gap-2 truncate">
                      <Filter className="w-3 h-3 text-muted-foreground" />
                      <SelectValue placeholder="Categoría" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" variant="secondary" className="rounded-xl">
                Buscar
              </Button>
              {(q || categoryId !== "all" || desde || hasta) && (
                <Button type="button" variant="ghost" onClick={clearFilters} className="rounded-xl" title="Limpiar filtros">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Tabla de Resultados */}
        <Card className="rounded-2xl border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            {loading && items.length === 0 ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-20 text-center space-y-3">
                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground">No se encontraron documentos</h3>
                <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">
                  {q ? "Prueba con otros términos de búsqueda." : "Los documentos compartidos aparecerán aquí."}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="py-4">Nombre</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Visibilidad</TableHead>
                        <TableHead>Tamaño</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Propietario</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((doc) => (
                        <TableRow 
                          key={doc.id} 
                          className="cursor-pointer hover:bg-muted/20 border-border/40 transition-colors"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setDetailOpen(true);
                          }}
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-lg shrink-0">{getFileIcon(doc.mimeType)}</span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium truncate max-w-[200px]">{doc.name}</p>
                                  {doc.isSensitive && <Lock className="w-3 h-3 text-rose-400" title="Contenido Sensible" />}
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate max-w-[200px] font-mono">{doc.originalName}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {doc.category ? (
                              <Badge variant="outline" className="text-[10px] border-indigo-500/20 text-indigo-300 bg-indigo-500/5">
                                {doc.category.name}
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/40 italic">Sin categoría</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className={`${SCOPE_BADGE_CLASSES[doc.scope]} text-[10px] px-2`}>
                                {getScopeLabel(doc.scope)}
                              </Badge>
                              {doc.jefaOnly && (
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" title="Jefa Only" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground tabular-nums">
                            {formatFileSize(doc.fileSize)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs font-medium truncate max-w-[120px]">
                            {doc.owner?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg"
                                onClick={() => handleDownload(doc.id)}
                              >
                                <Download className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                              {doc.ownerId === user?.id && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() => openShareModal(doc)}
                                  >
                                    <Share2 className="h-4 w-4 text-muted-foreground hover:text-indigo-400" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg hover:bg-rose-500/10"
                                    onClick={() => handleDelete(doc.id)}
                                    disabled={busy === doc.id}
                                  >
                                    <Trash2 className="h-4 w-4 text-rose-400/70 hover:text-rose-400" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {total > pageSize && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 text-xs border-t border-border/40 bg-muted/10">
                    <span className="text-muted-foreground">
                      Página {page} de {totalPages} · {total} documentos
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="h-8 rounded-lg"
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page * pageSize >= total}
                        onClick={() => setPage((p) => p + 1)}
                        className="h-8 rounded-lg"
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalle */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-none shadow-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedDoc ? getFileIcon(selectedDoc.mimeType) : ""}</span>
              <span className="truncate pr-4">{selectedDoc?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs font-mono break-all opacity-60">
              {selectedDoc?.originalName}
            </DialogDescription>
          </DialogHeader>

          {selectedDoc && (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-2">
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" /> Categoría
                  </p>
                  <p className="text-xs font-semibold text-indigo-300">
                    {selectedDoc.category?.name ?? "Sin categoría"}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Visibilidad</p>
                  <Badge variant="outline" className={`${SCOPE_BADGE_CLASSES[selectedDoc.scope]} text-[9px] py-0`}>
                    {getScopeLabel(selectedDoc.scope)}
                  </Badge>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Tamaño</p>
                  <p className="text-xs font-medium tabular-nums">{formatFileSize(selectedDoc.fileSize)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Fecha</p>
                  <p className="text-xs font-medium tabular-nums">{new Date(selectedDoc.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Propietario</p>
                  <p className="text-xs font-medium truncate">{selectedDoc.owner?.name ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Seguridad</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDoc.jefaOnly && (
                      <Badge className="bg-indigo-500/10 text-indigo-400 border-none text-[8px] h-4">JEFA</Badge>
                    )}
                    {selectedDoc.isSensitive && (
                      <Badge className="bg-rose-500/10 text-rose-400 border-none text-[8px] h-4">SENSIBLE</Badge>
                    )}
                    {!selectedDoc.jefaOnly && !selectedDoc.isSensitive && (
                      <span className="text-xs text-muted-foreground/30">—</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedDoc.description && (
                <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/20">
                   <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                    <Info className="w-2.5 h-2.5" /> Descripción
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedDoc.description}
                  </p>
                </div>
              )}

              <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/40">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Compartido con</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDoc.sharedWith?.map((sw) => (
                    <Badge key={sw.fiscalGroup.id} variant="secondary" className="text-[9px] border-emerald-500/10 bg-emerald-500/5 text-emerald-400 py-0">
                      <Users className="w-2 h-2 mr-1" />
                      {sw.fiscalGroup.name}
                    </Badge>
                  ))}
                  {selectedDoc.accessRecords?.filter(r => r.principalType === "ADMIN_UNIT").map((r) => (
                    <Badge key={r.id} variant="secondary" className="text-[9px] border-indigo-500/10 bg-indigo-500/5 text-indigo-400 py-0">
                      <Building2 className="w-2 h-2 mr-1" />
                      Unidad Administrativa
                    </Badge>
                  ))}
                  {!selectedDoc.sharedWith?.length && !selectedDoc.accessRecords?.length && (
                    <p className="text-xs text-muted-foreground/50 italic">No compartido aún</p>
                  )}
                </div>
              </div>

              {/* Acciones de gestión */}
              {selectedDoc.ownerId === user?.id && (
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Gestión de acceso</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDoc.scope === "SHARED" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-[10px] h-7"
                        onClick={() => handleChangeScope(selectedDoc.id, "PRIVATE")}
                        disabled={busy === `scope-${selectedDoc.id}`}
                      >
                        Hacer Privado
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-lg text-[10px] h-7 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                        onClick={() => {
                          setDetailOpen(false);
                          openShareModal(selectedDoc);
                        }}
                      >
                        <Share2 className="w-3 h-3 mr-1" />
                        Compartir...
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between border-t border-border/40 pt-4 mt-2">
            <Button
              variant="default"
              className="rounded-xl flex-1 sm:flex-none shadow-lg shadow-indigo-500/20"
              onClick={() => selectedDoc && handleDownload(selectedDoc.id)}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
            {selectedDoc && selectedDoc.ownerId === user?.id && (
              <Button
                variant="ghost"
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl"
                onClick={() => handleDelete(selectedDoc.id)}
                disabled={busy === selectedDoc?.id}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Compartir */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-xl rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-400">
              <Share2 className="w-5 h-5" />
              Compartir documento
            </DialogTitle>
            <DialogDescription>
              Gestiona los permisos de acceso para este documento
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Coordinaciones */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Users className="w-4 h-4" />
                <h4 className="text-[10px] font-bold uppercase tracking-wider">Coordinaciones</h4>
              </div>
              
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {loadingGroups ? (
                  <Skeleton className="h-20 w-full rounded-xl" />
                ) : fiscalGroups.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No hay grupos</p>
                ) : (
                  fiscalGroups.map((fg) => (
                    <label
                      key={fg.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer
                        ${selectedGroups.includes(fg.id) ? "border-emerald-500/40 bg-emerald-500/5" : "border-transparent hover:bg-muted/30"}`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-muted bg-transparent text-emerald-500 focus:ring-emerald-500"
                        checked={selectedGroups.includes(fg.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedGroups([...selectedGroups, fg.id]);
                          else setSelectedGroups(selectedGroups.filter(id => id !== fg.id));
                        }}
                      />
                      <span className="text-xs font-medium">{fg.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Unidades Administrativas */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Building2 className="w-4 h-4" />
                <h4 className="text-[10px] font-bold uppercase tracking-wider">U. Administrativas</h4>
              </div>
              
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {loadingUnits ? (
                  <Skeleton className="h-20 w-full rounded-xl" />
                ) : adminUnits.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No hay unidades</p>
                ) : (
                  adminUnits.map((au) => (
                    <label
                      key={au.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer
                        ${selectedUnits.includes(au.id) ? "border-indigo-500/40 bg-indigo-500/5" : "border-transparent hover:bg-muted/30"}`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-muted bg-transparent text-indigo-500 focus:ring-indigo-500"
                        checked={selectedUnits.includes(au.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedUnits([...selectedUnits, au.id]);
                          else setSelectedUnits(selectedUnits.filter(id => id !== au.id));
                        }}
                      />
                      <span className="text-xs font-medium">{au.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-border/40 pt-4">
            <Button variant="ghost" onClick={() => setShareOpen(false)} disabled={busy !== null} className="rounded-xl px-6">
              Cancelar
            </Button>
            <Button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 min-w-[120px]"
              onClick={handleSaveShare}
              disabled={busy !== null}
            >
              {busy ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
