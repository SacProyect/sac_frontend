import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { zodResolver } from '@hookform/resolvers/zod';
import { errorsSchema } from '@/components/validations/errorsSchema';
import { createError } from '@/components/utils/api/reportFunctions';
import { Card } from '@/components/UI/card';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Textarea } from '@/components/UI/textarea';
import { Button } from '@/components/UI/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select';
import { Upload, X } from 'lucide-react';
import { PageHeader } from '@/components/UI/v2';
import toast from 'react-hot-toast';
import { app_error } from '@/types/errors';

export interface InputErrors {
  id?: string;
  title?: string;
  description: string;
  type:
    | 'HOME'
    | 'TAXPAYER_DETAILS'
    | 'TAXPAYERS'
    | 'WARNING'
    | 'FINES'
    | 'PAYMENT'
    | 'PAYMENT_COMPROMISE'
    | 'STATS'
    | 'OTHER';
  userId: string;
  closed_at?: Date;
  error_images?: Array<{
    id?: string;
    img_src: string;
    img_alt: string;
    errorId?: string;
  }>;
}

/**
 * ErrorsReportV2 - Página de Reporte de Errores con diseño Shadcn UI v2.0
 */
export default function ErrorsReportV2() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const { register, reset, handleSubmit, formState: { errors }, setValue, watch } = useForm<InputErrors>({
    resolver: zodResolver(errorsSchema),
    defaultValues: {
      userId: user.id || '',
      type: 'OTHER',
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: true,
    onDrop: (acceptedFiles) => {
      setUploadedFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
    },
  });

  const removeFile = (index: number) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const onSubmit: SubmitHandler<InputErrors> = async (data) => {
    if (isSubmitting) return;

    const userId = user.id;
    const formData = new FormData();

    formData.append('title', data.title || '');
    formData.append('description', data.description || '');
    formData.append('type', data.type || '');
    formData.append('userId', userId || '');

    uploadedFiles.forEach((file) => {
      formData.append('images', file);
    });

    try {
      setIsSubmitting(true);
      const request = await createError(formData);

      if (request) {
        toast.success('¡Error reportado exitosamente!');
        reset();
        setUploadedFiles([]);
      }
    } catch (e) {
      console.error(e);
      toast.error('Ha ocurrido un error, por favor, intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <PageHeader
        title="Reportar Error"
        description="Notifica errores o problemas encontrados en el sistema"
      />

      <Card className="bg-slate-800 border-slate-700 p-6 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-300">
              Título del error
            </Label>
            <Input
              id="title"
              {...register('title')}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              placeholder="Describe brevemente el error"
            />
            {errors.title && (
              <p className="text-red-400 text-xs">{errors.title.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-slate-300">
              Tipo de error <span className="text-red-400">*</span>
            </Label>
            <Select
              value={watch('type')}
              onValueChange={(value) => setValue('type', value as InputErrors['type'])}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Seleccione una opción" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value={app_error.HOME}>Inicio</SelectItem>
                <SelectItem value={app_error.TAXPAYERS}>Contribuyentes</SelectItem>
                <SelectItem value={app_error.TAXPAYER_DETAILS}>Detalles del contribuyente</SelectItem>
                <SelectItem value={app_error.WARNING}>Avisos</SelectItem>
                <SelectItem value={app_error.FINES}>Multas</SelectItem>
                <SelectItem value={app_error.PAYMENT}>Pagos</SelectItem>
                <SelectItem value={app_error.PAYMENT_COMPROMISE}>Compromiso de pago</SelectItem>
                <SelectItem value={app_error.OTHER}>Otro</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-red-400 text-xs">{errors.type.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">
              Descripción <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="description"
              {...register('description')}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 min-h-[120px]"
              placeholder="Describe el error en detalle..."
            />
            {errors.description && (
              <p className="text-red-400 text-xs">{errors.description.message}</p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="text-slate-300">Imágenes (opcional)</Label>
            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-slate-600 bg-slate-900 hover:border-slate-500'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm text-slate-400 text-center px-4">
                {isDragActive
                  ? 'Suelta los archivos aquí...'
                  : 'Arrastra y suelta imágenes o haz clic para seleccionar'}
              </p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-slate-300">Archivos seleccionados:</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-300">📄 {file.name}</span>
                        <span className="text-xs text-slate-500">
                          ({(file.size / 1024).toFixed(2)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
