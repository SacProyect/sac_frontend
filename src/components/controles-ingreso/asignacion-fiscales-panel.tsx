import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Badge } from '@/components/UI/badge';
import { UserPlus, Trash2, User } from 'lucide-react';
import type { ControlIngresoAssignee } from '@/types/controles-ingreso';

interface AsignacionFiscalesPanelProps {
  assignees: ControlIngresoAssignee[];
  onAdd: (assignee: Omit<ControlIngresoAssignee, 'id' | 'control_id' | 'created_at'>) => void;
  onRemove: (id: string) => void;
}

export function AsignacionFiscalesPanel({ assignees, onAdd, onRemove }: AsignacionFiscalesPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [doc, setDoc] = useState('');
  const [role, setRole] = useState('');
  const [position, setPosition] = useState('');

  const handleAdd = () => {
    if (!name.trim() || !doc.trim()) return;
    onAdd({
      full_name: name.trim(),
      identity_document: doc.trim(),
      role_name: role.trim() || 'Fiscal',
      position: position.trim() || null,
      is_manual: true,
    });
    setName('');
    setDoc('');
    setRole('');
    setPosition('');
    setShowForm(false);
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-100 text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-400" />
            Fiscales Asignados
            <Badge className="ml-2 text-[10px] bg-slate-700 text-slate-300 border-slate-600">
              {assignees.length}
            </Badge>
          </CardTitle>
          <Button
            variant="outline" size="sm"
            onClick={() => setShowForm(!showForm)}
            className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 h-8"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Formulario de agregar */}
        {showForm && (
          <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/30 space-y-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
              className="bg-slate-800 border-slate-700 text-slate-200 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={doc}
                onChange={(e) => setDoc(e.target.value)}
                placeholder="Cédula (V-XXXXXX)"
                className="bg-slate-800 border-slate-700 text-slate-200 text-sm"
              />
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Rol (Fiscal)"
                className="bg-slate-800 border-slate-700 text-slate-200 text-sm"
              />
            </div>
            <Input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Cargo (opcional)"
              className="bg-slate-800 border-slate-700 text-slate-200 text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!name.trim() || !doc.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-8"
              >
                Guardar
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => setShowForm(false)}
                className="border-slate-700 text-slate-400 h-8"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de fiscales */}
        {assignees.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No hay fiscales asignados</p>
        ) : (
          <div className="space-y-2">
            {assignees.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30 border border-slate-700/20"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">{a.full_name}</p>
                    <p className="text-[10px] text-slate-500">
                      {a.identity_document} · {a.role_name}
                      {a.position && ` · ${a.position}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => onRemove(a.id)}
                  className="text-slate-500 hover:text-red-400 h-8 w-8 p-0 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
