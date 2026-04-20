import { useState, useEffect, useCallback } from 'react';
import { getParishList, getTaxpayerCategories, getTaxpayers, getTaxpayerForEvents } from '@/components/utils/api/taxpayer-functions';
import { getOfficers } from '@/components/utils/api/user-functions';
import type { Parish } from '@/types/parish';
import type { TaxpayerCategories } from '@/types/taxpayer-categories';
import type { Taxpayer } from '@/types/taxpayer';

// Tiempo de caché: 5 minutos
const CACHE_DURATION = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Respuesta paginada de get-taxpayers-for-events
export interface TaxpayersForEventsResult {
  data: Taxpayer[];
  page: number;
  totalPages: number;
}

// Caché global compartido entre todos los componentes
const globalCache = {
  parishes: null as CacheEntry<Parish[]> | null,
  categories: null as CacheEntry<TaxpayerCategories[]> | null,
  officers: null as CacheEntry<Array<{ id: string; name: string; personId: string }>> | null,
  taxpayers: null as CacheEntry<Taxpayer[]> | null,
  taxpayersForEvents: null as CacheEntry<TaxpayersForEventsResult> | null,
};

// Flags para evitar peticiones duplicadas simultáneas
const fetchingFlags = {
  parishes: false,
  categories: false,
  officers: false,
  taxpayers: false,
  taxpayersForEvents: false,
};

const isCacheValid = <T>(cache: CacheEntry<T> | null): boolean => {
  if (!cache) return false;
  return Date.now() - cache.timestamp < CACHE_DURATION;
};

/**
 * Hook para obtener y cachear listas de parroquias
 */
