export interface Aircraft {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  time_position: number | null;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
  geo_altitude: number | null;
  squawk: string | null;
}

export interface TrackedJet {
  icao24: string;
  name: string;
  owner: string;
  type: string;
  category: 'tech' | 'political' | 'business' | 'government';
  description?: string;
  image?: string;
}

export interface AircraftWithDetails extends Aircraft {
  jetInfo: TrackedJet;
}
