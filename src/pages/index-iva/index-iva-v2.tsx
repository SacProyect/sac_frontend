import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/v2';
import IndexIvaForm from '@/components/index-iva/index-iva-form';

/**
 * IndexIvaV2 - Página de Índice IVA con diseño Shadcn UI v2.0
 */
export default function IndexIvaV2() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Actualizar Índices de IVA"
        description="Gestiona los índices de IVA para contribuyentes ordinarios y especiales"
      />
      <Card className="bg-slate-800 border-slate-700 p-6 max-w-md mx-auto transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <IndexIvaForm />
      </Card>
    </div>
  );
}
