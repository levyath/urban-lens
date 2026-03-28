import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface NearbyPlace {
  name: string;
  type: string;
  lat: number;
  lon: number;
  distance: number;
}

export interface PlacesNearbyResult {
  summary: {
    radius_meters: number;
    type_filter: string | null;
    total: number;
    returned_count: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  data: NearbyPlace[];
}

@Injectable()
export class PlacesService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findNearby(
    lat: number,
    lon: number,
    radius: number,
    type?: string,
    page = 1,
    pageSize = 50,
  ): Promise<PlacesNearbyResult> {
    const safeRadius = Math.max(1, Number(radius));
    const safePage = Math.max(1, Number(page));
    const safePageSize = Math.min(Math.max(1, Number(pageSize)), 200);

    const baseCountQuery = `
      SELECT COUNT(*)::int AS total
      FROM planet_osm_point
      WHERE amenity IS NOT NULL
      AND name IS NOT NULL
      AND ($4::text IS NULL OR amenity = ANY(string_to_array($4::text, ',')))
      AND ST_DWithin(
        ST_Transform(way,4326)::geography,
        ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
        $3
      )
    `;

    const [aggregate] = await this.dataSource.query<Array<{ total: number }>>(
      baseCountQuery,
      [lon, lat, safeRadius, type ?? null],
    );

    const total = aggregate?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const effectivePage = Math.min(safePage, totalPages);
    const offset = (effectivePage - 1) * safePageSize;

    const query = `
      SELECT
        name,
        amenity AS type,
        ST_Y(ST_Transform(way,4326)) AS lat,
        ST_X(ST_Transform(way,4326)) AS lon,
        ST_Distance(
          ST_Transform(way,4326)::geography,
          ST_SetSRID(ST_MakePoint($1,$2),4326)::geography
        ) AS distance
      FROM planet_osm_point
      WHERE amenity IS NOT NULL
      AND name IS NOT NULL
      AND ($4::text IS NULL OR amenity = ANY(string_to_array($4::text, ',')))
      AND ST_DWithin(
        ST_Transform(way,4326)::geography,
        ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
        $3
      )
      ORDER BY distance
      LIMIT $5
      OFFSET $6
    `;

    const data = await this.dataSource.query<NearbyPlace[]>(query, [
      lon,
      lat,
      safeRadius,
      type ?? null,
      safePageSize,
      offset,
    ]);

    return {
      summary: {
        radius_meters: safeRadius,
        type_filter: type ?? null,
        total,
        returned_count: data.length,
        page: effectivePage,
        page_size: safePageSize,
        total_pages: totalPages,
      },
      data,
    };
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

  async getClusters(): Promise<unknown[]> {
    const query = `
    SELECT
      amenity,
      COUNT(*) AS total,
      ST_Y(ST_Centroid(ST_Collect(way))) AS lat,
      ST_X(ST_Centroid(ST_Collect(way))) AS lon
    FROM planet_osm_point
    WHERE amenity IS NOT NULL
    GROUP BY amenity
    ORDER BY total DESC
    LIMIT 20
  `;

    return this.dataSource.query(query);
  }
}
