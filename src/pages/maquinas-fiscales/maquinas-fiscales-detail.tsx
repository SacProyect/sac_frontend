import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader, EmptyState, BackButton } from '@/components/UI/v2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Badge } from '@/components/UI/badge';
import { Button } from '@/components/UI/button';
import { maquinasFiscalesMock } from '@/data/mock-maquinas-fiscales';
import type { MachineMock } from '@/types/maquinas-fiscales';
import { 
  ArrowLeft, ExternalLink, MapPin, Phone, Calendar, 
  Building2, Cpu, Hash, Clock, Activity, FileText 
} from 'lucide-react';

const stateColors: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  ok: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  unlinked: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  no_machine: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

const stateLabel: Record<string, string> = {
  critical: 'Crítica',
  warning: 'Alerta',
  ok: 'Normal',
  unlinked: 'Sin enlace',
  no_machine: 'Sin máquina',
};

const tipoLabel: Record<string, string> = {
  IMPRESORA_FISCAL: 'Impresora Fiscal',
  CAJA_REGISTRADORA: 'Caja Registradora',
  OTRO: 'Otro',
};

// Mock de actividad reciente
const mockActivity = [
  { date: '2026-06-01', event: 'Última transmisión registrada', type: 'transmission' },
  { date: '2026-05-15', event: 'Cambio de estado a activo', type: 'status' },
  { date: '2026-04-20', event: 'Registro en sistema SAC', type: 'registration' },
  { date: '2026-03-10', event: 'Asignación de parroquia', type: 'assignment' },
];

export default function MaquinasFiscalesDetail() {
  const { serial } = useParams<{ serial: string }>();
  const navigate = useNavigate();

  const machine = maquinasFiscalesMock.find(m => m.serial === serial);

  if (!machine) {
    return (
      <div className="space-y-6">
        <BackButton to="/maquinas-fiscales" label="Volver al dashboard" />
        <PageHeader title="Detalle de Máquina" />
        <EmptyState
          title="Máquina no encontrada"
          message={`No se encontró una máquina con serial "${serial}".`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton to="/maquinas-fiscales" label="Volver al dashboard" />
      <PageHeader
        title={machine.razonsocial}
        description={`Serial: ${machine.serial}`}
        action={
          <Button
            variant="outline"
            className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
            onClick={() => navigate(`/taxpayer/${machine.rif}`)}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Contribuyente
          </Button>
        }
      />

      {/* Badges de estado */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={`text-xs font-medium border ${stateColors[machine.machineState]}`}>
          {stateLabel[machine.machineState]}
        </Badge>
        <Badge className={`text-xs font-medium border ${
          machine.estadoSAC === 'enlazado' 
            ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' 
            : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
        }`}>
          {machine.estadoSAC === 'enlazado' ? 'Enlazado' : 'Sin enlace'}
        </Badge>
        <Badge className="text-xs font-medium border bg-slate-500/15 text-slate-400 border-slate-500/30">
          {tipoLabel[machine.tipoMaquina]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información Técnica */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-100 text-base flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-400" />
              Información Técnica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={Hash} label="Serial" value={machine.serial} />
            <DetailRow icon={Building2} label="RIF" value={machine.rif} />
            <DetailRow icon={FileText} label="Tipo de Máquina" value={tipoLabel[machine.tipoMaquina]} />
            <DetailRow 
              icon={Clock} 
              label="Días sin transmitir" 
              value={machine.diasSinTransmitir !== null ? `${machine.diasSinTransmitir} días` : 'N/A'}
              valueColor={
                (machine.diasSinTransmitir ?? 0) >= 1000 ? 'text-red-400 font-semibold' :
                (machine.diasSinTransmitir ?? 0) >= 300 ? 'text-orange-400' :
                (machine.diasSinTransmitir ?? 0) >= 90 ? 'text-yellow-400' : 'text-emerald-400'
              }
            />
            {machine.lastSeen && (
              <DetailRow icon={Calendar} label="Última actividad" value={machine.lastSeen} />
            )}
          </CardContent>
        </Card>

        {/* Información del Contribuyente */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-100 text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-400" />
              Contribuyente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={Building2} label="Razón Social" value={machine.razonsocial} />
            <DetailRow icon={Hash} label="RIF" value={machine.rif} />
            <DetailRow icon={MapPin} label="Parroquia" value={machine.parish} />
            {machine.address && <DetailRow icon={MapPin} label="Dirección" value={machine.address} />}
            {machine.phone && <DetailRow icon={Phone} label="Teléfono" value={machine.phone} />}
            {machine.activity && <DetailRow icon={FileText} label="Actividad" value={machine.activity} />}
          </CardContent>
        </Card>
      </div>

      {/* Actividad Reciente */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-slate-100 text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-400" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockActivity.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 pb-3 border-b border-slate-700/30 last:border-0 last:pb-0">
                <div className="h-2 w-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-slate-300">{item.event}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, valueColor = 'text-slate-200' }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className={`text-sm ${valueColor} break-words`}>{value}</p>
      </div>
    </div>
  );
}
