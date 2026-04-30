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
    counts_by_type?: Array<{ type: string; count: number }>;
    top_types?: Array<{ type: string; count: number }>;
    rating_stars?: number; // 0-5
    rating_score?: number; // raw weighted score used to compute stars
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

    // Aggregate counts by amenity (category) inside the radius
    // Also compute a weighted sum per amenity where weight = 1 / (distance_m / 100 + 1)
    // so closer places contribute more to the score.
    const countsQuery = `
      SELECT
        amenity AS type,
        COUNT(*)::int AS count,
        COALESCE(SUM(1.0 / ((ST_Distance(
          ST_Transform(way,4326)::geography,
          ST_SetSRID(ST_MakePoint($2,$3),4326)::geography
        )/100.0) + 1.0)), 0) AS weight_sum
      FROM planet_osm_point
      WHERE amenity IS NOT NULL
        AND name IS NOT NULL
        AND ($1::text IS NULL OR amenity = ANY(string_to_array($1::text, ',')))
        AND ST_DWithin(
          ST_Transform(way,4326)::geography,
          ST_SetSRID(ST_MakePoint($2,$3),4326)::geography,
          $4
        )
      GROUP BY amenity
      ORDER BY count DESC
    `;

    const countsRows: Array<{
      type: string;
      count: number;
      weight_sum: number;
    }> = await this.dataSource.query(countsQuery, [
      type ?? null,
      lon,
      lat,
      safeRadius,
    ]);

    // Compute aggregated weighted score across all amenities
    const totalWeight = countsRows.reduce(
      (acc, r) => acc + Number(r.weight_sum || 0),
      0,
    );

    // Map totalWeight to 0-5 stars using heuristic thresholds
    const mapWeightToStars = (w: number): number => {
      if (w >= 20) return 5;
      if (w >= 12) return 4;
      if (w >= 6) return 3;
      if (w >= 3) return 2;
      if (w >= 1) return 1;
      return 0;
    };

    const ratingScore = totalWeight;
    const ratingStars = mapWeightToStars(ratingScore);

    const topTypes = countsRows
      .slice(0, 3)
      .map((r) => ({ type: r.type, count: r.count }));

    return {
      summary: {
        radius_meters: safeRadius,
        type_filter: type ?? null,
        counts_by_type: countsRows.map((r) => ({
          type: r.type,
          count: r.count,
        })),
        top_types: topTypes,
        rating_stars: ratingStars,
        rating_score: Number(ratingScore.toFixed(4)),
        total,
        returned_count: data.length,
        page: effectivePage,
        page_size: safePageSize,
        total_pages: totalPages,
      },
      data,
    };
  }

  async getCategories(search?: string | string[]): Promise<unknown[]> {
    const rawTerms = Array.isArray(search)
      ? search
      : typeof search === 'string'
        ? search.split(',')
        : [];

    const terms = rawTerms
      .map((term) => term.trim())
      .filter((term) => term.length > 0);

    const uniquePatterns = terms.length
      ? Array.from(new Set(terms)).map((term) => `%${term}%`)
      : null;

    const query = `
    SELECT DISTINCT amenity
    FROM planet_osm_point
    WHERE amenity IS NOT NULL
      AND ($1::text[] IS NULL OR amenity ILIKE ANY($1::text[]))
    ORDER BY amenity
  `;

    const result: Array<{ amenity: string }> = await this.dataSource.query(
      query,
      [uniquePatterns],
    );

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
