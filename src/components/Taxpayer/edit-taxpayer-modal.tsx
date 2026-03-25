import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/UI/dialog';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/select';
import { Parish, TaxpayerCategory } from '@/types/taxpayer';
import { getParishList, getTaxpayerCategories, updateTaxpayer } from '../utils/api/taxpayer-functions';
import toast from 'react-hot-toast';

interface EditTaxpayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxpayerData: any;
  onSuccess: (updatedData: any) => void;
}

export function EditTaxpayerModal({ isOpen, onClose, taxpayerData, onSuccess }: EditTaxpayerModalProps) {
  const [loading, setLoading] = useState(false);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [categories, setCategories] = useState<TaxpayerCategory[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    rif: '',
    providenceNum: '',
    process: '',
    address: '',
    parish_id: '',
    taxpayer_category_id: '',
  });

  useEffect(() => {
    if (isOpen && taxpayerData) {
      setFormData({
        name: taxpayerData.name || '',
        rif: taxpayerData.rif || '',
        providenceNum: taxpayerData.providenceNum?.toString() || '',
        process: taxpayerData.process || '',
        address: taxpayerData.address || '',
        parish_id: taxpayerData.parish?.id || '',
        taxpayer_category_id: taxpayerData.taxpayer_category?.id || '',
      });
      fetchSelectOptions();
    }
  }, [isOpen, taxpayerData]);

  const fetchSelectOptions = async () => {
    try {
      const [parishRes, catRes] = await Promise.all([
        getParishList(),
        getTaxpayerCategories()
      ]);
      setParishes(parishRes.data || []);
      setCategories(catRes.data || []);
    } catch (error) {
      console.error("Error fetching options:", error);
      toast.error("Error al cargar las opciones.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxpayerData?.id) return;

    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        rif: formData.rif,
        providenceNum: formData.providenceNum ? Number(formData.providenceNum) : null,
        process: formData.process,
        address: formData.address,
        parish_id: formData.parish_id,
        taxpayer_category_id: formData.taxpayer_category_id,
      };

      await updateTaxpayer(taxpayerData.id, payload);
      toast.success('Contribuyente actualizado exitosamente');
      
      // Pasar los datos actualizados al padre
      onSuccess({
        ...taxpayerData,
        name: formData.name,
        rif: formData.rif,
        providenceNum: formData.providenceNum,
        process: formData.process,
        address: formData.address,
        parish: parishes.find(p => p.id === formData.parish_id) || taxpayerData.parish,
        taxpayer_category: categories.find(c => c.id === formData.taxpayer_category_id) || taxpayerData.taxpayer_category,
      });
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al actualizar el contribuyente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-[600px] md:max-w-[700px] bg-slate-900 border-slate-800 text-slate-200 p-4 sm:p-6 overflow-y-auto max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl text-white">Editar Información del Contribuyente</DialogTitle>
          <DialogDescription className="text-sm text-slate-400">
            Modifique los campos necesarios y haga clic en guardar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-slate-300">Razón Social</Label>
            <Input 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleInputChange}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="grid gap-2">
              <Label htmlFor="rif" className="text-slate-300">RIF</Label>
              <Input 
                id="rif" 
                name="rif" 
                value={formData.rif} 
                onChange={handleInputChange}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="providenceNum" className="text-slate-300">N° Providencia</Label>
              <Input 
                id="providenceNum" 
                name="providenceNum" 
                type="number"
                value={formData.providenceNum} 
                onChange={handleInputChange}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="grid gap-2">
              <Label className="text-slate-300">Procedimiento</Label>
              <Select 
                value={formData.process} 
                onValueChange={(val) => setFormData(prev => ({...prev, process: val}))}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="AF">Auditoría Fiscal (AF)</SelectItem>
                  <SelectItem value="FP">Fiscalización Puntual (FP)</SelectItem>
                  <SelectItem value="VDF">Verificación de Deberes Formales (VDF)</SelectItem>
                  <SelectItem value="NA">No Aplica (NA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label className="text-slate-300">Parroquia</Label>
              <Select 
                value={formData.parish_id} 
                onValueChange={(val) => setFormData(prev => ({...prev, parish_id: val}))}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Seleccione parroquia" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {parishes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-slate-300">Actividad Comercial</Label>
            <Select 
              value={formData.taxpayer_category_id} 
              onValueChange={(val) => setFormData(prev => ({...prev, taxpayer_category_id: val}))}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Seleccione actividad" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address" className="text-slate-300">Dirección</Label>
            <Input 
              id="address" 
              name="address" 
              value={formData.address} 
              onChange={handleInputChange}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="w-full sm:w-auto text-slate-300 hover:text-white hover:bg-slate-800">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
