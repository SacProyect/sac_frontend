import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/UI/v2";
import { Button } from "@/components/UI/button";
import { Input } from "@/components/UI/input";
import { Card, CardContent } from "@/components/UI/card";
import { Label } from "@/components/UI/label";
import { Textarea } from "@/components/UI/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/UI/select";
import { Skeleton } from "@/components/UI/skeleton";
import { Switch } from "@/components/UI/switch";
import { useAuth } from "@/hooks/use-auth";
import { 
  uploadDocument, 
  listFiscalGroups, 
  listAdminUnits,
  listDocumentCategories 
} from "@/components/utils/api/documentos-functions";
import type { 
  DocumentScope, 
  FiscalGroupInfo, 
  AdminUnitInfo,
  DocumentCategoryInfo 
} from "@/types/documents";
import { ArrowLeft, Upload, FileText, Users, Building2, ShieldCheck, Share2, Tag, Info, Lock } from "lucide-react";
import toast from "react-hot-toast";

const SCOPE_OPTIONS: { value: DocumentScope; label: string; description: string }[] = [
  { value: "PRIVATE", label: "Privado", description: "Solo visible para ti" },
  { value: "SHARED", label: "Compartido", description: "Visible para las coordinaciones o unidades seleccionadas" },
];

// Default to SHARED

const DEFAULT_SCOPE: DocumentScope = "SHARED";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/gif",
  "text/plain",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function getMimeTypeAcceptString(): string {
  return ALLOWED_MIME_TYPES
    .map((mime) => {
      if (mime.includes("pdf")) return ".pdf";
      if (mime.includes("msword")) return ".doc";
      if (mime.includes("officedocument.wordprocessingml")) return ".docx";
      if (mime.includes("ms-excel")) return ".xls";
      if (mime.includes("officedocument.spreadsheetml")) return ".xlsx";
      if (mime.includes("jpeg")) return ".jpg,.jpeg";
      if (mime.includes("png")) return ".png";
      if (mime.includes("gif")) return ".gif";
      if (mime.includes("text")) return ".txt";
      return "";
    })
    .filter(Boolean)
    .join(",");
}

export default function SubirDocumentoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role ?? "";

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [isSensitive, setIsSensitive] = useState(false);
  const [scope, setScope] = useState<DocumentScope>("PRIVATE");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

