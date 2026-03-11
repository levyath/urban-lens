import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PlacesService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findNearby(
    lat: number,
    lon: number,
    radius: number,
    type?: string,
  ): Promise<unknown[]> {
    const query = `
      SELECT
    name,
    amenity,
    ST_Y(ST_Transform(way,4326)) AS lat,
    ST_X(ST_Transform(way,4326)) AS lon,
    ST_Distance(
      ST_Transform(way,4326)::geography,
      ST_SetSRID(ST_MakePoint($1,$2),4326)::geography
    ) AS distance
  FROM planet_osm_point
  WHERE amenity IS NOT NULL
  AND name IS NOT NULL
  AND ($4::text IS NULL OR amenity = $4::text)
  AND ST_DWithin(
    ST_Transform(way,4326)::geography,
    ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
    $3
  )
  ORDER BY distance
  LIMIT 20
  `;

    return await this.dataSource.query(query, [lon, lat, radius, type]);
  }

  async getCategories(): Promise<unknown[]> {
    const query = `
    SELECT DISTINCT amenity
    FROM planet_osm_point
    WHERE amenity IS NOT NULL
    ORDER BY amenity
  `;

    const result: Array<{ amenity: string }> =
      await this.dataSource.query(query);

    return result.map((row) => row.amenity);
  }
}
