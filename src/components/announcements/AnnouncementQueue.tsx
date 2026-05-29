import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Announcement } from '@/types/announcements';
import { 
  getPendingAnnouncements, 
  markAsOpened, 
  markAsClosed, 
  markCtaClicked, 
  confirmCriticalAnnouncement 
} from '@/components/utils/api/announcements-functions';
import { AnnouncementTopBar } from './AnnouncementTopBar';
import { AnnouncementModal } from './AnnouncementModal';
import { AnnouncementCritical } from './AnnouncementCritical';
import { AnnouncementTooltip } from './AnnouncementTooltip';

export const AnnouncementQueue: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState<number | null>(null);
  const location = useLocation();

  const fetchAnnouncements = useCallback(async () => {
    try {
      const data = await getPendingAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const activeAnnouncement = announcements[currentIndex];

  useEffect(() => {
    if (activeAnnouncement && !loading) {
      markAsOpened(activeAnnouncement.id);
      setStartTime(performance.now());
    }
  }, [activeAnnouncement?.id, loading]);

  const handleClose = useCallback(async () => {
    if (!activeAnnouncement) return;
    
    const timeSpent = startTime ? Math.round((performance.now() - startTime) / 1000) : undefined;
    await markAsClosed(activeAnnouncement.id, timeSpent);
    
    setAnnouncements(prev => prev.filter((_, i) => i !== currentIndex));
    setStartTime(null);
  }, [activeAnnouncement, startTime, currentIndex]);

  const handleCtaClick = useCallback(async () => {
    if (!activeAnnouncement) return;
    await markCtaClicked(activeAnnouncement.id);
    if (activeAnnouncement.ctaUrl) {
      window.open(activeAnnouncement.ctaUrl, '_blank');
    }
  }, [activeAnnouncement]);

  const handleConfirm = useCallback(async () => {
    if (!activeAnnouncement) return;
    await confirmCriticalAnnouncement(activeAnnouncement.id);
    setAnnouncements(prev => prev.filter((_, i) => i !== currentIndex));
    setStartTime(null);
  }, [activeAnnouncement, currentIndex]);

  // Tooltips se manejan aparte porque dependen de la ruta actual
  const tooltips = useMemo(() => {
    return announcements.filter(a => a.type === 'TOOLTIP');
  }, [announcements]);

  const visibleTooltips = useMemo(() => {
    return tooltips.filter(t => {
      if (!t.targetSection) return false;
      // El backend puede enviar una ruta exacta o un patrón
      return location.pathname.startsWith(t.targetSection);
    });
  }, [tooltips, location.pathname]);

  if (loading || announcements.length === 0) return null;

  // Si el anuncio actual es un tooltip, pasamos al siguiente (los tooltips no bloquean la cola global)
  if (activeAnnouncement?.type === 'TOOLTIP') {
    // Esto es un poco simplista, en una implementación real buscaríamos el siguiente no-tooltip
    return (
      <>
        {visibleTooltips.map(t => (
          <AnnouncementTooltip 
            key={t.id} 
            announcement={t} 
            onClose={() => setAnnouncements(prev => prev.filter(a => a.id !== t.id))}
            onCtaClick={() => markCtaClicked(t.id).then(() => t.ctaUrl && window.open(t.ctaUrl, '_blank'))}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {activeAnnouncement.type === 'TOP_BAR' && (
        <AnnouncementTopBar 
          announcement={activeAnnouncement} 
          onClose={handleClose} 
          onCtaClick={handleCtaClick} 
        />
      )}
      
      {activeAnnouncement.type === 'MODAL' && !activeAnnouncement.isCritical && (
        <AnnouncementModal 
          announcement={activeAnnouncement} 
          onClose={handleClose} 
          onCtaClick={handleCtaClick} 
        />
      )}
      
      {activeAnnouncement.isCritical && (
        <AnnouncementCritical 
          announcement={activeAnnouncement} 
          onConfirm={handleConfirm} 
          onCtaClick={handleCtaClick} 
        />
      )}

      {visibleTooltips.map(t => (
        <AnnouncementTooltip 
          key={t.id} 
          announcement={t} 
          onClose={() => setAnnouncements(prev => prev.filter(a => a.id !== t.id))}
          onCtaClick={() => markCtaClicked(t.id).then(() => t.ctaUrl && window.open(t.ctaUrl, '_blank'))}
        />
      ))}
    </>
  );
};
