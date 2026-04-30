import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, useMapEvents, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { SearchBar } from './components/SearchBar/SearchBar';
import { AnalysisPanel } from './components/AnalysisPanel/AnalysisPanel';
import type { GeocodeResultItem, VulnerabilityArea, PlacesNearbyResponse, TransportResponse, VulnerabilityNearbyResponse, CrimeStatisticResponse } from './types';
import { parseWKT, getVulnerabilityColor, getVulnerabilityOpacity } from './utils/wktParser';
import './App.scss';
import logoSvg from './assets/logo.svg';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const GreenIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path fill="#10b981" stroke="#047857" stroke-width="1.5" d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 18 9 18s9-11.25 9-18c0-4.97-4.03-9-9-9z"/>
      <circle cx="12" cy="9" r="4" fill="white"/>
    </svg>
  `),
  shadowUrl: iconShadow,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

L.Marker.prototype.options.icon = DefaultIcon;

const API_URL = 'http://localhost:3000';

interface MarkerData {
  id: string;
  lat: number;
  lon: number;
  title: string;
  description: string;
  color: string;
}

interface SearchResult {
  address: string;
  lat: number;
  lon: number;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    const currentZoom = map.getZoom();
    map.setView(center, currentZoom, {
      animate: true,
      duration: 1
    });
  }, [center, map]);
  
  useEffect(() => {
    map.setZoom(zoom, {
      animate: true,
      duration: 1
    });
  }, [zoom, map]);
  
  return null;
}

function App() {
  const [mapCenter, setMapCenter] = useState<[number, number]>([-22.9068, -43.1729]);
  const [mapZoom, setMapZoom] = useState(13);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [vulnerabilityAreas, setVulnerabilityAreas] = useState<VulnerabilityArea[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SearchResult | null>(null);
  const [searchRadius, setSearchRadius] = useState(2000);
  const [error, setError] = useState('');
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [placesData, setPlacesData] = useState<PlacesNearbyResponse | null>(null);
  const [transportData, setTransportData] = useState<TransportResponse | null>(null);
  const [vulnerabilityData, setVulnerabilityData] = useState<VulnerabilityNearbyResponse | null>(null);
  const [crimeData, setCrimeData] = useState<CrimeStatisticResponse | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const mapRef = useRef<any>(null);

  const handleSelectAddress = (result: GeocodeResultItem) => {
    setError('');
    
    const searchResult: SearchResult = {
      address: result.address,
      lat: result.lat,
      lon: result.lon
    };
    
    setSelectedLocation(searchResult);
    setMapCenter([result.lat, result.lon]);
    
    const newMarker: MarkerData = {
      id: `selected-${Date.now()}`,
      lat: result.lat,
      lon: result.lon,
      title: 'Local Selecionado',
      description: result.address,
      color: 'blue'
    };
    
    setMarkers([newMarker]);
    
    loadVulnerabilityAreas(result.lat, result.lon);
    loadAnalysisData(result.lat, result.lon);
  };

  const loadAnalysisData = async (lat: number, lon: number) => {
    setLoadingAnalysis(true);
    setShowAnalysisPanel(true);
    
    try {
      const [placesResponse, transportResponse, vulnerabilityResponse, crimeResponse] = await Promise.all([
        axios.get(`${API_URL}/places/near`, {
          params: { 
            lat, 
            lon, 
            radius: searchRadius,
            page: 1,
            page_size: 50
          }
        }),
        axios.get(`${API_URL}/transports/near`, {
          params: { 
            lat, 
            lon, 
            radius: searchRadius,
            page: 1,
            page_size: 50
          }
        }),
        axios.get(`${API_URL}/vulnerability/near`, {
          params: { 
            lat, 
            lon, 
            radius: searchRadius,
            page: 1,
            page_size: 20
          }
        }),
        axios.get(`${API_URL}/cisp-statistic/local`, {
          params: { 
            lat: lat.toString(), 
            lon: lon.toString()
          }
        }).catch(() => ({ data: null }))
      ]);
      
      setPlacesData(placesResponse.data);
      setTransportData(transportResponse.data);
      setVulnerabilityData(vulnerabilityResponse.data);
      setCrimeData(crimeResponse.data);
    } catch (error) {
      console.error('Erro ao carregar dados de análise:', error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handlePlaceClick = (place: { name: string; lat: number; lon: number; type: string }) => {
    const placeMarker: MarkerData = {
      id: `place-${Date.now()}`,
      lat: place.lat,
      lon: place.lon,
      title: place.name,
      description: place.type,
      color: 'green'
    };

    setMarkers(prev => {
      const mainMarker = prev.find(m => m.id.startsWith('selected-') || m.id.startsWith('click-'));
      const filteredMarkers = prev.filter(m => !m.id.startsWith('place-'));
      return mainMarker ? [...filteredMarkers, placeMarker] : [placeMarker];
    });
    setMapCenter([place.lat, place.lon]);
    setMapZoom(17);
  };

  const handleClearPlaceMarkers = () => {
    setMarkers(prev => prev.filter(m => !m.id.startsWith('place-')));
  };

  const handleRadiusChange = (newRadius: number) => {
    setSearchRadius(newRadius);
  };

  useEffect(() => {
    if (!selectedLocation) return;

    const timeoutId = setTimeout(() => {
      loadVulnerabilityAreas(selectedLocation.lat, selectedLocation.lon);
      loadAnalysisData(selectedLocation.lat, selectedLocation.lon);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchRadius]);

  const loadVulnerabilityAreas = async (lat: number, lon: number) => {
    try {
      const response = await axios.get(`${API_URL}/vulnerability/near`, {
        params: {
          lat,
          lon,
          radius: searchRadius,
          page: 1,
          page_size: 50
        }
      });
      
      setVulnerabilityAreas(response.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar áreas de vulnerabilidade:', err);
    }
  };

  const handleMapClick = (lat: number, lon: number) => {
    const clickMarker: MarkerData = {
      id: `click-${Date.now()}`,
      lat,
      lon,
      title: 'Ponto Clicado',
      description: `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`,
      color: 'red'
    };
    
    setMarkers([clickMarker]);
    setMapCenter([lat, lon]);
    setSelectedLocation({ address: 'Ponto clicado no mapa', lat, lon });
    
    loadVulnerabilityAreas(lat, lon);
    loadAnalysisData(lat, lon);
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="header__brand">
          <img src={logoSvg} alt="Urban Lens" className="header__icon" />
          Urban Lens
        </h1>
        
        <SearchBar 
          onSelectAddress={handleSelectAddress}
          placeholder="Digite um endereço (ex: Copacabana, Rio de Janeiro)..."
        />
      </header>

      <div className="spacer"></div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      <main className="main">
        <div className="map-container">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom={true}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapController center={mapCenter} zoom={mapZoom} />
            
            {selectedLocation && (
              <Circle
                center={[selectedLocation.lat, selectedLocation.lon]}
                radius={searchRadius}
                pathOptions={{
                  color: '#667eea',
                  fillColor: '#667eea',
                  fillOpacity: 0.05,
                  weight: 2,
                  dashArray: '10, 10',
                  opacity: 0.6
                }}
              />
            )}
            
            {vulnerabilityAreas.map((area) => {
              const polygons = parseWKT(area.geom_wkt);
              const color = getVulnerabilityColor(area.vulnerability_level);
              const opacity = getVulnerabilityOpacity(area.vulnerability_level);
              
              return polygons.map((polygon, idx) => (
                <Polygon
                  key={`${area.id}-${idx}`}
                  positions={polygon}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: opacity,
                    weight: 2,
                    opacity: 0.8
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <strong style={{ fontSize: '14px', color: '#111' }}>
                        {area.name}
                      </strong>
                      <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                        {area.municipality && `${area.municipality}, `}{area.uf}
                      </p>
                      <p style={{ margin: '5px 0', fontSize: '12px' }}>
                        <strong>Nível:</strong> {area.vulnerability_level}
                      </p>
                      <p style={{ margin: '5px 0', fontSize: '12px' }}>
                        <strong>Distância:</strong> {Math.round(area.distance_meters)}m
                      </p>
                      {area.pop_sabren && (
                        <p style={{ margin: '5px 0', fontSize: '12px' }}>
                          <strong>População:</strong> {area.pop_sabren}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Polygon>
              ));
            })}
            
            {markers.map((marker) => (
              <Marker 
                key={marker.id} 
                position={[marker.lat, marker.lon]}
                icon={marker.color === 'green' ? GreenIcon : DefaultIcon}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <strong style={{ fontSize: '14px', color: marker.color === 'green' ? '#047857' : '#111' }}>
                      {marker.title}
                    </strong>
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                      {marker.description}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            <MapClickHandler onClick={handleMapClick} />
          </MapContainer>

          {showAnalysisPanel && (
            <AnalysisPanel
              placesData={placesData}
              transportData={transportData}
              vulnerabilityData={vulnerabilityData}
              crimeData={crimeData}
              loading={loadingAnalysis}
              selectedLocation={selectedLocation ? { lat: selectedLocation.lat, lon: selectedLocation.lon } : null}
              searchRadius={searchRadius}
              onPlaceClick={handlePlaceClick}
              onClearPlaceMarkers={handleClearPlaceMarkers}
            />
          )}

          {selectedLocation && (
            <div className="map-controls">
              <div className="map-controls__panel">
                <div className="map-controls__icon">📏</div>
                <div className="map-controls__content">
                  <label className="map-controls__label">Raio de Busca</label>
                  <div className="map-controls__value">{searchRadius}m</div>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="100"
                    value={searchRadius}
                    onChange={(e) => handleRadiusChange(Number(e.target.value))}
                    className="map-controls__slider"
                  />
                </div>
              </div>

              {placesData && placesData.summary.total > 0 && (
                <div className="map-controls__badge map-controls__badge--places">
                  <div className="map-controls__badge-icon">🏪</div>
                  <div className="map-controls__badge-content">
                    <div className="map-controls__badge-label">Lugares</div>
                    <div className="map-controls__badge-count">{placesData.summary.total}</div>
                  </div>
                </div>
              )}

              {transportData && transportData.summary.total > 0 && (
                <div className="map-controls__badge map-controls__badge--transport">
                  <div className="map-controls__badge-icon">🚇</div>
                  <div className="map-controls__badge-content">
                    <div className="map-controls__badge-label">Transportes</div>
                    <div className="map-controls__badge-count">{transportData.summary.total}</div>
                  </div>
                </div>
              )}

              {vulnerabilityAreas.length > 0 && (
                <div className="map-controls__badge map-controls__badge--vulnerability">
                  <div className="map-controls__badge-icon">⚠️</div>
                  <div className="map-controls__badge-content">
                    <div className="map-controls__badge-label">Áreas Vulneráveis</div>
                    <div className="map-controls__badge-count">{vulnerabilityAreas.length}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
