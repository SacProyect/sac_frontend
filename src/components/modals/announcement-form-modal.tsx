import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/UI/dialog';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { RichTextEditor } from '@/components/UI/rich-text-editor';
import { Switch } from '@/components/UI/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select';
import { ModalFooter } from '@/components/UI/v2';
import {
  createAnnouncement,
  updateAnnouncement,
  uploadAnnouncementMedia,
  CreateAnnouncementData,
} from '@/components/utils/api/announcements-admin-functions';
import { getCoordinationGroups } from '@/components/utils/api/report-functions';
import { Announcement, AnnouncementType, AnnouncementTargetType } from '@/types/announcements';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Upload, X, Loader2, ImageIcon, Film } from 'lucide-react';

interface AnnouncementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editData?: Announcement | null;
}

interface FormState {
  title: string;
  description: string;
  type: AnnouncementType | '';
  targetSection: string;
  targetType: AnnouncementTargetType | '';
  targetRole: string;
  targetCoordinacionId: string;
  specificUserId: string;
  startsAt: string;
  expiresAt: string;
  isCritical: boolean;
  ctaText: string;
  ctaUrl: string;
  mediaUrl: string;
  mediaType: 'image' | 'gif' | 'video' | '';
  version: string;
  isActive: boolean;
  useMedia: boolean;
}

const defaultFormState: FormState = {
  title: '',
  description: '',
  type: '',
  targetSection: '',
  targetType: '',
  targetRole: '',
  targetCoordinacionId: '',
  specificUserId: '',
  startsAt: '',
  expiresAt: '',
  isCritical: false,
  ctaText: '',
  ctaUrl: '',
  mediaUrl: '',
  mediaType: '',
  version: '',
  isActive: true,
  useMedia: false,
};

