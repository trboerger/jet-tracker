import { NextResponse } from 'next/server';
import { trackedJets, jetLookup } from '@/lib/aircraft-data';
import { Aircraft } from '@/types/aircraft';

// OpenSky API fetch (server-side, no CORS issues)
async function fetchOpenSkyData(icao24List: string[]): Promise<Aircraft[]> {
  const icaoSet = new Set(icao24List.map(i => i.toLowerCase()));
  const url = 'https://opensky-network.org/api/states/all';
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'JetTracker/1.0'
    },
    next: { revalidate: 15 }
  });
  
  if (!response.ok) {
    throw new Error(`OpenSky API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.states) {
    return [];
  }
  
  // Filter to tracked aircraft
  const filtered = data.states.filter((state: any[]) => 
    icaoSet.has(state[0].toLowerCase())
  );
  
  return filtered.map((state: any[]) => ({
    icao24: state[0],
    callsign: state[1]?.trim() || null,
    origin_country: state[2],
    time_position: state[3],
    last_contact: state[4],
    longitude: state[5],
    latitude: state[6],
    baro_altitude: state[7],
    on_ground: state[8],
    velocity: state[9],
    true_track: state[10],
    vertical_rate: state[11],
    geo_altitude: state[13],
    squawk: state[14],
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';
  
  // Filter jets by category
  let jetsToTrack = trackedJets;
  if (category !== 'all') {
    jetsToTrack = trackedJets.filter(jet => jet.category === category);
  }
  
  const icao24List = jetsToTrack.map(jet => jet.icao24.toLowerCase());
  
  try {
    const aircraftData = await fetchOpenSkyData(icao24List);
    
    // Merge with jet info
    const enrichedData = aircraftData
      .map(ac => {
        const jetInfo = jetLookup.get(ac.icao24.toLowerCase());
        if (!jetInfo) return null;
        return { ...ac, jetInfo };
      })
      .filter((ac): ac is any => ac !== null);
    
    return NextResponse.json({
      aircraft: enrichedData,
      timestamp: Date.now(),
      totalTracked: jetsToTrack.length,
      visible: enrichedData.length,
      source: 'opensky'
    });
  } catch (error) {
    console.error('Error fetching aircraft:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch aircraft data',
        aircraft: [],
        timestamp: Date.now(),
        totalTracked: jetsToTrack.length,
        visible: 0,
        source: 'error'
      },
      { status: 500 }
    );
  }
}
