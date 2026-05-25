import { useState } from 'react';
import { PageHeader } from '@/components/UI/v2';
import IndexIvaForm from '@/components/index-iva/index-iva-form';
import IndexCurrentIva from '@/components/index-iva/index-current-iva';
import { Button } from '@/components/UI/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
/**
 * IndexIvaV2 - Página de Índice IVA con diseño Shadcn UI v2.0
 */
export default function IndexIvaV2() {
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <PageHeader
        title="Actualizar Índices de IVA"
        description="Gestiona los índices de IVA para contribuyentes ordinarios y especiales"
        action={<Button variant="outline" onClick={() => navigate('/admin')} className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>}
      />
      <div className="pt-2">
        {/* Visualización de Índices Actuales */}
        <IndexCurrentIva key={refreshKey} />
        
        {/* Formulario de Actualización */}
        <IndexIvaForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
