import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/UI/dialog';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Textarea } from '@/components/UI/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select';
import { User, Building2, Calendar, FileText, Loader2, AlertCircle } from 'lucide-react';
import type { CreateControlPayload } from '@/components/utils/api/controles-ingreso-functions';
import type { Coordinacion } from '@/types/controles-ingreso';
import { COORDINACION_LABELS } from '@/types/controles-ingreso';

const createControlSchema = z.object({
  subject_name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  subject_rif: z.string().min(5, 'RIF inválido'),
  subject_address: z.string().min(5, 'La dirección es muy corta'),
  coordination_id: z.enum([
    'COORDINACION_1',
    'COORDINACION_2',
    'COORDINACION_3',
    'COORDINACION_4',
    'COORDINACION_5',
  ]),
  start_date: z.string().min(1, 'La fecha de inicio es requerida'),
  notes: z.string().optional(),
});

type CreateControlFormData = z.infer<typeof createControlSchema>;

interface NuevoControlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateControlPayload) => void;
}

function getNextControlNumber(): string {
  const year = new Date().getFullYear();
  // Simulación de contador estimado para preview
  const estimated = Math.floor(Math.random() * 900) + 100;
  return `CI-${year}-${estimated}`;
}

export function NuevoControlDialog({ open, onOpenChange, onSubmit }: NuevoControlDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewNumber, setPreviewNumber] = useState(() => getNextControlNumber());

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateControlFormData>({
    resolver: zodResolver(createControlSchema),
    defaultValues: {
      subject_name: '',
      subject_rif: '',
      subject_address: '',
      coordination_id: undefined,
      start_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const watchedCoordination = watch('coordination_id');

  // Resetear formulario y preview cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      reset({
        subject_name: '',
        subject_rif: '',
        subject_address: '',
        coordination_id: undefined,
        start_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setPreviewNumber(getNextControlNumber());
    }
  }, [open, reset]);

  const onFormSubmit = async (data: CreateControlFormData) => {
    setIsSubmitting(true);
    try {
      onSubmit({
        coordination_id: data.coordination_id as Coordinacion,
        subject_name: data.subject_name.trim(),
        subject_rif: data.subject_rif.trim(),
        subject_address: data.subject_address.trim(),
        subject_parish_id: '',
        start_date: data.start_date,
        notes: data.notes?.trim() || null,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      reset();
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-2xl p-0 gap-0 overflow-hidden">
            <motion.div
              className="flex flex-col max-h-[85vh]"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <DialogHeader className="px-6 pt-6 pb-2 shrink-0 space-y-2">
                <DialogTitle className="text-xl font-semibold text-slate-100">
                  Nuevo Control de Ingreso
                </DialogTitle>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-medium">
                    {previewNumber}
                  </span>
                  <span className="text-slate-400">(número estimado)</span>
                </div>
                <DialogDescription className="text-slate-400">
                  Complete los datos para crear un nuevo control. El control se creará en estado Borrador.
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-y-auto flex-1 px-6 py-2">
                <form id="nuevo-control-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
                {/* ── Datos del Sujeto Pasivo ── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-300 border-b border-slate-700/50 pb-1">
                    <User className="h-4 w-4 text-indigo-400" />
                    <span>Datos del Sujeto Pasivo</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="subject_name" className="text-slate-300">
                        Nombre / Razón Social <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="subject_name"
                        {...register('subject_name')}
                        placeholder="Ej: Comercializadora Los Andes, C.A."
                        className={`bg-slate-900/50 border-slate-700 text-slate-100 ${
                          errors.subject_name ? 'border-red-500 focus-visible:ring-red-500' : ''
                        }`}
                      />
                      <AnimatePresence>
                        {errors.subject_name && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs text-red-400 flex items-center gap-1"
                          >
                            <AlertCircle className="h-3 w-3" />
                            {errors.subject_name.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="subject_rif" className="text-slate-300">
                        RIF <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="subject_rif"
                        {...register('subject_rif')}
                        placeholder="Ej: J-40.891.234-5"
                        className={`bg-slate-900/50 border-slate-700 text-slate-100 ${
                          errors.subject_rif ? 'border-red-500 focus-visible:ring-red-500' : ''
                        }`}
                      />
                      <AnimatePresence>
                        {errors.subject_rif && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs text-red-400 flex items-center gap-1"
                          >
                            <AlertCircle className="h-3 w-3" />
                            {errors.subject_rif.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subject_address" className="text-slate-300">
                      Dirección <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="subject_address"
                      {...register('subject_address')}
                      placeholder="Dirección del establecimiento"
                      className={`bg-slate-900/50 border-slate-700 text-slate-100 ${
                        errors.subject_address ? 'border-red-500 focus-visible:ring-red-500' : ''
                      }`}
                    />
                    <AnimatePresence>
                      {errors.subject_address && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-red-400 flex items-center gap-1"
                        >
                          <AlertCircle className="h-3 w-3" />
                          {errors.subject_address.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ── Datos del Control ── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-300 border-b border-slate-700/50 pb-1">
                    <Building2 className="h-4 w-4 text-indigo-400" />
                    <span>Datos del Control</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="coordination_id" className="text-slate-300">
                      Coordinación <span className="text-red-400">*</span>
                    </Label>
                    <Select
                      value={watchedCoordination || ''}
                      onValueChange={(value) =>
                        setValue('coordination_id', value as Coordinacion, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger
                        id="coordination_id"
                        className={`bg-slate-900/50 border-slate-700 text-slate-100 ${
                          errors.coordination_id ? 'border-red-500 focus:ring-red-500' : ''
                        }`}
                      >
                        <SelectValue placeholder="Seleccionar coordinación" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {(Object.keys(COORDINACION_LABELS) as Coordinacion[]).map((key) => (
                          <SelectItem key={key} value={key} className="text-slate-100">
                            {COORDINACION_LABELS[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <AnimatePresence>
                      {errors.coordination_id && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-red-400 flex items-center gap-1"
                        >
                          <AlertCircle className="h-3 w-3" />
                          {errors.coordination_id.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="start_date" className="text-slate-300">
                      Fecha de Inicio <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <Input
                        id="start_date"
                        type="date"
                        {...register('start_date')}
                        className={`bg-slate-900/50 border-slate-700 text-slate-100 pl-10 ${
                          errors.start_date ? 'border-red-500 focus-visible:ring-red-500' : ''
                        }`}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.start_date && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-red-400 flex items-center gap-1"
                        >
                          <AlertCircle className="h-3 w-3" />
                          {errors.start_date.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ── Observaciones ── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-300 border-b border-slate-700/50 pb-1">
                    <FileText className="h-4 w-4 text-indigo-400" />
                    <span>Observaciones</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-slate-300">
                      Notas internas
                    </Label>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      placeholder="Notas internas sobre este control..."
                      rows={3}
                      className="bg-slate-900/50 border-slate-700 text-slate-100 resize-none"
                    />
                  </div>
                </div>

                </form>
              </div>
              <DialogFooter className="px-6 py-4 border-t border-slate-700/50 shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                  className="border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  form="nuevo-control-form"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creando...
                    </span>
                  ) : (
                    'Crear Control'
                  )}
                </Button>
              </DialogFooter>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
