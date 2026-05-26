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
  Filter,
  History,
  Eye,
  FileCode
} from "lucide-react";
import toast from "react-hot-toast";

const TAB_LABELS: Record<string, string> = {
  mine: "Expediente Personal",
  shared: "Recibidos / Archivo",
  all: "Registro Global",
};

const SCOPE_COLORS: Record<string, string> = {
  PRIVATE: "text-slate-400 bg-slate-500/5 border-slate-500/10",
  SHARED: "text-indigo-400 bg-indigo-500/5 border-indigo-500/10",
};
const getMimeLabel = (mime: string): string => {
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("word") || mime.includes("document")) return "DOCX";
  if (mime.includes("excel") || mime.includes("spreadsheet")) return "XLSX";
  if (mime.includes("image")) return "IMG";
  if (mime.includes("text")) return "TXT";
  return "BIN";
};


/**
 * Signature Component: DocumentSeal
 * Represents the official nature of the document with its status.
 */
function DocumentSeal({ doc }: { doc: DocumentItem }) {
  return (
    <div className="relative group/seal">
      <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-muted/20 border border-border/40 transition-all group-hover/seal:border-indigo-500/30 group-hover/seal:bg-muted/30">
        <span className="text-2xl grayscale group-hover/seal:grayscale-0 transition-all">{getFileIcon(doc.mimeType)}</span>
      </div>
      <div className="absolute -bottom-1 -right-1 flex gap-0.5">
        {doc.jefaOnly && (
          <div className="w-4 h-4 bg-indigo-600 rounded-full border-2 border-background flex items-center justify-center shadow-sm" title="Alta Gerencia">
            <ShieldCheck className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {doc.isSensitive && (
          <div className="w-4 h-4 bg-rose-600 rounded-full border-2 border-background flex items-center justify-center shadow-sm" title="Contenido Sensible">
            <Lock className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocumentosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = (searchParams.get("tab") as DocumentTab) || "mine";

  const role = user?.role ?? "";

  const tabs = useMemo(() => {
    if (role === "ADMIN") return ["mine", "shared", "all"] as DocumentTab[];
    return ["mine", "shared"] as DocumentTab[];
  }, [role]);

  const currentTab = tabs.includes(tabParam) ? tabParam : (tabs[0] ?? "mine");

  // Estados
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Master Data
  const [categories, setCategories] = useState<DocumentCategoryInfo[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  // Modales
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Compartición
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

        const result = await listDocuments(query);
        setItems(Array.isArray(result.items) ? result.items : []);
        setTotal(typeof result.total === "number" ? result.total : 0);
      } catch (e: any) {
        setError(e?.message ?? "Error en el servidor central.");
      } finally {
        setLoading(false);
      }
    },
    [currentTab, page, pageSize, q, categoryId],
  );

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("CONFIRMACIÓN: ¿Desea proceder con la eliminación lógica del registro?")) return;
    try {
      setBusy(id);
      await deleteDocument(id);
      toast.success("REGISTRO ELIMINADO");
      setDetailOpen(false);
      fetchDocuments();
    } catch (e: any) {
      toast.error("ERROR EN OPERACIÓN");
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
      toast.error("ACCESO DENEGADO");
    }
  };

  const handleChangeScope = async (id: string, scope: DocumentScope) => {
    try {
      setBusy(`scope-${id}`);
      await changeDocumentScope(id, scope);
      toast.success("ESTADO ACTUALIZADO");
      setDetailOpen(false);
      fetchDocuments();
    } catch (e: any) {
      toast.error("ERROR");
    } finally {
      setBusy(null);
    }
  };

  const openShareModal = async (doc: DocumentItem) => {
    setSelectedDoc(doc);
    const currentGroupIds = new Set(doc.sharedWith?.map((s) => s.fiscalGroup.id) ?? []);
    doc.accessRecords?.filter(r => r.principalType === "FISCAL_GROUP").forEach(r => currentGroupIds.add(r.principalId));
    setSelectedGroups(Array.from(currentGroupIds));
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

  const handleSaveShare = async () => {
    if (!selectedDoc) return;
    try {
      setBusy(`share-${selectedDoc.id}`);

      const currentGroupIds = new Set(selectedDoc.sharedWith?.map((s) => s.fiscalGroup.id) ?? []);
      selectedDoc.accessRecords?.filter(r => r.principalType === "FISCAL_GROUP").forEach(r => currentGroupIds.add(r.principalId));
      const groupsToAdd = selectedGroups.filter(id => !currentGroupIds.has(id));
      const groupsToRemove = Array.from(currentGroupIds).filter(id => !selectedGroups.includes(id));

      for (const id of groupsToAdd) await shareDocumentWithPrincipal(selectedDoc.id, { principalType: "FISCAL_GROUP", principalId: id });
      for (const id of groupsToRemove) await revokeDocumentAccess(selectedDoc.id, "FISCAL_GROUP", id);

      const currentUnitIds = selectedDoc.accessRecords?.filter(r => r.principalType === "ADMIN_UNIT").map(r => r.principalId) ?? [];
      const unitsToAdd = selectedUnits.filter(id => !currentUnitIds.includes(id));
      const unitsToRemove = currentUnitIds.filter(id => !selectedUnits.includes(id));

      for (const id of unitsToAdd) await shareDocumentWithPrincipal(selectedDoc.id, { principalType: "ADMIN_UNIT", principalId: id });
      for (const id of unitsToRemove) await revokeDocumentAccess(selectedDoc.id, "ADMIN_UNIT", id);

      toast.success("AUDITORÍA: ACCESOS ACTUALIZADOS");
      setShareOpen(false);
      setDetailOpen(false);
      fetchDocuments();
    } catch (e: any) {
      toast.error("FALLO EN ACTUALIZACIÓN");
    } finally {
      setBusy(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden pb-12">
      <PageHeader
        title="Gestión Documental"
        description="Custodia y trazabilidad de archivos fiscales"
        action={
          <Button 
            className="rounded-lg shadow-sm bg-indigo-600 hover:bg-indigo-500 font-bold uppercase text-[10px] tracking-widest h-10 px-6 border-none" 
            onClick={() => navigate("/documentos/subir")}
          >
            <Upload className="w-4 h-4 mr-2" />
            Nuevo Registro
          </Button>
        }
      />

      {/* Ledger Header: Filter and Navigation */}
      <div className="grid grid-cols-1 gap-2">
        <div className="flex flex-col lg:flex-row gap-0 justify-between items-stretch">
          <Tabs 
            value={currentTab} 
            onValueChange={(v) => setSearchParams({ tab: v })}
            className="flex-none"
          >
            <TabsList className="bg-muted/30 p-0 rounded-none border-b border-border/40 h-auto gap-0">
              {tabs.map((t) => (
                <TabsTrigger 
                  key={t} 
                  value={t} 
                  className="rounded-none px-6 py-3 data-[state=active]:bg-background data-[state=active]:border-t-2 data-[state=active]:border-indigo-500 text-[10px] font-black uppercase tracking-widest transition-none"
                >
                  {TAB_LABELS[t]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <form onSubmit={handleSearch} className="flex flex-wrap gap-0 items-center bg-muted/20 border-b border-border/40 px-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                placeholder="Identificador o nombre..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-8 bg-transparent border-none rounded-none h-11 text-xs focus-visible:ring-0 placeholder:text-[10px] placeholder:uppercase placeholder:tracking-wider placeholder:opacity-50 font-medium"
              />
            </div>

            <div className="w-[200px] border-l border-border/40">
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="bg-transparent border-none rounded-none h-11 text-[10px] font-black uppercase tracking-wider focus:ring-0">
                  <div className="flex items-center gap-2 truncate">
                    <Filter className="w-3 h-3 text-indigo-400" />
                    <SelectValue placeholder="Categoría" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-md border-border/60">
                  <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-wider">Todas las categorías</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-[10px] font-bold uppercase tracking-wider">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" variant="ghost" size="sm" className="h-11 px-6 rounded-none hover:bg-indigo-500/10 hover:text-indigo-400 font-black uppercase text-[10px] tracking-tighter border-l border-border/40">
              FILTRAR
            </Button>
            {q !== "" && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="h-11 w-11 rounded-none p-0 border-l border-border/40">
                <X className="w-3 h-3" />
              </Button>
            )}
          </form>
        </div>

        {/* Ledger Table: The main data grid */}
        <div className="bg-background border border-border/60 overflow-hidden shadow-sm">
          {loading && items.length === 0 ? (
            <div className="p-12 space-y-4 bg-muted/5">
              <Skeleton className="h-10 w-full rounded-sm opacity-20" />
              <Skeleton className="h-10 w-full rounded-sm opacity-20" />
              <Skeleton className="h-10 w-full rounded-sm opacity-20" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-24 text-center space-y-6 bg-muted/10">
              <div className="w-20 h-20 bg-muted/20 border-2 border-dashed border-border/60 rounded-full flex items-center justify-center mx-auto grayscale opacity-40">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">ARCHIVO VACÍO</h3>
                <p className="text-[10px] text-muted-foreground/40 font-medium italic">
                  No se registran documentos bajo los parámetros actuales.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="border-collapse">
                  <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent border-none border-b border-border/60 h-10">
                      <TableHead className="text-[9px] uppercase font-black tracking-widest pl-6 text-muted-foreground/60 w-[350px]">Identificación del Documento</TableHead>
                      <TableHead className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60 border-l border-border/20 px-4">Clasificación</TableHead>
                      <TableHead className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60 border-l border-border/20 px-4 text-center">Visibilidad</TableHead>
                      <TableHead className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60 border-l border-border/20 px-4">Custodio</TableHead>
                      <TableHead className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60 border-l border-border/20 px-4">Destinatarios</TableHead>
                      <TableHead className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60 border-l border-border/20 text-right pr-6">Comandos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((doc) => (
                      <TableRow 
                        key={doc.id} 
                        className="group cursor-pointer hover:bg-indigo-500/[0.02] border-none border-b border-border/20 transition-all h-16"
                        onClick={() => {
                          setSelectedDoc(doc);
                          setDetailOpen(true);
                        }}
                      >
                        <TableCell className="pl-6 py-2">
                          <div className="flex items-center gap-4">
                            <DocumentSeal doc={doc} />
                            <div className="min-w-0">
                              <p className="text-xs font-bold uppercase tracking-tight text-foreground/90 group-hover:text-indigo-400 transition-colors truncate max-w-[250px]">
                                {doc.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[9px] font-black tabular-nums text-muted-foreground/40 bg-muted/30 px-1 rounded-sm uppercase tracking-tighter">
                                  {getMimeLabel(doc.mimeType)}
                                </span>
                                <span className="text-[9px] font-medium tabular-nums text-muted-foreground/40">
                                  {formatFileSize(doc.fileSize)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="border-l border-border/10 px-4">
                          {doc.category ? (
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-3 bg-indigo-500/40 rounded-full" />
                              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                                {doc.category.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px] uppercase font-bold text-muted-foreground/20 italic">No clasificado</span>
                          )}
                        </TableCell>
                        <TableCell className="border-l border-border/10 px-4 text-center">
                          <Badge variant="outline" className={`${SCOPE_COLORS[doc.scope]} text-[8px] px-2 py-0 border font-black uppercase tracking-widest rounded-sm`}>
                            {getScopeLabel(doc.scope)}
                          </Badge>
                        </TableCell>
                        <TableCell className="border-l border-border/10 px-4">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase text-muted-foreground/70 truncate max-w-[120px]">{doc.owner?.name ?? "—"}</p>
                            <p className="text-[9px] font-medium tabular-nums text-muted-foreground/40 italic">{new Date(doc.createdAt).toLocaleDateString()}</p>
                          </div>
                        </TableCell>
                        <TableCell className="border-l border-border/10 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {doc.sharedWith?.slice(0, 2).map((sw) => (
                              <div key={sw.fiscalGroup.id} className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded-sm border border-emerald-500/10">
                                {sw.fiscalGroup.name}
                              </div>
                            ))}
                            {doc.accessRecords?.filter(r => r.principalType === "ADMIN_UNIT").slice(0, 1).map((r) => (
                              <div key={r.id} className="text-[8px] font-black uppercase text-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded-sm border border-indigo-500/10">
                                ADM
                              </div>
                            ))}
                            {(doc.sharedWith?.length || 0) + (doc.accessRecords?.filter(r => r.principalType === "ADMIN_UNIT").length || 0) > 2 && (
                              <span className="text-[9px] text-muted-foreground/30 font-black">+</span>
                            )}
                            {!doc.sharedWith?.length && !doc.accessRecords?.filter(r => r.principalType === "ADMIN_UNIT").length && (
                              <span className="text-[10px] font-black text-muted-foreground/10 tracking-widest">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="border-l border-border/10 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-indigo-500/10 hover:text-indigo-400 rounded-none border border-transparent hover:border-indigo-500/20"
                              onClick={() => handleDownload(doc.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {doc.ownerId === user?.id && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 hover:bg-indigo-500/10 hover:text-indigo-400 rounded-none border border-transparent hover:border-indigo-500/20"
                                  onClick={() => openShareModal(doc)}
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 hover:bg-rose-500/10 hover:text-rose-400 rounded-none border border-transparent hover:border-rose-500/20"
                                  onClick={() => handleDelete(doc.id)}
                                  disabled={busy === doc.id}
                                >
                                  <Trash2 className="h-4 w-4" />
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-border/40 bg-muted/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                    LIBRO: PÁGINA {page} DE {totalPages} · TOTAL {total} ENTRADAS
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="h-8 rounded-none px-4 text-[9px] font-black uppercase tracking-tighter border-border/60 hover:bg-muted"
                    >
                      ANTERIOR
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page * pageSize >= total}
                      onClick={() => setPage((p) => p + 1)}
                      className="h-8 rounded-none px-4 text-[9px] font-black uppercase tracking-tighter border-border/60 hover:bg-muted"
                    >
                      SIGUIENTE
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Ledger Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-xl rounded-none border-border/60 shadow-2xl bg-background p-0 overflow-hidden">
          <div className="bg-muted/40 px-8 py-6 border-b border-border/40 flex items-center gap-6">
             <div className="w-16 h-16 bg-background border border-border/60 rounded flex items-center justify-center text-4xl shadow-sm">
                {selectedDoc ? getFileIcon(selectedDoc.mimeType) : ""}
             </div>
             <div className="min-w-0">
                <h3 className="text-xl font-black uppercase tracking-tight text-foreground/90">{selectedDoc?.name}</h3>
                <p className="text-[10px] font-mono text-muted-foreground/50 mt-1 truncate">{selectedDoc?.originalName}</p>
             </div>
          </div>

          {selectedDoc && (
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-3 gap-y-8 gap-x-4 border-b border-border/20 pb-8">
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                    <Tag className="w-3 h-3 text-indigo-500" /> CATEGORÍA
                  </p>
                  <p className="text-xs font-bold text-foreground">
                    {selectedDoc.category?.name ?? "—"}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">VISIBILIDAD</p>
                  <Badge variant="outline" className={`${SCOPE_COLORS[selectedDoc.scope]} text-[8px] font-black py-0 px-2 rounded-sm uppercase`}>
                    {getScopeLabel(selectedDoc.scope)}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">TAMAÑO</p>
                  <p className="text-xs font-black tabular-nums">{formatFileSize(selectedDoc.fileSize)}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">FECHA REGISTRO</p>
                  <p className="text-xs font-black tabular-nums">{new Date(selectedDoc.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">CUSTODIO ACTUAL</p>
                  <p className="text-xs font-bold truncate text-foreground">{selectedDoc.owner?.name ?? "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">NIVEL SEGURIDAD</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoc.jefaOnly && (
                      <div className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-sm">DIVISIÓN</div>
                    )}
                    {selectedDoc.isSensitive && (
                      <div className="bg-rose-600 text-white text-[8px] font-black px-2 py-0.5 rounded-sm">SENSIBLE</div>
                    )}
                    {!selectedDoc.jefaOnly && !selectedDoc.isSensitive && (
                      <span className="text-[9px] font-black text-muted-foreground/20">ESTÁNDAR</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedDoc.description && (
                <div className="space-y-3 bg-muted/10 p-5 border border-border/20">
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-indigo-400" /> NOTA ADJUNTA AL REGISTRO
                  </p>
                  <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                    {selectedDoc.description}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">AUTORIZACIONES VIGENTES</p>
                   <div className="h-[1px] bg-border/20 flex-1 ml-4" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedDoc.sharedWith?.map((sw) => (
                    <div key={sw.fiscalGroup.id} className="text-[9px] font-black uppercase border border-emerald-500/30 bg-emerald-500/5 text-emerald-500 px-3 py-1 rounded-sm flex items-center gap-2">
                      <Users className="w-2.5 h-2.5" />
                      {sw.fiscalGroup.name}
                    </div>
                  ))}
                  {selectedDoc.accessRecords?.filter(r => r.principalType === "ADMIN_UNIT").map((r) => (
                    <div key={r.id} className="text-[9px] font-black uppercase border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 px-3 py-1 rounded-sm flex items-center gap-2">
                      <Building2 className="w-2.5 h-2.5" />
                      UNIDAD ADMINISTRATIVA
                    </div>
                  ))}
                  {!selectedDoc.sharedWith?.length && !selectedDoc.accessRecords?.filter(r => r.principalType === "ADMIN_UNIT").length && (
                    <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest italic py-2 pl-1">Sin destinatarios externos · Documento bajo custodia privada</p>
                  )}
                </div>
              </div>

              {/* Acciones del Propietario */}
              {selectedDoc.ownerId === user?.id && (
                <div className="pt-4 flex items-center gap-4">
                  <div className="flex-1 h-[1px] bg-border/20" />
                  <div className="flex gap-2">
                    {selectedDoc.scope === "SHARED" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-none text-[9px] font-black uppercase tracking-widest h-8 px-4 border-border/60 hover:bg-rose-500/5 hover:text-rose-400 hover:border-rose-400/30 transition-all"
                        onClick={() => handleChangeScope(selectedDoc.id, "PRIVATE")}
                        disabled={busy === `scope-${selectedDoc.id}`}
                      >
                        REVOCAR TODO ACCESO
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-none text-[9px] font-black uppercase tracking-widest h-8 px-4 bg-indigo-500/5 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/10 transition-all"
                        onClick={() => {
                          setDetailOpen(false);
                          openShareModal(selectedDoc);
                        }}
                      >
                        HABILITAR COMPARTICIÓN
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-8 bg-muted/20 border-t border-border/40 flex flex-col sm:flex-row gap-3">
            <Button
              className="rounded-none flex-1 font-black uppercase text-[10px] tracking-[0.2em] h-11 bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-indigo-500/20 shadow-md"
              onClick={() => selectedDoc && handleDownload(selectedDoc.id)}
            >
              <Download className="w-4 h-4 mr-3" />
              DESCARGAR DOCUMENTO
            </Button>
            {selectedDoc && selectedDoc.ownerId === user?.id && (
              <Button
                variant="ghost"
                className="rounded-none px-6 text-rose-400/60 hover:text-rose-400 font-black uppercase text-[10px] tracking-widest h-11"
                onClick={() => handleDelete(selectedDoc.id)}
                disabled={busy === selectedDoc?.id}
              >
                ELIMINAR REGISTRO
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Ledger Modal */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-2xl rounded-none border-border/60 shadow-2xl bg-background p-0 overflow-hidden">
           <div className="bg-indigo-600/5 px-8 py-6 border-b border-indigo-500/20 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-indigo-400">Libro de Autorizaciones</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1 opacity-70 flex items-center gap-2">
                   <Share2 className="w-3 h-3" /> CONTROL DE ACCESO EXTERNO
                </p>
              </div>
           </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="flex items-center gap-3 text-emerald-400 border-b border-emerald-500/10 pb-3">
                <Users className="w-5 h-5" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.15em]">Coordinaciones Fiscales</h4>
              </div>
              
              <div className="space-y-1 max-h-72 overflow-y-auto pr-3 custom-scrollbar">
                {loadingGroups ? (
                  <Skeleton className="h-32 w-full rounded-sm opacity-10" />
                ) : fiscalGroups.length === 0 ? (
                  <p className="text-[10px] font-bold text-muted-foreground/30 uppercase italic py-4">No se registran grupos de inspección</p>
                ) : (
                  fiscalGroups.map((fg) => (
                    <label
                      key={fg.id}
                      className={`flex items-center gap-4 p-3 border transition-all cursor-pointer rounded-sm
                        ${selectedGroups.includes(fg.id) ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/20 hover:bg-muted/40"}`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded-none border-border/60 bg-transparent text-emerald-500 focus:ring-0 cursor-pointer"
                        checked={selectedGroups.includes(fg.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedGroups([...selectedGroups, fg.id]);
                          else setSelectedGroups(selectedGroups.filter(id => id !== fg.id));
                        }}
                      />
                      <span className="text-[11px] font-black uppercase tracking-tight">{fg.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-5 border-l border-border/20 pl-8">
              <div className="flex items-center gap-3 text-indigo-400 border-b border-indigo-500/10 pb-3">
                <Building2 className="w-5 h-5" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.15em]">Unidades Administrativas</h4>
              </div>
              
              <div className="space-y-1 max-h-72 overflow-y-auto pr-3 custom-scrollbar">
                {loadingUnits ? (
                  <Skeleton className="h-32 w-full rounded-sm opacity-10" />
                ) : adminUnits.length === 0 ? (
                  <p className="text-[10px] font-bold text-muted-foreground/30 uppercase italic py-4">Sin dependencias administrativas</p>
                ) : (
                  adminUnits.map((au) => (
                    <label
                      key={au.id}
                      className={`flex items-center gap-4 p-3 border transition-all cursor-pointer rounded-sm
                        ${selectedUnits.includes(au.id) ? "border-indigo-500/30 bg-indigo-500/5" : "border-border/20 hover:bg-muted/40"}`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded-none border-border/60 bg-transparent text-indigo-500 focus:ring-0 cursor-pointer"
                        checked={selectedUnits.includes(au.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedUnits([...selectedUnits, au.id]);
                          else setSelectedUnits(selectedUnits.filter(id => id !== au.id));
                        }}
                      />
                      <span className="text-[11px] font-black uppercase tracking-tight">{au.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="p-8 bg-muted/10 border-t border-border/40 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShareOpen(false)} disabled={busy !== null} className="rounded-none px-8 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 hover:text-foreground">
              CANCELAR
            </Button>
            <Button
              className="rounded-none bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 min-w-[180px] font-black text-[10px] uppercase tracking-widest h-11 border-none"
              onClick={handleSaveShare}
              disabled={busy !== null}
            >
              {busy ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : "CONFIRMAR ACCESOS"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
