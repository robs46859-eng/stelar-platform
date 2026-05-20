import { queryAll, queryOne } from '../db/client.js';

export interface Neighborhood {
  id: string;
  name: string;
  city: string;
  region: string;
  lat: number | null;
  lon: number | null;
  properties: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Corridor {
  id: string;
  from_neighborhood_id: string;
  to_neighborhood_id: string;
  distance_meters: number | null;
  travel_time_seconds: number | null;
  mode: string | null;
  weight: number | null;
  properties: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export async function listNeighborhoods(): Promise<Neighborhood[]> {
  return queryAll<Neighborhood>(
    'SELECT * FROM worldgraph.neighborhoods ORDER BY name ASC'
  );
}

export async function getNeighborhood(id: string): Promise<Neighborhood | undefined> {
  return queryOne<Neighborhood>(
    'SELECT * FROM worldgraph.neighborhoods WHERE id = $1',
    [id]
  );
}

export async function listCorridors(): Promise<Corridor[]> {
  return queryAll<Corridor>(
    'SELECT * FROM worldgraph.corridors ORDER BY id ASC'
  );
}
