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

    }
  }, [cacheKey]);

  const saveFiltersToCache = useCallback(() => {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(filters));
    } catch (error) {

    }
  }, [cacheKey, filters]);

  useEffect(() => {
    saveFiltersToCache();
  }, [saveFiltersToCache]);

  const clearCache = useCallback(() => {
    try {
      sessionStorage.removeItem(cacheKey);
    } catch (error) {

    }
  }, [cacheKey]);

  return { clearCache };
}
