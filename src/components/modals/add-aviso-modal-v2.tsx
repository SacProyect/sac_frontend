import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/UI/dialog';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { createEvent, getTaxpayers } from '@/components/utils/api/taxpayer-functions';
import type { Taxpayer } from '@/types/taxpayer';
import { ModalFooter } from '@/components/UI/v2';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';

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
  const { user } = useAuth();
  const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([]);
  const [formData, setFormData] = useState<AvisoFormData>({
    taxpayerId: '',
    date: '',
    amount: '',
    fineEventId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const selectedTaxpayer = useMemo(() => {
    return taxpayers.find((t) => t.id === formData.taxpayerId);
  }, [formData.taxpayerId, taxpayers]);

  const filteredTaxpayers = useMemo(() => {
    const searchLower = searchTaxpayer.toLowerCase().trim();
    if (!searchLower) return taxpayers;
    return taxpayers.filter(
      (t) =>
        t.name.toLowerCase().includes(searchLower) ||
        t.rif.toLowerCase().includes(searchLower)
    );
  }, [taxpayers, searchTaxpayer]);

  // Cargar contribuyentes
  useEffect(() => {
    if (isOpen) {
      const loadTaxpayers = async () => {
        console.log('[DEBUG] AddAvisoModalV2 - User:', user);
        try {
          const response = await getTaxpayers();
          const allTaxpayers = response.data ?? [];

          if (user?.role === 'ADMIN') {
            console.log('[DEBUG] AddAvisoModalV2 - Loading ALL taxpayers (ADMIN)');
            setTaxpayers(allTaxpayers);
          } else {
            console.log('[DEBUG] AddAvisoModalV2 - Filtering taxpayers for FISCAL:', user?.id);
            const filtered = allTaxpayers.filter((t: any) => t.user?.id === user?.id);
            console.log('[DEBUG] AddAvisoModalV2 - Filtered result count:', filtered.length);
            setTaxpayers(filtered);
          }
        } catch (error) {
          console.error('Error cargando contribuyentes:', error);
        }
      };
      loadTaxpayers();
      setSearchTaxpayer('');
      setIsDropdownOpen(false);
    }
  }, [isOpen, user]);

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
        setSearchTaxpayer('');
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
            <div className="relative" ref={dropdownRef}>
              <div
                className={`flex items-center justify-between w-full bg-slate-900/50 border px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${
                  errors.taxpayerId
                    ? 'border-rose-500/50 bg-rose-500/5'
                    : isDropdownOpen
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-slate-800'
                    : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/80 shadow-sm'
                }`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="flex items-center gap-3 flex-1 truncate">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    selectedTaxpayer ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 truncate pr-2">
                    {selectedTaxpayer ? (
                      <div className="flex flex-col text-left">
                        <span className="text-white text-sm font-semibold truncate leading-tight">
                          {selectedTaxpayer.name}
                        </span>
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                          {selectedTaxpayer.rif}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-sm">Seleccionar contribuyente...</span>
                    )}
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[60] overflow-hidden flex flex-col max-h-[300px] animate-in fade-in slide-in-from-top-3 duration-300 backdrop-blur-xl">
                  <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10">
                    <Search className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                    <input
                      type="text"
                      className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-slate-600 focus:ring-0"
                      placeholder="Filtrar por nombre o RIF..."
                      value={searchTaxpayer}
                      onChange={(e) => setSearchTaxpayer(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto flex-1 p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {filteredTaxpayers.length > 0 ? (
                      filteredTaxpayers.map((taxpayer) => (
                        <div
                          key={taxpayer.id}
                          className={`flex items-center justify-between px-3 py-2.5 cursor-pointer rounded-xl mb-1 last:mb-0 transition-all duration-200 ${
                            formData.taxpayerId === taxpayer.id
                              ? 'bg-indigo-500/10 text-indigo-400'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                          onClick={() => {
                            handleChange('taxpayerId', taxpayer.id);
                            setIsDropdownOpen(false);
                            setSearchTaxpayer('');
                          }}
                        >
                          <div className="flex items-center gap-3 truncate pr-3">
                            <div className={`p-1.5 rounded-lg ${
                              formData.taxpayerId === taxpayer.id ? 'bg-indigo-500/20' : 'bg-slate-800/50'
                            }`}>
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col truncate">
                              <span className="text-sm font-semibold truncate leading-tight">{taxpayer.name}</span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                formData.taxpayerId === taxpayer.id ? 'text-indigo-400/70' : 'text-slate-500'
                              }`}>
                                {taxpayer.rif}
                              </span>
                            </div>
                          </div>
                          {formData.taxpayerId === taxpayer.id && (
                            <div className="bg-indigo-500 p-0.5 rounded-full">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                        <Building2 className="w-8 h-8 text-slate-800 mb-2" />
                        <p className="text-sm text-slate-500 font-medium">No se encontraron contribuyentes</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.taxpayerId && (
              <p className="text-rose-400 text-xs mt-1.5">{errors.taxpayerId}</p>
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
