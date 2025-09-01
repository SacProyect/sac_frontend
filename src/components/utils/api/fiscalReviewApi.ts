import axios from 'axios';
import { TaxpayersList } from '@/types/reports';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function getActiveProcesses(fiscalId: string): Promise<TaxpayersList[]> {
  const response = await axios.get(\`\${API_BASE_URL}/processes/active\`, {
    params: { fiscalId }
  });
  return response.data;
}

export async function getCompletedProcesses(fiscalId: string): Promise<TaxpayersList[]> {
  const response = await axios.get(\`\${API_BASE_URL}/processes/completed\`, {
    params: { fiscalId }
  });
  return response.data;
}
