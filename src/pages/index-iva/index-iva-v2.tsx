import { PageHeader } from '@/components/UI/v2';
import IndexIvaForm from '@/components/index-iva/index-iva-form';

/**
 * IndexIvaV2 - Página de Índice IVA con diseño Shadcn UI v2.0
 */
export default function IndexIvaV2() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <PageHeader
        title="Actualizar Índices de IVA"
        description="Gestiona los índices de IVA para contribuyentes ordinarios y especiales"
      />
      <div className="pt-2">
        <IndexIvaForm />
      </div>
    </div>
  );
}
