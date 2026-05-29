import React, { useEffect, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Announcement } from '@/types/announcements';
import { createPortal } from 'react-dom';

interface AnnouncementTooltipProps {
  announcement: Announcement;
  onClose: () => void;
  onCtaClick: () => void;
}

export const AnnouncementTooltip: React.FC<AnnouncementTooltipProps> = ({
  announcement,
  onClose,
  onCtaClick,
}) => {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!announcement.targetSection) return;

    const findAndPosition = () => {
      const element = document.querySelector(announcement.targetSection!);
      if (element) {
        const rect = element.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY + 10,
          left: rect.left + window.scrollX,
        });
      }
    };

    findAndPosition();
    window.addEventListener('resize', findAndPosition);
    return () => window.removeEventListener('resize', findAndPosition);
  }, [announcement.targetSection]);

  if (!coords) return null;

  return createPortal(
    <div 
      className="absolute z-[120] w-64 p-4 bg-card border rounded-lg shadow-lg animate-in fade-in zoom-in-95 duration-200"
      style={{ top: coords.top, left: coords.left }}
    >
      <div className="absolute -top-2 left-4 w-4 h-4 bg-card border-t border-l rotate-45" />
      
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-sm">{announcement.title}</h4>
        <button onClick={onClose} className="p-0.5 hover:bg-muted rounded-full">
          <X size={14} />
        </button>
      </div>
      
      {announcement.description && (
        <p className="text-xs text-muted-foreground mb-3">{announcement.description}</p>
      )}
      
      {announcement.ctaText && announcement.ctaUrl && (
        <button
          onClick={onCtaClick}
          className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter"
        >
          {announcement.ctaText}
          <ExternalLink size={10} />
        </button>
      )}
    </div>,
    document.body
  );
};
