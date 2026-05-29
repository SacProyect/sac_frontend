import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ExternalLink, ShieldAlert } from 'lucide-react';
import { Announcement } from '@/types/announcements';

interface AnnouncementCriticalProps {
  announcement: Announcement;
  onConfirm: () => void;
  onCtaClick: () => void;
}

export const AnnouncementCritical: React.FC<AnnouncementCriticalProps> = ({
  announcement,
  onConfirm,
  onCtaClick,
}) => {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md animate-in fade-in duration-500" />
        <Dialog.Content 
          className="fixed left-1/2 top-1/2 z-[201] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-500 border-2 border-primary/20"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="text-primary" size={32} />
            </div>
            
            <Dialog.Title className="text-2xl font-bold mb-2">{announcement.title}</Dialog.Title>
            
            {announcement.description && (
              <Dialog.Description className="text-muted-foreground mb-6">
                <div
                  className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_strong]:text-white [&_em]:text-slate-300 [&_a]:text-indigo-400 [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: announcement.description }}
                />
              </Dialog.Description>
            )}

            {announcement.mediaUrl && (
              <div className="w-full aspect-video rounded-lg overflow-hidden mb-6 border border-muted">
                {announcement.mediaType === 'video' ? (
                  <video
                    src={announcement.mediaUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
                  />
                ) : (
                  <img
                    src={announcement.mediaUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>
            )}

            <div className="w-full space-y-4">
              {announcement.ctaText && announcement.ctaUrl && (
                <button
                  onClick={onCtaClick}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-primary text-primary font-medium rounded-md hover:bg-primary/5 transition-colors"
                >
                  {announcement.ctaText}
                  <ExternalLink size={16} />
                </button>
              )}

              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg text-left">
                <input
                  type="checkbox"
                  id="confirm-critical"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="w-5 h-5 rounded border-muted-foreground text-primary focus:ring-primary"
                />
                <label htmlFor="confirm-critical" className="text-sm font-medium leading-tight cursor-pointer">
                  He leído y entendido este comunicado importante.
                </label>
              </div>

              <button
                disabled={!confirmed}
                onClick={onConfirm}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
