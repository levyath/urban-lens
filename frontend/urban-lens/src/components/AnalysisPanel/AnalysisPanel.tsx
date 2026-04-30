import type { PlacesNearbyResponse, TransportResponse, VulnerabilityNearbyResponse, CrimeStatisticResponse } from '../../types';
import './AnalysisPanel.scss';
import { useState } from 'react';
import axios from 'axios';

interface AnalysisPanelProps {
  placesData: PlacesNearbyResponse | null;
  transportData: TransportResponse | null;
  vulnerabilityData: VulnerabilityNearbyResponse | null;
  crimeData: CrimeStatisticResponse | null;
  loading: boolean;
  selectedLocation: { lat: number; lon: number } | null;
  searchRadius: number;
  onPlaceClick?: (place: { name: string; lat: number; lon: number; type: string }) => void;
  onClearPlaceMarkers?: () => void;
}

interface ExpandedCategory {
  type: string;
  places: Array<{ name: string; distance: number; lat: number; lon: number }>;
  page: number;
  hasMore: boolean;
  loading: boolean;
}

export function AnalysisPanel({ 
  placesData, 
  transportData, 
  vulnerabilityData, 
  crimeData, 
  loading,
  selectedLocation,
  searchRadius,
  onPlaceClick,
  onClearPlaceMarkers
}: AnalysisPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, ExpandedCategory>>({});
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryPage, setCategoryPage] = useState(0);
  const categoriesPerPage = 8;

  if (isMinimized) {
    return (
      <div className="analysis-panel analysis-panel--minimized">
        <div className="analysis-panel__header">
          <h2 className="analysis-panel__title">📊 Análise da Região</h2>
          <button 
            className="analysis-panel__action-btn" 
            onClick={() => setIsMinimized(false)}
            title="Maximizar"
          >
            ▲
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="analysis-panel">
        <div className="analysis-panel__header">
          <h2 className="analysis-panel__title">Carregando Análise...</h2>
          <button 
            className="analysis-panel__action-btn" 
            onClick={() => setIsMinimized(true)}
            title="Minimizar"
          >
            ▼
          </button>
        </div>
        <div className="analysis-panel__loading">
          <div className="analysis-panel__spinner"></div>
          <p>Buscando dados de lugares, transportes, vulnerabilidade e segurança...</p>
        </div>
      </div>
    );
  }

  const handlePlaceClick = (place: { name: string; lat: number; lon: number; type: string }, placeId: string) => {
    setSelectedPlaceId(placeId);
    if (onPlaceClick) {
      onPlaceClick(place);
    }
  };

  const handleLoadMorePlaces = async (type: string) => {
    if (!selectedLocation) return;

    // Se for uma nova categoria, limpa a anterior
    if (selectedCategory !== type) {
      setSelectedCategory(type);
      setExpandedCategories({});
      setSelectedPlaceId(null);
    }

    const category = expandedCategories[type];
    const isFirstLoad = !category;

    if (category?.loading) return;

    if (isFirstLoad) {
      setExpandedCategories({
        [type]: {
          type,
          places: [],
          page: 1,
          hasMore: true,
          loading: true
        }
      });
    } else {
      setExpandedCategories(prev => ({
        ...prev,
        [type]: { ...prev[type], loading: true }
      }));
    }

    try {
      const nextPage = isFirstLoad ? 1 : category.page + 1;
      const response = await axios.get<PlacesNearbyResponse>('http://localhost:3000/places/near', {
        params: {
          lat: selectedLocation.lat,
          lon: selectedLocation.lon,
          radius: searchRadius,
          type: type,
          page: nextPage,
          page_size: 20
        }
      });

      const newPlaces = response.data.data.map(p => ({ 
        name: p.name, 
        distance: p.distance,
        lat: p.lat,
        lon: p.lon
      }));
      const allPlaces = isFirstLoad ? newPlaces : [...category.places, ...newPlaces];

      setExpandedCategories({
        [type]: {
          type,
          places: allPlaces,
          page: nextPage,
          hasMore: nextPage < response.data.summary.total_pages,
          loading: false
        }
      });
    } catch (error) {
      console.error('Erro ao carregar lugares da categoria:', error);
      if (isFirstLoad) {
        setExpandedCategories({});
        setSelectedCategory(null);
      } else {
        setExpandedCategories(prev => ({
          ...prev,
          [type]: { ...prev[type], loading: false }
        }));
      }
    }
  };

  const handleCollapseCategory = () => {
    setExpandedCategories({});
    setSelectedCategory(null);
    setSelectedPlaceId(null);
    if (onClearPlaceMarkers) {
      onClearPlaceMarkers();
    }
  };

  return (
    <div className="analysis-panel">
      <div className="analysis-panel__header">
        <h2 className="analysis-panel__title">📊 Análise da Região</h2>
        <button 
          className="analysis-panel__action-btn" 
          onClick={() => setIsMinimized(true)}
          title="Minimizar"
        >
          ▼
        </button>
      </div>

      <div className="analysis-panel__content">
        <section className="analysis-section">
          <h3 className="analysis-section__title">🚇 Transportes</h3>
          
          {transportData ? (
            <>
              <div className="analysis-section__score">
                <div className="score-badge">
                  <span className="score-badge__label">Avaliação de Transporte</span>
                  <div className="score-badge__stars">
                    {'⭐'.repeat(transportData.summary.rating_stars)}
                    {'☆'.repeat(5 - transportData.summary.rating_stars)}
                  </div>
                  <span className="score-badge__subtitle">
                    {transportData.summary.rating_stars}/5 estrelas
                  </span>
                </div>
              </div>

              <div className="data-grid">
                <div className="data-card">
                  <div className="data-card__icon">🚌</div>
                  <div className="data-card__content">
                    <div className="data-card__value">{transportData.summary.counts_by_type.bus_stops}</div>
                    <div className="data-card__label">Pontos de Ônibus</div>
                  </div>
                </div>
                
                <div className="data-card">
                  <div className="data-card__icon">🚆</div>
                  <div className="data-card__content">
                    <div className="data-card__value">{transportData.summary.counts_by_type.train_stations}</div>
                    <div className="data-card__label">Estações de Trem</div>
                  </div>
                </div>
                
                <div className="data-card">
                  <div className="data-card__icon">🚇</div>
                  <div className="data-card__content">
                    <div className="data-card__value">{transportData.summary.counts_by_type.subway_entrances}</div>
                    <div className="data-card__label">Entradas de Metrô</div>
                  </div>
                </div>

                <div className="data-card data-card--highlight">
                  <div className="data-card__icon">📍</div>
                  <div className="data-card__content">
                    <div className="data-card__value">{transportData.summary.total}</div>
                    <div className="data-card__label">Total de Transportes</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">🚇</div>
              <p className="empty-state__text">Nenhum dado de transporte disponível</p>
            </div>
          )}
        </section>

        <section className="analysis-section">
          <h3 className="analysis-section__title">🏪 Lugares Próximos</h3>
          
          {placesData && placesData.data && placesData.data.length > 0 ? (
            <>
              <div className="analysis-section__score">
                <div className="score-badge score-badge--secondary">
                  <span className="score-badge__label">Avaliação de Lugares</span>
                  <div className="score-badge__stars">
                    {'⭐'.repeat(placesData.summary?.rating_stars || 0)}
                    {'☆'.repeat(5 - (placesData.summary?.rating_stars || 0))}
                  </div>
                  <span className="score-badge__subtitle">
                    {placesData.summary?.rating_stars || 0}/5 estrelas
                  </span>
                </div>
              </div>

              <div className="data-grid">
                <div className="data-card data-card--highlight data-card--full">
                  <div className="data-card__icon">🏪</div>
                  <div className="data-card__content">
                    <div className="data-card__value">{placesData.summary?.total || 0}</div>
                    <div className="data-card__label">Total de Lugares</div>
                  </div>
                </div>
              </div>

              {placesData.summary?.top_types && placesData.summary.top_types.length > 0 && (
                <div className="detail-section">
                  <h4 className="detail-section__title">Categorias Principais</h4>
                  <div className="badge-list">
                    {placesData.summary.top_types.slice(0, 3).map((item: { type: string; count: number }, idx: number) => {
                      const isActive = selectedCategory === item.type;
                      return (
                        <div 
                          key={idx} 
                          className={`info-badge info-badge--success info-badge--clickable ${isActive ? 'info-badge--active' : ''}`}
                          onClick={() => handleLoadMorePlaces(item.type)}
                        >
                          <span className="info-badge__label">{item.type}</span>
                          <span className="info-badge__value">{item.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {placesData.summary?.counts_by_type && placesData.summary.counts_by_type.length > 0 && (
                <div className="detail-section">
                  <div className="category-header">
                    <h4 className="detail-section__title">
                      Todas as Categorias ({placesData.summary.counts_by_type.length})
                    </h4>
                    {placesData.summary.counts_by_type.length > categoriesPerPage && (
                      <div className="category-pagination">
                        <button 
                          className="category-pagination__btn"
                          onClick={() => setCategoryPage(prev => Math.max(0, prev - 1))}
                          disabled={categoryPage === 0}
                        >
                          ◀
                        </button>
                        <span className="category-pagination__info">
                          {categoryPage + 1}/{Math.ceil((placesData.summary.counts_by_type?.length || 0) / categoriesPerPage)}
                        </span>
                        <button 
                          className="category-pagination__btn"
                          onClick={() => setCategoryPage(prev => Math.min(Math.ceil((placesData.summary.counts_by_type?.length || 0) / categoriesPerPage) - 1, prev + 1))}
                          disabled={categoryPage >= Math.ceil((placesData.summary.counts_by_type?.length || 0) / categoriesPerPage) - 1}
                        >
                          ▶
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="category-grid">
                    {placesData.summary.counts_by_type
                      .slice(categoryPage * categoriesPerPage, (categoryPage + 1) * categoriesPerPage)
                      .map((item: { type: string; count: number }, idx: number) => {
                        const isActive = selectedCategory === item.type;
                        return (
                          <div 
                            key={idx} 
                            className={`category-card ${isActive ? 'category-card--active' : ''}`}
                            onClick={() => handleLoadMorePlaces(item.type)}
                          >
                            <div className="category-card__content">
                              <div className="category-card__name">{item.type}</div>
                              <div className="category-card__count">{item.count}</div>
                            </div>
                            {isActive && <div className="category-card__indicator">✓</div>}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {selectedCategory && expandedCategories[selectedCategory] && (
                <div className="detail-section">
                  <div className="category-header">
                    <h4 className="detail-section__title">
                      {selectedCategory}
                    </h4>
                    <button 
                      className="category-close-btn"
                      onClick={handleCollapseCategory}
                    >
                      ✕ Fechar
                    </button>
                  </div>
                  <div className="places-list">
                    {(() => {
                      const expandedData = expandedCategories[selectedCategory];
                      const totalCountFromSummary = placesData?.summary?.counts_by_type?.find(
                        (item) => item.type === selectedCategory
                      )?.count || expandedData.places.length;
                      
                      const displayedCount = expandedData.places.length;
                      const hasMore = expandedData.hasMore;
                      const isLoading = expandedData.loading;

                      return (
                        <div className="place-group">
                          <ul className="place-group__list">
                            {expandedData.places.map((place, idx) => {
                              const placeId = `${selectedCategory}-${idx}`;
                              const isSelected = selectedPlaceId === placeId;
                              
                              return (
                                <li 
                                  key={idx} 
                                  className={`place-item place-item--clickable ${isSelected ? 'place-item--selected' : ''}`}
                                  onClick={() => handlePlaceClick({ 
                                    name: place.name, 
                                    lat: place.lat, 
                                    lon: place.lon, 
                                    type: selectedCategory 
                                  }, placeId)}
                                >
                                  <span className="place-item__name">{place.name}</span>
                                  <span className="place-item__distance">{Math.round(place.distance)}m</span>
                                </li>
                              );
                            })}
                            {isLoading && (
                              <li className="place-item place-item--loading">
                                <div className="place-item__spinner"></div>
                                <span>Carregando mais...</span>
                              </li>
                            )}
                            {hasMore && !isLoading && (
                              <li 
                                className="place-item place-item--load-more" 
                                onClick={() => handleLoadMorePlaces(selectedCategory)}
                              >
                                <span className="place-item__expand-icon">▼</span>
                                <span className="place-item__expand-text">
                                  Ver mais ({displayedCount}/{totalCountFromSummary})
                                </span>
                              </li>
                            )}
                          </ul>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">🏪</div>
              <p className="empty-state__text">Nenhum lugar encontrado nesta região</p>
            </div>
          )}
        </section>

        <section className="analysis-section">
          <h3 className="analysis-section__title">⚠️ Vulnerabilidade Social</h3>
          
          {vulnerabilityData && vulnerabilityData.summary.total > 0 ? (
            <>
              <div className="analysis-section__score">
                <div className="score-badge score-badge--warning">
                  <span className="score-badge__label">Nível de Vulnerabilidade</span>
                  <div className="score-badge__stars">
                    {'⭐'.repeat(vulnerabilityData.summary.vulnerability_stars)}
                    {'☆'.repeat(5 - vulnerabilityData.summary.vulnerability_stars)}
                  </div>
                  <span className="score-badge__subtitle">
                    {vulnerabilityData.summary.vulnerability_stars}/5 estrelas (maior = mais vulnerável)
                  </span>
                </div>
              </div>

              <div className="data-grid">
                <div className="data-card data-card--danger">
                  <div className="data-card__icon">🏘️</div>
                  <div className="data-card__content">
                    <div className="data-card__value">{vulnerabilityData.summary.total}</div>
                    <div className="data-card__label">Áreas Vulneráveis</div>
                  </div>
                </div>

                <div className="data-card data-card--danger">
                  <div className="data-card__icon">👥</div>
                  <div className="data-card__content">
                    <div className="data-card__value">
                      {vulnerabilityData.summary.total_population_sabren.toLocaleString()}
                    </div>
                    <div className="data-card__label">População Total</div>
                  </div>
                </div>

                {vulnerabilityData.summary.nearest_distance_meters !== null && (
                  <div className="data-card data-card--danger data-card--full">
                    <div className="data-card__icon">📏</div>
                    <div className="data-card__content">
                      <div className="data-card__value">
                        {Math.round(vulnerabilityData.summary.nearest_distance_meters)}m
                      </div>
                      <div className="data-card__label">Área Mais Próxima</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h4 className="detail-section__title">Distribuição por Proximidade</h4>
                <div className="metric-list">
                  {vulnerabilityData.summary.high_count > 0 && (
                    <div className="metric-item metric-item--danger">
                      <span className="metric-item__label">Muito Próximo (&lt;300m)</span>
                      <span className="metric-item__value">{vulnerabilityData.summary.high_count}</span>
                    </div>
                  )}
                  {vulnerabilityData.summary.medium_count > 0 && (
                    <div className="metric-item metric-item--warning">
                      <span className="metric-item__label">Próximo (300-800m)</span>
                      <span className="metric-item__value">{vulnerabilityData.summary.medium_count}</span>
                    </div>
                  )}
                  {vulnerabilityData.summary.low_count > 0 && (
                    <div className="metric-item metric-item--success">
                      <span className="metric-item__label">Distante (&gt;800m)</span>
                      <span className="metric-item__value">{vulnerabilityData.summary.low_count}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">⚠️</div>
              <p className="empty-state__text">Nenhuma área vulnerável encontrada nesta região</p>
            </div>
          )}
        </section>

        <section className="analysis-section">
          <h3 className="analysis-section__title">🚨 Segurança e Criminalidade</h3>
          
          {crimeData && crimeData.sucesso ? (
            <>
              <div className="analysis-section__score">
                <div className="score-badge score-badge--safety">
                  <span className="score-badge__label">Índice de Segurança</span>
                  <div className="score-badge__stars">
                    {'⭐'.repeat(crimeData.crime_safety_stars)}
                    {'☆'.repeat(5 - crimeData.crime_safety_stars)}
                  </div>
                  <span className="score-badge__subtitle">
                    {crimeData.crime_safety_stars}/5 estrelas (maior = mais seguro)
                  </span>
                </div>
              </div>

              <div className="data-grid">
                <div className={`data-card data-card--full data-card--risk data-card--risk-${crimeData.indice_risco.toLowerCase().replace('í', 'i').replace('é', 'e')}`}>
                  <div className="data-card__icon">⚠️</div>
                  <div className="data-card__content">
                    <div className="data-card__value">{crimeData.indice_risco}</div>
                    <div className="data-card__label">Índice de Risco</div>
                  </div>
                </div>

                <div className="data-card data-card--info data-card--full">
                  <div className="data-card__icon">🏛️</div>
                  <div className="data-card__content">
                    <div className="data-card__value">{crimeData.delegacia_responsavel}</div>
                    <div className="data-card__label">Delegacia Responsável</div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="detail-section__title">Estatísticas Criminais</h4>
                <div className="data-grid data-grid--compact">
                  <div className="data-card data-card--compact">
                    <div className="data-card__icon">💀</div>
                    <div className="data-card__content">
                      <div className="data-card__value">{crimeData.dados_brutos.letalidade_violenta}</div>
                      <div className="data-card__label">Letalidade Violenta</div>
                    </div>
                  </div>

                  <div className="data-card data-card--compact">
                    <div className="data-card__icon">🏃</div>
                    <div className="data-card__content">
                      <div className="data-card__value">{crimeData.dados_brutos.roubos_rua}</div>
                      <div className="data-card__label">Roubos de Rua</div>
                    </div>
                  </div>

                  <div className="data-card data-card--compact">
                    <div className="data-card__icon">🚗</div>
                    <div className="data-card__content">
                      <div className="data-card__value">{crimeData.dados_brutos.roubos_veiculo}</div>
                      <div className="data-card__label">Roubos de Veículo</div>
                    </div>
                  </div>

                  <div className="data-card data-card--compact data-card--highlight">
                    <div className="data-card__icon">📊</div>
                    <div className="data-card__content">
                      <div className="data-card__value">{crimeData.dados_brutos.pontuacao_total}</div>
                      <div className="data-card__label">Pontuação Total</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">🚨</div>
              <p className="empty-state__text">Dados de segurança não disponíveis para esta região</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
