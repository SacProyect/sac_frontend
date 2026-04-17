import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/UI/card";
import { Button } from "@/components/UI/button";
import { Input } from "@/components/UI/input";
import { Label } from "@/components/UI/label";
import { isNotificationsFeatureEnabled } from "@/config/feature-flags";
import { ProcedureType } from "@/types/notifications";
import {
  getEscalationConfigs,
  updateEscalationConfig,
} from "@/components/utils/api/notifications-functions";

type EscalationFormState = Record<ProcedureType, { escalationDays: number; notifyRole: string }>;

const PROCEDURE_OPTIONS: ProcedureType[] = [
  ProcedureType.FP,
  ProcedureType.AF,
  ProcedureType.VDF,
  ProcedureType.NA,
];

const createDefaultState = (): EscalationFormState => ({
  [ProcedureType.FP]: { escalationDays: 5, notifyRole: "COORDINATOR" },
  [ProcedureType.AF]: { escalationDays: 5, notifyRole: "COORDINATOR" },
  [ProcedureType.VDF]: { escalationDays: 5, notifyRole: "COORDINATOR" },
  [ProcedureType.NA]: { escalationDays: 5, notifyRole: "COORDINATOR" },
});

export function EscalationConfigTab() {
  const [state, setState] = useState<EscalationFormState>(createDefaultState);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isNotificationsFeatureEnabled) {
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        const list = await getEscalationConfigs();
        if (!list.length) {
          return;
        }

        setState((previous) => {
          const next = { ...previous };
          for (const item of list) {
            if (!PROCEDURE_OPTIONS.includes(item.procedureType)) {
              continue;
            }
            next[item.procedureType] = {
              escalationDays: item.escalationDays,
              notifyRole: item.notifyRole,
            };
          }
          return next;
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudo cargar la configuración.";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const handleSave = async () => {
    if (!isNotificationsFeatureEnabled) {
      toast("Las notificaciones están desactivadas.");
      return;
    }

    try {
      setIsSaving(true);
      await Promise.all(
        PROCEDURE_OPTIONS.map((procedureType) =>
          updateEscalationConfig(procedureType, state[procedureType])
        )
      );
      toast.success("Configuración de escalamiento actualizada.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo actualizar la configuración.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isNotificationsFeatureEnabled) {
    return null;
  }

  return (
    <Card className="border-slate-700 bg-slate-800/80 p-6">
      <div className="mb-6 border-b border-slate-700 pb-5">
        <h3 className="text-lg font-semibold text-white">Escalamiento de Notificaciones</h3>
        <p className="text-sm text-slate-400">
          Configuración exclusiva de administrador para definir escalamiento por procedimiento.
        </p>
      </div>

      <div className="space-y-4">
        {PROCEDURE_OPTIONS.map((procedureType) => (
          <div
            key={procedureType}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-700 bg-slate-900/70 p-4 transition-all hover:border-slate-600 md:grid-cols-3"
          >
            <div className="md:col-span-1">
              <p className="text-xs font-semibold tracking-wide text-slate-400">PROCEDIMIENTO</p>
              <p className="mt-1 text-sm font-semibold text-slate-100">{procedureType}</p>
            </div>
            <div>
              <Label className="mb-1 block text-xs text-slate-400">Días para escalar</Label>
              <Input
                type="number"
                min={1}
                value={state[procedureType].escalationDays}
                onChange={(event) =>
                  setState((previous) => ({
                    ...previous,
                    [procedureType]: {
                      ...previous[procedureType],
                      escalationDays: Math.max(1, Number(event.target.value)),
                    },
                  }))
                }
                className="border-slate-600 bg-slate-800 text-white"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs text-slate-400">Rol destino</Label>
              <Input
                value={state[procedureType].notifyRole}
                onChange={(event) =>
                  setState((previous) => ({
                    ...previous,
                    [procedureType]: {
                      ...previous[procedureType],
                      notifyRole: event.target.value.toUpperCase(),
                    },
                  }))
                }
                className="border-slate-600 bg-slate-800 text-white"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-700 pt-5">
        <p className="text-xs text-slate-400">
          Solo disponible para perfiles con permisos de administración.
        </p>
        <Button
          type="button"
          disabled={isSaving || isLoading}
          onClick={() => void handleSave()}
          className="bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {isSaving ? "Guardando..." : "Guardar configuración"}
        </Button>
      </div>
    </Card>
  );
}
