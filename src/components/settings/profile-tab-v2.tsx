import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Upload } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import toast from 'react-hot-toast';

export function ProfileTabV2() {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(''); // Si tienes campo de teléfono en el usuario

  const handleSave = async () => {
    try {
      // TODO: Conectar a API de actualización de usuario
      // await updateUser(user.id, { email, phone });
      
      // Actualizar estado local
      if (user) {
        setUser({
          ...user,
          email: email,
        });
      }
      
      setIsEditing(false);
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      toast.error('Error al actualizar el perfil');
    }
  };

  const userInitials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const roleLabel =
    user?.role === 'COORDINATOR'
      ? 'COORDINADOR'
      : user?.role === 'ADMIN'
      ? 'ADMINISTRADOR'
      : user?.role === 'SUPERVISOR'
      ? 'SUPERVISOR'
      : user?.role === 'FISCAL'
      ? 'FISCAL'
      : user?.role || 'Usuario';

  return (
    <Card className="bg-slate-800 border-slate-700 p-6 space-y-8 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
      {/* Avatar Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Foto de Perfil</h3>
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 border-2 border-slate-600">
            <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2 bg-transparent transition-all duration-200"
            >
              <Upload className="h-4 w-4" />
              Cambiar Foto
            </Button>
            <p className="text-xs text-slate-400">JPG, PNG o GIF. Máximo 5MB</p>
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="border-t border-slate-700 pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Información Personal</h3>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Editar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name - Read Only */}
          <div className="space-y-2">
            <Label className="text-slate-300">Nombre Completo</Label>
            <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-400 text-sm">
              {user?.name || 'N/A'}
            </div>
            <p className="text-xs text-slate-500">Solo lectura</p>
          </div>

          {/* Role - Read Only */}
          <div className="space-y-2">
            <Label className="text-slate-300">Rol</Label>
            <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-400 text-sm">
              {roleLabel}
            </div>
            <p className="text-xs text-slate-500">Solo lectura</p>
          </div>

          {/* Person ID - Read Only */}
          <div className="space-y-2">
            <Label className="text-slate-300">Cédula</Label>
            <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-400 text-sm">
              {user?.personId || 'N/A'}
            </div>
            <p className="text-xs text-slate-500">Solo lectura</p>
          </div>

          {/* Email - Editable */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">
              Correo Electrónico
            </Label>
            {isEditing ? (
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                placeholder="correo@ejemplo.com"
              />
            ) : (
              <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-300 text-sm">
                {email || 'No especificado'}
              </div>
            )}
          </div>

          {/* Phone - Editable */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-300">
              Teléfono
            </Label>
            {isEditing ? (
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                placeholder="+58 414 123 4567"
              />
            ) : (
              <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-300 text-sm">
                {phone || 'No especificado'}
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
            >
              Guardar Cambios
            </Button>
            <Button
              onClick={() => {
                setIsEditing(false);
                setEmail(user?.email || '');
              }}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 transition-all duration-200"
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
