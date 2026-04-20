import React, { useState, useEffect } from "react";
import { useForm, useController } from "react-hook-form";
import toast from "react-hot-toast";
import { createIndexIva } from "../utils/api/taxpayer-functions";
import Decimal from "decimal.js";
import {
  Settings2,
  ShieldCheck,
  AlertCircle,
  Activity,
  FileText,
  Save,
} from "lucide-react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/UI/card";
import { Label } from "@/components/UI/label";
import { Input } from "@/components/UI/input";
import { Button } from "@/components/UI/button";
import { Badge } from "@/components/UI/badge";

type IndexIvaFormData = {
  ordinaryAmount: string;
  specialAmount: string;
};

interface IndexIvaFormProps {
  onSuccess?: () => void;
}

// -------------------------------------------------------------------
// Utilidades de formateo venezolano: punto=miles, coma=decimal
// -------------------------------------------------------------------

/** Convierte "20.000,50" → 20000.50 para parsear como float */
function parseVES(display: string): number {
  return parseFloat(display.replace(/\./g, "").replace(",", "."));
}

/** Formatea el número mientras escribe:
 *  - Solo permite dígitos y una coma decimal
 *  - Agrega puntos de miles en la parte entera automáticamente
 *  Retorna { display, raw } donde raw es el número limpio ("20000.50")
 */
function formatInput(value: string): { display: string; raw: string } {
  // Permitir solo dígitos y una coma
  let clean = value.replace(/[^0-9,]/g, "");
  // Asegurar una sola coma
  const parts = clean.split(",");
  const integerStr = parts[0];
  const decimalStr = parts.length > 1 ? parts[1] : null;

  // Añadir puntos de miles a la parte entera
  const intFormatted = integerStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  // Construir display
  const display =
    decimalStr !== null ? `${intFormatted},${decimalStr}` : intFormatted;

  // Construir raw (valor numérico limpio, punto como decimal)
  const rawNum = integerStr + (decimalStr !== null ? "." + decimalStr : "");
  const raw = rawNum === "" || rawNum === "." ? "" : rawNum;

  return { display, raw };
}

// -------------------------------------------------------------------
// Sub-componente de input controlado con formateo
// -------------------------------------------------------------------
interface AmountFieldProps {
  name: keyof IndexIvaFormData;
  label: string;
  placeholder: string;
  accentClass: string;
  iconColor: string;
  icon: React.ReactNode;
  control: ReturnType<typeof useForm<IndexIvaFormData>>["control"];
  error?: string;
  resetKey?: number;
}

function AmountField({
  name,
  label,
  placeholder,
  accentClass,
  iconColor,
  icon,
  control,
  error,
  resetKey,
}: AmountFieldProps) {
  const [display, setDisplay] = useState("");

  // Limpiar el display cuando el formulario padre indica reset
  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
      setDisplay("");
    }
  }, [resetKey]);

  const {
    field: { onChange, onBlur, ref },
  } = useController({
    name,
    control,
    rules: {
      required: "Campo obligatorio",
      validate: (v) => {
        const n = parseFloat(v);
        if (!v || isNaN(n) || n <= 0) return "Debe ser mayor a 0";
        return true;
      },
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { display: formatted, raw } = formatInput(e.target.value);
    setDisplay(formatted);
    onChange(raw); // Guarda el valor numérico limpio en RHF
  };

  const handleFocus = () => {
    // Al enfocar, si el display es "0" o vacío → limpiar
    if (display === "0" || display === "") setDisplay("");
  };

  const handleBlur = () => {
    onBlur();
    // Al salir, si el display está vacío markarlo en RHF
    if (!display) onChange("");
  };

  return (
    <div className="space-y-3">
      <Label className={`text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2`}>
        <span className={iconColor}>{icon}</span> {label}
      </Label>
      <div className="relative group">
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[10px] text-slate-500 group-focus-within:${iconColor} transition-colors`}>
          Bs.
        </div>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={display}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`pl-12 h-14 bg-slate-950/30 border-slate-800 ${accentClass} rounded-2xl text-lg font-mono text-white`}
        />
      </div>
      {error && (
        <p className="px-1 text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// Formulario principal
// -------------------------------------------------------------------
function IndexIvaForm({ onSuccess }: IndexIvaFormProps) {
  const [resetKey, setResetKey] = useState(0);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<IndexIvaFormData>({
    mode: "onChange",
    defaultValues: {
      ordinaryAmount: "",
      specialAmount: "",
    },
  });

  const onSubmit = async (data: IndexIvaFormData) => {
    const toastId = toast.loading("Actualizando índices de IVA...");
    try {
      const payload = {
        ordinaryAmount: new Decimal(data.ordinaryAmount || 0),
        specialAmount: new Decimal(data.specialAmount || 0),
      };

      await createIndexIva(payload);
      toast.success("Índices de IVA actualizados correctamente", { id: toastId });
      reset();
      setResetKey((k) => k + 1); // dispara limpieza del display en los campos
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al actualizar los índices de IVA", { id: toastId });
    }
  };

  return (
    <div className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="w-full max-w-2xl bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl">
        <div className="p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400">
              <Settings2 className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                Configuración del Sistema
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-3xl font-bold text-white">
                  Parámetros de IVA
                </CardTitle>
                <CardDescription className="text-slate-400 mt-1">
                  Defina los índices base para el cálculo de declaraciones automáticas.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 self-start sm:self-center h-fit"
              >
                v2.1.0-Active
              </Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <AmountField
                name="ordinaryAmount"
                label="Índice Ordinario"
                placeholder="Ej: 16.000,00"
                accentClass="focus:ring-indigo-500/50"
                iconColor="text-indigo-400"
                icon={<FileText className="w-3.5 h-3.5" />}
                control={control}
                error={errors.ordinaryAmount?.message}
                resetKey={resetKey}
              />

              <AmountField
                name="specialAmount"
                label="Índice Especial"
                placeholder="Ej: 8.000,00"
                accentClass="focus:ring-emerald-500/50"
                iconColor="text-emerald-400"
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
                control={control}
                error={errors.specialAmount?.message}
                resetKey={resetKey}
              />

            </div>

            {/* Insight */}
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-start gap-4 animate-in zoom-in-95 duration-300">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  Impacto del Cambio
                </p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Actualizar estos valores afectará todos los cálculos de reportes pendientes
                  generados a partir de este momento. El sistema registrará esta modificación
                  en el historial de parámetros globales.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full bg-indigo-600 hover:bg-white hover:text-indigo-900 text-white font-bold py-7 rounded-2xl transition-all shadow-xl shadow-indigo-500/10 active:scale-[0.98] group"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-900/50 border-t-indigo-900 rounded-full animate-spin" />
                  Guardando Cambios...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Actualizar Parámetros Globales
                </span>
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default IndexIvaForm;