/** Converts ISO date string to datetime-local input value (YYYY-MM-DDTHH:mm) */
function toDatetimeLocal(isoStr?: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/** Converts datetime-local value to ISO string */
function fromDatetimeLocal(val: string): string | undefined {
  if (!val) return undefined;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function AnnouncementFormModal({
  isOpen,
  onClose,
  onSuccess,
  editData = null,
}: AnnouncementFormModalProps) {
  const isEditing = editData !== null;

  const [formData, setFormData] = useState<FormState>(defaultFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [coordinaciones, setCoordinaciones] = useState<Array<{ id: string; name: string }>>([]);

  // Pre-fill form when editing or reset when creating
  useEffect(() => {
    if (!isOpen) return;

    if (editData) {
      setFormData({
        title: editData.title ?? '',
        description: editData.description ?? '',
        type: editData.type ?? '',
        targetSection: editData.targetSection ?? '',
        targetType: editData.targetType ?? '',
        targetRole: editData.targetRole ?? '',
        targetCoordinacionId: editData.targetCoordinacionId ?? '',
        specificUserId: editData.specificUserId ?? '',
        startsAt: toDatetimeLocal(editData.startsAt),
        expiresAt: toDatetimeLocal(editData.expiresAt),
        isCritical: editData.isCritical ?? false,
        ctaText: editData.ctaText ?? '',
        ctaUrl: editData.ctaUrl ?? '',
        mediaUrl: editData.mediaUrl ?? '',
        mediaType: editData.mediaType ?? '',
        version: editData.version ?? '',
        isActive: editData.isActive ?? true,
        useMedia: !!(editData.mediaUrl),
      });
    } else {
      setFormData(defaultFormState);
    }

    setErrors({});
  }, [isOpen, editData]);

  // Fetch coordinations when targetType is COORDINACION
  useEffect(() => {
    if (isOpen && formData.targetType === 'COORDINACION' && coordinaciones.length === 0) {
      getCoordinationGroups()
        .then(setCoordinaciones)
        .catch(() => {
          // Silent fail — user can still type if needed
        });
    }
  }, [isOpen, formData.targetType, coordinaciones.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
      'video/mp4': [],
      'video/webm': [],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      setIsUploading(true);
      setUploadError('');
      try {
        const result = await uploadAnnouncementMedia(file);
        setFormData(prev => ({
          ...prev,
          mediaUrl: result.url,
          mediaType: result.mediaType as 'image' | 'gif' | 'video',
        }));
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Error al subir el archivo');
      } finally {
        setIsUploading(false);
      }
    },
  });

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Clear dependent fields when type or targetType changes
      if (field === 'type') {
        if (value !== 'TOOLTIP') next.targetSection = '';
      }
      if (field === 'targetType') {
        next.targetRole = '';
        next.targetCoordinacionId = '';
        next.specificUserId = '';
      }
      if (field === 'mediaUrl') {
        if (!value) next.mediaType = '';
      }
      return next;
    });
    // Clear the corresponding error
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }
    if (!formData.type) {
      newErrors.type = 'El tipo es requerido';
    }
    if (!formData.targetType) {
      newErrors.targetType = 'El tipo de objetivo es requerido';
    }

    // Conditional validations
    if (formData.type === 'TOOLTIP' && !formData.targetSection.trim()) {
      newErrors.targetSection = 'La sección objetivo es requerida para tooltips';
    }
    if (formData.targetType === 'ROLE' && !formData.targetRole.trim()) {
      newErrors.targetRole = 'El rol es requerido';
    }
    if (formData.targetType === 'COORDINACION' && !formData.targetCoordinacionId.trim()) {
      newErrors.targetCoordinacionId = 'La coordinación es requerida';
    }
    if (formData.targetType === 'SPECIFIC_USER' && !formData.specificUserId.trim()) {
      newErrors.specificUserId = 'El ID de usuario es requerido';
    }

    // Date validation: startsAt < expiresAt
    if (formData.startsAt && formData.expiresAt) {
      const start = new Date(formData.startsAt);
      const end = new Date(formData.expiresAt);
      if (start >= end) {
        newErrors.expiresAt = 'La fecha de expiración debe ser posterior a la fecha de inicio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload: CreateAnnouncementData = {
        title: formData.title.trim(),
        isCritical: formData.isCritical,
        isActive: formData.isActive,
        type: formData.type as AnnouncementType,
        targetType: formData.targetType as AnnouncementTargetType,
      };

      // Optional fields — only include if non-empty
      if (formData.description.trim()) payload.description = formData.description.trim();
      if (formData.targetSection.trim()) payload.targetSection = formData.targetSection.trim();
      if (formData.targetRole.trim()) payload.targetRole = formData.targetRole.trim();
      if (formData.targetCoordinacionId.trim()) payload.targetCoordinacionId = formData.targetCoordinacionId.trim();
      if (formData.specificUserId.trim()) payload.specificUserId = formData.specificUserId.trim();
      if (formData.ctaText.trim()) payload.ctaText = formData.ctaText.trim();
      if (formData.ctaUrl.trim()) payload.ctaUrl = formData.ctaUrl.trim();
      if (formData.version.trim()) payload.version = formData.version.trim();

      // Media — only include if useMedia is enabled and mediaUrl exists
      if (formData.useMedia && formData.mediaUrl.trim()) {
        payload.mediaUrl = formData.mediaUrl.trim();
        if (formData.mediaType) payload.mediaType = formData.mediaType as 'image' | 'gif' | 'video';
      }

      const startIso = fromDatetimeLocal(formData.startsAt);
      const endIso = fromDatetimeLocal(formData.expiresAt);
      if (startIso) payload.startsAt = startIso;
      if (endIso) payload.expiresAt = endIso;

      if (isEditing && editData) {
        await updateAnnouncement(editData.id, payload);
        toast.success('Anuncio actualizado exitosamente');
      } else {
        await createAnnouncement(payload);
        toast.success('Anuncio creado exitosamente');
      }

      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al guardar el anuncio';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700/80 text-white w-full max-w-[calc(100%-1rem)] sm:max-w-2xl p-0 overflow-hidden gap-0">
        {/* Top accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-indigo-400/60 to-transparent" />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </div>
          <DialogTitle className="text-white text-base font-semibold">
            {isEditing ? 'Editar Anuncio' : 'Nuevo Anuncio'}
          </DialogTitle>
        </div>

        <div className="overflow-y-auto custom-scrollbar max-h-[calc(80vh-140px)]">
        <div className="px-5 py-5 space-y-4">
          {/* ── Row 1: Title ── */}
          <div className="space-y-2">
            <Label
              htmlFor="announcement-title"
              className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1"
            >
              Título *
            </Label>
            <Input
              id="announcement-title"
              placeholder="Título del anuncio"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={cn(
                'bg-slate-950/30 border-slate-700 focus:ring-indigo-500/30 rounded-xl h-12 text-slate-200 transition-all',
                errors.title && 'border-rose-500/50 bg-rose-500/5 text-rose-200'
              )}
            />
            {errors.title && (
              <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.title}</p>
            )}
          </div>

          {/* ── Row 2: Description (Rich Text) ── */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Descripción
            </Label>
            <RichTextEditor
              value={formData.description}
              onChange={(html) => handleChange('description', html)}
              placeholder="Escribe la descripción del anuncio..."
            />
          </div>

          {/* ── Row 3: Type + TargetType ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                Tipo *
              </Label>
              <Select
                value={formData.type}
                onValueChange={(val) => handleChange('type', val)}
              >
                <SelectTrigger
                  className={cn(
                    'bg-slate-950/30 border-slate-700 focus:ring-indigo-500/30 rounded-xl h-12 text-slate-200 transition-all',
                    errors.type && 'border-rose-500/50'
                  )}
                >
                  <SelectValue placeholder="Seleccionar tipo..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="TOP_BAR">Barra Superior</SelectItem>
                  <SelectItem value="MODAL">Modal</SelectItem>
                  <SelectItem value="TOOLTIP">Tooltip</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.type}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                Objetivo *
              </Label>
              <Select
                value={formData.targetType}
                onValueChange={(val) => handleChange('targetType', val)}
              >
                <SelectTrigger
                  className={cn(
                    'bg-slate-950/30 border-slate-700 focus:ring-indigo-500/30 rounded-xl h-12 text-slate-200 transition-all',
                    errors.targetType && 'border-rose-500/50'
                  )}
                >
                  <SelectValue placeholder="Seleccionar objetivo..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="GLOBAL">Global</SelectItem>
                  <SelectItem value="ROLE">Rol</SelectItem>
                  <SelectItem value="COORDINACION">Coordinación</SelectItem>
                  <SelectItem value="SPECIFIC_USER">Usuario Específico</SelectItem>
                </SelectContent>
              </Select>
              {errors.targetType && (
                <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.targetType}</p>
              )}
            </div>
          </div>

          {/* ── Conditional: targetSection (only when type = TOOLTIP) ── */}
          {formData.type === 'TOOLTIP' && (
            <div className="space-y-2">
              <Label
                htmlFor="announcement-targetSection"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1"
              >
                Sección Objetivo (Ruta) *
              </Label>
              <Input
                id="announcement-targetSection"
                placeholder="Ej: /dashboard"
                value={formData.targetSection}
                onChange={(e) => handleChange('targetSection', e.target.value)}
                className={cn(
                  'bg-slate-950/30 border-slate-700 focus:ring-indigo-500/30 rounded-xl h-12 text-slate-200 transition-all',
                  errors.targetSection && 'border-rose-500/50 bg-rose-500/5 text-rose-200'
                )}
              />
              {errors.targetSection && (
                <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.targetSection}</p>
              )}
            </div>
          )}

          {/* ── Conditional: targetRole (only when targetType = ROLE) ── */}
          {formData.targetType === 'ROLE' && (
            <div className="space-y-2">
              <Label
                htmlFor="announcement-targetRole"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1"
              >
                Rol *
              </Label>
              <Input
                id="announcement-targetRole"
                placeholder="Ej: ADMIN, COORDINADOR"
                value={formData.targetRole}
                onChange={(e) => handleChange('targetRole', e.target.value)}
                className={cn(
                  'bg-slate-950/30 border-slate-700 focus:ring-indigo-500/30 rounded-xl h-12 text-slate-200 transition-all',
                  errors.targetRole && 'border-rose-500/50 bg-rose-500/5 text-rose-200'
                )}
              />
              {errors.targetRole && (
                <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.targetRole}</p>
              )}
            </div>
          )}

          {/* ── Conditional: targetCoordinacionId (only when targetType = COORDINACION) ── */}
          {formData.targetType === 'COORDINACION' && (
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                Coordinación *
              </Label>
              <Select
                value={formData.targetCoordinacionId}
                onValueChange={(val) => handleChange('targetCoordinacionId', val)}
              >
                <SelectTrigger
                  className={cn(
                    'bg-slate-950/30 border-slate-700 focus:ring-indigo-500/30 rounded-xl h-12 text-slate-200 transition-all',
                    errors.targetCoordinacionId && 'border-rose-500/50'
                  )}
                >
                  <SelectValue placeholder="Seleccionar coordinación..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {coordinaciones.length === 0 ? (
                    <SelectItem value="__loading" disabled>Cargando coordinaciones...</SelectItem>
                  ) : (
                    coordinaciones.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.targetCoordinacionId && (
                <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.targetCoordinacionId}</p>
              )}
            </div>
          )}

          {/* ── Conditional: specificUserId (only when targetType = SPECIFIC_USER) ── */}
          {formData.targetType === 'SPECIFIC_USER' && (
            <div className="space-y-2">
              <Label
                htmlFor="announcement-specificUserId"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1"
              >
                ID Usuario *
              </Label>
              <Input
                id="announcement-specificUserId"
                placeholder="ID del usuario específico"
                value={formData.specificUserId}
                onChange={(e) => handleChange('specificUserId', e.target.value)}
                className={cn(
                  'bg-slate-950/30 border-slate-700 focus:ring-indigo-500/30 rounded-xl h-12 text-slate-200 transition-all',
                  errors.specificUserId && 'border-rose-500/50 bg-rose-500/5 text-rose-200'
                )}
              />
              {errors.specificUserId && (
                <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.specificUserId}</p>
              )}
            </div>
          )}

          {/* ── Row 4: Dates ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="announcement-startsAt"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1"
              >
                Fecha de Inicio
              </Label>
              <Input
                id="announcement-startsAt"
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) => handleChange('startsAt', e.target.value)}
                className="bg-slate-950/30 border-slate-700 focus:ring-indigo-500/30 rounded-xl h-12 text-slate-200 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="announcement-expiresAt"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1"
              >
                Fecha de Expiración
              </Label>
              <Input
                id="announcement-expiresAt"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => handleChange('expiresAt', e.target.value)}
                className={cn(
                  'bg-slate-950/30 border-slate-700 focus:ring-indigo-500/30 rounded-xl h-12 text-slate-200 transition-all',
                  errors.expiresAt && 'border-rose-500/50 bg-rose-500/5 text-rose-200'
                )}
              />
              {errors.expiresAt && (
                <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.expiresAt}</p>
              )}
            </div>
          </div>

          {/* ── Row 5: isCritical + isActive toggles ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/30 px-4 h-12">
              <Label
                htmlFor="announcement-isCritical"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
              >
                Crítico
              </Label>
              <Switch
                id="announcement-isCritical"
                checked={formData.isCritical}
                onCheckedChange={(checked) => handleChange('isCritical', checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/30 px-4 h-12">
              <Label
                htmlFor="announcement-isActive"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
              >
                Activo
              </Label>
              <Switch
                id="announcement-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleChange('isActive', checked)}
              />
            </div>
          </div>

          {/* ── Row 6: CTA fields ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="announcement-ctaText"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1"
              >
                Texto CTA
              </Label>
              <Input
                id="announcement-ctaText"
                placeholder="Etiqueta del botón (opcional)"
                value={formData.ctaText}
                onChange={(e) => handleChange('ctaText', e.target.value)}
                className="bg-slate-950/30 border-slate-700 focus:ring-indigo-500/30 rounded-xl h-12 text-slate-200 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="announcement-ctaUrl"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1"
              >
                URL CTA
              </Label>
              <Input
                id="announcement-ctaUrl"
                placeholder="https://ejemplo.com (opcional)"
                value={formData.ctaUrl}
                onChange={(e) => handleChange('ctaUrl', e.target.value)}
                className="bg-slate-950/30 border-slate-700 focus:ring-indigo-500/30 rounded-xl h-12 text-slate-200 transition-all"
              />
            </div>
          </div>

          {/* ── Media Section ── */}
          <div className="space-y-3">
            {/* Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/30 px-4 h-12">
              <Label
                htmlFor="announcement-useMedia"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
              >
                Adjuntar Media
              </Label>
              <Switch
                id="announcement-useMedia"
                checked={formData.useMedia}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    useMedia: checked,
                    mediaUrl: checked ? prev.mediaUrl : '',
                    mediaType: checked ? prev.mediaType : '',
                  }));
                }}
              />
            </div>

            {/* Upload Zone (when useMedia is true AND no mediaUrl yet) */}
            {formData.useMedia && !formData.mediaUrl && (
              <div
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? 'border-indigo-500 bg-indigo-500/5'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-950/30 hover:bg-slate-900/50'
                }`}
              >
                <input {...getInputProps()} />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-sm text-slate-400">Subiendo archivo...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-full bg-slate-700/30">
                      <Upload className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-300 font-medium">
                        {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra un archivo o haz clic'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        JPG, PNG, GIF, MP4, WebM — Max 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upload Error */}
            {uploadError && (
              <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{uploadError}</p>
            )}

            {/* Preview (when mediaUrl exists) */}
            {formData.useMedia && formData.mediaUrl && (
              <div className="relative rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900/30">
                {formData.mediaType === 'video' ? (
                  <video
                    src={formData.mediaUrl}
                    controls
                    className="w-full max-h-[200px] object-contain"
                  />
                ) : (
                  <img
                    src={formData.mediaUrl}
                    alt="Preview"
                    className="w-full max-h-[200px] object-contain"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, mediaUrl: '', mediaType: '' }))}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 border border-slate-700/50 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-700/50">
                  {formData.mediaType === 'video' ? (
                    <Film className="w-3 h-3 text-purple-400" />
                  ) : (
                    <ImageIcon className="w-3 h-3 text-blue-400" />
                  )}
                  <span className="text-[10px] text-slate-400 font-medium uppercase">
                    {formData.mediaType === 'gif' ? 'GIF' : formData.mediaType === 'video' ? 'Video' : 'Imagen'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Row 8: Version ── */}
          <div className="space-y-2">
            <Label
              htmlFor="announcement-version"
              className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1"
            >
              Versión
            </Label>
            <Input
              id="announcement-version"
              placeholder="Ej: 2.1.0 (opcional)"
              value={formData.version}
              onChange={(e) => handleChange('version', e.target.value)}
              className="bg-slate-950/30 border-slate-700 focus:ring-indigo-500/30 rounded-xl h-12 text-slate-200 transition-all"
            />
          </div>
        </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800 bg-slate-900/80">
          <ModalFooter
            onCancel={onClose}
            onConfirm={handleSubmit}
            confirmLabel={isEditing ? 'Actualizar' : 'Crear'}
            isLoading={isSubmitting}
            confirmVariant="default"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
