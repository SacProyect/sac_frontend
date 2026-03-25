import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/UI/dialog';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Search, ChevronDown, Check } from 'lucide-react';
import { createEvent, getTaxpayers } from '@/components/utils/api/taxpayer-functions';
import type { Taxpayer } from '@/types/taxpayer';
import { ModalFooter } from '@/components/UI/v2';
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
  const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([]);

  // Búsqueda de contribuyentes
  const [searchTaxpayer, setSearchTaxpayer] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

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
      // Reset search state when modal opens
      setSearchTaxpayer('');
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  const selectedTaxpayer = taxpayers.find((t) => t.id === formData.taxpayerId);

  const filteredTaxpayers = useMemo(() => {
    const searchLower = searchTaxpayer.toLowerCase().trim();
    if (!searchLower) return taxpayers;
    return taxpayers.filter(
      (t) =>
        t.name.toLowerCase().includes(searchLower) ||
        t.rif.toLowerCase().includes(searchLower)
    );
  }, [taxpayers, searchTaxpayer]);


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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

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
        setSearchTaxpayer('');
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
      <DialogContent className="bg-slate-800 border-slate-700 text-white transition-all duration-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Agregar Multa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="taxpayerId" className="text-slate-300 mb-2 block">
              Contribuyente
            </Label>
            <div className="relative" ref={dropdownRef}>
              <div
                className={`flex items-center justify-between w-full bg-slate-700/50 border px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  errors.taxpayerId
                    ? 'border-red-500 bg-red-500/5'
                    : isDropdownOpen
                    ? 'border-blue-500 ring-1 ring-blue-500 bg-slate-700'
                    : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700'
                }`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="flex-1 truncate pr-2">
                  {selectedTaxpayer ? (
                    <span className="text-white text-sm">
                      {selectedTaxpayer.name}{' '}
                      <span className="text-slate-400 text-xs ml-1">{selectedTaxpayer.rif}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm">Buscar contribuyente...</span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.5)] z-[60] overflow-hidden flex flex-col max-h-[260px] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center px-3 py-2.5 border-b border-slate-700 bg-slate-800/95 sticky top-0 z-10">
                    <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-slate-500"
                      placeholder="Buscar por nombre o RIF..."
                      value={searchTaxpayer}
                      onChange={(e) => setSearchTaxpayer(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto flex-1 p-1.5 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    {filteredTaxpayers.length > 0 ? (
                      filteredTaxpayers.map((taxpayer) => (
                        <div
                          key={taxpayer.id}
                          className={`flex items-center justify-between px-3 py-2 cursor-pointer rounded-sm mb-0.5 last:mb-0 transition-colors ${
                            formData.taxpayerId === taxpayer.id
                              ? 'bg-blue-600/20 text-blue-400'
                              : 'text-slate-200 hover:bg-slate-700/80'
                          }`}
                          onClick={() => {
                            handleChange('taxpayerId', taxpayer.id);
                            setIsDropdownOpen(false);
                            setSearchTaxpayer('');
                          }}
                        >
                          <div className="flex flex-col truncate pr-3">
                            <span className="text-sm font-medium truncate">{taxpayer.name}</span>
                            <span
                              className={`text-xs ${
                                formData.taxpayerId === taxpayer.id
                                  ? 'text-blue-400/80'
                                  : 'text-slate-400'
                              }`}
                            >
                              {taxpayer.rif}
                            </span>
                          </div>
                          {formData.taxpayerId === taxpayer.id && (
                            <Check className="w-4 h-4 shrink-0 text-blue-500" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-sm text-slate-400">
                        No se encontraron resultados
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.taxpayerId && (
              <p className="text-red-400 text-xs mt-1.5">{errors.taxpayerId}</p>
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
