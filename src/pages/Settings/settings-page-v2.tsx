import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/tabs';
import { User, Lock, Bell } from 'lucide-react';
import { ProfileTabV2 } from '@/components/settings/profile-tab-v2';
import { SecurityTabV2 } from '@/components/settings/security-tab-v2';
import { NotificationsTabV2 } from '@/components/settings/notifications-tab-v2';

/**
 * SettingsPageV2 - Página de Ajustes con diseño Shadcn UI v2.0
 * 
 * Incluye tabs para:
 * - Mi Perfil: Editar datos del usuario
 * - Seguridad: Cambio de contraseña
 * - Notificaciones: Configuración de alertas
 */
export default function SettingsPageV2() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Ajustes</h1>
        <p className="text-slate-400 mt-2">Administra tu perfil, seguridad y preferencias</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Vertical Tabs List - Left Side */}
          <div className="lg:col-span-1">
            <TabsList className="flex flex-col w-full h-auto bg-slate-800 border border-slate-700 rounded-lg p-2 space-y-1 transition-all duration-200 hover:border-slate-600">
              <TabsTrigger
                value="profile"
                className="w-full justify-start gap-3 text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white py-3 px-4 transition-all duration-200"
              >
                <User className="h-5 w-5" />
                <span>Mi Perfil</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="w-full justify-start gap-3 text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white py-3 px-4 transition-all duration-200"
              >
                <Lock className="h-5 w-5" />
                <span>Seguridad</span>
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="w-full justify-start gap-3 text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white py-3 px-4 transition-all duration-200"
              >
                <Bell className="h-5 w-5" />
                <span>Notificaciones</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content - Right Side */}
          <div className="lg:col-span-3">
            <TabsContent value="profile" className="mt-0">
              <ProfileTabV2 />
            </TabsContent>
            <TabsContent value="security" className="mt-0">
              <SecurityTabV2 />
            </TabsContent>
            <TabsContent value="notifications" className="mt-0">
              <NotificationsTabV2 />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
