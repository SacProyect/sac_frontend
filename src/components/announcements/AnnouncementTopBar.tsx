import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Announcement } from '@/types/announcements';
import { cn } from '@/lib/utils';

interface AnnouncementTopBarProps {
  announcement: Announcement;
  onClose: () => void;
  onCtaClick: () => void;
  position?: 'top' | 'bottom';
}

export const AnnouncementTopBar: React.FC<AnnouncementTopBarProps> = ({
  announcement,
  onClose,
  onCtaClick,
  position = 'top',
}) => {
  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-[100] flex items-center justify-between px-4 py-2 bg-primary text-primary-foreground shadow-md transition-transform duration-300 animate-in slide-in-from-top",
        position === 'top' ? "top-0" : "bottom-0 slide-in-from-bottom"
      )}
    >
      <div className="flex items-center gap-4 flex-1 overflow-hidden">
        {announcement.mediaUrl && (
          <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden hidden sm:block">
            {announcement.mediaType === 'video' ? (
              <video src={announcement.mediaUrl} className="w-full h-full object-cover" autoPlay muted loop
                onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
              />
            ) : (
              <img src={announcement.mediaUrl} alt="" className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
        )}
        <div className="overflow-hidden">
          <p className="font-semibold text-sm truncate">{announcement.title}</p>
          {announcement.description && (
            <span
              className="text-xs opacity-90 truncate hidden md:block"
              dangerouslySetInnerHTML={{ __html: announcement.description }}
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {announcement.ctaText && announcement.ctaUrl && (
          <button
            onClick={onCtaClick}
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-white text-primary rounded-full hover:bg-opacity-90 transition-colors whitespace-nowrap"
          >
            {announcement.ctaText}
            <ExternalLink size={12} />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
