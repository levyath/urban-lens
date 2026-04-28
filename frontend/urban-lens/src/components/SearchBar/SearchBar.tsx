import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useGeocoding } from '../../hooks/useGeocoding';
import { GeocodeResults } from '../GeocodeResults/GeocodeResults';
import type { GeocodeResultItem } from '../../types';
import './SearchBar.scss';

export interface SearchBarProps {
  onSelectAddress: (result: GeocodeResultItem) => void;
  placeholder?: string;
}

export const SearchBar = ({ 
  onSelectAddress, 
  placeholder = 'Buscar endereço...' 
}: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    results,
    isLoading, 
    isLoadingMore,
    error, 
    hasMore,
    totalCount,
    currentQuery,
    searchAddress, 
    loadMore,
    clearResult 
  } = useGeocoding();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (results.length > 0) {
          clearResult();
          setSearchTerm('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [results.length, clearResult]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchTerm.trim()) {
      await searchAddress(searchTerm);
    }
  };

  const handleSelectResult = (item: GeocodeResultItem) => {
    onSelectAddress(item);
    clearResult();
    setSearchTerm('');
  };

  const handleClear = () => {
    clearResult();
    setSearchTerm('');
  };

  const hasResults = results.length > 0 || isLoading || error;

  return (
    <>
      {hasResults && (
        <div 
          className="search-bar-backdrop"
          onClick={handleClear}
        />
      )}

      <div className="search-bar-container" ref={containerRef}>
        <form className="search-bar" onSubmit={handleSubmit}>
          <span className="search-bar__icon">
            <Icon icon="fa6-solid:magnifying-glass" width="18" height="18" />
          </span>
          
          <input
            type="text"
            className="search-bar__input"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
          />
          
          {searchTerm && (
            <>
              <button
                type="button"
                className="search-bar__clear"
                onClick={handleClear}
                title="Limpar"
              >
                <Icon icon="mdi:close" width="20" height="20" />
              </button>
              <div className="search-bar__divider"></div>
            </>
          )}
          
          <button 
            type="submit" 
            className="search-bar__button"
            disabled={isLoading || !searchTerm.trim()}
          >
            {isLoading ? (
              <>
                <Icon icon="eos-icons:loading" width="18" height="18" />
                <span>Buscando</span>
              </>
            ) : (
              <>
                <Icon icon="mdi:target" width="18" height="18" />
                <span>Buscar</span>
              </>
            )}
          </button>
        </form>

        <GeocodeResults
          results={results}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          error={error}
          hasMore={hasMore}
          totalCount={totalCount}
          currentQuery={currentQuery}
          onSelectResult={handleSelectResult}
          onLoadMore={loadMore}
        />
      </div>
    </>
  );
};
