export type AuditoriaRow = {
  id: string;
  usuario_id: string;
  accion: string;
  entidad: string;
  entidad_id: string;
  valores_anteriores: unknown;
  valores_nuevos: unknown;
  fecha: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export type AuditoriaListResponse = {
  success: boolean;
  data: AuditoriaRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
