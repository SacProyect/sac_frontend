import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  createObservation,
  getObservations,
  updateObservation,
  deleteObservations,
} from '@/components/utils/api/taxpayerFunctions';
import { Card } from '@/components/UI/card';
import { Input } from '@/components/UI/input';
import { Button } from '@/components/UI/button';
import { Label } from '@/components/UI/label';
import { Textarea } from '@/components/UI/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/UI/dialog';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import { LoadingState, EmptyState, PageHeader } from '@/components/UI/v2';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface Observation {
  id: string;
  description: string;
  date: string;
}

interface ObservationFormData {
  description: string;
  date: string;
}

/**
 * ObservationsPageV2 - Gestión de Observaciones con diseño Shadcn UI v2.0
 */
export default function ObservationsPageV2() {
  const { taxpayerId } = useParams();
  const { user } = useAuth();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedDescription, setEditedDescription] = useState<string>('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [observationToDelete, setObservationToDelete] = useState<Observation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ObservationFormData>({
    defaultValues: {
      description: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (!taxpayerId) return;

    const fetchObservations = async () => {
      try {
        setLoading(true);
        const response = await getObservations(taxpayerId);
        setObservations(response || []);
      } catch (error) {
        toast.error('No se pudieron obtener las observaciones.');
      } finally {
        setLoading(false);
      }
    };

    fetchObservations();
  }, [taxpayerId]);

  const onSubmit = async (data: ObservationFormData) => {
    if (!taxpayerId) {
      toast.error('No se ha especificado un contribuyente.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...data,
        taxpayerId: taxpayerId,
      };

      const response = await createObservation(payload);

      if (response) {
        toast.success('¡Observación creada exitosamente!');
        reset({
          description: '',
          date: new Date().toISOString().split('T')[0],
        });
        // Recargar observaciones
        const updated = await getObservations(taxpayerId);
        setObservations(updated || []);
      }
    } catch (e) {
      console.error('Error al crear la observación...', e);
      toast.error('Ocurrió un error al crear la observación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const response = await updateObservation(id, editedDescription);
      if (response) {
        toast.success('¡Observación actualizada correctamente!');
        setObservations((prev) =>
          prev.map((obs) => (obs.id === id ? { ...obs, description: editedDescription } : obs))
        );
        setEditingId(null);
        setEditedDescription('');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al actualizar');
    }
  };

  const handleDelete = async () => {
    if (!observationToDelete) return;

    try {
      const response = await deleteObservations(observationToDelete.id);
      if (response) {
        toast.success(`¡Observación eliminada correctamente!`);
        setObservations((prev) => prev.filter((obs) => obs.id !== observationToDelete.id));
        setDeleteConfirmOpen(false);
        setObservationToDelete(null);
      } else {
        toast.error('La respuesta no contiene datos válidos.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar');
    }
  };

  if (loading) {
    return <LoadingState message="Cargando observaciones..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Observaciones"
        description="Registra y gestiona observaciones para este contribuyente"
      />

      {/* Formulario de nueva observación */}
      <Card className="bg-slate-800 border-slate-700 p-6 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <h2 className="text-lg font-semibold text-white mb-4">Nueva Observación</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="date" className="text-slate-300 mb-2 block">
              Fecha
            </Label>
            <Input
              id="date"
              type="date"
              {...register('date', { required: 'La fecha es requerida' })}
              className="bg-slate-700 border-slate-600 text-white"
            />
            {errors.date && (
              <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description" className="text-slate-300 mb-2 block">
              Descripción
            </Label>
            <Textarea
              id="description"
              {...register('description', {
                required: 'Se debe proporcionar una observación',
                minLength: {
                  value: 20,
                  message: 'La observación debe contener más de 20 caracteres',
                },
              })}
              className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
              placeholder="Describe la observación..."
            />
            {errors.description && (
              <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Observación
          </Button>
        </form>
      </Card>

      {/* Lista de observaciones */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Observaciones ({observations.length})
        </h2>

        {observations.length === 0 ? (
          <EmptyState title="No hay observaciones registradas" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {observations.map((obs) => (
              <Card key={obs.id} className="bg-slate-800 border-slate-700 p-4 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Calendar className="h-4 w-4" />
                    {new Date(obs.date).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    {editingId === obs.id ? (
                      <>
                        <Input
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white text-sm flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(obs.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
                        >
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setEditedDescription('');
                          }}
                          className="border-slate-600 text-slate-300 transition-all duration-200"
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(obs.id);
                            setEditedDescription(obs.description);
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setObservationToDelete(obs);
                            setDeleteConfirmOpen(true);
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-slate-200 text-sm">{obs.description}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-slate-400">
              ¿Está seguro que desea eliminar esta observación? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setObservationToDelete(null);
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
