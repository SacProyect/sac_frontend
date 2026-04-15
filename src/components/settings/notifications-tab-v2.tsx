import { useEffect, useState } from "react";
import { AlertCircle, Bell, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/UI/card";
import { Button } from "@/components/UI/button";
import { Input } from "@/components/UI/input";
import { Label } from "@/components/UI/label";
import {
  createNotificationThreshold,
  getDefaultNotificationThreshold,
  getNotificationThreshold,
  updateDefaultNotificationThreshold,
} from "@/components/utils/api/notifications-functions";
import { ProcedureType } from "@/types/notifications";
import { useAuth } from "@/hooks/use-auth";
import { EscalationConfigTab } from "@/components/settings/escalation-config-tab";

type ThresholdState = Record<ProcedureType, number>;

const PROCEDURES: ProcedureType[] = [
  ProcedureType.FP,
  ProcedureType.AF,
  ProcedureType.VDF,
  ProcedureType.NA,
];

const DEFAULT_THRESHOLDS: ThresholdState = {
  [ProcedureType.FP]: 7,
  [ProcedureType.AF]: 7,
  [ProcedureType.VDF]: 7,
  [ProcedureType.NA]: 7,
};

export function NotificationsTabV2() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [defaultThreshold, setDefaultThreshold] = useState(7);
  const [thresholds, setThresholds] = useState<ThresholdState>(DEFAULT_THRESHOLDS);

  const sanitizeDayValue = (value: number): number => {
    if (Number.isNaN(value) || value < 1) {
      return 1;
    }
    return value;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const defaultConfig = await getDefaultNotificationThreshold();
        if (defaultConfig?.daysBeforeDue) {
          setDefaultThreshold(defaultConfig.daysBeforeDue);
        }

        const entries = await Promise.all(
          PROCEDURES.map(async (procedureType) => ({
            procedureType,
            config: await getNotificationThreshold(procedureType),
          }))
        );

        setThresholds((current) => {
          const next = { ...current };
          for (const entry of entries) {
            if (entry.config?.daysBeforeDue) {
              next[entry.procedureType] = entry.config.daysBeforeDue;
            }
          }
          return next;
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar los umbrales.";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateDefaultNotificationThreshold({
        daysBeforeDue: sanitizeDayValue(defaultThreshold),
      });
      await Promise.all(
        PROCEDURES.map((procedureType) =>
          createNotificationThreshold({
            procedureType,
            daysBeforeDue: sanitizeDayValue(thresholds[procedureType]),
          })
        )
      );
      toast.success("Umbrales de notificación actualizados.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudieron guardar los umbrales.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-700 bg-slate-800/80 p-6">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-700 pb-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-2">
              <Bell className="h-5 w-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-semibold text-white">Gestión de Notificaciones</h3>
              <p className="text-sm text-slate-400">
                Define umbrales por procedimiento para disparar alertas y mantener seguimiento.
              </p>
            </div>
          </div>
          <div className="rounded-md border border-slate-600 bg-slate-900 px-3 py-1 text-xs text-slate-300">
            Rol actual: <span className="font-semibold text-slate-100">{user?.role ?? "N/A"}</span>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/80 p-4">
          <p className="mb-3 text-sm font-medium text-slate-200">Umbral base global</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr] md:items-center">
            <Label className="text-xs text-slate-400">Días por defecto antes de vencimiento</Label>
            <Input
              type="number"
              min={1}
              value={defaultThreshold}
              onChange={(event) => setDefaultThreshold(sanitizeDayValue(Number(event.target.value)))}
              className="border-slate-600 bg-slate-800 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {PROCEDURES.map((procedureType) => (
            <div
              key={procedureType}
              className="rounded-lg border border-slate-700 bg-slate-900/70 p-4 transition-all hover:border-slate-600"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold tracking-wide text-slate-400">PROCEDIMIENTO</p>
                <span className="rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-100">
                  {procedureType}
                </span>
              </div>
              <div className="mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <p className="text-sm font-semibold text-slate-100">
                  Detección temprana para {procedureType}
                </p>
              </div>
              <Label className="mb-1 block text-xs text-slate-400">Días antes de vencimiento</Label>
              <Input
                type="number"
                min={1}
                value={thresholds[procedureType]}
                onChange={(event) =>
                  setThresholds((current) => ({
                    ...current,
                    [procedureType]: sanitizeDayValue(Number(event.target.value)),
                  }))
                }
                className="border-slate-600 bg-slate-800 text-white"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-700 pt-5 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-slate-400">
            Los cambios aplican a la generación de alertas desde backend y refresco del centro de notificaciones.
          </p>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || isLoading}
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {isSaving ? "Guardando..." : "Guardar umbrales"}
          </Button>
        </div>
      </Card>

      {user?.role === "ADMIN" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Configuración avanzada de escalamiento (solo ajustes de notificaciones).
          </div>
          <EscalationConfigTab />
        </div>
      )}
    </div>
  );
}
