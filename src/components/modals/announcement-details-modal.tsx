import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/UI/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/UI/table';
import { getAnnouncementReaders } from '@/components/utils/api/announcements-admin-functions';
import { Announcement, AnnouncementReader } from '@/types/announcements';
import { Eye, Check, Minus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Type badge styles (mirrors AnnouncementsAdmin) ──
const typeBadgeStyles: Record<string, string> = {
  TOP_BAR: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  MODAL: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  TOOLTIP: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const typeLabels: Record<string, string> = {
  TOP_BAR: 'Barra Superior',
  MODAL: 'Modal',
  TOOLTIP: 'Tooltip',
};

const targetTypeLabels: Record<string, string> = {
  GLOBAL: 'Global',
  ROLE: 'Rol',
  COORDINACION: 'Coordinación',
  SPECIFIC_USER: 'Usuario Específico',
};

// ── Formatting helpers ──
function formatDateTime(isoStr?: string): string {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleString('es-VE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function formatTimeSpent(seconds?: number): string {
  if (seconds === undefined || seconds === null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

// ── Props ──
export interface AnnouncementDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
}

// ── Component ──
export function AnnouncementDetailsModal({
  isOpen,
  onClose,
  announcement,
}: AnnouncementDetailsModalProps) {
  const [readers, setReaders] = useState<AnnouncementReader[]>([]);
  const [loadingReaders, setLoadingReaders] = useState(false);

  // Fetch readers whenever announcement changes
  useEffect(() => {
    if (!isOpen || !announcement) {
      setReaders([]);
      return;
    }

    let cancelled = false;

    const fetchReaders = async () => {
      setLoadingReaders(true);
      try {
        const data = await getAnnouncementReaders(announcement.id);
        if (!cancelled) setReaders(data);
      } catch {
        if (!cancelled) toast.error('Error cargando lectores del anuncio');
      } finally {
        if (!cancelled) setLoadingReaders(false);
      }
    };

    fetchReaders();

    return () => {
      cancelled = true;
    };
  }, [isOpen, announcement]);

  if (!announcement) return null;

  // ── Info field component ──
  const InfoField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-slate-200">{children}</span>
    </div>
  );

  // ── Boolean indicator ──
  const BoolIcon = ({ value }: { value: boolean }) =>
    value ? (
      <Check className="w-4 h-4 text-emerald-400 inline-block" />
    ) : (
      <Minus className="w-4 h-4 text-slate-500 inline-block" />
    );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700/80 text-white w-full max-w-[calc(100%-1rem)] sm:max-w-2xl p-0 overflow-hidden gap-0">
        {/* Top accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-cyan-500 via-cyan-400/60 to-transparent" />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Eye className="w-4 h-4" />
          </div>
          <DialogTitle className="text-white text-base font-semibold">Detalles del Anuncio</DialogTitle>
        </div>

        <div className="overflow-y-auto custom-scrollbar max-h-[calc(90vh-140px)]">
          <div className="px-5 py-5 space-y-5">
          {/* Title */}
          <h2 className="text-xl font-bold text-white leading-tight">
            {announcement.title}
          </h2>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type badge */}
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                typeBadgeStyles[announcement.type] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}
            >
              {typeLabels[announcement.type] ?? announcement.type}
            </span>

            {/* Target badge */}
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-slate-500/10 text-slate-400 border-slate-500/20">
              {targetTypeLabels[announcement.targetType] ?? announcement.targetType}
            </span>

            {/* Critical badge */}
            {announcement.isCritical && (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-500/10 text-red-400 border-red-500/20">
                Crítico
              </span>
            )}

            {/* Active status badge */}
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                announcement.isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}
            >
              {announcement.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          {/* Description */}
            {announcement.description && (
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                <div
                  className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_strong]:text-white [&_em]:text-slate-300 [&_a]:text-cyan-400 [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: announcement.description }}
                />
              </div>
            )}

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* CTA Text */}
            {announcement.ctaText && (
              <InfoField label="Texto CTA">{announcement.ctaText}</InfoField>
            )}

            {/* CTA URL */}
            {announcement.ctaUrl && (
              <InfoField label="URL CTA">
                <span className="text-cyan-400 break-all text-xs">
                  {announcement.ctaUrl}
                </span>
              </InfoField>
            )}

            {/* Target Role */}
            {announcement.targetRole && (
              <InfoField label="Rol objetivo">{announcement.targetRole}</InfoField>
            )}

            {/* Version */}
            {announcement.version && (
              <InfoField label="Versión">
                <span className="font-mono text-xs bg-slate-700/50 px-1.5 py-0.5 rounded">
                  {announcement.version}
                </span>
              </InfoField>
            )}

            {/* Starts At */}
            <InfoField label="Inicio">{formatDateTime(announcement.startsAt)}</InfoField>

            {/* Expires At */}
            <InfoField label="Expira">{formatDateTime(announcement.expiresAt)}</InfoField>

            {/* Created */}
            <InfoField label="Creado">{formatDateTime(announcement.createdAt)}</InfoField>

            {/* Updated */}
            <InfoField label="Actualizado">{formatDateTime(announcement.updatedAt)}</InfoField>
          </div>

          {/* Media preview */}
          {announcement.mediaUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900/30">
              {announcement.mediaType === 'video' ? (
                <video
                  src={announcement.mediaUrl}
                  controls
                  className="w-full max-h-[200px] object-contain"
                />
              ) : (
                <img
                  src={announcement.mediaUrl}
                  alt={`Media de ${announcement.title}`}
                  className="w-full max-h-[200px] object-contain"
                />
              )}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-700/50" />

          {/* ══════════════════════════════════════════
              SECTION B — Readers
              ══════════════════════════════════════════ */}
          <div>
            {/* Readers header */}
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-base font-semibold text-white">Lecturas</h3>
              <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20">
                {loadingReaders ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  readers.length
                )}
              </span>
            </div>

            {/* Loading state */}
            {loadingReaders && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={`reader-skeleton-${i}`} className="flex items-center gap-4">
                    <div className="h-4 w-32 bg-slate-700/50 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-slate-700/50 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-slate-700/50 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-slate-700/50 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-slate-700/50 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-slate-700/50 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-slate-700/50 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loadingReaders && readers.length === 0 && (
              <div className="flex flex-col items-center text-center py-10 bg-slate-900/30 rounded-xl border border-slate-700/30">
                <div className="p-3 rounded-full bg-slate-700/20 mb-3">
                  <Eye className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-400">
                  Nadie ha visto este anuncio todavía
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Las lecturas aparecerán aquí cuando los usuarios abran el anuncio
                </p>
              </div>
            )}

            {/* Readers table */}
            {!loadingReaders && readers.length > 0 && (
              <div className="rounded-xl border border-slate-700/50 overflow-hidden">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur-sm">
                    <TableRow className="border-slate-700/50 hover:bg-transparent">
                      <TableHead className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                        Usuario
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider hidden sm:table-cell">
                        Rol
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                        Abrió
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider hidden md:table-cell">
                        Cerró
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider hidden lg:table-cell">
                        Tiempo
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                        CTA
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                        Confirmado
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {readers.map((reader) => (
                      <TableRow
                        key={reader.id}
                        className="border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                      >
                        {/* Usuario */}
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-200 font-medium">
                              {reader.userName}
                            </span>
                            {reader.userEmail && (
                              <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                                {reader.userEmail}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Rol */}
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-xs text-slate-400">
                            {reader.userRole ?? '—'}
                          </span>
                        </TableCell>

                        {/* Abrió */}
                        <TableCell>
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {formatDateTime(reader.openedAt)}
                          </span>
                        </TableCell>

                        {/* Cerró */}
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {formatDateTime(reader.closedAt)}
                          </span>
                        </TableCell>

                        {/* Tiempo */}
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-slate-400 font-mono">
                            {formatTimeSpent(reader.timeSpentSeconds)}
                          </span>
                        </TableCell>

                        {/* CTA Click */}
                        <TableCell className="text-center">
                          <BoolIcon value={!!reader.ctaClickedAt} />
                        </TableCell>

                        {/* Confirmado */}
                        <TableCell className="text-center">
                          <BoolIcon value={reader.isConfirmed} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
