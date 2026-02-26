import React, { useState } from "react";
import { useForm } from "react-hook-form";
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
  Coins
} from 'lucide-react';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/UI/card';
import { Label } from '@/components/UI/label';
import { Input } from '@/components/UI/input';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import { cn } from "@/lib/utils";

type IndexIvaFormData = {
    ordinaryAmount: string; // Use string for form input to handle decimals better
    specialAmount: string;
};

/**
 * IndexIvaForm - Interfaz Premium para Actualización de Índices de IVA
 */
function IndexIvaForm() {
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isValid, isSubmitting },
    } = useForm<IndexIvaFormData>({
        mode: "onChange",
        defaultValues: {
            ordinaryAmount: "0",
            specialAmount: "0",
        },
    });

    const watchValues = watch();

    const onSubmit = async (data: IndexIvaFormData) => {
        const toastId = toast.loading("Actualizando índices de IVA...");
        try {
            const payload = {
                ordinaryAmount: new Decimal(data.ordinaryAmount.replace(',', '.') || 0),
                specialAmount: new Decimal(data.specialAmount.replace(',', '.') || 0),
            };

            await createIndexIva(payload);
            toast.success("Índices de IVA actualizados correctamente", { id: toastId });
            reset();
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
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Configuración del Sistema</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-3xl font-bold text-white">Parámetros de IVA</CardTitle>
                                <CardDescription className="text-slate-400 mt-1">
                                    Defina los índices base para el cálculo de declaraciones automáticas.
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 self-start sm:self-center h-fit">
                                v2.1.0-Active
                            </Badge>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* ORDINARY */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" /> Índice Ordinario
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[10px] text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                        BsS
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="0.00"
                                        {...register("ordinaryAmount", {
                                            required: "Campo obligatorio",
                                        })}
                                        className="pl-12 h-14 bg-slate-950/30 border-slate-800 focus:ring-indigo-500/50 rounded-2xl text-lg font-mono text-white"
                                    />
                                </div>
                                {errors.ordinaryAmount && (
                                    <p className="px-1 text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {errors.ordinaryAmount.message}
                                    </p>
                                )}
                            </div>

                            {/* SPECIAL */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Índice Especial
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[10px] text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                                        BsS
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="0.00"
                                        {...register("specialAmount", {
                                            required: "Campo obligatorio",
                                        })}
                                        className="pl-12 h-14 bg-slate-950/30 border-slate-800 focus:ring-emerald-500/50 rounded-2xl text-lg font-mono text-white"
                                    />
                                </div>
                                {errors.specialAmount && (
                                    <p className="px-1 text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {errors.specialAmount.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Visual Summary / Insight */}
                        <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-start gap-4 animate-in zoom-in-95 duration-300">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                                <Activity className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Impacto del Cambio</p>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                    Actualizar estos valores afectará todos los cálculos de reportes pendientes generados a partir de este momento. 
                                    El sistema registrará esta modificación en el historial de parámetros globales.
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

