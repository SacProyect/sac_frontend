import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ExternalLink } from 'lucide-react';
import { Announcement } from '@/types/announcements';

interface AnnouncementModalProps {
  announcement: Announcement;
  onClose: () => void;
  onCtaClick: () => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  announcement,
  onClose,
  onCtaClick,
}) => {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" />
        <Dialog.Content 
          className="fixed left-1/2 top-1/2 z-[151] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-card p-0 shadow-xl animate-in zoom-in-95 duration-300 overflow-hidden"
          onPointerDownOutside={(e) => e.preventDefault()} // Force attention
        >
          {announcement.mediaUrl && (
            <div className="w-full aspect-video bg-muted">
              {announcement.mediaType === 'video' ? (
                <video src={announcement.mediaUrl} className="w-full h-full object-cover" autoPlay muted loop />
              ) : (
                <img src={announcement.mediaUrl} alt="" className="w-full h-full object-cover" />
              )}
            </div>
          )}
          
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <Dialog.Title className="text-xl font-bold">{announcement.title}</Dialog.Title>
              <Dialog.Close asChild>
                <button 
                  onClick={onClose}
                  className="p-1 hover:bg-muted rounded-full transition-colors"
                  aria-label="Cerrar"
                >
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>
            
            {announcement.description && (
              <Dialog.Description className="text-muted-foreground mb-6 whitespace-pre-wrap">
                {announcement.description}
              </Dialog.Description>
            )}
            
            {announcement.ctaText && announcement.ctaUrl && (
              <button
                onClick={onCtaClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:opacity-90 transition-opacity"
              >
                {announcement.ctaText}
                <ExternalLink size={18} />
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
