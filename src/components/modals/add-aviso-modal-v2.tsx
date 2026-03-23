import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/UI/dialog';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select';
import { createEvent, getTaxpayers } from '@/components/utils/api/taxpayer-functions';
import type { Taxpayer } from '@/types/taxpayer';
import { ModalFooter } from '@/components/UI/v2';
import toast from 'react-hot-toast';

interface AddAvisoModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface AvisoFormData {
  taxpayerId: string;
  date: string;
  amount: string;
  fineEventId: string;
}

export function AddAvisoModalV2({ isOpen, onClose, onSuccess }: AddAvisoModalV2Props) {
  const [formData, setFormData] = useState<AvisoFormData>({
    taxpayerId: '',
    date: '',
    amount: '',
    fineEventId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([]);
  const [fineEvents, setFineEvents] = useState<Array<{ id: string; description: string; amount: number }>>([]);

  // Cargar contribuyentes
  useEffect(() => {
    if (isOpen) {
      const loadTaxpayers = async () => {
        try {
          const response = await getTaxpayers();
          setTaxpayers(response.data ?? []);
        } catch (error) {
          console.error('Error cargando contribuyentes:', error);
        }
      };
      loadTaxpayers();
    }
  }, [isOpen]);

  // Cargar multas del contribuyente seleccionado
  useEffect(() => {
    if (formData.taxpayerId && isOpen) {
      // En una implementación real, cargarías los eventos de tipo FINE del contribuyente
      // Por ahora, dejamos el campo opcional
      setFineEvents([]);
    }
  }, [formData.taxpayerId, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.taxpayerId.trim()) {
      newErrors.taxpayerId = 'Contribuyente es requerido';
    }
    if (!formData.date) {
      newErrors.date = 'Fecha de Emisión es requerida';
    }
    if (!formData.amount.trim() || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Monto válido es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const formattedDate = new Date(formData.date).toISOString();

      const eventData: {
        date: string;
        amount: number;
        taxpayerId: string;
        fineEventId?: string;
      } = {
        date: formattedDate,
        amount: Number(formData.amount),
        taxpayerId: formData.taxpayerId,
      };

      // Si hay un fineEventId, agregarlo
      if (formData.fineEventId) {
        eventData.fineEventId = formData.fineEventId;
      }

      const result = await createEvent('warning', eventData);

      if (result) {
        toast.success('Aviso creado exitosamente');
        setFormData({
          taxpayerId: '',
          date: '',
          amount: '',
          fineEventId: '',
        });
        setErrors({});
        onSuccess?.();
        onClose();
      } else {
        toast.error('Error al crear el aviso');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el aviso';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof AvisoFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const formatCurrency = (value: string) => {
    const numValue = value.replace(/[^\d.]/g, '');
    return numValue ? `BS ${parseFloat(numValue).toLocaleString('es-VE')}` : '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white transition-all duration-200 max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-white">Agregar Aviso</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="taxpayerId" className="text-slate-300 mb-2 block">
              Contribuyente
            </Label>
            <Select
              value={formData.taxpayerId}
              onValueChange={(value) => handleChange('taxpayerId', value)}
            >
              <SelectTrigger
                className={`bg-slate-700 border-slate-600 text-white ${
                  errors.taxpayerId ? 'border-red-500' : ''
                }`}
              >
                <SelectValue placeholder="Seleccionar contribuyente..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {taxpayers.map((taxpayer) => (
                  <SelectItem key={taxpayer.id} value={taxpayer.id}>
                    {taxpayer.name} - {taxpayer.rif}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.taxpayerId && (
              <p className="text-red-400 text-xs mt-1">{errors.taxpayerId}</p>
            )}
          </div>

          <div>
            <Label htmlFor="date" className="text-slate-300 mb-2 block">
              Fecha de Emisión
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className={`bg-slate-700 border-slate-600 text-white ${
                errors.date ? 'border-red-500' : ''
              }`}
            />
            {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
          </div>

          <div>
            <Label htmlFor="amount" className="text-slate-300 mb-2 block">
              Monto en BS
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 ${
                errors.amount ? 'border-red-500' : ''
              }`}
            />
            {formData.amount && (
              <p className="text-slate-400 text-sm mt-1">{formatCurrency(formData.amount)}</p>
            )}
            {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount}</p>}
          </div>
        </form>

        <DialogFooter>
          <ModalFooter
            onCancel={onClose}
            onConfirm={handleSubmit}
            confirmLabel="Guardar"
            isLoading={isSubmitting}
            confirmVariant="default"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
