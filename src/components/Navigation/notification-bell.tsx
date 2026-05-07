import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationBell() {
  const { isEnabled, unreadCount } = useNotifications();

  if (!isEnabled) {
    return null;
  }

  return (
    <Link
      to="/notifications"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700/50 bg-slate-800/40 text-slate-200 transition-all hover:border-indigo-500/60 hover:bg-slate-700/70 hover:text-white"
      aria-label="Abrir notificaciones"
      title="Notificaciones"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 text-center text-[10px] font-bold leading-5 text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
