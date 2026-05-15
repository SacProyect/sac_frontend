import { useCallback, useEffect, useRef } from "react";
import { isVisitNotificationsFeatureEnabled } from "@/config/feature-flags";
import { useLocalStorage } from "./use-local-storage";

interface VisitNotificationOptions {
  voiceEnabled: boolean;
  soundEnabled: boolean;
  voiceURI?: string;
}

export const useVisitNotifications = () => {
  const [settings, setSettings] = useLocalStorage<VisitNotificationOptions>("sac-visit-notification-settings", {
    voiceEnabled: true,
    soundEnabled: true,
    voiceURI: undefined,
  });

  const lastProcessedVisitId = useRef<string | null>(null);

  // Warm up voices
  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!settings.soundEnabled || !isVisitNotificationsFeatureEnabled) return;

    // Play the custom "tun tun tuntun" sound
    const audio = new Audio('/sounds/notificacion2.mp3');
    audio.play().catch(error => {
      console.warn("No se pudo reproducir el sonido de notificación:", error);
    });
  }, [settings.soundEnabled]);

  const speakNotification = useCallback((fiscalName: string, contributorName: string) => {
    if (!settings.voiceEnabled || !isVisitNotificationsFeatureEnabled) return;

    const message = `${fiscalName} te solicita contribuyente. por favor pasar a recepcion`;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "es-ES";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    // Buscar la voz seleccionada o la mejor disponible
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.voiceURI === settings.voiceURI);

    if (!selectedVoice) {
      selectedVoice = 
        voices.find(v => v.lang.includes("es") && v.name.toLowerCase().includes("google")) ||
        voices.find(v => v.lang.includes("es") && v.name.toLowerCase().includes("natural")) ||
        voices.find(v => v.lang.includes("es")) || 
        voices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [settings.voiceEnabled, settings.voiceURI]);

  const notifyVisit = useCallback((visitId: string, fiscalName: string, contributorName: string) => {
    if (lastProcessedVisitId.current === visitId) return;
    lastProcessedVisitId.current = visitId;

    playNotificationSound();

    // Delay voice slightly after sound
    setTimeout(() => {
      speakNotification(fiscalName, contributorName);
    }, 800);
  }, [playNotificationSound, speakNotification]);

  const availableVoices = useCallback(() => {
    return window.speechSynthesis.getVoices().filter(v => v.lang.includes("es"));
  }, []);

  return {
    settings,
    setSettings,
    notifyVisit,
    availableVoices: availableVoices(),
    isEnabled: isVisitNotificationsFeatureEnabled
  };
};
