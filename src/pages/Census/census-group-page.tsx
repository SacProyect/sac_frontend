import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/UI/tabs';
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
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full flex flex-col h-full">
        <TabsList className={`grid w-full max-w-md mx-auto mb-4 ${canCapture ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="tabla">Tabla</TabsTrigger>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          {canCapture && <TabsTrigger value="captura">Captura</TabsTrigger>}
        </TabsList>
        <div className="flex-1 min-h-0">
          <TabsContent value="tabla" className="mt-0 h-full">
            <CensusTableView />
          </TabsContent>
          <TabsContent value="mapa" className="mt-0 flex-1 min-h-0">
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="w-full max-w-5xl aspect-[4/3] max-h-full">
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
