import { NextResponse } from 'next/server';
import { trackedJets, jetLookup } from '@/lib/aircraft-data';
import { Aircraft } from '@/types/aircraft';

// Force dynamic to avoid caching
export const dynamic = 'force-dynamic';

// Retry helper
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Fetch attempt ${i + 1}/${maxRetries}...`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      return response;
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error);
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';
  
  console.log(`API called with category: ${category}`);
  
  // Filter jets by category
  let jetsToTrack = trackedJets;
  if (category !== 'all') {
    jetsToTrack = trackedJets.filter(jet => jet.category === category);
  }
  
  const icao24List = jetsToTrack.map(jet => jet.icao24.toLowerCase());
  const icaoSet = new Set(icao24List);
  
  try {
    // Fetch from OpenSky - get all states and filter
    const openSkyUrl = 'https://opensky-network.org/api/states/all';
    console.log('Fetching from OpenSky with retries...');
    
    const response = await fetchWithRetry(openSkyUrl, {
      headers: {
        'User-Agent': 'JetTracker/1.0 (Research Project)',
        'Accept': 'application/json'
      }
    }, 3);
    
    console.log(`OpenSky response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`OpenSky API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.states || !Array.isArray(data.states)) {
      console.log('OpenSky returned no states');
      return NextResponse.json({
        aircraft: [],
        timestamp: Date.now(),
        totalTracked: jetsToTrack.length,
        visible: 0,
        source: 'opensky-empty'
      });
    }
    
    console.log(`OpenSky returned ${data.states.length} total aircraft`);
    
    // Filter to tracked aircraft
    const filtered = data.states.filter((state: any[]) => 
      icaoSet.has(state[0].toLowerCase())
    );
    
    console.log(`Found ${filtered.length} tracked aircraft`);
    
    const aircraftData: Aircraft[] = filtered.map((state: any[]) => ({
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
    return NextResponse.json({
      aircraft: [],
      timestamp: Date.now(),
      totalTracked: jetsToTrack.length,
      visible: 0,
      source: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 });
  }
}
