import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, useMapEvents, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { SearchBar } from './components/SearchBar/SearchBar';
import type { GeocodeResultItem, VulnerabilityArea } from './types';
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

L.Marker.prototype.options.icon = DefaultIcon;

const API_URL = 'http://localhost:3000';

interface Place {
  name: string;
  type: string;
  lat: number;
  lon: number;
  distance: number;
}

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
    map.setView(center, zoom, {
      animate: true,
      duration: 1
    });
  }, [center, zoom, map]);
  
  return null;
}

function App() {
  const [mapCenter, setMapCenter] = useState<[number, number]>([-22.9068, -43.1729]);
  const [mapZoom, setMapZoom] = useState(13);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [vulnerabilityAreas, setVulnerabilityAreas] = useState<VulnerabilityArea[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SearchResult | null>(null);
  const [searchRadius, setSearchRadius] = useState(2000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
    setMapZoom(15);
    
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
  };

  const handleRadiusChange = (newRadius: number) => {
    setSearchRadius(newRadius);
    if (selectedLocation) {
      loadVulnerabilityAreas(selectedLocation.lat, selectedLocation.lon);
    }
  };

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

  const searchNearbyPlaces = async () => {
    if (!selectedLocation) return;
    
    setLoading(true);
    try {
      const { lat, lon } = selectedLocation;
      
      const response = await axios.get(`${API_URL}/places/near`, {
        params: { 
          lat, 
          lon, 
          radius: 1000,
          page: 1,
          page_size: 30
        }
      });
      
      const places: Place[] = response.data.data || [];
      
      const selectedMarker = markers[0];
      const placeMarkers: MarkerData[] = places.map((place, index) => ({
        id: `place-${index}`,
        lat: place.lat,
        lon: place.lon,
        title: place.name,
        description: `${place.type} - ${Math.round(place.distance)}m`,
        color: 'green'
      }));
      
      setMarkers([selectedMarker, ...placeMarkers]);
      
    } catch (err) {
      setError('Erro ao buscar lugares próximos');
      console.error('Erro ao buscar lugares:', err);
    } finally {
      setLoading(false);
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
        
        <div className="header__actions">
          {selectedLocation && (
            <div className="header__radius-control">
              <label htmlFor="radius-slider" className="header__radius-label">
                Raio: {searchRadius}m
              </label>
              <input
                id="radius-slider"
                type="range"
                min="500"
                max="5000"
                step="100"
                value={searchRadius}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                className="header__radius-slider"
              />
            </div>
          )}
          
          {markers.length > 0 && (
            <div className="header__badge">
              <span className="header__badge-icon">📍</span>
              <span className="header__badge-count">{markers.length}</span>
            </div>
          )}
          
          {selectedLocation && (
            <button
              onClick={searchNearbyPlaces}
              disabled={loading}
              className={`header__button ${!loading ? 'header__button--success' : ''}`}
            >
              {loading ? '⏳ Buscando...' : '🔍 Buscar Lugares'}
            </button>
          )}
        </div>
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
              <Marker key={marker.id} position={[marker.lat, marker.lon]}>
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <strong style={{ fontSize: '14px', color: '#111' }}>
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
        </div>
      </main>
    </div>
  );
}

export default App;
