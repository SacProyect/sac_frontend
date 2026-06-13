import { useState, useEffect, useCallback, useRef } from 'react';
import type { CensusTableParams, PaginationMeta } from '@/types/census-table';

interface UseCensusTableOptions<T> {
  fetchFn: (params: CensusTableParams) => Promise<{
    success: boolean;
    data: T[] | null;
    pagination?: PaginationMeta;
    message?: string;
  }>;
  dataKey: string;
  initialLimit?: number;
  enabled?: boolean;
}

interface UseCensusTableReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  totalPages: number;
  total: number;
  statusFilter: string;
  sort: string;
  goToPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setStatusFilter: (status: string) => void;
  setSort: (sort: string) => void;
  refresh: () => void;
}

export function useCensusTable<T>({
  fetchFn,
  dataKey: _dataKey,
  initialLimit = 10,
  enabled = true,
}: UseCensusTableOptions<T>): UseCensusTableReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilterState] = useState('');
  const [sort, setSortState] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const abortRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const currentFetch = ++abortRef.current;
    setLoading(true);
    setError(null);

    try {
      const params: CensusTableParams = {
        page,
        limit,
      };
      if (statusFilter) params.status = statusFilter;
      if (sort) params.sort = sort;

      const result = await fetchFn(params);

      // Aborted or stale
      if (currentFetch !== abortRef.current) return;

      if (result.success) {
        setData(result.data ?? []);
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages);
          setTotal(result.pagination.total);
        }
      } else {
        setData([]);
        setError(result.message || 'Error al cargar datos.');
      }
    } catch (err: any) {
      if (currentFetch !== abortRef.current) return;
      setData([]);
      setError(err.message || 'Error inesperado.');
    } finally {
      if (currentFetch === abortRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, page, limit, statusFilter, sort, refreshKey, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit);
    setPage(1); // Reset to first page when changing limit
  }, []);

  const setStatusFilter = useCallback((status: string) => {
    setStatusFilterState(status);
    setPage(1); // Reset to first page when filtering
  }, []);

  const setSort = useCallback((newSort: string) => {
    setSortState(newSort);
    setPage(1);
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    data,
    loading,
    error,
    page,
    limit,
    totalPages,
    total,
    statusFilter,
    sort,
    goToPage,
    setLimit,
    setStatusFilter,
    setSort,
    refresh,
  };
}
