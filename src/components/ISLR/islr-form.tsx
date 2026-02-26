import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Taxpayer } from '@/types/taxpayer';
import { 
  Calculator, 
  Calendar, 
  Building2, 
  ArrowRight, 
  Info, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  PieChart,
  CheckCircle2,
  AlertCircle,
  Search,
  Wallet
} from 'lucide-react';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/UI/card';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import { 
  DropdownMenu as Popover,
  DropdownMenuContent as PopoverContent,
  DropdownMenuTrigger as PopoverTrigger,
} from "@/components/UI/dropdown-menu";
import { cn } from "@/lib/utils";
import toast from 'react-hot-toast';
import { createISLR } from '@/components/utils/api/taxpayer-functions';
import { useCachedTaxpayersForEvents } from '@/hooks/useCachedData';
import Decimal from 'decimal.js';
import { IvaReportFormData } from '../iva/IvaForm';

// Campos locales del formulario (interacción con el usuario)
export interface IslrFormFields {
    taxpayerId: string;
    incomes: string;
    costs: string;
    expent: string;
    emition_date: string;
    paid: string;
}

// Interfaz para el API
export interface IslrReportFormData {
    taxpayerId: string;
    incomes: string;
    costs: string;
    expent: string;
    emition_date: string;
    paid: string;
}

/**
 * IslrForm - Interfaz Premium para Registro de ISLR
 */
