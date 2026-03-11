export class GeocodeResultDto {
  address: string;
  lat: number;
  lon: number;
  boundingBox: {
    south: number;
    north: number;
    west: number;
    east: number;
  };
}