<<<<<<< Updated upstream
  // Categorías
  const [categories, setCategories] = useState<DocumentCategoryInfo[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Compartición con Coordinaciones
  const [fiscalGroups, setFiscalGroups] = useState<FiscalGroupInfo[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
=======
	// Estado para coordinaciones
	const [fiscalGroups, setFiscalGroups] = useState<FiscalGroupInfo[]>([]);
	const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
	const [loadingGroups, setLoadingGroups] = useState(false);

	// Cargar coordinaciones al montar
	useEffect(() => {
		if (role === "ADMIN") {
			setLoadingGroups(true);
			listFiscalGroups()
				.then((res) => setFiscalGroups(res.data ?? []))
				.catch(() => {})
				.finally(() => setLoadingGroups(false));
		}
		// COORDINATOR: listFiscalGroups devuelve solo su grupo
	}, [role]);
>>>>>>> Stashed changes

  // Compartición con Unidades Administrativas
  const [adminUnits, setAdminUnits] = useState<AdminUnitInfo[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Jefa Division override (jefaOnly)
  const [sendToJefa, setSendToJefa] = useState(false);

  useEffect(() => {
    setLoadingCategories(true);
    listDocumentCategories()
      .then((res) => setCategories(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingCategories(false));

    if (role === "ADMIN" || role === "COORDINATOR") {
      setLoadingGroups(true);
      listFiscalGroups()
        .then((res) => setFiscalGroups(res.data ?? []))
        .catch(() => {})
        .finally(() => setLoadingGroups(false));
      
      setLoadingUnits(true);
      listAdminUnits()
        .then((res) => setAdminUnits(res.data ?? []))
        .catch(() => {})
        .finally(() => setLoadingUnits(false));
    }
  }, [role]);

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;
    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
      toast.error(`Tipo de archivo no soportado: ${selectedFile.type}`);
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      toast.error("El archivo no puede superar los 10MB");
      return;
    }
    setFile(selectedFile);
    if (!name) {
      setName(selectedFile.name.replace(/\.[^.]+$/, ""));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const toggleUnit = (unitId: string) => {
    setSelectedUnits((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Selecciona un archivo");
      return;
    }
    if (!name.trim()) {
      toast.error("Ingresa un nombre para el documento");
      return;
    }
    
    if (scope === "SHARED" && selectedGroups.length === 0 && selectedUnits.length === 0 && !sendToJefa) {
      toast.error("Selecciona al menos un destinatario para compartir");
      return;
    }

    try {
      setUploading(true);
      await uploadDocument(file, name.trim(), scope, selectedGroups, sendToJefa, {
        description: description.trim() || undefined,
        categoryId: categoryId === "none" ? undefined : categoryId,
        isSensitive
      });
      
      // Phase 3 support for selectedUnits would go here if needed via Principal API
      // but for now we focus on Phase 4 metadata.
      toast.success("Documento subido exitosamente");
      navigate("/documentos");
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? e?.message ?? "Error al subir el documento");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto">
      <PageHeader
        title="Subir documento"
        description="Selecciona un archivo y configura su clasificación"
        action={
          <Button variant="outline" onClick={() => navigate("/documentos")} className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6 pb-12">
        {/* Archivo */}
        <Card className="rounded-2xl overflow-hidden border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                ${dragOver ? "border-indigo-500 bg-indigo-500/5" : "border-border hover:border-muted-foreground/30"}
                ${file ? "bg-emerald-500/5 border-emerald-500/30" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                accept={getMimeTypeAcceptString()}
              />

              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-1">
                    <FileText className="h-6 w-6 text-emerald-400" />
                  </div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground tabular-nums uppercase">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type.split('/')[1] || 'Archivo'}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[10px] text-rose-400 mt-2 hover:bg-rose-500/10 uppercase font-bold tracking-wider"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    Cambiar archivo
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-1">
                    <Upload className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="font-medium text-sm text-muted-foreground">
                    Arrastra un archivo aquí o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    PDF, DOCX, XLSX, imágenes (max 10MB)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clasificación y Metadatos */}
        <Card className="rounded-2xl border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-3 h-3 text-indigo-400" /> Nombre
                </Label>
                <Input
                  id="name"
                  placeholder="Ej: Informe mensual mayo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-background/50 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-3 h-3 text-indigo-400" /> Categoría
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category" className="bg-background/50 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {loadingCategories ? (
                      <div className="p-2 flex items-center justify-center"><Skeleton className="h-4 w-20" /></div>
                    ) : categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Info className="w-3 h-3 text-indigo-400" /> Descripción (opcional)
              </Label>
              <Textarea
                id="description"
                placeholder="Breve descripción del contenido..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background/50 rounded-xl min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="scope" className="text-xs font-bold uppercase tracking-wider">Visibilidad Base</Label>
                <Select value={scope} onValueChange={(v) => setScope(v as DocumentScope)}>
                  <SelectTrigger id="scope" className="bg-background/50 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {SCOPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="font-medium text-xs">{opt.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 h-[50px] self-end">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-xs font-medium text-rose-300">Sensible</span>
                </div>
                <Switch checked={isSensitive} onCheckedChange={setIsSensitive} />
              </div>
            </div>
            
            {/* Toggle Jefa Division (solo ADMIN) */}
            {role === "ADMIN" && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-indigo-300">Visible para Jefa de División</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Acceso de alta gerencia</p>
                  </div>
                </div>
                <Switch 
                  checked={sendToJefa} 
                  onCheckedChange={setSendToJefa}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Destinatarios (solo si scope = SHARED) */}
        {scope === "SHARED" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1 pt-2">
              <Share2 className="w-4 h-4 text-indigo-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Destinatarios</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Coordinaciones */}
              <Card className="rounded-2xl border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <Label className="text-[10px] font-bold uppercase tracking-wider">Coordinaciones</Label>
                  </div>
                  
                  {loadingGroups ? (
                    <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                  ) : fiscalGroups.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No hay grupos</p>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {fiscalGroups.map((fg) => (
                        <label
                          key={fg.id}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all
                            ${selectedGroups.includes(fg.id) ? "border-emerald-500/50 bg-emerald-500/10" : "border-transparent hover:bg-muted/50"}`}
                        >
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 rounded border-muted bg-transparent text-emerald-500 focus:ring-emerald-500"
                            checked={selectedGroups.includes(fg.id)}
                            onChange={() => toggleGroup(fg.id)}
                          />
                          <span className="text-xs font-medium">{fg.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Unidades Administrativas */}
              <Card className="rounded-2xl border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <Label className="text-[10px] font-bold uppercase tracking-wider">U. Administrativas</Label>
                  </div>
                  
                  {loadingUnits ? (
                    <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                  ) : adminUnits.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No hay unidades</p>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {adminUnits.map((au) => (
                        <label
                          key={au.id}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all
                            ${selectedUnits.includes(au.id) ? "border-indigo-500/50 bg-indigo-500/10" : "border-transparent hover:bg-muted/50"}`}
                        >
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 rounded border-muted bg-transparent text-indigo-500 focus:ring-indigo-500"
                            checked={selectedUnits.includes(au.id)}
                            onChange={() => toggleUnit(au.id)}
                          />
                          <span className="text-xs font-medium">{au.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/documentos")}
            disabled={uploading}
            className="rounded-xl px-8"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={!file || !name.trim() || uploading}
            className="rounded-xl px-8 shadow-lg shadow-indigo-500/20"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Subir documento
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
