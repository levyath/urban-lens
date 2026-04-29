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
          <h2 className="analysis-panel__title">📊 Análise</h2>
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
              <div className="analysis-section__summary">
                <div className="stat-card">
                  <div className="stat-card__icon">🚌</div>
                  <div className="stat-card__content">
                    <div className="stat-card__label">Pontos de Ônibus</div>
                    <div className="stat-card__value">{transportData.summary.counts_by_type.bus_stops}</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-card__icon">🚆</div>
                  <div className="stat-card__content">
                    <div className="stat-card__label">Estações de Trem</div>
                    <div className="stat-card__value">{transportData.summary.counts_by_type.train_stations}</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-card__icon">🚇</div>
                  <div className="stat-card__content">
                    <div className="stat-card__label">Entradas de Metrô</div>
                    <div className="stat-card__value">{transportData.summary.counts_by_type.subway_entrances}</div>
                  </div>
                </div>
              </div>

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

              {transportData.summary.top_types && transportData.summary.top_types.length > 0 && (
                <div className="analysis-section__highlight">
                  <strong>Mais comum:</strong> 
                  <span className="highlight-badge">
                    {transportData.summary.top_types[0].type === 'bus_stop' ? '🚌 Ônibus' : 
                     transportData.summary.top_types[0].type === 'train_station' ? '🚆 Trem' : '🚇 Metrô'}
                    {' '}({transportData.summary.top_types[0].count})
                  </span>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              Nenhum dado de transporte disponível
            </p>
          )}
        </section>

        <section className="analysis-section">
          <h3 className="analysis-section__title">📍 Lugares Próximos</h3>
          
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

              <div className="analysis-section__summary">
                <div className="stat-card stat-card--full">
                  <div className="stat-card__icon">🏪</div>
                  <div className="stat-card__content">
                    <div className="stat-card__label">Total de Lugares</div>
                    <div className="stat-card__value">{placesData.summary?.total || 0}</div>
                  </div>
                </div>
              </div>

              {placesData.summary?.top_types && placesData.summary.top_types.length > 0 && (
                <div className="top-categories">
                  <h4 className="top-categories__title">Categorias Principais</h4>
                  <div className="top-categories__list">
                    {placesData.summary.top_types.slice(0, 3).map((item: { type: string; count: number }, idx: number) => (
                      <div key={idx} className="category-badge">
                        <span className="category-badge__name">{item.type}</span>
                        <span className="category-badge__count">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="places-list">
                {Object.entries(placesByType).slice(0, 3).map(([type, places]) => (
                  <div key={type} className="place-group">
                    <h4 className="place-group__title">
                      {type} <span className="place-group__count">({places.length})</span>
                    </h4>
                    <ul className="place-group__list">
                      {places.slice(0, 3).map((place, idx) => (
                        <li key={idx} className="place-item">
                          <span className="place-item__name">{place.name}</span>
                          <span className="place-item__distance">
                            {Math.round(place.distance)}m
                          </span>
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
            </>
          ) : (
            <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              Nenhum lugar encontrado nesta região
            </p>
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
                    {vulnerabilityData.summary.vulnerability_stars}/5 estrelas
                  </span>
                </div>
              </div>

              <div className="analysis-section__summary">
                <div className="stat-card stat-card--danger">
                  <div className="stat-card__icon">🏘️</div>
                  <div className="stat-card__content">
                    <div className="stat-card__label">Áreas Vulneráveis</div>
                    <div className="stat-card__value">{vulnerabilityData.summary.total}</div>
                  </div>
                </div>

                <div className="stat-card stat-card--danger">
                  <div className="stat-card__icon">👥</div>
                  <div className="stat-card__content">
                    <div className="stat-card__label">População</div>
                    <div className="stat-card__value">
                      {vulnerabilityData.summary.total_population_sabren.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="vulnerability-breakdown">
                <h4 className="vulnerability-breakdown__title">Distribuição por Proximidade</h4>
                <div className="vulnerability-breakdown__items">
                  {vulnerabilityData.summary.high_count > 0 && (
                    <div className="vulnerability-item vulnerability-item--high">
                      <span className="vulnerability-item__label">Muito Próximo (&lt;300m)</span>
                      <span className="vulnerability-item__count">{vulnerabilityData.summary.high_count}</span>
                    </div>
                  )}
                  {vulnerabilityData.summary.medium_count > 0 && (
                    <div className="vulnerability-item vulnerability-item--medium">
                      <span className="vulnerability-item__label">Próximo (300-800m)</span>
                      <span className="vulnerability-item__count">{vulnerabilityData.summary.medium_count}</span>
                    </div>
                  )}
                  {vulnerabilityData.summary.low_count > 0 && (
                    <div className="vulnerability-item vulnerability-item--low">
                      <span className="vulnerability-item__label">Distante (&gt;800m)</span>
                      <span className="vulnerability-item__count">{vulnerabilityData.summary.low_count}</span>
                    </div>
                  )}
                </div>
              </div>

              {vulnerabilityData.summary.nearest_distance_meters !== null && (
                <div className="analysis-section__highlight analysis-section__highlight--warning">
                  <strong>Área mais próxima:</strong>
                  <span className="highlight-badge highlight-badge--warning">
                    {Math.round(vulnerabilityData.summary.nearest_distance_meters)}m
                  </span>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              Nenhuma área vulnerável encontrada nesta região
            </p>
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
                    {crimeData.crime_safety_stars}/5 estrelas
                  </span>
                </div>
              </div>

              <div className={`crime-risk-badge crime-risk-badge--${crimeData.indice_risco.toLowerCase().replace('í', 'i').replace('é', 'e')}`}>
                <span className="crime-risk-badge__label">Índice de Risco</span>
                <span className="crime-risk-badge__value">{crimeData.indice_risco}</span>
              </div>

              <div className="analysis-section__highlight analysis-section__highlight--info">
                <strong>Delegacia Responsável:</strong>
                <span className="highlight-badge highlight-badge--info">
                  {crimeData.delegacia_responsavel}
                </span>
              </div>

              <div className="crime-stats">
                <h4 className="crime-stats__title">Estatísticas Criminais</h4>
                <div className="crime-stats__grid">
                  <div className="crime-stat-item">
                    <span className="crime-stat-item__icon">💀</span>
                    <div className="crime-stat-item__content">
                      <span className="crime-stat-item__label">Letalidade Violenta</span>
                      <span className="crime-stat-item__value">{crimeData.dados_brutos.letalidade_violenta}</span>
                    </div>
                  </div>

                  <div className="crime-stat-item">
                    <span className="crime-stat-item__icon">🏃</span>
                    <div className="crime-stat-item__content">
                      <span className="crime-stat-item__label">Roubos de Rua</span>
                      <span className="crime-stat-item__value">{crimeData.dados_brutos.roubos_rua}</span>
                    </div>
                  </div>

                  <div className="crime-stat-item">
                    <span className="crime-stat-item__icon">🚗</span>
                    <div className="crime-stat-item__content">
                      <span className="crime-stat-item__label">Roubos de Veículo</span>
                      <span className="crime-stat-item__value">{crimeData.dados_brutos.roubos_veiculo}</span>
                    </div>
                  </div>

                  <div className="crime-stat-item">
                    <span className="crime-stat-item__icon">📊</span>
                    <div className="crime-stat-item__content">
                      <span className="crime-stat-item__label">Pontuação Total</span>
                      <span className="crime-stat-item__value">{crimeData.dados_brutos.pontuacao_total}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              Dados de segurança não disponíveis para esta região
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
