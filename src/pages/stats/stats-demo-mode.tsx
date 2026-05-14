import { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, X, ChevronRight, ChevronLeft, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { cn } from '@/lib/utils';

interface StatsDemoModeProps {
  onClose: () => void;
  year: number;
  groupId?: string;
  pages: {
    id: number;
    title: string;
    component: React.ReactNode;
  }[];
}

const PAGE_DURATION = 15000; // 15 seconds per page

export default function StatsDemoMode({ onClose, year, groupId, pages }: StatsDemoModeProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nextPage = useCallback(() => {
    setCurrentPageIndex((prev) => (prev + 1) % pages.length);
    setProgress(0);
  }, [pages.length]);

  const prevPage = useCallback(() => {
    setCurrentPageIndex((prev) => (prev - 1 + pages.length) % pages.length);
    setProgress(0);
  }, [pages.length]);

  useEffect(() => {
    if (isPaused) return;

    const interval = 100;
    const step = (interval / PAGE_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          // Programar el cambio de página fuera del setter para evitar la race condition
          setTimeout(() => {
            setCurrentPageIndex((p) => (p + 1) % pages.length);
            setProgress(0);
          }, 0);
          return 100; // Quedar en 100 hasta que el setTimeout lo resetee
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, pages.length]);


  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable full-screen mode: ${e.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleClose = useCallback(() => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === ' ') setIsPaused((prev) => !prev);
      if (e.key === 'ArrowRight') nextPage();
      if (e.key === 'ArrowLeft') prevPage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, nextPage, prevPage]);

  const currentPage = pages[currentPageIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col text-slate-200 overflow-hidden font-sans select-none">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-600 rounded-full blur-[160px]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-indigo-900 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[url('/src/assets/sac-background.svg')] bg-repeat opacity-5" />
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6 bg-gradient-to-b from-slate-950/80 to-transparent">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                SAC
              </span>
              <span className="text-slate-500 font-light">|</span>
              <span className="animate-in fade-in slide-in-from-left-4 duration-500">
                {currentPage.title}
              </span>
            </h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">
              Visualización de Estadísticas · Período {year}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-1 gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevPage}
              className="h-10 w-10 text-slate-400 hover:text-white hover:bg-slate-800 transition-all rounded-xl"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPaused(!isPaused)}
              className="h-10 w-10 text-white bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/20 transition-all rounded-xl"
            >
              {isPaused ? <Play className="h-5 w-5 fill-current" /> : <Pause className="h-5 w-5 fill-current" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextPage}
              className="h-10 w-10 text-slate-400 hover:text-white hover:bg-slate-800 transition-all rounded-xl"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="w-px h-8 bg-slate-800 mx-2" />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-12 w-12 text-slate-400 hover:text-white hover:bg-slate-800 transition-all rounded-2xl border border-slate-800/50"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-12 w-12 bg-red-950/20 text-red-400 hover:bg-red-900 hover:text-white border border-red-900/30 transition-all rounded-2xl"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative flex-1 min-h-0 w-full px-12 pb-12 flex flex-col items-center justify-center">
        <div 
          key={currentPage.id}
          className="w-full h-full max-w-[1400px] animate-in fade-in zoom-in-95 duration-700 ease-out bg-slate-900/40 rounded-3xl border border-slate-800/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/50"
        >
          {currentPage.component}
        </div>
      </div>

      {/* Footer / Page Indicator */}
      <div className="relative z-10 px-8 py-4 flex items-center justify-between border-t border-slate-900 bg-slate-950/50 backdrop-blur-md">
        <div className="flex gap-2">
          {pages.map((_, i) => (
            <div 
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                i === currentPageIndex ? "w-12 bg-blue-500" : "w-2 bg-slate-800"
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            Slide {currentPageIndex + 1} de {pages.length}
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight">
            En Vivo
          </span>
        </div>
      </div>
    </div>
  );
}
