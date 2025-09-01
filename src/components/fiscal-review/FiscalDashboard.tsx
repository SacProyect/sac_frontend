import * as React from 'react';
import { useEffect, useState } from 'react';
import { User } from '@/types/user';
import { TaxpayersList } from '@/types/reports';
import { getActiveProcesses, getCompletedProcesses } from '../utils/api/fiscalReviewApi';
import TaxpayerList from '../fiscal-stats/page1/TaxpayerList';
import toast from 'react-hot-toast';

interface FiscalDashboardProps {
  fiscal: User;
}

type FilterType = 'all' | 'active' | 'completed';

const FiscalDashboard: React.FC<FiscalDashboardProps> = ({ fiscal }: { fiscal: User }) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [taxpayers, setTaxpayers] = useState<TaxpayersList[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTaxpayers = async (filterType: FilterType) => {
    setLoading(true);
    try {
      let data: TaxpayersList[] = [];
      if (filterType === 'active') {
        data = await getActiveProcesses(fiscal.id);
      } else if (filterType === 'completed') {
        data = await getCompletedProcesses(fiscal.id);
      } else {
        // Para 'all' se puede llamar a getFiscalTaxpayers o combinar activos y completados
        // Aquí asumimos que se llama a getFiscalTaxpayers (no implementado aquí)
        // Por ahora, combinamos activos y completados
        const active = await getActiveProcesses(fiscal.id);
        const completed = await getCompletedProcesses(fiscal.id);
        data = [...active, ...completed];
      }
      setTaxpayers(data);
    } catch (error) {
      toast.error('Error al obtener los contribuyentes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxpayers(filter);
  }, [filter, fiscal]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="mb-4 text-xl font-semibold">Dashboard Fiscal: {fiscal.name}</h2>
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('all')}
        >
          Contribuyentes
        </button>
        <button
          className={`px-4 py-2 rounded ${filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('active')}
        >
          Procesos Activos
        </button>
        <button
          className={`px-4 py-2 rounded ${filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('completed')}
        >
          Completados
        </button>
      </div>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <TaxpayerList fiscalInfo={{ fiscalId: fiscal.id, taxpayersList: taxpayers }} />
      )}
    </div>
  );
};

export default FiscalDashboard;
