import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/UI/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select';
import CensusTableView from '@/pages/Census/CensusTableView';
import CensusQuickCapturePage from '@/pages/Census/census-quick-capture-page';
import CensusMapPage from '@/pages/Census/census-map-page';

export default function CensusGroupPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const allowedRoles = ['FISCAL', 'SUPERVISOR', 'ADMIN', 'COORDINATOR'];
  const canCapture = user && allowedRoles.includes(user.role);

  const activeTab = searchParams.get('tab') || 'tabla';
  const validTabs = ['tabla', 'mapa', ...(canCapture ? ['captura'] : [])];
  const currentTab = validTabs.includes(activeTab) ? activeTab : 'tabla';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Mobile: select dropdown (hidden ≥ md) */}
      <div className="md:hidden px-4 pt-2 pb-3">
        <Select value={currentTab} onValueChange={handleTabChange}>
          <SelectTrigger
            className="w-full min-h-[48px] bg-slate-800 border-slate-700 text-slate-200"
            aria-label="Cambiar vista de censo"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tabla">Tabla de censo</SelectItem>
            <SelectItem value="mapa">Mapa</SelectItem>
            {canCapture && <SelectItem value="captura">Captura rápida</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full flex flex-col h-full">
        {/* Desktop: tabs (hidden < md) */}
        <TabsList
          className={`hidden md:grid w-full max-w-md mx-auto mb-4 ${canCapture ? 'grid-cols-3' : 'grid-cols-2'}`}
        >
          <TabsTrigger value="tabla">Tabla</TabsTrigger>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          {canCapture && <TabsTrigger value="captura">Captura</TabsTrigger>}
        </TabsList>
        <div className="flex-1 min-h-0">
          <TabsContent value="tabla" className="mt-0 h-full">
            <CensusTableView />
          </TabsContent>
          {/* Mobile: full-screen map; Desktop: centered with max-w-5xl aspect-[4/3] */}
          <TabsContent value="mapa" className="mt-0 flex-1 min-h-0">
            <div className="w-full h-full lg:flex lg:items-center lg:justify-center lg:p-4">
              <div className="w-full h-full lg:max-w-5xl lg:aspect-[4/3] lg:max-h-full">
                <CensusMapPage />
              </div>
            </div>
          </TabsContent>
          {canCapture && (
            <TabsContent value="captura" className="mt-0 h-full">
              <CensusQuickCapturePage />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
