import type { AnalysisPanelProps } from '../../types/components';
import type { VulnerabilitySortBy, SortOrder } from '../../types';
import './AnalysisPanel.scss';

const vulnerabilitySortOptions: VulnerabilitySortBy[] = [
  'relevance',
  'distance_meters',
  'vulnerability_level',
  'pop_sabren',
  'bairro',
];

const canGoBack = (page: number) => page > 1;
const canGoForward = (page: number, totalPages?: number) =>
  Boolean(totalPages && page < totalPages);

const Pagination = ({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages?: number;
  onChange: (nextPage: number) => void;
}) => (
  <div className="pagination-row">
    <button type="button" onClick={() => onChange(page - 1)} disabled={!canGoBack(page)}>
      Anterior
    </button>
    <span>
      Pagina {page} de {totalPages ?? 1}
    </span>
    <button
      type="button"
      onClick={() => onChange(page + 1)}
      disabled={!canGoForward(page, totalPages)}
    >
      Proxima
    </button>
  </div>
);

export const AnalysisPanel = ({
  selectedPointLabel,
  searchAddressLabel,
  hasSelectedPoint,
  analysisStatus,
  error,
  analysisError,
  filters,
  pagination,
  places,
  transports,
  vulnerabilityLevel,
  vulnerabilityNearby,
  onRadiusChange,
  onSelectedTypeChange,
  onVulnerabilitySortByChange,
  onVulnerabilitySortOrderChange,
  onVulnerabilityBairroChange,
  onPageSizeChange,
  onApplyFilters,
  onReset,
  onPlacesPageChange,
  onTransportsPageChange,
  onVulnerabilityPageChange,
}: AnalysisPanelProps) => {
  const vulnerabilityTone = vulnerabilityLevel?.vulnerability_level ?? 'LOW';

  return (
    <aside className="analysis-panel">
      <section className="panel-card">
        <h2>Ponto ativo</h2>
        <p>{searchAddressLabel || selectedPointLabel}</p>
        <div className="panel-grid">
          <label>
            Raio (m)
            <input
              type="number"
              min={100}
              max={5000}
              step={100}
              value={filters.radius}
              onChange={(event) => onRadiusChange(Number(event.target.value))}
            />
          </label>
          <label>
            Tipo de lugar
            <input
              type="text"
              value={filters.selectedType}
              placeholder="Ex: school,hospital"
              onChange={(event) => onSelectedTypeChange(event.target.value)}
            />
          </label>
          <label>
            Ordenar vulnerabilidade
            <select
              value={filters.vulnerabilitySortBy}
              onChange={(event) =>
                onVulnerabilitySortByChange(event.target.value as VulnerabilitySortBy)
              }
            >
              {vulnerabilitySortOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ordem
            <select
              value={filters.vulnerabilitySortOrder}
              onChange={(event) => onVulnerabilitySortOrderChange(event.target.value as SortOrder)}
            >
              <option value="asc">asc</option>
              <option value="desc">desc</option>
            </select>
          </label>
          <label>
            Filtro bairro
            <input
              type="text"
              value={filters.vulnerabilityBairro}
              placeholder="Ex: Rocinha"
              onChange={(event) => onVulnerabilityBairroChange(event.target.value)}
            />
          </label>
          <label>
            Itens por pagina
            <input
              type="number"
              min={5}
              max={100}
              step={5}
              value={pagination.pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            />
          </label>
        </div>
        <div className="panel-actions">
          <button
            type="button"
            onClick={onApplyFilters}
            disabled={!hasSelectedPoint || analysisStatus === 'loading'}
          >
            Atualizar analise
          </button>
          <button type="button" className="ghost" onClick={onReset}>
            Limpar
          </button>
        </div>
      </section>

      {error && <p className="app__error">{error}</p>}
      {analysisError && <p className="app__error">{analysisError}</p>}

      {analysisStatus === 'loading' && (
        <section className="panel-card">
          <h2>Carregando</h2>
          <p>Consultando lugares, transporte e vulnerabilidade...</p>
        </section>
      )}

      {analysisStatus === 'ready' && (
        <>
          <section className="panel-card">
            <h2>Vulnerabilidade</h2>
            <p className={`badge badge--${vulnerabilityTone.toLowerCase()}`}>
              Nivel {vulnerabilityLevel?.vulnerability_level}
            </p>
            <p>
              Areas proximas: {vulnerabilityNearby?.summary.returned_count ?? 0} de{' '}
              {vulnerabilityNearby?.summary.total ?? 0}
            </p>
            <p>
              Populacao estimada (SABREN): {vulnerabilityNearby?.summary.total_population_sabren ?? 0}
            </p>
            <Pagination
              page={pagination.vulnerabilityPage}
              totalPages={vulnerabilityNearby?.summary.total_pages}
              onChange={onVulnerabilityPageChange}
            />
          </section>

          <section className="panel-card">
            <h2>Transporte</h2>
            <p>Score: {((transports?.transport_score ?? 0) * 100).toFixed(0)} / 100</p>
            <p>Ponto mais proximo: {transports?.nearest_transport?.name ?? 'Nao encontrado'}</p>
            <p>Distancia: {transports?.nearest_transport?.distance_meters ?? '-'} m</p>
            <p>
              Onibus: {transports?.counts.bus_stops ?? 0} | Trem: {transports?.counts.train_stations ?? 0}{' '}
              | Metro: {transports?.counts.subway_entrances ?? 0}
            </p>
            <Pagination
              page={pagination.transportsPage}
              totalPages={transports?.summary.total_pages}
              onChange={onTransportsPageChange}
            />
          </section>

          <section className="panel-card panel-card--scroll">
            <h2>Lugares ({places?.summary.returned_count ?? 0})</h2>
            <ul className="places-list">
              {(places?.data ?? []).slice(0, 12).map((place, index) => (
                <li key={`${place.name}-${index}`}>
                  <strong>{place.name}</strong>
                  <span>{place.type}</span>
                  <span>{Math.round(place.distance)} m</span>
                </li>
              ))}
            </ul>
            <Pagination
              page={pagination.placesPage}
              totalPages={places?.summary.total_pages}
              onChange={onPlacesPageChange}
            />
          </section>
        </>
      )}
    </aside>
  );
};
