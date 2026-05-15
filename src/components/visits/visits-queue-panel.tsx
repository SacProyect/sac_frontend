import { useEffect, useMemo, useState } from "react";
import { useVisitsMonitor } from "@/hooks/use-visits-monitor";
import { useVisitNotifications } from "@/hooks/use-visit-notifications";
import { Users, Volume2, VolumeX, Settings2, Bell, BellOff, Info } from "lucide-react";
import { Switch } from "@/components/UI/switch";
import { Label } from "@/components/UI/label";
import { Button } from "@/components/UI/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/UI/select";

export const VisitsQueuePanel = () => {
  const { liveVisits, lastRealtimeEvent, wsStatus } = useVisitsMonitor();
  const { settings, setSettings, notifyVisit, availableVoices, isEnabled } = useVisitNotifications();
  const [showSettings, setShowSettings] = useState(false);

  // Shortcut Ctrl+Alt+V to toggle settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setShowSettings(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtramos solo las visitas en espera para la "cola"
  const queue = useMemo(() => {
    return liveVisits
      .filter((v) => v.status === "espera")
      .sort((a, b) => {
        const timeA = `${a.entry_date}T${a.entry_time}`;
        const timeB = `${b.entry_date}T${b.entry_time}`;
        return new Date(timeA).getTime() - new Date(timeB).getTime();
      });
  }, [liveVisits]);

  // Escuchamos eventos en tiempo real para notificar
  useEffect(() => {
    if (lastRealtimeEvent?.type === "visit.created" && lastRealtimeEvent.visitId) {
      const visit = liveVisits.find((v) => v.id === lastRealtimeEvent.visitId);
      if (visit) {
        const fiscalName = visit.fiscal_name || "Un fiscal";
        const contributorName = visit.contributor_name || visit.contribuyente || "Contribuyente";
        notifyVisit(visit.id, fiscalName, contributorName);
      }
    }
  }, [lastRealtimeEvent, liveVisits, notifyVisit]);

  const handleTestSound = () => {
    notifyVisit("test-" + Date.now(), "Sistema SAC", "de Prueba");
  };

  if (!isEnabled) return null;

  return (
    <div className="flex flex-col h-full w-[320px] bg-slate-950/80 border-l border-slate-800/50 backdrop-blur-xl transition-all duration-500 animate-in slide-in-from-right-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50 bg-slate-900/40">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Users className="w-5 h-5 text-blue-400" />
            {queue.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white animate-pulse">
                {queue.length}
              </span>
            )}
          </div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Cola de Visitas</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            "h-8 w-8 rounded-lg transition-colors",
            showSettings ? "bg-blue-600/20 text-blue-400" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
          )}
        >
          <Settings2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Settings Overlay */}
      {showSettings && (
        <div className="absolute inset-x-0 top-[57px] z-20 p-4 bg-slate-900/95 border-b border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Configuración de Alertas</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-1.5 rounded-md", settings.voiceEnabled ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500")}>
                  {settings.voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="voice-toggle" className="text-xs font-bold text-slate-200">Voz de Notificación</Label>
                  <span className="text-[10px] text-slate-500">Llamada por altavoz</span>
                </div>
              </div>
              <Switch
                id="voice-toggle"
                checked={settings.voiceEnabled}
                onCheckedChange={(v) => setSettings({ ...settings, voiceEnabled: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-1.5 rounded-md", settings.soundEnabled ? "bg-blue-500/10 text-blue-400" : "bg-slate-800 text-slate-500")}>
                  {settings.soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="sound-toggle" className="text-xs font-bold text-slate-200">Sonido de Alerta</Label>
                  <span className="text-[10px] text-slate-500">Campana de aviso</span>
                </div>
              </div>
              <Switch
                id="sound-toggle"
                checked={settings.soundEnabled}
                onCheckedChange={(v) => setSettings({ ...settings, soundEnabled: v })}
              />
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/50">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selector de Voz</Label>
              <Select 
                value={settings.voiceURI || (availableVoices[0]?.voiceURI)} 
                onValueChange={(v) => setSettings({ ...settings, voiceURI: v })}
              >
                <SelectTrigger className="h-8 bg-slate-950/50 border-slate-800 text-[11px] font-bold text-slate-200">
                  <SelectValue placeholder="Seleccionar voz" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  {availableVoices.length > 0 ? (
                    availableVoices.map((voice) => (
                      <SelectItem key={voice.voiceURI} value={voice.voiceURI} className="text-[11px]">
                        {voice.name.replace("Google", "G.").replace("Microsoft", "MS.")}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled className="text-[11px]">No hay voces disponibles</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full h-8 text-[11px] font-bold border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-slate-300"
              onClick={handleTestSound}
            >
              Probar Sonido y Voz
            </Button>
          </div>
        </div>
      )}

      {/* Queue Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-600 gap-3">
            <div className="p-4 rounded-full bg-slate-900/50 border border-slate-800/50">
              <Users className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-xs font-medium italic">No hay visitas en espera</p>
          </div>
        ) : (
          queue.map((visit, idx) => (
            <div
              key={visit.id}
              className="group relative p-3 rounded-xl bg-slate-900/40 border border-slate-800/50 hover:border-blue-500/30 hover:bg-slate-900/60 transition-all duration-300 animate-in fade-in slide-in-from-right-4"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-black text-slate-100 leading-tight group-hover:text-blue-400 transition-colors">
                    {visit.contributor_name || visit.contribuyente || "Sin nombre"}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                    {visit.entry_time.slice(0, 5)}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[10px] font-bold text-slate-400 truncate">
                    Asignado a: <span className="text-slate-200">{visit.fiscal_name || "Pendiente"}</span>
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800/30">
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase tracking-wider font-bold">
                    <Info className="w-3 h-3" />
                    <span>{visit.department || "General"}</span>
                  </div>
                </div>
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-blue-500/0 via-white/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))
        )}
      </div>

      {/* Footer Status */}
      <div className="p-3 border-t border-slate-800/50 bg-slate-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              wsStatus === 'connected' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
              wsStatus === 'connecting' ? "bg-amber-500 animate-pulse" : "bg-red-500"
            )} />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              {wsStatus === 'connected' ? "Conectado" : wsStatus === 'connecting' ? "Conectando..." : "Desconectado"}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-600">
            {new Date().toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
};
