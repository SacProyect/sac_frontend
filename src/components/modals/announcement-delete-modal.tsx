import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/UI/dialog';
import { ModalFooter } from '@/components/UI/v2';
import { deleteAnnouncement } from '@/components/utils/api/announcements-admin-functions';
import { Announcement } from '@/types/announcements';
import toast from 'react-hot-toast';

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
      <DialogContent className="bg-slate-800 border-slate-700 text-white transition-all duration-200 max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-white">Eliminar Anuncio</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
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

        <DialogFooter>
          <ModalFooter
            onCancel={onClose}
            onConfirm={handleConfirm}
            confirmLabel="Eliminar"
            isLoading={isSubmitting}
            confirmVariant="destructive"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
