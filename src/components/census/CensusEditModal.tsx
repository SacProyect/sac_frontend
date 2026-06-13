import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/UI/dialog';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Switch } from '@/components/UI/switch';
import { Badge } from '@/components/UI/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select';
import { completeCensusRecord, type CompleteCensusInput } from '@/components/utils/api/census-table-functions';
import type { CensusRecordRow } from '@/types/census-table';
import toast from 'react-hot-toast';
import { Save, X, CheckCircle2, Circle } from 'lucide-react';

interface CensusEditModalProps {
  census: CensusRecordRow | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function FilledField({ label, value }: { label: string; value: string | number | boolean }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md bg-emerald-900/20 border border-emerald-700/30">
      <span className="text-slate-400 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <Badge className="bg-emerald-900/40 text-emerald-300 border-emerald-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}
        </Badge>
      </div>
    </div>
  );
}

function EmptyField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Circle className="h-3 w-3 text-amber-400" />
        <Label className="text-slate-300">{label} *</Label>
      </div>
      {children}
    </div>
  );
}

export default function CensusEditModal({ census, open, onClose, onSaved }: CensusEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CompleteCensusInput>({});

  useEffect(() => {
    if (census) {
      setForm({
        commercial_name: census.commercial_name || '',
        activity_type: census.activity_type || '',
        billing_method: (census.billing_method as any) || undefined,
        employee_count: census.employee_count ?? undefined,
        has_fiscal_machine: census.has_fiscal_machine || false,
        has_homologated_system: census.has_homologated_system || false,
        homologated_system_name: census.homologated_system_name || '',
      });
    }
  }, [census]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!census) return;

    setLoading(true);
    try {
      const result = await completeCensusRecord(census.id, form);
      if (result.success) {
        toast.success('Censo guardado correctamente');
        onSaved();
        onClose();
      } else {
        toast.error(result.message || 'Error al guardar');
      }
    } catch {
      toast.error('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof CompleteCensusInput>(key: K, value: CompleteCensusInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (!census) return null;

  const hasCommercialName = !!census.commercial_name;
  const hasActivityType = !!census.activity_type;
  const hasBillingMethod = !!census.billing_method;

  const completedCount = [hasCommercialName, hasActivityType, hasBillingMethod].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center justify-between">
            <span>Editar Censo — {census.census_number}</span>
            <Badge className={
              census.census_status === 'COMPLETED'
                ? 'bg-blue-900/40 text-blue-300'
                : 'bg-slate-600/30 text-slate-300'
            }>
              {census.census_status === 'COMPLETED' ? 'Completado' : 'Borrador'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Campos obligatorios: {completedCount}/3</span>
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(completedCount / 3) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre Comercial */}
          {hasCommercialName ? (
            <FilledField label="Nombre Comercial" value={census.commercial_name!} />
          ) : (
            <EmptyField label="Nombre Comercial">
              <Input
                value={form.commercial_name || ''}
                onChange={(e) => updateField('commercial_name', e.target.value)}
                placeholder="Ej: Farmacia La Salud"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </EmptyField>
          )}

          {/* Tipo de Actividad */}
          {hasActivityType ? (
            <FilledField label="Tipo de Actividad" value={census.activity_type!} />
          ) : (
            <EmptyField label="Tipo de Actividad">
              <Input
                value={form.activity_type || ''}
                onChange={(e) => updateField('activity_type', e.target.value)}
                placeholder="Ej: Farmacia, Restaurante..."
                className="bg-slate-700 border-slate-600 text-white"
              />
            </EmptyField>
          )}

          {/* Método de Facturación */}
          {hasBillingMethod ? (
            <FilledField
              label="Método de Facturación"
              value={census.billing_method === 'MANUAL' ? 'Manual' : census.billing_method === 'ELECTRONICA' ? 'Electrónica' : 'Mixta'}
            />
          ) : (
            <EmptyField label="Método de Facturación">
              <Select
                value={form.billing_method || ''}
                onValueChange={(v) => updateField('billing_method', v as any)}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="ELECTRONICA">Electrónica</SelectItem>
                  <SelectItem value="MIXTA">Mixta</SelectItem>
                </SelectContent>
              </Select>
            </EmptyField>
          )}

          {/* Empleados */}
          {census.employee_count != null ? (
            <FilledField label="Cantidad de Empleados" value={census.employee_count} />
          ) : (
            <EmptyField label="Cantidad de Empleados">
              <Input
                type="number"
                min={0}
                value={form.employee_count ?? ''}
                onChange={(e) => updateField('employee_count', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Ej: 5"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </EmptyField>
          )}

          {/* Máquina Fiscal */}
          {census.has_fiscal_machine ? (
            <FilledField label="Máquina Fiscal" value={true} />
          ) : (
            <div className="flex items-center justify-between py-2 px-3 rounded-md bg-slate-700/30 border border-slate-600/30">
              <div className="flex items-center gap-2">
                <Circle className="h-3 w-3 text-amber-400" />
                <Label className="text-slate-300">Máquina Fiscal</Label>
              </div>
              <Switch
                checked={form.has_fiscal_machine || false}
                onCheckedChange={(v) => updateField('has_fiscal_machine', v)}
              />
            </div>
          )}

          {/* Sistema Homologado */}
          {census.has_homologated_system ? (
            <FilledField
              label="Sistema Homologado"
              value={census.homologated_system_name || 'Sí'}
            />
          ) : (
            <>
              <div className="flex items-center justify-between py-2 px-3 rounded-md bg-slate-700/30 border border-slate-600/30">
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3 text-amber-400" />
                  <Label className="text-slate-300">Sistema Homologado</Label>
                </div>
                <Switch
                  checked={form.has_homologated_system || false}
                  onCheckedChange={(v) => updateField('has_homologated_system', v)}
                />
              </div>
              {form.has_homologated_system && (
                <div className="space-y-2 ml-5">
                  <Label className="text-slate-400 text-sm">Nombre del Sistema</Label>
                  <Input
                    value={form.homologated_system_name || ''}
                    onChange={(e) => updateField('homologated_system_name', e.target.value)}
                    placeholder="Ej: SysWasap, FacturaSegura..."
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              )}
            </>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-1" />
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
