import { useState, useEffect, useRef } from 'react';
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" width="20" height="20">
              <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
            </svg>
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
                ✕
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
                <span>⏳</span>
                <span>Buscando</span>
              </>
            ) : (
              <>
                <span>🎯</span>
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
