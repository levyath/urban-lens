import type { LatLngExpression } from 'leaflet';

export function parseWKT(wkt: string): LatLngExpression[][][] {
  const multiPolygonMatch = wkt.match(/MULTIPOLYGON\s*\(\(\((.*)\)\)\)/);
  
  if (!multiPolygonMatch) {
    return [];
  }

  const coordsString = multiPolygonMatch[1];
  const polygons: LatLngExpression[][][] = [];
  
  const polygonStrings = coordsString.split(')),((');
  
  polygonStrings.forEach(polygonStr => {
    const rings = polygonStr.split('),(');
    const polygonRings: LatLngExpression[][] = [];
    
    rings.forEach(ringStr => {
      const coords = ringStr
        .trim()
        .split(',')
        .map(pair => {
          const [lon, lat] = pair.trim().split(' ').map(Number);
          return [lat, lon] as [number, number];
        })
        .filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));
      
      if (coords.length > 0) {
        polygonRings.push(coords);
      }
    });
    
    if (polygonRings.length > 0) {
      polygons.push(polygonRings);
    }
  });
  
  return polygons;
}

export function getVulnerabilityColor(level: string): string {
  switch (level) {
    case 'HIGH':
      return '#ef4444'; // Vermelho
    case 'MEDIUM':
      return '#f59e0b'; // Laranja
    case 'LOW':
      return '#10b981'; // Verde
    default:
      return '#6b7280'; // Cinza
  }
}

export function getVulnerabilityOpacity(level: string): number {
  switch (level) {
    case 'HIGH':
      return 0.6;
    case 'MEDIUM':
      return 0.5;
    case 'LOW':
      return 0.3;
    default:
      return 0.2;
  }
}
