import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/UI/dialog';
import { Separator } from '@/components/UI/separator';
import { RepairStatusBadge } from './RepairStatusBadge';
import { ExpirationIndicator } from './ExpirationIndicator';
import type { ActaReparo } from './types';

interface ActasDetailDialogProps {
  row: ActaReparo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return '—';
  const parts = s.slice(0, 10).split('-');
  if (parts.length !== 3) return s;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

export function ActasDetailDialog({ row, open, onOpenChange }: ActasDetailDialogProps) {
  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            Detalle del Acta de Reparo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1">
          <DetailRow label="Contribuyente" value={row.contribuyente} />
          <DetailRow label="RIF" value={row.rif} />
          <Separator />
          <DetailRow label="N.º Expediente" value={row.numeroExpediente ?? '—'} />
          <DetailRow label="N.º Reparo" value={row.numeroReparo ?? '—'} />
          <DetailRow label="Impuesto" value={row.impuestoTipo ?? '—'} />
          <DetailRow label="Ejercicio Fiscal" value={row.ejercicioFiscalPeriodo ?? '—'} />
          <Separator />
          <DetailRow label="Monto Total" value={`Bs. ${fmtMoney(row.montoTotal)}`} />
          <DetailRow label="Monto ISLR" value={`Bs. ${fmtMoney(row.montoIslr)}`} />
          <DetailRow label="Monto IVA" value={`Bs. ${fmtMoney(row.montoIva)}`} />
          <Separator />
          <DetailRow label="Fiscal actuante" value={row.fiscalActuante ?? '—'} />
          <DetailRow label="Supervisor" value={row.supervisorNombre ?? '—'} />
          <DetailRow label="Grupo fiscal" value={row.fiscalGroupName ?? '—'} />
          <Separator />
          <DetailRow label="Fecha de entrega" value={fmtDate(row.fechaEntrega)} />
          <DetailRow label="Fecha notificación" value={fmtDate(row.fechaNotificado)} />
          <DetailRow
            label="Estado"
            value={<RepairStatusBadge status={row.status} />}
          />
          <DetailRow
            label="Vencimiento"
            value={<ExpirationIndicator fechaVencimiento={row.fechaVencimiento} />}
          />
          <DetailRow
            label="Vinculado a operativo"
            value={row.vinculadoAOperativo ? 'Sí' : 'No'}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
