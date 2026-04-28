// Componente de Mapa usando Leaflet
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import type { MapProps } from '../../types/components';
import 'leaflet/dist/leaflet.css';
import './Map.scss';

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

// Componente auxiliar para lidar com eventos do mapa
const MapEvents = ({ onClick }: { onClick?: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      if (onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  
  return null;
};

// Componente principal do Mapa
export const Map = ({ 
  center, 
  zoom = 13, 
  markers = [],
  onMapClick 
}: MapProps) => {
  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        className="map"
        scrollWheelZoom={true}
      >
        {/* Camada de tiles do OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Renderiza todos os marcadores */}
        {markers.map((marker) => (
          <Marker key={marker.id} position={marker.position}>
            <Popup>
              <div className="marker-popup">
                <h3>{marker.title}</h3>
                {marker.description && <p>{marker.description}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Componente para eventos do mapa */}
        <MapEvents onClick={onMapClick} />
      </MapContainer>
    </div>
  );
};
