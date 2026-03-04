import { useEffect, useCallback } from 'react';

export function useFilterCache<T extends Record<string, any>>(
  cacheKey: string,
  filters: T,
  setFilters: (filters: T) => void
) {
  useEffect(() => {
    try {
      const cachedFilters = sessionStorage.getItem(cacheKey);
      if (cachedFilters) {
        const parsed = JSON.parse(cachedFilters);
        setFilters(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar filtros do cache:', error);
    }
  }, [cacheKey]);

  const saveFiltersToCache = useCallback(() => {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(filters));
    } catch (error) {
      console.error('Erro ao salvar filtros no cache:', error);
    }
  }, [cacheKey, filters]);

  useEffect(() => {
    saveFiltersToCache();
  }, [saveFiltersToCache]);

  const clearCache = useCallback(() => {
    try {
      sessionStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Erro ao limpar cache de filtros:', error);
    }
  }, [cacheKey]);

  return { clearCache };
}
