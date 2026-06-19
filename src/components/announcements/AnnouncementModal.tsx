import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
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
        {/* Overlay */}
        <Dialog.Overlay asChild forceMount>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm"
          />
        </Dialog.Overlay>

        {/* Centering wrapper — flex centers the content without transforms */}
        <div className="fixed inset-0 z-[151] flex items-center justify-center p-4 pointer-events-none">
          <Dialog.Content
            asChild
            forceMount
            onPointerDownOutside={(e: Event) => e.preventDefault()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg rounded-xl bg-slate-900 border border-slate-700/80 p-0 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col pointer-events-auto"
            >
              {/* Scrollable content area */}
              <div className="overflow-y-auto custom-scrollbar flex-1">
                <div className="p-6">
                  {/* Title + Close button */}
                  <div className="flex justify-between items-start mb-4">
                    <Dialog.Title className="text-xl font-bold text-white pr-8">
                      {announcement.title}
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors shrink-0"
                        aria-label="Cerrar"
                      >
                        <X size={18} />
                      </button>
                    </Dialog.Close>
                  </div>

                  {/* Description (Rich Text HTML) */}
                  {announcement.description && (
                    <Dialog.Description className="text-slate-400 mb-6">
                      <div
                        className="prose prose-sm prose-invert max-w-none [&_p]:my-1.5 [&_strong]:text-white [&_em]:text-slate-300 [&_a]:text-indigo-400 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
                        dangerouslySetInnerHTML={{ __html: announcement.description }}
                      />
                    </Dialog.Description>
                  )}

                  {/* Media — BELOW title and description */}
                  {announcement.mediaUrl && (
                    <div className="mb-6 rounded-lg overflow-hidden border border-slate-700/50 bg-slate-800/50">
                      {announcement.mediaType === 'video' ? (
                        <video
                          src={announcement.mediaUrl}
                          className="w-full max-h-[300px] object-contain"
                          controls
                          onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
                        />
                      ) : (
                        <img
                          src={announcement.mediaUrl}
                          alt={announcement.title}
                          className="w-full max-h-[300px] object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                    </div>
                  )}

                  {/* CTA Button */}
                  {announcement.ctaText && announcement.ctaUrl && (
                    <button
                      onClick={onCtaClick}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
                    >
                      {announcement.ctaText}
                      <ExternalLink size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
