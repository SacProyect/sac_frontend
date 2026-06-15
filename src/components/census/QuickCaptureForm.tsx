import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import { Input } from '@/components/UI/input';
import { Textarea } from '@/components/UI/textarea';
import { Switch } from '@/components/UI/switch';
import { Label } from '@/components/UI/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/UI/form';
import { PhotoCapture } from '@/components/census/PhotoCapture';
import { GpsCapture } from '@/components/census/GpsCapture';
import { LocationVerificationMap } from '@/components/census/PinMapSelector';
import { useOfflineCensus } from '@/hooks/useOfflineCensus';
import { useAuth } from '@/hooks/use-auth';
import { useCachedParishes } from '@/hooks/useCachedData';
import { quickCaptureSchema, type QuickCaptureFormValues } from './quick-capture-schema';
import { detectParroquiaFromPoint, PARROQUIA_LABELS } from '@/components/map/parroquias-data';
import type { ParroquiaCaracas } from '@/components/utils/api/divulgacion-functions';
import { detectParishFromCoords } from '@/components/utils/api/taxpayer-census-functions';
import { Wifi, WifiOff, Save, RotateCcw, CloudUpload, Database, Loader2 } from 'lucide-react';

export function QuickCaptureForm() {
  const { user } = useAuth();
  const { isOnline, pendingCount, isSyncing, saveOffline } = useOfflineCensus();
  const { parishes, loading: parishesLoading } = useCachedParishes();

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoResetKey, setPhotoResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para detección server-side de parroquia
  const [isDetectingParish, setIsDetectingParish] = useState(false);
  const [parishDetectionError, setParishDetectionError] = useState<string | null>(null);

  const form = useForm<QuickCaptureFormValues>({
    resolver: zodResolver(quickCaptureSchema),
    defaultValues: {
      census_number: '',
      census_year: new Date().getFullYear(),
      commercial_name: '',
      activity_type: '',
      billing_method: 'MANUAL',
      has_fiscal_machine: false,
      has_homologated_system: false,
      homologated_system_name: '',
      latitude: null,
      longitude: null,
      address: '',
      parish_id: '',
      official_id: user?.id ?? '',
      taxpayer_id: '',
      rifPrefix: 'J',
      rif: '',
      name: '',
      employee_count: undefined,
      admin_unit_id: '',
    },
  });

  const watchHasHomologated = form.watch('has_homologated_system');
  const watchLatitude = form.watch('latitude');
  const watchLongitude = form.watch('longitude');

  // Resetear nombre de sistema cuando se desactiva el switch
  useEffect(() => {
    if (!watchHasHomologated) {
      form.setValue('homologated_system_name', '');
    }
  }, [watchHasHomologated, form]);

  const handlePhotoCaptured = useCallback((file: File) => {
    setPhotoFile(file);
    setPhotoError(null);
  }, []);

  const handlePhotoRemoved = useCallback(() => {
    setPhotoFile(null);
    setPhotoError(null);
  }, []);

  const handleLocationCaptured = useCallback(async (lat: number, lng: number) => {
    form.setValue('latitude', lat, { shouldValidate: true });
    form.setValue('longitude', lng, { shouldValidate: true });
    
    setIsDetectingParish(true);
    setParishDetectionError(null);
    
    try {
      // 1. Intentar detección server-side primero
      const serverResult = await detectParishFromCoords(lat, lng);
      
      if (serverResult.detected && serverResult.parish_id) {
        // Encontrado en el backend
        form.setValue('parish_id', serverResult.parish_id, { shouldValidate: true });
        toast(`Parroquia detectada: ${serverResult.parish_name}`, { icon: '📍' });
        setIsDetectingParish(false);
        return;
      }
      
      // 2. Fallback a detección client-side
      const clientKey = detectParroquiaFromPoint(lat, lng);
      if (clientKey) {
        const detectedLabel = PARROQUIA_LABELS[clientKey as ParroquiaCaracas];
        const match = parishes.find((p) => {
          const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          return normalize(p.name).includes(normalize(detectedLabel)) || normalize(detectedLabel).includes(normalize(p.name));
        });
        if (match) {
          form.setValue('parish_id', match.id, { shouldValidate: true });
          toast(`Parroquia detectada: ${detectedLabel}`, { icon: '📍' });
          setIsDetectingParish(false);
          return;
        }
      }
      
      // 3. No se pudo detectar
      setParishDetectionError('No se pudo detectar la parroquia. Seleccione manualmente.');
      toast('No se pudo detectar la parroquia. Seleccione manualmente.', { icon: '⚠️' });
    } catch (error) {
      // Error inesperado, intentar fallback client-side
      try {
        const clientKey = detectParroquiaFromPoint(lat, lng);
        if (clientKey) {
          const detectedLabel = PARROQUIA_LABELS[clientKey as ParroquiaCaracas];
          const match = parishes.find((p) => {
            const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            return normalize(p.name).includes(normalize(detectedLabel)) || normalize(detectedLabel).includes(normalize(p.name));
          });
          if (match) {
            form.setValue('parish_id', match.id, { shouldValidate: true });
            toast(`Parroquia detectada (offline): ${detectedLabel}`, { icon: '📍' });
          }
        }
      } catch {
        setParishDetectionError('Error al detectar parroquia');
      }
    } finally {
      setIsDetectingParish(false);
    }
  }, [form, parishes]);

  const handleLocationError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  // Cuando el usuario confirma la ubicación (click "Listo")
  const handleLocationConfirmed = useCallback((lat: number, lng: number) => {
    // La ubicación ya está seteada, no hacer nada más
    // El formulario ya tiene lat/lng y parish_id
  }, []);

  // Cuando el usuario mueve el pin (re-detectar parroquia)
  const handlePinMoved = useCallback((lat: number, lng: number) => {
    form.setValue('latitude', lat, { shouldValidate: true });
    form.setValue('longitude', lng, { shouldValidate: true });
    
    // Re-detectar parroquia
    setIsDetectingParish(true);
    setParishDetectionError(null);
    
    // Usar la misma lógica de detección
    (async () => {
      try {
        const serverResult = await detectParishFromCoords(lat, lng);
        if (serverResult.detected && serverResult.parish_id) {
          form.setValue('parish_id', serverResult.parish_id, { shouldValidate: true });
          toast(`Parroquia detectada: ${serverResult.parish_name}`, { icon: '📍' });
          return;
        }
        const clientKey = detectParroquiaFromPoint(lat, lng);
        if (clientKey) {
          const detectedLabel = PARROQUIA_LABELS[clientKey as ParroquiaCaracas];
          const match = parishes.find((p) => {
            const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            return normalize(p.name).includes(normalize(detectedLabel)) || normalize(detectedLabel).includes(normalize(p.name));
          });
          if (match) {
            form.setValue('parish_id', match.id, { shouldValidate: true });
            toast(`Parroquia detectada: ${detectedLabel}`, { icon: '📍' });
          }
        }
      } catch {
        // Fallback silencioso
      } finally {
        setIsDetectingParish(false);
      }
    })();
  }, [form, parishes]);

  // Cuando el usuario quiere capturar GPS de nuevo
  const handleDiscardLocation = useCallback(() => {
    form.setValue('latitude', null, { shouldValidate: true });
    form.setValue('longitude', null, { shouldValidate: true });
    form.setValue('parish_id', '', { shouldValidate: true });
    setIsDetectingParish(false);
    setParishDetectionError(null);
  }, [form]);

  const getSyncBadge = () => {
    if (isSyncing) {
      return (
        <Badge variant="secondary" className="gap-1">
          <CloudUpload className="w-3 h-3 animate-bounce" />
          Sincronizando...
        </Badge>
      );
    }
    if (!isOnline) {
      return (
        <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700">
          <Database className="w-3 h-3" />
          Guardado localmente
        </Badge>
      );
    }
    if (pendingCount > 0) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Database className="w-3 h-3" />
          {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
        <Wifi className="w-3 h-3" />
        Sincronizado
      </Badge>
    );
  };

  const onSubmit = async (values: QuickCaptureFormValues) => {
    if (isSubmitting) return;

    // Validación manual de foto obligatoria
    if (!photoFile) {
      setPhotoError('La foto de fachada es obligatoria');
      toast.error('Debe capturar una foto de fachada');
      return;
    }

    // Validación manual de GPS obligatorio
    if (values.latitude == null || values.longitude == null) {
      toast.error('Debe capturar la ubicación GPS');
      return;
    }

    setIsSubmitting(true);

    try {
      const valuesToSubmit = {
        ...values,
        rif: values.rif ? `${values.rifPrefix || 'J'}-${values.rif}` : undefined,
        official_id: user?.id ?? values.official_id,
      };

      await saveOffline(valuesToSubmit, photoFile);

      toast.success(isOnline ? 'Censo guardado. Sincronizando...' : 'Censo guardado localmente');

      // Resetear formulario
      form.reset({
        census_number: '',
        census_year: new Date().getFullYear(),
        commercial_name: '',
        activity_type: '',
        billing_method: 'MANUAL',
        has_fiscal_machine: false,
        has_homologated_system: false,
        homologated_system_name: '',
      latitude: null,
      longitude: null,
        address: '',
        parish_id: '',
        official_id: user?.id ?? '',
      taxpayer_id: '',
      rifPrefix: 'J',
      rif: '',
      name: '',
        employee_count: undefined,
        admin_unit_id: '',
      });
      setPhotoFile(null);
      setPhotoError(null);
      setPhotoResetKey((k) => k + 1);
      setIsDetectingParish(false);
      setParishDetectionError(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? 'Error al guardar el censo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveOffline = async () => {
    if (!isOnline) {
      form.handleSubmit(onSubmit)();
    }
  };

  const handleClear = () => {
    form.reset({
      census_number: '',
      census_year: new Date().getFullYear(),
      commercial_name: '',
      activity_type: '',
      billing_method: 'MANUAL',
      has_fiscal_machine: false,
      has_homologated_system: false,
      homologated_system_name: '',
      latitude: null,
      longitude: null,
      address: '',
      parish_id: '',
        official_id: user?.id ?? '',
        taxpayer_id: '',
        rifPrefix: 'J',
        rif: '',
        name: '',
        employee_count: undefined,
        admin_unit_id: '',
      });
      setPhotoFile(null);
    setPhotoError(null);
    setPhotoResetKey((k) => k + 1);
    setIsDetectingParish(false);
    setParishDetectionError(null);
    toast('Formulario limpiado', { icon: '🧹' });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xl font-bold tracking-tight">
            Captura Rápida de Censo
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {isOnline ? (
              <Badge variant="outline" className="gap-1 text-green-700 border-green-300">
                <Wifi className="w-3 h-3" />
                Online
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-red-700 border-red-300">
                <WifiOff className="w-3 h-3" />
                Offline
              </Badge>
            )}
            {getSyncBadge()}
          </div>
        </div>
        {pendingCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {pendingCount} censo{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''} de sincronización
          </p>
        )}
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Datos básicos del censo */}
            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="census_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de censo *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: CEN-2024-001"
                        {...field}
                        className="min-h-[48px] text-base"
                        aria-label="Número de censo"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="census_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año de censo *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="min-h-[48px] text-base"
                        aria-label="Año de censo"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commercial_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre comercial *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre del establecimiento"
                        {...field}
                        className="min-h-[48px] text-base"
                        aria-label="Nombre comercial"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activity_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actividad / Rubro *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Venta de alimentos, servicios, etc."
                        {...field}
                        className="min-h-[48px] text-base"
                        aria-label="Actividad o rubro"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billing_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de facturación *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="min-h-[48px] text-base">
                          <SelectValue placeholder="Seleccione método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                        <SelectItem value="ELECTRONICA">Electrónica</SelectItem>
                        <SelectItem value="MIXTA">Mixta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Switches */}
            <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4">
              <FormField
                control={form.control}
                name="has_fiscal_machine"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">¿Tiene máquina fiscal?</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Tiene máquina fiscal"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="has_homologated_system"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">¿Tiene sistema homologado?</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Tiene sistema homologado"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchHasHomologated && (
                <FormField
                  control={form.control}
                  name="homologated_system_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del sistema homologado *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: SoftRestaurant, SAP, etc."
                          {...field}
                          className="min-h-[48px] text-base"
                          aria-label="Nombre del sistema homologado"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Foto y Ubicación */}
            <div className="flex flex-col gap-4">
              <div>
                <Label className="text-base font-semibold mb-2 block">Foto de fachada *</Label>
                <PhotoCapture
                  key={photoResetKey}
                  onPhotoCaptured={handlePhotoCaptured}
                  onPhotoRemoved={handlePhotoRemoved}
                />
                {photoError && (
                  <p className="text-sm font-medium text-destructive mt-2">{photoError}</p>
                )}
              </div>

              <div>
                <Label className="text-base font-semibold mb-2 block">Ubicación GPS *</Label>
                
                {/* Mostrar GPS capture SOLO cuando no hay coordenadas */}
                {!watchLatitude && !watchLongitude ? (
                  <GpsCapture
                    onLocationCaptured={handleLocationCaptured}
                    onLocationError={handleLocationError}
                  />
                ) : (
                  /* Mostrar mapa de verificación cuando hay coordenadas */
                  <LocationVerificationMap
                    latitude={watchLatitude!}
                    longitude={watchLongitude!}
                    onConfirm={handleLocationConfirmed}
                    onPinMoved={handlePinMoved}
                    onDiscard={handleDiscardLocation}
                    isDetectingParish={isDetectingParish}
                  />
                )}
              </div>
            </div>

            {/* Datos de ubicación y parroquia */}
            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Dirección completa del establecimiento"
                        {...field}
                        className="min-h-[80px] text-base resize-none"
                        aria-label="Dirección"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parish_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Parroquia *
                      {isDetectingParish && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Detectando parroquia...
                        </span>
                      )}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={parishesLoading || isDetectingParish}
                    >
                      <FormControl>
                        <SelectTrigger className="min-h-[48px] text-base">
                          <SelectValue 
                            placeholder={
                              parishesLoading 
                                ? 'Cargando...' 
                                : isDetectingParish 
                                  ? 'Detectando parroquia...' 
                                  : 'Seleccione parroquia'
                            } 
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {parishes.map((parish) => (
                          <SelectItem key={parish.id} value={parish.id}>
                            {parish.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {parishDetectionError && (
                      <p className="text-xs text-amber-600 mt-1">{parishDetectionError}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Datos adicionales del contribuyente */}
            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="rif"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RIF</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) => form.setValue('rifPrefix', value)}
                          defaultValue="J"
                          value={form.watch('rifPrefix') || 'J'}
                        >
                          <SelectTrigger className="w-[80px] min-h-[48px] text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="J">J-</SelectItem>
                            <SelectItem value="V">V-</SelectItem>
                            <SelectItem value="G">G-</SelectItem>
                            <SelectItem value="E">E-</SelectItem>
                            <SelectItem value="P">P-</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="123456789"
                          {...field}
                          className="flex-1 min-h-[48px] text-base"
                          aria-label="RIF"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razón social</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Razón social del contribuyente"
                        {...field}
                        className="min-h-[48px] text-base"
                        aria-label="Razón social"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employee_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad de empleados</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        className="min-h-[48px] text-base"
                        aria-label="Cantidad de empleados"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="admin_unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad administrativa</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ID de unidad administrativa"
                        {...field}
                        className="min-h-[48px] text-base"
                        aria-label="Unidad administrativa"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Botones */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full min-h-[52px] text-base font-semibold"
                disabled={isSubmitting || isSyncing}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Guardando...' : 'Guardar Rápido'}
              </Button>

              {!isOnline && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full min-h-[52px] text-base font-semibold"
                  onClick={handleSaveOffline}
                  disabled={isSubmitting}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Guardar Offline
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                className="w-full min-h-[48px] text-base"
                onClick={handleClear}
                disabled={isSubmitting}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
