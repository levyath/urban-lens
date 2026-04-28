import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { SearchBar } from './components/SearchBar/SearchBar';
import type { GeocodeResultItem } from './types';

// Fix para ícones do Leaflet
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

// URL da API
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

// Componente para capturar cliques no mapa
function MapClickHandler({ onClick }: { onClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Componente para mover o mapa quando o centro muda
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

  // Selecionar um endereço da busca
  const handleSelectAddress = (result: GeocodeResultItem) => {
    setError('');
    
    const searchResult: SearchResult = {
      address: result.address,
      lat: result.lat,
      lon: result.lon
    };
    
    setSelectedLocation(searchResult);
    
    // Centralizar mapa com zoom maior
    setMapCenter([result.lat, result.lon]);
    setMapZoom(15);
    
    // Adicionar APENAS o marcador do endereço selecionado
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

  // Buscar lugares próximos (acionado por botão)
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
      
      // Manter o marcador selecionado e adicionar os lugares
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

  // Clicar no mapa
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
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header Fixo */}
      <header style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white', 
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        flexWrap: 'wrap',
        zIndex: 1000
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#2563eb' }}>
          🗺️ Urban Lens
        </h1>
        
        {/* Search Box */}
        <SearchBar 
          onSelectAddress={handleSelectAddress}
          placeholder="Digite um endereço (ex: Copacabana, Rio de Janeiro)..."
        />
        
        {/* Botão para buscar lugares próximos */}
        {selectedLocation && (
          <button
            onClick={searchNearbyPlaces}
            disabled={loading}
            style={{
              padding: '12px 20px',
              backgroundColor: loading ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}
          >
            {loading ? 'Buscando...' : '🔍 Buscar Lugares Próximos'}
          </button>
        )}
        
        {error && (
          <div style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#fee', 
            color: '#c00',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
      </header>

      {/* Espaçador para compensar header fixo */}
      <div style={{ height: '100px' }}></div>

      {/* Info */}
      <div style={{ 
        padding: '10px 20px', 
        backgroundColor: '#f0f9ff',
        borderBottom: '1px solid #ddd',
        fontSize: '14px',
        color: '#0369a1',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>
          💡 Dica: Digite um endereço, selecione da lista e clique em "Buscar Lugares Próximos"
        </span>
        {markers.length > 0 && (
          <span style={{ fontWeight: 600 }}>
            📍 {markers.length} marcador{markers.length > 1 ? 'es' : ''}
          </span>
        )}
      </div>

      {/* Mapa */}
      <main style={{ 
        flex: 1, 
        padding: '16px',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ 
          width: '100%', 
          height: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
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
            
            {/* Controlar movimento do mapa */}
            <MapController center={mapCenter} zoom={mapZoom} />
            
            {/* Renderizar marcadores */}
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
            
            {/* Capturar cliques no mapa */}
            <MapClickHandler onClick={handleMapClick} />
          </MapContainer>
        </div>
      </main>
    </div>
  );
}

export default App;
