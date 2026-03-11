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
  ): Promise<NearbyTransportsResult> {
    const query = `
    SELECT *
FROM (

  (SELECT
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
    ORDER BY distance
    LIMIT 20
  )

  UNION ALL

  (SELECT
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
    ORDER BY distance
    LIMIT 20
  )

  UNION ALL

  (SELECT
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
    ORDER BY distance
    LIMIT 20
  )

) transports

ORDER BY distance;
    `;

    const transports: TransportPoint[] = await this.dataSource.query(query, [
      lon,
      lat,
      radius,
    ]);

    const walkSpeed = 83; // metros por minuto

    const transportsWithTime: TransportPointWithTime[] = transports.map(
      (t) => ({
        ...t,
        walk_time_minutes: Math.round(t.distance / walkSpeed),
      }),
    );

    const busStops = transportsWithTime.filter((t) => t.type === 'bus_stop');
    const trainStations = transportsWithTime.filter(
      (t) => t.type === 'train_station',
    );
    const subwayEntrances = transportsWithTime.filter(
      (t) => t.type === 'subway_entrance',
    );

    const busStopsCount = busStops.length;
    const subwayCount = subwayEntrances.length;
    const trainCount = trainStations.length;

    const rawScore = busStopsCount * 1 + subwayCount * 3 + trainCount * 2;

    const maxScore = 20;
    const transportScore = Math.min(rawScore / maxScore, 1);

    const nearestTransport = transportsWithTime.sort(
      (a, b) => a.distance - b.distance,
    )[0];

    return {
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
