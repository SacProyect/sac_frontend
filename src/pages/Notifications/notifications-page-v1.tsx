import { useEffect } from "react";
import { Check, RefreshCcw } from "lucide-react";
import { Button } from "@/components/UI/button";
import { Card } from "@/components/UI/card";
import { Badge } from "@/components/UI/badge";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationStatus, SocketConnectionStatus } from "@/types/notifications";
import toast from "react-hot-toast";

const statusToLabel = (status: string): string => {
  if (status === NotificationStatus.READ) return "Leída";
  if (status === NotificationStatus.PENDING) return "Pendiente";
  if (status === NotificationStatus.SENT) return "Enviada";
  if (status === NotificationStatus.CONFIRMED) return "Confirmada";
  return "Sin estado";
};



export default function NotificationsPageV1() {
  const {
    notifications,
    unreadCount,
    connectionStatus,
    page,
    totalPages,
    total,
    isLoadingPage,
    pageError,
    loadPage,
    markAsRead,
    refreshUnread,
  } = useNotifications();

  useEffect(() => {
    void loadPage(page);
  }, [loadPage, page]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      toast.success("Notificación confirmada.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo marcar como leída.";
      toast.error(message);
    }
  };
  const switch_lang = (status: SocketConnectionStatus) => {
    switch (status) {
      case "connected":
        return "Conectado";
      case "disconnected":
        return "Desconectado"; 
      case "error":
        return "Error";
      case "fallback_polling":
        return "Polling de fallback";
      case "connecting":
        return "Conectando";
      case "idle":
        return "Inactivo";
    }
  };
  const connectionStatusLabel = switch_lang(connectionStatus);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Centro de Notificaciones</h1>
          <p className="mt-2 text-slate-400">
            Estado: <span className="font-semibold text-indigo-300">{connectionStatusLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="text-xs">
            No leídas: {unreadCount}
          </Badge>
          <Button
            type="button"
            variant="outline"
            className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-700"
            onClick={() => {
              void refreshUnread();
              void loadPage(page);
            }}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refrescar
          </Button>
        </div>
      </div>

      {pageError && (
        <Card className="border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{pageError}</Card>
      )}

      <Card className="border-slate-700 bg-slate-800/60 p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-300">
            {isLoadingPage
              ? "Cargando notificaciones..."
              : `${total.toLocaleString()} notificaciones en total`}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1 || isLoadingPage}
              className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-700"
              onClick={() => void loadPage(page - 1)}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={page >= totalPages || isLoadingPage}
              className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-700"
              onClick={() => void loadPage(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {!isLoadingPage && notifications.length === 0 && (
            <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-6 text-center text-sm text-slate-400">
              No hay notificaciones para   mostrar.
            </div>
          )}

          {notifications.map((item) => {
            const isRead = [NotificationStatus.READ, NotificationStatus.CONFIRMED].includes(item.status as NotificationStatus);
            const isPending = [NotificationStatus.PENDING].includes(item.status as NotificationStatus);
            const showConfirmButton = isPending;
            return (
              <div
                key={item.id}
                className="rounded-lg border border-slate-700 bg-slate-900/70 p-4 transition-all hover:border-slate-600"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-300">{item.message}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString("es-VE")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={isPending ? "secondary" : "success"}>
                      {statusToLabel(item.status as NotificationStatus)}
                    </Badge>

                    {showConfirmButton && (
                      <Button
                        type="button"
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => void handleMarkAsRead(item.id)}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Confirmar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
