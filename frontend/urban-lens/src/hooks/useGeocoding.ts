import { useState, useCallback } from 'react';
import { geocodeService, getApiErrorMessage } from '../services/api';
import type { GeocodeResultItem } from '../types';

export const useGeocoding = () => {
  const [allResults, setAllResults] = useState<GeocodeResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [currentQuery, setCurrentQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const searchAddress = useCallback(async (address: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentPage(1);
    setCurrentQuery(address);
    setAllResults([]);
    setHasMore(true);
    
    try {
      const data = await geocodeService.searchAddress(address, 1, pageSize);
      setAllResults(data.results);
      setTotalCount(data.count);
      setCurrentPage(1);
      
      const maxResults = 50;
      setHasMore(data.results.length === pageSize && data.count === pageSize && data.offset + data.count < maxResults);
      
      return data;
    } catch (err) {
      const errorMessage = getApiErrorMessage(err, 'Erro ao buscar endereço');
      setError(errorMessage);
      console.error('Erro no geocoding:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  const loadMore = useCallback(async () => {
    if (!currentQuery || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    
    try {
      const data = await geocodeService.searchAddress(currentQuery, nextPage, pageSize);
      
      setAllResults(prev => [...prev, ...data.results]);
      setCurrentPage(nextPage);
      
      const maxResults = 50;
      const totalLoaded = (nextPage - 1) * pageSize + data.results.length;
      setHasMore(data.results.length === pageSize && totalLoaded < maxResults);
      
      return data;
    } catch (err) {
      const errorMessage = getApiErrorMessage(err, 'Erro ao carregar mais resultados');
      setError(errorMessage);
      console.error('Erro ao carregar mais:', err);
      return null;
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentQuery, currentPage, pageSize, isLoadingMore, hasMore]);

  const clearResult = useCallback(() => {
    setAllResults([]);
    setError(null);
    setCurrentPage(1);
    setCurrentQuery('');
    setHasMore(true);
    setTotalCount(0);
  }, []);

  return {
    results: allResults,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    currentQuery,
    searchAddress,
    loadMore,
    clearResult,
  };
};
