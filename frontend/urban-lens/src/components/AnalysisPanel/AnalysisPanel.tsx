import type { PlacesNearbyResponse, TransportResponse, VulnerabilityNearbyResponse, CrimeStatisticResponse } from '../../types';
import './AnalysisPanel.scss';
import { useState } from 'react';

interface AnalysisPanelProps {
  placesData: PlacesNearbyResponse | null;
  transportData: TransportResponse | null;
  vulnerabilityData: VulnerabilityNearbyResponse | null;
  crimeData: CrimeStatisticResponse | null;
  loading: boolean;
}

export function AnalysisPanel({ placesData, transportData, vulnerabilityData, crimeData, loading }: AnalysisPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);

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

  const placesByType = placesData?.data?.reduce((acc, place) => {
    if (!acc[place.type]) {
      acc[place.type] = [];
    }
    acc[place.type].push(place);
    return acc;
  }, {} as Record<string, typeof placesData.data>) || {};

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
                    {placesData.summary.top_types.slice(0, 3).map((item: { type: string; count: number }, idx: number) => (
                      <div key={idx} className="info-badge info-badge--success">
                        <span className="info-badge__label">{item.type}</span>
                        <span className="info-badge__value">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h4 className="detail-section__title">Lugares por Categoria</h4>
                <div className="places-list">
                  {Object.entries(placesByType).slice(0, 3).map(([type, places]) => (
                    <div key={type} className="place-group">
                      <div className="place-group__header">
                        <span className="place-group__title">{type}</span>
                        <span className="place-group__count">{places.length}</span>
                      </div>
                      <ul className="place-group__list">
                        {places.slice(0, 3).map((place, idx) => (
                          <li key={idx} className="place-item">
                            <span className="place-item__name">{place.name}</span>
                            <span className="place-item__distance">{Math.round(place.distance)}m</span>
                          </li>
                        ))}
                        {places.length > 3 && (
                          <li className="place-item place-item--more">
                            +{places.length - 3} mais
                          </li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
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
