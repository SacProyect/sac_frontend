import { z } from 'zod';

export const quickCaptureSchema = z.object({
  census_number: z.string().min(1, 'Número de censo es obligatorio'),
  census_year: z.number().int().min(2000).max(2100),
  commercial_name: z.string().min(1, 'Nombre comercial es obligatorio'),
  activity_type: z.string().min(1, 'Actividad/Rubro es obligatorio'),
  billing_method: z.enum(['MANUAL', 'ELECTRONICA', 'MIXTA']),
  has_fiscal_machine: z.boolean(),
  has_homologated_system: z.boolean(),
  homologated_system_name: z.string().optional(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  address: z.string().optional(),
  parish_id: z.string().min(1, 'Parroquia es obligatoria'),
  official_id: z.string(),
  taxpayer_id: z.string().optional(),
  rif: z.string().optional(),
  name: z.string().optional(),
  employee_count: z.number().int().optional(),
  admin_unit_id: z.string().optional(),
}).refine((data) => {
  if (data.has_homologated_system) {
    return data.homologated_system_name && data.homologated_system_name.length > 0;
  }
  return true;
}, {
  message: 'Nombre del sistema homologado es obligatorio cuando tiene sistema homologado',
  path: ['homologated_system_name'],
});

export type QuickCaptureFormValues = z.infer<typeof quickCaptureSchema>;
