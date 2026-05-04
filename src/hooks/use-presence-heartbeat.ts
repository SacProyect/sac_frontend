import { useEffect, useRef } from "react";
import { sendPresenceHeartbeat } from "@/components/utils/api/user-functions";

type PresenceHeartbeatOptions = {
  enabled: boolean;
  intervalMs?: number;
  activityThrottleMs?: number;
};

export function usePresenceHeartbeat({
  enabled,
  intervalMs = 90_000,
  activityThrottleMs = 30_000,
}: PresenceHeartbeatOptions) {
  const lastSentAtRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;

    const canSendNow = () => Date.now() - lastSentAtRef.current >= activityThrottleMs;

    const pushPresence = async () => {
      if (disposed || document.visibilityState !== "visible") return;
      if (!canSendNow()) return;
      lastSentAtRef.current = Date.now();
      await sendPresenceHeartbeat();
    };

    // Primer ping cuando entra a sesión/página visible.
    void pushPresence();

    const timer = window.setInterval(() => {
      void pushPresence();
    }, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void pushPresence();
      }
    };

    const onActivity = () => {
      void pushPresence();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, [enabled, intervalMs, activityThrottleMs]);
}
