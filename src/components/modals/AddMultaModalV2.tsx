import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createEvent } from '@/components/utils/api/taxpayerFunctions';
import type { Taxpayer } from '@/types/taxpayer';
import { ModalFooter } from '@/components/ui/v2';
import toast from 'react-hot-toast';
import { useCachedTaxpayers } from '@/hooks/useCachedData';

interface AddMultaModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface MultaFormData {
  taxpayerId: string;
  date: string;
  amount: string;
  description: string;
}

export function AddMultaModalV2({ isOpen, onClose, onSuccess }: AddMultaModalV2Props) {
  const [formData, setFormData] = useState<MultaFormData>({
    taxpayerId: '',
    date: '',
    amount: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✅ Usar hook cacheado en vez de hacer petición cada vez que se abre el modal
  const { taxpayers, loading: taxpayersLoading } = useCachedTaxpayers(100);

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
    if (!formData.description.trim()) {
      newErrors.description = 'Motivo es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const formattedDate = new Date(formData.date).toISOString();

      const eventData = {
        date: formattedDate,
        amount: Number(formData.amount),
        taxpayerId: formData.taxpayerId,
        description: formData.description,
      };

      const result = await createEvent('fine', eventData);

      if (result) {
        toast.success('Multa creada exitosamente');
        setFormData({
          taxpayerId: '',
          date: '',
          amount: '',
          description: '',
        });
        setErrors({});
        onSuccess?.();
        onClose();
      } else {
        toast.error('Error al crear la multa');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la multa';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof MultaFormData, value: string) => {
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
      <DialogContent className="bg-slate-800 border-slate-700 text-white transition-all duration-200">
        <DialogHeader>
          <DialogTitle className="text-white">Agregar Multa</DialogTitle>
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

          <div>
            <Label htmlFor="description" className="text-slate-300 mb-2 block">
              Motivo
            </Label>
            <Input
              id="description"
              placeholder="Ej: Retraso en declaración IVA"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 ${
                errors.description ? 'border-red-500' : ''
              }`}
            />
            {errors.description && (
              <p className="text-red-400 text-xs mt-1">{errors.description}</p>
            )}
          </div>
        </form>

        <DialogFooter>
          <ModalFooter
            onCancel={onClose}
            onConfirm={handleSubmit}
            confirmLabel="Guardar"
            isLoading={isSubmitting}
            confirmVariant="destructive"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
