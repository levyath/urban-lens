import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface TransportPoint {
  name: string;
  lat: number;
  lon: number;
  distance: number;
  type: 'bus_stop' | 'train_station' | 'subway_entrance';
}

interface TransportPointWithTime extends TransportPoint {
  walk_time_minutes: number;
}

interface NearestTransport {
  type: string;
  distance_meters: number;
  walk_time_minutes: number;
  name: string;
}

export interface NearbyTransportsResult {
  summary: {
    radius_meters: number;
    total: number;
    returned_count: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  counts: {
    bus_stops: number;
    train_stations: number;
    subway_entrances: number;
  };
  raw_score: number;
  transport_score: number;
  nearest_transport: NearestTransport | null;
  data: {
    bus_stops: TransportPointWithTime[];
    train_stations: TransportPointWithTime[];
    subway_entrances: TransportPointWithTime[];
  };
}

@Injectable()
export class TransportsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findNearbyTransports(
    lat: number,
    lon: number,
    radius: number,
    page = 1,
    pageSize = 50,
  ): Promise<NearbyTransportsResult> {
    const safeRadius = Math.max(1, Number(radius));
    const safePage = Math.max(1, Number(page));
    const safePageSize = Math.min(Math.max(1, Number(pageSize)), 200);

    const aggregateQuery = `
      WITH transports AS (
        SELECT
          name,
          ST_Y(ST_Transform(way,4326)) AS lat,
          ST_X(ST_Transform(way,4326)) AS lon,
          'bus_stop' AS type,
          ST_Distance(
            ST_Transform(way,4326)::geography,
            ST_SetSRID(ST_MakePoint($1,$2),4326)::geography
          ) AS distance
        FROM planet_osm_point
        WHERE highway = 'bus_stop'
        AND ST_DWithin(
          ST_Transform(way,4326)::geography,
          ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
          $3
        )

        UNION ALL

        SELECT
          name,
          ST_Y(ST_Transform(way,4326)) AS lat,
          ST_X(ST_Transform(way,4326)) AS lon,
          'train_station' AS type,
          ST_Distance(
            ST_Transform(way,4326)::geography,
            ST_SetSRID(ST_MakePoint($1,$2),4326)::geography
          ) AS distance
        FROM planet_osm_point
        WHERE railway = 'station'
        AND ST_DWithin(
          ST_Transform(way,4326)::geography,
          ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
          $3
        )

        UNION ALL

        SELECT
          name,
          ST_Y(ST_Transform(way,4326)) AS lat,
          ST_X(ST_Transform(way,4326)) AS lon,
          'subway_entrance' AS type,
          ST_Distance(
            ST_Transform(way,4326)::geography,
            ST_SetSRID(ST_MakePoint($1,$2),4326)::geography
          ) AS distance
        FROM planet_osm_point
        WHERE railway = 'subway_entrance'
        AND ST_DWithin(
          ST_Transform(way,4326)::geography,
          ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
          $3
        )
      )
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE type = 'bus_stop')::int AS bus_stops,
        COUNT(*) FILTER (WHERE type = 'train_station')::int AS train_stations,
        COUNT(*) FILTER (WHERE type = 'subway_entrance')::int AS subway_entrances
      FROM transports
    `;

    const [aggregate] = await this.dataSource.query<
      Array<{
        total: number;
        bus_stops: number;
        train_stations: number;
        subway_entrances: number;
      }>
    >(aggregateQuery, [lon, lat, safeRadius]);

    const total = aggregate?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const effectivePage = Math.min(safePage, totalPages);
    const offset = (effectivePage - 1) * safePageSize;

    const pagedQuery = `
      WITH transports AS (
        SELECT
          name,
          ST_Y(ST_Transform(way,4326)) AS lat,
          ST_X(ST_Transform(way,4326)) AS lon,
          'bus_stop' AS type,
          ST_Distance(
            ST_Transform(way,4326)::geography,
            ST_SetSRID(ST_MakePoint($1,$2),4326)::geography
          ) AS distance
        FROM planet_osm_point
        WHERE highway = 'bus_stop'
        AND ST_DWithin(
          ST_Transform(way,4326)::geography,
          ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
          $3
        )

        UNION ALL

        SELECT
          name,
          ST_Y(ST_Transform(way,4326)) AS lat,
          ST_X(ST_Transform(way,4326)) AS lon,
          'train_station' AS type,
          ST_Distance(
            ST_Transform(way,4326)::geography,
            ST_SetSRID(ST_MakePoint($1,$2),4326)::geography
          ) AS distance
        FROM planet_osm_point
        WHERE railway = 'station'
        AND ST_DWithin(
          ST_Transform(way,4326)::geography,
          ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
          $3
        )

        UNION ALL

        SELECT
          name,
          ST_Y(ST_Transform(way,4326)) AS lat,
          ST_X(ST_Transform(way,4326)) AS lon,
          'subway_entrance' AS type,
          ST_Distance(
            ST_Transform(way,4326)::geography,
            ST_SetSRID(ST_MakePoint($1,$2),4326)::geography
          ) AS distance
        FROM planet_osm_point
        WHERE railway = 'subway_entrance'
        AND ST_DWithin(
          ST_Transform(way,4326)::geography,
          ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
          $3
        )
      )
      SELECT *
      FROM transports
      ORDER BY distance
      LIMIT $4
      OFFSET $5
    `;

    const transports: TransportPoint[] = await this.dataSource.query(
      pagedQuery,
      [lon, lat, safeRadius, safePageSize, offset],
    );

    const walkSpeed = 83; // metros por minuto

    const transportsWithTime: TransportPointWithTime[] = transports.map(
      (t) => ({
        ...t,
        walk_time_minutes: Math.round(t.distance / walkSpeed),
      }),
    );

    const nearestQuery = `
      WITH transports AS (
        SELECT
          name,
          ST_Y(ST_Transform(way,4326)) AS lat,
          ST_X(ST_Transform(way,4326)) AS lon,
          'bus_stop' AS type,
          ST_Distance(
            ST_Transform(way,4326)::geography,
            ST_SetSRID(ST_MakePoint($1,$2),4326)::geography
          ) AS distance
        FROM planet_osm_point
        WHERE highway = 'bus_stop'
        AND ST_DWithin(
          ST_Transform(way,4326)::geography,
          ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
          $3
        )

        UNION ALL

        SELECT
          name,
          ST_Y(ST_Transform(way,4326)) AS lat,
          ST_X(ST_Transform(way,4326)) AS lon,
          'train_station' AS type,
          ST_Distance(
            ST_Transform(way,4326)::geography,
            ST_SetSRID(ST_MakePoint($1,$2),4326)::geography
          ) AS distance
        FROM planet_osm_point
        WHERE railway = 'station'
        AND ST_DWithin(
          ST_Transform(way,4326)::geography,
          ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
          $3
        )

        UNION ALL

        SELECT
          name,
          ST_Y(ST_Transform(way,4326)) AS lat,
          ST_X(ST_Transform(way,4326)) AS lon,
          'subway_entrance' AS type,
          ST_Distance(
            ST_Transform(way,4326)::geography,
            ST_SetSRID(ST_MakePoint($1,$2),4326)::geography
          ) AS distance
        FROM planet_osm_point
        WHERE railway = 'subway_entrance'
        AND ST_DWithin(
          ST_Transform(way,4326)::geography,
          ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
          $3
        )
      )
      SELECT *
      FROM transports
      ORDER BY distance
      LIMIT 1
    `;

    const [nearestTransportRow] = await this.dataSource.query<TransportPoint[]>(
      nearestQuery,
      [lon, lat, safeRadius],
    );

    const busStops = transportsWithTime.filter((t) => t.type === 'bus_stop');
    const trainStations = transportsWithTime.filter(
      (t) => t.type === 'train_station',
    );
    const subwayEntrances = transportsWithTime.filter(
      (t) => t.type === 'subway_entrance',
    );

    const busStopsCount = aggregate?.bus_stops ?? 0;
    const subwayCount = aggregate?.subway_entrances ?? 0;
    const trainCount = aggregate?.train_stations ?? 0;

    const rawScore = busStopsCount * 1 + subwayCount * 3 + trainCount * 2;

    const maxScore = 20;
    const transportScore = Math.min(rawScore / maxScore, 1);

    const nearestTransport = nearestTransportRow
      ? {
          ...nearestTransportRow,
          walk_time_minutes: Math.round(
            nearestTransportRow.distance / walkSpeed,
          ),
        }
      : null;

    return {
      summary: {
        radius_meters: safeRadius,
        total,
        returned_count: transportsWithTime.length,
        page: effectivePage,
        page_size: safePageSize,
        total_pages: totalPages,
      },
      counts: {
        bus_stops: busStopsCount,
        train_stations: trainCount,
        subway_entrances: subwayCount,
      },

      raw_score: rawScore,
      transport_score: transportScore,

      nearest_transport: nearestTransport
        ? {
            type: nearestTransport.type,
            distance_meters: Math.round(nearestTransport.distance),
            walk_time_minutes: nearestTransport.walk_time_minutes,
            name: nearestTransport.name,
          }
        : null,

      data: {
        bus_stops: busStops,
        train_stations: trainStations,
        subway_entrances: subwayEntrances,
      },
    };
  }
}
