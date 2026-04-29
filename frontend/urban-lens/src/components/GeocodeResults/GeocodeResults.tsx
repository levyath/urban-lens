import { useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import type { GeocodeResultItem } from '../../types';
import './GeocodeResults.scss';

export interface GeocodeResultsProps {
  results: GeocodeResultItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  currentQuery: string;
  onSelectResult: (item: GeocodeResultItem) => void;
  onLoadMore: () => void;
}

export const GeocodeResults = ({
  results,
  isLoading,
  isLoadingMore,
  error,
  hasMore,
  currentQuery,
  onSelectResult,
  onLoadMore,
}: GeocodeResultsProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const setupIntersectionObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          onLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '20px',
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
  }, [hasMore, isLoadingMore, isLoading, onLoadMore]);

  useEffect(() => {
    setupIntersectionObserver();
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [setupIntersectionObserver]);

  useEffect(() => {
    if (loadMoreRef.current && observerRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
  }, [results.length]);

  if (isLoading && results.length === 0) {
    return (
      <div className="geocode-results geocode-results--loading">
        <div className="geocode-results__spinner">
          <Icon icon="eos-icons:loading" width="24" height="24" />
          <span>Buscando endereços...</span>
        </div>
      </div>
    );
  }

  if (error && results.length === 0) {
    return (
      <div className="geocode-results geocode-results--error">
        <div className="geocode-results__error">{error}</div>
      </div>
    );
  }

  if (!isLoading && results.length === 0 && currentQuery) {
    return (
      <div className="geocode-results geocode-results--empty">
        <div className="geocode-results__empty">
          Nenhum endereço encontrado para "{currentQuery}". Tente uma busca diferente.
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="geocode-results">
      <div className="geocode-results__header">
        <h3 className="geocode-results__title">
          Resultados para "{currentQuery}"
        </h3>
      </div>

      <div className="geocode-results__list" ref={listRef}>
        {results.map((item, index) => (
          <div
            key={`${item.lat}-${item.lon}-${index}`}
            className="geocode-results__item"
            onClick={() => onSelectResult(item)}
          >
            <div className="geocode-results__item-content">
              <div className="geocode-results__address">{item.address}</div>
              <div className="geocode-results__coordinates">
                {item.lat.toFixed(6)}, {item.lon.toFixed(6)}
              </div>
            </div>
          </div>
        ))}

        {hasMore && (
          <div ref={loadMoreRef} className="geocode-results__load-more">
            {isLoadingMore ? (
              <div className="geocode-results__loading-more">
                <Icon icon="eos-icons:loading" width="16" height="16" />
                Carregando mais resultados...
              </div>
            ) : (
              <div className="geocode-results__load-more-trigger">
                Role para baixo para carregar mais
              </div>
            )}
          </div>
        )}

        {!hasMore && results.length > 10 && (
          <div className="geocode-results__end">
            <div className="geocode-results__end-message">
              Todos os resultados foram carregados
            </div>
          </div>
        )}
      </div>

      {error && results.length > 0 && (
        <div className="geocode-results__error-footer">
          {error}
        </div>
      )}
    </div>
  );
};