import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { SearchBar } from './components/SearchBar/SearchBar';
import type { GeocodeResultItem } from './types';
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
  const [selectedLocation, setSelectedLocation] = useState<SearchResult | null>(null);
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

      <div className="info-bar">
        <span className="info-bar__tip">
          <span className="info-bar__icon">💡</span>
          Digite um endereço, selecione da lista e clique em "Buscar Lugares"
        </span>
        {markers.length > 0 && (
          <span className="info-bar__markers">
            📍 {markers.length} marcador{markers.length > 1 ? 'es' : ''}
          </span>
        )}
      </div>

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
