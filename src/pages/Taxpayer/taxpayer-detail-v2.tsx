import { useState } from 'react';
import { useParams, useNavigate, useLoaderData, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  AlertTriangle, 
  DollarSign, 
  FileText, 
  Eye,
  Package,
  Receipt,
  FileSearch
} from 'lucide-react';
import { IndividualStats } from '@/components/stats/individual-stats';
import EventTable from '@/components/Events/event-table';
import TaxSummaryTable from '@/components/iva/tax-summary-table';
import ISLRSummaryTable from '@/components/ISLR/islr-summary-table';
import { Event } from '@/types/event';
import { IVAReports } from '@/types/iva-reports';
import { ISLRReports } from '@/types/islr-reports';
import { Fines } from '@/pages/router';
import { Payment } from '@/types/payment';
import { PageHeader, EmptyState } from '@/components/ui/v2';

/**
 * TaxpayerDetailV2 - Detalle del Contribuyente con diseño Shadcn UI v2.0
 * 
 * Muestra:
 * - Estadísticas individuales del contribuyente
 * - Botones de acción rápida (con permisos)
 * - Tabs para historial (Multas, IVA, ISLR)
 */
export default function TaxpayerDetailV2() {
  const { taxpayer } = useParams<{ taxpayer: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    events: initialEvents, 
    fines, 
    payments, 
    taxSummary: initialTaxSummary, 
    islrReports: initialIslrReports 
  } = useLoaderData() as { 
    events: Event[]; 
    fines: Fines; 
    payments: Payment; 
    taxSummary: IVAReports[]; 
    islrReports: ISLRReports[] 
  };

  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [taxSummary, setTaxSummary] = useState<IVAReports[]>(initialTaxSummary);
  const [islrReports, setIslrReports] = useState<ISLRReports[]>(initialIslrReports);
  const [activeTab, setActiveTab] = useState('fine');

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Determinar permisos para acciones rápidas
  const matchedTaxpayer = user?.taxpayer?.find(t => t.id === taxpayer);
  const canSeeAllOptions = 
    user.role === "ADMIN" || (matchedTaxpayer && matchedTaxpayer.officerId === user.id);

  const quickActions = [
    { name: 'Aviso', path: `/v2/warning/${taxpayer}`, icon: Bell, color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'Multa', path: `/v2/fine/${taxpayer}`, icon: AlertTriangle, color: 'bg-red-600 hover:bg-red-700' },
    { name: 'Pago', path: `/v2/payment/${taxpayer}`, icon: DollarSign, color: 'bg-green-600 hover:bg-green-700' },
    { name: 'Compromiso de pago', path: `/v2/payment_compromise/${taxpayer}`, icon: FileText, color: 'bg-purple-600 hover:bg-purple-700' },
    { name: 'Observaciones', path: `/v2/observations/${taxpayer}`, icon: Eye, color: 'bg-slate-600 hover:bg-slate-700' },
  ].filter(opt => canSeeAllOptions || opt.name === 'Observaciones');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detalle del Contribuyente"
        description="Información completa y gestión de eventos"
      />

      {/* Estadísticas Individuales */}
      <IndividualStats events={events} IVAReports={taxSummary} />

      {/* Acciones Rápidas */}
      <Card className="bg-slate-800 border-slate-700 p-6 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <h3 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.name} to={action.path}>
                <Button className={`${action.color} text-white font-semibold rounded-md flex items-center gap-2 transition-all duration-200`}>
                  <Icon className="h-4 w-4" />
                  {action.name}
                </Button>
              </Link>
            );
          })}
        </div>
      </Card>

      {/* Tabs para Historial */}
      <Card className="bg-slate-800 border-slate-700 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-900 border-slate-700 grid w-full grid-cols-3">
            <TabsTrigger 
              value="fine" 
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300"
            >
              <Package className="h-4 w-4 mr-2" />
              Historial de Multas
            </TabsTrigger>
            <TabsTrigger 
              value="iva" 
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300"
            >
              <Receipt className="h-4 w-4 mr-2" />
              Historial IVA
            </TabsTrigger>
            <TabsTrigger 
              value="islr" 
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300"
            >
              <FileSearch className="h-4 w-4 mr-2" />
              Historial ISLR
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fine" className="mt-4">
            {events.length > 0 ? (
              <div className="overflow-x-auto">
                <EventTable rows={events} setRows={setEvents} />
              </div>
            ) : (
              <EmptyState 
                title="No hay eventos registrados" 
                message="Agrega multas, avisos o pagos para ver el historial"
              />
            )}
          </TabsContent>

          <TabsContent value="iva" className="mt-4">
            {taxSummary.length > 0 ? (
              <div className="overflow-x-auto">
                <TaxSummaryTable rows={taxSummary} setRows={setTaxSummary} />
              </div>
            ) : (
              <EmptyState 
                title="No hay reportes de IVA" 
                message="Agrega reportes de IVA para ver el historial"
              />
            )}
          </TabsContent>

          <TabsContent value="islr" className="mt-4">
            {islrReports.length > 0 ? (
              <div className="overflow-x-auto">
                <ISLRSummaryTable rows={islrReports} setRows={setIslrReports} />
              </div>
            ) : (
              <EmptyState 
                title="No hay reportes de ISLR" 
                message="Agrega declaraciones de ISLR para ver el historial"
              />
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
