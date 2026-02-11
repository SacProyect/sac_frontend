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
import { createTaxpayer } from '@/components/utils/api/taxpayerFunctions';
import { contract_type, taxpayer_process } from '@/types/taxpayer';
import { ModalFooter } from '@/components/UI/v2';
import toast from 'react-hot-toast';
import { useCachedFormData, invalidateCache } from '@/hooks/useCachedData';

interface AddContribuyenteModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface ContribuyenteFormData {
  providenceNum: string;
  process: taxpayer_process;
  name: string;
  rifPrefix: string;
  rif: string;
  address: string;
  parish: string;
  category: string;
  emition_date: string;
  contract_type: contract_type;
  officerId: string;
}

export function AddContribuyenteModalV2({
  isOpen,
  onClose,
  onSuccess,
}: AddContribuyenteModalV2Props) {
  const [formData, setFormData] = useState<ContribuyenteFormData>({
    providenceNum: '',
    process: taxpayer_process.NA,
    name: '',
    rifPrefix: 'J',
    rif: '',
    address: '',
    parish: '',
    category: '',
    emition_date: '',
    contract_type: contract_type.ORDINARY,
    officerId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✅ Usar hook cacheado que carga todos los datos de una vez
  const { parishes: parishList, categories: taxpayerCategories, officers, loading: dataLoading } = useCachedFormData();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.providenceNum.trim() || isNaN(Number(formData.providenceNum))) {
      newErrors.providenceNum = 'Nro Providencia es requerido y debe ser numérico';
    }
    if (!formData.process || formData.process === taxpayer_process.NA) {
      newErrors.process = 'Procedimiento es requerido';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Razón Social es requerida';
    }
    if (!formData.rif.trim()) {
      newErrors.rif = 'RIF es requerido';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Dirección es requerida';
    }
    if (!formData.parish) {
      newErrors.parish = 'Parroquia es requerida';
    }
    if (!formData.category) {
      newErrors.category = 'Actividad Comercial es requerida';
    }
    if (!formData.emition_date) {
      newErrors.emition_date = 'Fecha de Emisión es requerida';
    }
    if (!formData.officerId) {
      newErrors.officerId = 'Funcionario es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Buscar parroquia y categoría por ID
      const selectedParish = parishList.find((p) => p.id === formData.parish);
      const selectedCategory = taxpayerCategories.find((c) => c.id === formData.category);
      const selectedOfficer = officers.find((o) => o.id === formData.officerId);

      if (!selectedParish || !selectedCategory || !selectedOfficer) {
        toast.error('Error: Parroquia, Categoría o Funcionario no encontrado');
        setIsSubmitting(false);
        return;
      }

      // Construir FormData para la API (igual que TaxpayerForm.tsx)
      const formDataToSend = new FormData();
      formDataToSend.append('providenceNum', formData.providenceNum);
      formDataToSend.append('process', formData.process);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('rif', `${formData.rifPrefix}-${formData.rif}`);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('parish', selectedParish.name); // API espera nombre, no ID
      formDataToSend.append('category', selectedCategory.name); // API espera nombre, no ID
      formDataToSend.append('emition_date', formData.emition_date);
      formDataToSend.append('contract_type', formData.contract_type);
      formDataToSend.append('officerId', formData.officerId);
      
      // Nota: El API requiere al menos un PDF, pero por ahora dejamos esto como placeholder
      // En producción, deberías agregar un campo de upload de PDFs

      const result = await createTaxpayer(formDataToSend);

      if (result.success) {
        toast.success('Contribuyente creado exitosamente');
        
        // ✅ Invalidar caché de contribuyentes para refrescar listas
        invalidateCache('taxpayers');
        
        // Reset form
        setFormData({
          providenceNum: '',
          process: taxpayer_process.NA,
          name: '',
          rifPrefix: 'J',
          rif: '',
          address: '',
          parish: '',
          category: '',
          emition_date: '',
          contract_type: contract_type.ORDINARY,
          officerId: '',
        });
        setErrors({});
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.message || 'Error al crear el contribuyente');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el contribuyente';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ContribuyenteFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto transition-all duration-200">
        <DialogHeader>
          <DialogTitle className="text-white">Agregar Contribuyente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Nro Providencia & Procedimiento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="providenceNum" className="text-slate-300 mb-2 block">
                Nro Providencia
              </Label>
              <Input
                id="providenceNum"
                type="number"
                placeholder="12345"
                value={formData.providenceNum}
                onChange={(e) => handleChange('providenceNum', e.target.value)}
                className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 ${
                  errors.providenceNum ? 'border-red-500' : ''
                }`}
              />
              {errors.providenceNum && (
                <p className="text-red-400 text-xs mt-1">{errors.providenceNum}</p>
              )}
            </div>

            <div>
              <Label htmlFor="process" className="text-slate-300 mb-2 block">
                Procedimiento
              </Label>
              <Select
                value={formData.process}
                onValueChange={(value) => handleChange('process', value as taxpayer_process)}
              >
                <SelectTrigger
                  className={`bg-slate-700 border-slate-600 text-white ${
                    errors.process ? 'border-red-500' : ''
                  }`}
                >
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value={taxpayer_process.FP}>FP</SelectItem>
                  <SelectItem value={taxpayer_process.AF}>AF</SelectItem>
                  <SelectItem value={taxpayer_process.VDF}>VDF</SelectItem>
                </SelectContent>
              </Select>
              {errors.process && (
                <p className="text-red-400 text-xs mt-1">{errors.process}</p>
              )}
            </div>
          </div>

          {/* Row 2: Razón Social */}
          <div>
            <Label htmlFor="name" className="text-slate-300 mb-2 block">
              Razón Social
            </Label>
            <Input
              id="name"
              placeholder="Nombre de la empresa"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 ${
                errors.name ? 'border-red-500' : ''
              }`}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Row 3: RIF */}
          <div>
            <Label htmlFor="rif" className="text-slate-300 mb-2 block">
              RIF
            </Label>
            <div className="flex gap-2">
              <Select
                value={formData.rifPrefix}
                onValueChange={(value) => handleChange('rifPrefix', value)}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="J">J-</SelectItem>
                  <SelectItem value="V">V-</SelectItem>
                  <SelectItem value="G">G-</SelectItem>
                  <SelectItem value="E">E-</SelectItem>
                  <SelectItem value="P">P-</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="rif"
                placeholder="123456789"
                value={formData.rif}
                onChange={(e) => handleChange('rif', e.target.value)}
                className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 flex-1 ${
                  errors.rif ? 'border-red-500' : ''
                }`}
              />
            </div>
            {errors.rif && <p className="text-red-400 text-xs mt-1">{errors.rif}</p>}
          </div>

          {/* Row 4: Dirección & Parroquia */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address" className="text-slate-300 mb-2 block">
                Dirección
              </Label>
              <Input
                id="address"
                placeholder="Calle Principal #100"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 ${
                  errors.address ? 'border-red-500' : ''
                }`}
              />
              {errors.address && (
                <p className="text-red-400 text-xs mt-1">{errors.address}</p>
              )}
            </div>

            <div>
              <Label htmlFor="parish" className="text-slate-300 mb-2 block">
                Parroquia
              </Label>
              <Select
                value={formData.parish}
                onValueChange={(value) => handleChange('parish', value)}
              >
                <SelectTrigger
                  className={`bg-slate-700 border-slate-600 text-white ${
                    errors.parish ? 'border-red-500' : ''
                  }`}
                >
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {parishList.map((parish) => (
                    <SelectItem key={parish.id} value={parish.id}>
                      {parish.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.parish && (
                <p className="text-red-400 text-xs mt-1">{errors.parish}</p>
              )}
            </div>
          </div>

          {/* Row 5: Actividad Comercial */}
          <div>
            <Label htmlFor="category" className="text-slate-300 mb-2 block">
              Actividad Comercial
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleChange('category', value)}
            >
              <SelectTrigger
                className={`bg-slate-700 border-slate-600 text-white ${
                  errors.category ? 'border-red-500' : ''
                }`}
              >
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {taxpayerCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-red-400 text-xs mt-1">{errors.category}</p>
            )}
          </div>

          {/* Row 6: Fecha de Emisión, Tipo, Funcionario */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="emition_date" className="text-slate-300 mb-2 block">
                Fecha de Emisión
              </Label>
              <Input
                id="emition_date"
                type="date"
                value={formData.emition_date}
                onChange={(e) => handleChange('emition_date', e.target.value)}
                className={`bg-slate-700 border-slate-600 text-white ${
                  errors.emition_date ? 'border-red-500' : ''
                }`}
              />
              {errors.emition_date && (
                <p className="text-red-400 text-xs mt-1">{errors.emition_date}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contract_type" className="text-slate-300 mb-2 block">
                Tipo Contribuyente
              </Label>
              <Select
                value={formData.contract_type}
                onValueChange={(value) => handleChange('contract_type', value as contract_type)}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value={contract_type.ORDINARY}>Ordinario</SelectItem>
                  <SelectItem value={contract_type.SPECIAL}>Especial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="officerId" className="text-slate-300 mb-2 block">
                Funcionario
              </Label>
              <Select
                value={formData.officerId}
                onValueChange={(value) => handleChange('officerId', value)}
              >
                <SelectTrigger
                  className={`bg-slate-700 border-slate-600 text-white ${
                    errors.officerId ? 'border-red-500' : ''
                  }`}
                >
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {officers.map((officer) => (
                    <SelectItem key={officer.id} value={officer.id}>
                      {officer.name} - C.I.: {officer.personId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.officerId && (
                <p className="text-red-400 text-xs mt-1">{errors.officerId}</p>
              )}
            </div>
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
