import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/UI/dialog';
import { ModalFooter } from '@/components/UI/v2';
import { deleteAnnouncement } from '@/components/utils/api/announcements-admin-functions';
import { Announcement } from '@/types/announcements';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

interface AnnouncementDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  announcement: Announcement | null;
}

export function AnnouncementDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  announcement,
}: AnnouncementDeleteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!announcement) return;

    setIsSubmitting(true);

    try {
      await deleteAnnouncement(announcement.id);
      toast.success('Anuncio eliminado exitosamente');
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al eliminar el anuncio';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700/80 text-white w-full max-w-[calc(100%-1rem)] sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Top accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-red-500 via-red-400/60 to-transparent" />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <Trash2 className="w-4 h-4" />
          </div>
          <DialogTitle className="text-white text-base font-semibold">Eliminar Anuncio</DialogTitle>
        </div>

        <div className="px-5 py-5 space-y-2">
          <p className="text-sm text-slate-300">
            ¿Estás seguro de que deseas eliminar el siguiente anuncio?
          </p>
          {announcement && (
            <p className="text-sm font-semibold text-white">
              "{announcement.title}"
            </p>
          )}
          <p className="text-xs text-slate-500">
            Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800 bg-slate-900/80">
          <ModalFooter
            onCancel={onClose}
            onConfirm={handleConfirm}
            confirmLabel="Eliminar"
            isLoading={isSubmitting}
            confirmVariant="destructive"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
