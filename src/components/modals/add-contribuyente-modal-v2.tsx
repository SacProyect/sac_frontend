import { useEffect, useMemo, useState } from 'react';
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
import { 
  Building2, 
  Hash, 
  Workflow, 
  CreditCard, 
  MapPin, 
  Activity, 
  Calendar, 
  UserCheck, 
  FileUp, 
  Globe,
  Check
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { createTaxpayer, getParishList, getTaxpayerCategories } from '@/components/utils/api/taxpayer-functions';
import { contract_type, Parish, taxpayer_process } from '@/types/taxpayer';
import { ModalFooter } from '@/components/UI/v2';
import toast from 'react-hot-toast';
import { getOfficers } from '../utils/api/user-functions';
import { TaxpayerCategories } from '@/types/taxpayer-categories';
import { useAuth } from '@/hooks/use-auth';
import { invalidateCache } from '@/hooks/useCachedData';

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
  const { user } = useAuth();

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
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [pdfInputKey, setPdfInputKey] = useState(0);
  const [parishList, setParishList] = useState<Parish[]>([]);
  const [taxpayerCategories, setTaxpayerCategories] = useState<TaxpayerCategories[]>([]);
  const [officers, setOfficers] = useState<Array<{ id: string; name: string; personId: string }>>([]);

  const allowedOfficerIds = useMemo(() => {
    if (!user) return null;
    if (user.role === 'ADMIN') return null; // sin filtro

    if (user.role === 'FISCAL') {
      return new Set<string>([user.id]);
    }

    if (user.role === 'SUPERVISOR') {
      const ids = new Set<string>();
      // Puede haber casos donde el backend asigne incluso al supervisor.
      if (user.id) ids.add(user.id);
      user.supervised_members?.forEach((m) => {
        if (m?.id) ids.add(m.id);
      });
      return ids;
    }

    // COORDINATOR
    const ids = new Set<string>();
    // Backend suele incluir group.members
    user.group?.members?.forEach((m) => {
      if (m?.id) ids.add(m.id);
    });
    // Backend también suele incluir coordinatedGroup.members (según tu mensaje)
    const coordinatedGroup = user.coordinatedGroup;
    if (coordinatedGroup && typeof coordinatedGroup === 'object' && 'members' in coordinatedGroup) {
      // members pertenece al tipo CoordinatedGroup, pero el union puede no traerlo.
      (coordinatedGroup as any).members?.forEach((m: any) => {
        if (m?.id) ids.add(m.id);
      });
    }
    return ids;
  }, [user]);

  const filteredOfficers = useMemo(() => {
    if (!allowedOfficerIds) return officers;
    return officers.filter((o) => allowedOfficerIds.has(o.id));
  }, [officers, allowedOfficerIds]);

  // Cargar datos necesarios
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const [parishRes, categoriesRes, officersRes] = await Promise.all([
            getParishList(),
            getTaxpayerCategories(),
            getOfficers(),
          ]);
          if (parishRes?.data) setParishList(parishRes.data);
          if (categoriesRes?.data) setTaxpayerCategories(categoriesRes.data);
          if (officersRes) setOfficers(officersRes);
        } catch (error) {
          console.error('Error cargando datos:', error);
        }
      };
      loadData();
    }
  }, [isOpen]);

  // Ajustar "Funcionario" según rol cuando se abra el modal.
  useEffect(() => {
    if (!isOpen || !user) return;

    if (user.role === 'FISCAL') {
      setFormData((prev) => ({ ...prev, officerId: user.id }));
      return;
    }

    if (user.role === 'ADMIN') return;

    // COORDINATOR / SUPERVISOR: si el officerId actual no está permitido, toma el primero permitido.
    if (allowedOfficerIds && formData.officerId && allowedOfficerIds.has(formData.officerId)) return;

    const firstAllowed = filteredOfficers[0]?.id;
    setFormData((prev) => ({ ...prev, officerId: firstAllowed ?? '' }));
  }, [allowedOfficerIds, filteredOfficers, formData.officerId, isOpen, user]);

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
    // if (!selectedPdf) {
    //   newErrors.pdf = 'Debe subir al menos un PDF';
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

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
      formDataToSend.append('parish', selectedParish.id); 
      formDataToSend.append('category', selectedCategory.id); 
      formDataToSend.append('emition_date', formData.emition_date);
      formDataToSend.append('contract_type', formData.contract_type);
      formDataToSend.append('officerId', formData.officerId);

      // El backend exige al menos 1 PDF.
      // Como no tenemos el nombre exacto del campo del backend aquí, adjuntamos bajo claves habituales.
      // Si el backend espera otra clave, ajústala en este punto.
      if (selectedPdf) {
        // formDataToSend.append('pdf', selectedPdf);
        
        formDataToSend.append('pdfs', selectedPdf);
      }

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
        setSelectedPdf(null);
        setPdfInputKey((k) => k + 1);
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

  const handlePdfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedPdf(file);
    if (errors.pdf) {
      setErrors((prev) => ({ ...prev, pdf: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl w-full transition-all duration-200">
        <DialogHeader className="pb-2 border-b border-slate-800">
          <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" /> Agregar Contribuyente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">

          {/* Nro Providencia */}
          <div className="space-y-1">
            <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Hash className="w-2.5 h-2.5 text-indigo-400" /> Nro Providencia
            </Label>
            <Input
              id="providenceNum"
              type="number"
              placeholder="123456"
              value={formData.providenceNum}
              onChange={(e) => handleChange('providenceNum', e.target.value)}
              className={cn(
                "bg-slate-950/40 border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm transition-all",
                errors.providenceNum && "border-rose-500/60 bg-rose-500/5"
              )}
            />
            {errors.providenceNum && <p className="text-[9px] font-bold text-rose-500 uppercase">{errors.providenceNum}</p>}
          </div>

          {/* Procedimiento */}
          <div className="space-y-1">
            <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Workflow className="w-2.5 h-2.5 text-emerald-400" /> Procedimiento
            </Label>
            <Select value={formData.process} onValueChange={(value: string) => handleChange('process', value as taxpayer_process)}>
              <SelectTrigger className={cn("bg-slate-950/40 border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm", errors.process && "border-rose-500/60")}>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                <SelectItem value={taxpayer_process.FP}>FP — Fiscalización</SelectItem>
                <SelectItem value={taxpayer_process.AF}>AF — Aviso Fiscal</SelectItem>
                <SelectItem value={taxpayer_process.VDF}>VDF — Verificación</SelectItem>
              </SelectContent>
            </Select>
            {errors.process && <p className="text-[9px] font-bold text-rose-500 uppercase">{errors.process}</p>}
          </div>

          {/* Razón Social — full width */}
          <div className="col-span-2 space-y-1">
            <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Building2 className="w-2.5 h-2.5 text-blue-400" /> Razón Social
            </Label>
            <Input
              id="name"
              placeholder="Nombre legal de la empresa o contribuyente..."
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={cn(
                "bg-slate-950/40 border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm transition-all",
                errors.name && "border-rose-500/60 bg-rose-500/5"
              )}
            />
            {errors.name && <p className="text-[9px] font-bold text-rose-500 uppercase">{errors.name}</p>}
          </div>

          {/* RIF */}
          <div className="space-y-1">
            <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <CreditCard className="w-2.5 h-2.5 text-amber-400" /> RIF
            </Label>
            <div className="flex gap-1.5">
              <Select value={formData.rifPrefix} onValueChange={(value: string) => handleChange('rifPrefix', value)}>
                <SelectTrigger className="bg-slate-950/40 border-slate-700/60 text-white w-[72px] h-9 rounded-lg text-sm shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
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
                className={cn(
                  "flex-1 bg-slate-950/40 border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm font-mono transition-all",
                  errors.rif && "border-rose-500/60 bg-rose-500/5"
                )}
              />
            </div>
            {errors.rif && <p className="text-[9px] font-bold text-rose-500 uppercase">{errors.rif}</p>}
          </div>

          {/* Parroquia */}
          <div className="space-y-1">
            <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Globe className="w-2.5 h-2.5 text-cyan-400" /> Parroquia
            </Label>
            <Select value={formData.parish} onValueChange={(value: string) => handleChange('parish', value)}>
              <SelectTrigger className={cn("bg-slate-950/40 border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm", errors.parish && "border-rose-500/60")}>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 max-h-52 overflow-y-auto text-white">
                {parishList.map((parish) => (
                  <SelectItem key={parish.id} value={parish.id}>{parish.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.parish && <p className="text-[9px] font-bold text-rose-500 uppercase">{errors.parish}</p>}
          </div>

          {/* Dirección — full width */}
          <div className="col-span-2 space-y-1">
            <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <MapPin className="w-2.5 h-2.5 text-rose-400" /> Dirección Fiscal
            </Label>
            <Input
              id="address"
              placeholder="Calle, edificio, oficina..."
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className={cn(
                "bg-slate-950/40 border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm transition-all",
                errors.address && "border-rose-500/60 bg-rose-500/5"
              )}
            />
            {errors.address && <p className="text-[9px] font-bold text-rose-500 uppercase">{errors.address}</p>}
          </div>

          {/* Actividad Comercial — full width */}
          <div className="col-span-2 space-y-1">
            <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-2.5 h-2.5 text-violet-400" /> Actividad Comercial
            </Label>
            <Select value={formData.category} onValueChange={(value: string) => handleChange('category', value)}>
              <SelectTrigger className={cn("bg-slate-950/40 border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm", errors.category && "border-rose-500/60")}>
                <SelectValue placeholder="Seleccionar actividad..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 max-h-52 overflow-y-auto text-white">
                {taxpayerCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-[9px] font-bold text-rose-500 uppercase">{errors.category}</p>}
          </div>

          {/* Fecha de Emisión */}
          <div className="space-y-1">
            <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="w-2.5 h-2.5 text-emerald-400" /> Fecha de Emisión
            </Label>
            <Input
              id="emition_date"
              type="date"
              value={formData.emition_date}
              onChange={(e) => handleChange('emition_date', e.target.value)}
              className={cn(
                "w-full bg-slate-950/40 border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm transition-all",
                errors.emition_date && "border-rose-500/60 bg-rose-500/5"
              )}
            />
            {errors.emition_date && <p className="text-[9px] font-bold text-rose-500 uppercase">{errors.emition_date}</p>}
          </div>

          {/* Tipo Contribuyente */}
          <div className="space-y-1">
            <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Workflow className="w-2.5 h-2.5 text-indigo-400" /> Clasificación
            </Label>
            <Select value={formData.contract_type} onValueChange={(value: string) => handleChange('contract_type', value as contract_type)}>
              <SelectTrigger className="w-full bg-slate-950/40 border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                <SelectItem value={contract_type.ORDINARY}>Ordinario</SelectItem>
                <SelectItem value={contract_type.SPECIAL}>Especial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fiscal Asignado — full width */}
          <div className="col-span-2 space-y-1">
            <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <UserCheck className="w-2.5 h-2.5 text-sky-400" /> Fiscal Asignado
            </Label>
            {user?.role === 'FISCAL' ? (
              <div className="flex items-center gap-2 text-slate-300 text-xs bg-slate-950/40 border border-slate-800 rounded-lg px-3 h-9">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">{user.name}</span>
                <span className="ml-auto text-slate-600 text-[9px] uppercase font-bold">Auto-asignado</span>
              </div>
            ) : (
              <Select value={formData.officerId} onValueChange={(value: string) => handleChange('officerId', value)}>
                <SelectTrigger className={cn("bg-slate-950/40 border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm", errors.officerId && "border-rose-500/60")}>
                  <SelectValue placeholder="Seleccionar funcionario..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 max-h-52 overflow-y-auto text-white">
                  {filteredOfficers.map((officer) => (
                    <SelectItem key={officer.id} value={officer.id}>
                      {officer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.officerId && <p className="text-[9px] font-bold text-rose-500 uppercase">{errors.officerId}</p>}
          </div>

          {/* PDF — full width */}
          <div className="col-span-2 space-y-1">
            <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <FileUp className="w-2.5 h-2.5 text-indigo-400" /> Soporte Documental (PDF)
            </Label>
            <Input
              key={pdfInputKey}
              id="pdf"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handlePdfChange}
              className={cn(
                "bg-slate-950/40 border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm transition-all pt-1.5",
                errors.pdf && "border-rose-500/60 bg-rose-500/5"
              )}
            />
            {selectedPdf ? (
              <div className="flex items-center gap-1.5 text-[9px] font-medium text-emerald-400 uppercase tracking-wider">
                <Check className="w-2.5 h-2.5" />
                <span className="truncate">{selectedPdf.name}</span>
              </div>
            ) : (
              <p className="text-[9px] text-slate-600 italic">Formato: .pdf — Máx 10MB</p>
            )}
            {errors.pdf && <p className="text-[9px] font-bold text-rose-500 uppercase">{errors.pdf}</p>}
          </div>

        </form>

        <DialogFooter className="pt-2 border-t border-slate-800 mt-1">
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