function IslrForm() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { taxpayersForEvents: taxpayerArray, loading: loadingTaxpayers } = useCachedTaxpayersForEvents();
    
    const [selectedTaxpayer, setSelectedTaxpayer] = useState<Taxpayer | null>(null);
    const [searchValue, setSearchValue] = useState("");

    const { 
        register,
        handleSubmit,
        control,
        setValue,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<IslrFormFields>({
        mode: "onChange",
        defaultValues: {
            taxpayerId: "",
            incomes: "0",
            costs: "0",
            expent: "0",
            paid: "0",
            emition_date: new Date().toISOString().split('T')[0],
        },
    });

    const watchValues = watch();

    const filteredTaxpayers = useMemo(() => {
        if (!searchValue) return taxpayerArray.slice(0, 10);
        const s = searchValue.toLowerCase();
        return taxpayerArray.filter(t => 
            t.name.toLowerCase().includes(s) || 
            t.rif.toLowerCase().includes(s)
        ).slice(0, 10);
    }, [searchValue, taxpayerArray]);

    // Cálculos en tiempo real
    const fiscalAnalysis = useMemo(() => {
        try {
            const inc = new Decimal(watchValues.incomes.replace(',', '.') || 0);
            const cos = new Decimal(watchValues.costs.replace(',', '.') || 0);
            const exp = new Decimal(watchValues.expent.replace(',', '.') || 0);
            
            const grossProfit = inc.minus(cos);
            const netProfit = grossProfit.minus(exp);
            
            return { grossProfit, netProfit };
        } catch {
            return { grossProfit: new Decimal(0), netProfit: new Decimal(0) };
        }
    }, [watchValues.incomes, watchValues.costs, watchValues.expent]);

    useEffect(() => {
        if (!user) navigate("/login");
    }, [user, navigate]);

    const onSubmit = async (data: IslrFormFields) => {
        const toastId = toast.loading("Procesando declaración anual...");
        try {
            const formattedData: IslrReportFormData = {
                taxpayerId: data.taxpayerId,
                incomes: new Decimal(data.incomes.replace(",", ".")).toString(),
                costs: new Decimal(data.costs.replace(",", ".")).toString(),
                expent: new Decimal(data.expent.replace(",", ".")).toString(),
                emition_date: new Date(data.emition_date).toISOString(),
                paid: new Decimal(data.paid.replace(",", ".")).toString(),
            };

            const success = await createISLR(formattedData);
            if (success) {
                toast.success("¡Declaración de ISLR registrada con éxito!", { id: toastId });
                reset();
                setSelectedTaxpayer(null);
                await refreshUser();
            }
        } catch (e: any) {
            toast.error(e.message || "Error al procesar la declaración", { id: toastId });
        }
    };

    if (!user) return null;

    return (
        <div className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="w-full max-w-4xl bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* Panel Izquierdo: Formulario */}
                    <div className="lg:col-span-7 p-6 sm:p-8 space-y-8 bg-slate-900/40">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-emerald-400">
                                <Wallet className="w-5 h-5" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Rentas y Ganancias</span>
                            </div>
                            <CardTitle className="text-3xl font-bold text-white">Declaración de ISLR</CardTitle>
                            <CardDescription className="text-slate-400">
                                Registro de ingresos, costos y gastos para el ejercicio fiscal.
                            </CardDescription>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5" /> Contribuyente
                                </Label>
                                <Controller
                                    control={control}
                                    name="taxpayerId"
                                    rules={{ required: "Seleccione un contribuyente" }}
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-between bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl h-11",
                                                        !field.value && "text-slate-500"
                                                    )}
                                                >
                                                    {field.value && selectedTaxpayer
                                                        ? `${selectedTaxpayer.name} | ${selectedTaxpayer.rif}`
                                                        : "Seleccionar contribuyente..."}
                                                    <ArrowRight className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 p-0 bg-slate-900 border-slate-800 shadow-2xl overflow-hidden rounded-xl">
                                                <div className="p-2 border-b border-slate-800 bg-slate-950/50 flex items-center gap-2">
                                                    <Search className="w-4 h-4 text-slate-500" />
                                                    <input 
                                                        className="bg-transparent border-none text-xs text-slate-200 focus:ring-0 w-full placeholder:text-slate-600" 
                                                        placeholder="Filtrar por nombre o RIF..."
                                                        value={searchValue}
                                                        onChange={(e) => setSearchValue(e.target.value)}
                                                    />
                                                </div>
                                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                    {loadingTaxpayers ? (
                                                        <div className="p-4 text-xs text-slate-500 text-center italic">Cargando...</div>
                                                    ) : filteredTaxpayers.length === 0 ? (
                                                        <div className="p-4 text-xs text-slate-500 text-center">No hay resultados</div>
                                                    ) : (
                                                        filteredTaxpayers.map((t: Taxpayer) => (
                                                            <div
                                                                key={t.id}
                                                                onClick={() => {
                                                                    setSelectedTaxpayer(t);
                                                                    field.onChange(t.id);
                                                                }}
                                                                className="px-4 py-3 text-xs text-slate-300 hover:bg-emerald-600 hover:text-white cursor-pointer border-b border-slate-800/50 last:border-0"
                                                            >
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="font-semibold">{t.name}</span>
                                                                    <span className="text-[10px] opacity-70 uppercase">{t.rif}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Ingresos Totales (BS)</Label>
                                    <div className="relative group">
                                        <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                                        <Input
                                            {...register("incomes", { required: true })}
                                            className="pl-10 bg-slate-950/30 border-slate-800 focus:ring-emerald-500/50 rounded-xl h-11 text-slate-200"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Costos de Ventas (BS)</Label>
                                    <div className="relative group">
                                        <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
                                        <Input
                                            {...register("costs", { required: true })}
                                            className="pl-10 bg-slate-950/30 border-slate-800 focus:ring-rose-500/50 rounded-xl h-11 text-slate-200"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Gastos Operativos (BS)</Label>
                                    <div className="relative group">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                        <Input
                                            {...register("expent", { required: true })}
                                            className="pl-10 bg-slate-950/30 border-slate-800 focus:ring-indigo-500/50 rounded-xl h-11 text-slate-200"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Impuesto Pagado (BS)</Label>
                                    <div className="relative group">
                                        <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                                        <Input
                                            {...register("paid", { required: true })}
                                            className="pl-10 bg-slate-950/30 border-slate-800 focus:ring-emerald-500/50 rounded-xl h-11 text-slate-200 font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Fecha de Declaración</Label>
                                <div className="relative group">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                    <Input
                                        type="date"
                                        {...register("emition_date", { required: true })}
                                        className="pl-10 bg-slate-950/30 border-slate-800 focus:ring-indigo-500/50 rounded-xl h-11 text-slate-200"
                                    />
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={isSubmitting || !selectedTaxpayer}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-6 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:grayscale"
                            >
                                {isSubmitting ? "Procesando..." : "Guardar Registro ISLR"}
                            </Button>
                        </form>
                    </div>

                    {/* Panel Derecho: Resumen Financiero */}
                    <div className="lg:col-span-5 p-8 bg-slate-950/50 backdrop-blur-md border-l border-slate-800/50 flex flex-col justify-between">
                        <div className="space-y-8">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <PieChart className="w-4 h-4" /> Análisis Fiscal
                            </h3>

                            <div className="space-y-6">
                                <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-xs font-medium text-slate-400">Utilidad Bruta</p>
                                        <Badge variant={fiscalAnalysis.grossProfit.isPositive() ? "success" : "destructive"} className="bg-opacity-10 text-[10px]">
                                            {fiscalAnalysis.grossProfit.isPositive() ? "Superávit" : "Déficit"}
                                        </Badge>
                                    </div>
                                    <p className={cn(
                                        "text-2xl font-mono font-bold tracking-tighter",
                                        fiscalAnalysis.grossProfit.isPositive() ? "text-white" : "text-rose-400"
                                    )}>
                                        {new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(fiscalAnalysis.grossProfit.toNumber())}
                                    </p>
                                </div>

                                <div className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 space-y-4">
                                    <p className="text-xs font-medium text-emerald-400/70">Estimación Utilidad Neta</p>
                                    <p className={cn(
                                        "text-4xl font-mono font-bold tracking-tighter",
                                        fiscalAnalysis.netProfit.isPositive() ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                        {new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(fiscalAnalysis.netProfit.toNumber())}
                                    </p>
                                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={cn("h-full bg-emerald-500 transition-all duration-700")} style={{ width: fiscalAnalysis.netProfit.gt(0) ? '100%' : '0%' }} />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-slate-300">Auditoría Habilitada</p>
                                            <p className="text-[11px] text-slate-500">Este reporte será validado contra el Libro de Compras y Ventas.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-slate-300">Importante</p>
                                            <p className="text-[11px] text-slate-500">Verifique el RIF antes de guardar. No se permiten ediciones posteriores.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-800/50">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                                <Calculator className="w-5 h-5 text-indigo-400 shrink-0" />
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Base Imponible ISLR</p>
                                    <p className="text-xs text-slate-400 truncate">Sujeta a retenciones acumuladas.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default IslrForm;

