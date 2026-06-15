/**
 * Lista estática de parroquias del Municipio Libertador de Caracas.
 * Usada como fallback cuando no hay conexión a internet.
 *
 * IDs reales obtenidos de la tabla Parish en producción (2026-06-15).
 */

import type { Parish } from '@/types/parish';

/**
 * Parroquias con IDs reales de la BD de producción.
 * Actualizar si se modifica la tabla Parish.
 */
export const OFFLINE_PARISHES: Parish[] = [
  { id: '919cb724-4753-4209-bd80-d6bcd3ad319f', name: '23 de Enero' },
  { id: 'af39c4ce-f17c-430b-a422-83b2d4d57101', name: 'Altagracia' },
  { id: '0fc81cc0-78c7-4853-b93a-9f74ee41c738', name: 'Antímano' },
  { id: '82993fe3-7d1c-4f69-9b3a-06a4b9cfb65e', name: 'Caricuao' },
  { id: 'f51618f6-5dd2-4515-a3ae-b91da86612f2', name: 'Catedral' },
  { id: '16001332-c22a-4de2-9dc1-ec334f8ff3e7', name: 'Coche' },
  { id: 'efe5baa4-4e90-4fbe-a317-03ef492453e9', name: 'El Junquito' },
  { id: '7974565e-95e0-43d2-be94-578dd95b4fb3', name: 'El Paraíso' },
  { id: 'f1ba6f5e-484b-4902-8997-9fd6db5efafe', name: 'El Recreo' },
  { id: '68d2c402-4dc3-43b2-bb19-fec45a8edfd0', name: 'El Valle' },
  { id: 'd13763fb-0b8a-49bc-85f0-af87680bad38', name: 'La Candelaria' },
  { id: 'e5e02790-b292-47cd-a080-7c6df5384bd0', name: 'La Pastora' },
  { id: 'e3e67d63-67d7-4f7e-b409-93567051c59d', name: 'La Vega' },
  { id: '91a57b49-1075-4328-b3f3-83784b45b04c', name: 'Macarao' },
  { id: '7417ad90-fda1-4852-a045-ac6ac067c6c2', name: 'San Agustín' },
  { id: '1afaa171-f342-48bb-8a73-edeeef442b19', name: 'San Bernardino' },
  { id: '5020cdd1-f2a1-4f9c-9491-cd55da990503', name: 'San José' },
  { id: 'c986a4aa-ff0c-4ec8-84d4-9db7e6ae354e', name: 'San Juan' },
  { id: 'de1226d1-e78e-4803-a6c9-3893debe3a45', name: 'San Pedro' },
  { id: '4b337140-6b21-498e-8ba3-599cbe3ad17c', name: 'Santa Rosalía' },
  { id: '4c8412c1-f19f-4923-86be-7798a6dfb187', name: 'Santa Teresa' },
  { id: '4e91b09a-3de3-4fa4-9754-c7b81708ae57', name: 'Sucre' },
];