export const useCachedParishes = () => {
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParishes = useCallback(async () => {
    // Si hay caché válido, usarlo
    if (isCacheValid(globalCache.parishes)) {
      setParishes(globalCache.parishes!.data);
      return;
    }

    // Si ya se está haciendo una petición, esperar
    if (fetchingFlags.parishes) {
      // Esperar un poco y volver a intentar
      setTimeout(() => {
        if (globalCache.parishes) {
          setParishes(globalCache.parishes.data);
        }
      }, 100);
      return;
    }

    try {
      setLoading(true);
      fetchingFlags.parishes = true;
      
      const response = await getParishList();
      const data = Array.isArray(response?.data) 
        ? response.data 
        : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      
      globalCache.parishes = {
        data,
        timestamp: Date.now(),
      };
      
      setParishes(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching parishes:', err);
      setError('No se pudo cargar la lista de parroquias');
    } finally {
      setLoading(false);
      fetchingFlags.parishes = false;
    }
  }, []);

  useEffect(() => {
    fetchParishes();
  }, [fetchParishes]);

  return { parishes, loading, error, refetch: fetchParishes };
};

/**
 * Hook para obtener y cachear categorías de contribuyentes
 */
export const useCachedCategories = () => {
  const [categories, setCategories] = useState<TaxpayerCategories[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (isCacheValid(globalCache.categories)) {
      setCategories(globalCache.categories!.data);
      return;
    }

    if (fetchingFlags.categories) {
      setTimeout(() => {
        if (globalCache.categories) {
          setCategories(globalCache.categories.data);
        }
      }, 100);
      return;
    }

    try {
      setLoading(true);
      fetchingFlags.categories = true;
      
      const response = await getTaxpayerCategories();
      const data = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      
      globalCache.categories = {
        data,
        timestamp: Date.now(),
      };
      
      setCategories(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('No se pudo cargar la lista de categorías');
    } finally {
      setLoading(false);
      fetchingFlags.categories = false;
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories };
};

/**
 * Hook para obtener y cachear lista de funcionarios
 */
export const useCachedOfficers = () => {
  const [officers, setOfficers] = useState<Array<{ id: string; name: string; personId: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOfficers = useCallback(async () => {
    if (isCacheValid(globalCache.officers)) {
      setOfficers(globalCache.officers!.data);
      return;
    }

    if (fetchingFlags.officers) {
      setTimeout(() => {
        if (globalCache.officers) {
          setOfficers(globalCache.officers.data);
        }
      }, 100);
      return;
    }

    try {
      setLoading(true);
      fetchingFlags.officers = true;
      
      const data = await getOfficers();
      
      globalCache.officers = {
        data: data || [],
        timestamp: Date.now(),
      };
      
      setOfficers(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching officers:', err);
      setError('No se pudo cargar la lista de funcionarios');
    } finally {
      setLoading(false);
      fetchingFlags.officers = false;
    }
  }, []);

  useEffect(() => {
    fetchOfficers();
  }, [fetchOfficers]);

  return { officers, loading, error, refetch: fetchOfficers };
};

/**
 * Hook para obtener y cachear contribuyentes (con límite razonable)
 * IMPORTANTE: Solo cachea para modales. HomePage debe manejar su propia paginación.
 */
export const useCachedTaxpayers = (limit: number = 100) => {
  const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTaxpayers = useCallback(async () => {
    if (isCacheValid(globalCache.taxpayers)) {
      setTaxpayers(globalCache.taxpayers!.data);
      return;
    }

    if (fetchingFlags.taxpayers) {
      setTimeout(() => {
        if (globalCache.taxpayers) {
          setTaxpayers(globalCache.taxpayers.data);
        }
      }, 100);
      return;
    }

    try {
      setLoading(true);
      fetchingFlags.taxpayers = true;
      
      // Limitar a 100 registros para evitar sobrecarga
      const response = await getTaxpayers(1, limit);
      const data = response?.data || [];
      
      globalCache.taxpayers = {
        data,
        timestamp: Date.now(),
      };
      
      setTaxpayers(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching taxpayers:', err);
      setError('No se pudo cargar la lista de contribuyentes');
    } finally {
      setLoading(false);
      fetchingFlags.taxpayers = false;
    }
  }, [limit]);

  useEffect(() => {
    fetchTaxpayers();
  }, [fetchTaxpayers]);

  return { taxpayers, loading, error, refetch: fetchTaxpayers };
};

/**
 * Hook para obtener y cachear contribuyentes para eventos/reportes (get-taxpayers-for-events).
 * Cachea solo la primera página; para "cargar más" los componentes deben usar getTaxpayerForEvents(page, limit).
 */
export const useCachedTaxpayersForEvents = (limit: number = 50) => {
  const [taxpayersForEvents, setTaxpayersForEvents] = useState<Taxpayer[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTaxpayersForEvents = useCallback(async () => {
    if (isCacheValid(globalCache.taxpayersForEvents)) {
      const cached = globalCache.taxpayersForEvents!;
      setTaxpayersForEvents(cached.data.data);
      setTotalPages(cached.data.totalPages);
      return;
    }

    if (fetchingFlags.taxpayersForEvents) {
      setTimeout(() => {
        if (globalCache.taxpayersForEvents) {
          setTaxpayersForEvents(globalCache.taxpayersForEvents.data.data);
          setTotalPages(globalCache.taxpayersForEvents.data.totalPages);
        }
      }, 100);
      return;
    }

    try {
      setLoading(true);
      fetchingFlags.taxpayersForEvents = true;

      const response = await getTaxpayerForEvents(1, limit);
      const payload = response?.data as { data?: Taxpayer[]; totalPages?: number } | Taxpayer[] | undefined;
      const data = Array.isArray(payload) ? payload : (payload?.data ?? []);
      const total = Array.isArray(payload) ? 1 : (payload?.totalPages ?? 1);

      globalCache.taxpayersForEvents = {
        data: { data, page: 1, totalPages: total },
        timestamp: Date.now(),
      };

      setTaxpayersForEvents(data);
      setTotalPages(total);
      setError(null);
    } catch (err) {
      console.error('Error fetching taxpayers for events:', err);
      setError('No se pudo cargar la lista de contribuyentes');
    } finally {
      setLoading(false);
      fetchingFlags.taxpayersForEvents = false;
    }
  }, [limit]);

  useEffect(() => {
    fetchTaxpayersForEvents();
  }, [fetchTaxpayersForEvents]);

  return {
    taxpayersForEvents,
    totalPages,
    loading,
    error,
    refetch: fetchTaxpayersForEvents,
  };
};

/**
 * Hook combinado para cargar todos los datos comunes de una vez
 * Útil para modales que necesitan múltiples listas
 */
export const useCachedFormData = () => {
  const parishesData = useCachedParishes();
  const categoriesData = useCachedCategories();
  const officersData = useCachedOfficers();

  const loading = parishesData.loading || categoriesData.loading || officersData.loading;
  const error = parishesData.error || categoriesData.error || officersData.error;

  return {
    parishes: parishesData.parishes,
    categories: categoriesData.categories,
    officers: officersData.officers,
    loading,
    error,
    refetch: () => {
      parishesData.refetch();
      categoriesData.refetch();
      officersData.refetch();
    },
  };
};

/**
 * Función para invalidar el caché manualmente cuando sea necesario
 * (por ejemplo, después de crear/actualizar/eliminar datos)
 */
export const invalidateCache = (key?: keyof typeof globalCache) => {
  if (key) {
    globalCache[key] = null;
  } else {
    // Invalidar todo el caché
    globalCache.parishes = null;
    globalCache.categories = null;
    globalCache.officers = null;
    globalCache.taxpayers = null;
    globalCache.taxpayersForEvents = null;
  }
};
