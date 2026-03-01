'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import AircraftCard from '@/components/AircraftCard';
import StatsPanel from '@/components/StatsPanel';
import FilterTabs from '@/components/FilterTabs';
import { AircraftWithDetails, Aircraft } from '@/types/aircraft';
import { trackedJets, jetLookup } from '@/lib/aircraft-data';
import { RefreshCw, AlertCircle } from 'lucide-react';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-jet-card rounded-xl flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  ),
});

type Category = 'all' | 'tech' | 'business' | 'political' | 'government';

// Cloudflare Worker URL - replace with yours once deployed
// Example: 'https://jet-tracker-api.yourname.workers.dev'
const WORKER_URL = 'https://jet-tracker-api.trboerger.workers.dev';

// Fetch from Cloudflare Worker
async function fetchFromWorker(icao24List: string[]): Promise<Aircraft[]> {
  const icaoSet = new Set(icao24List.map(i => i.toLowerCase()));
  
  const response = await fetch(WORKER_URL, {
    cache: 'no-store',
    headers: { 'Accept': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`Worker error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  if (!data.states || !Array.isArray(data.states)) {
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

// Generate realistic mock data
function generateMockData(icao24List: string[]): Aircraft[] {
  const now = Math.floor(Date.now() / 1000);
  
  // More realistic positions (major airports and common routes)
  const locations = [
    { lat: 40.7128, lon: -74.0060 }, // NYC
    { lat: 34.0522, lon: -118.2437 }, // LA
    { lat: 51.5074, lon: -0.1278 }, // London
    { lat: 48.8566, lon: 2.3522 }, // Paris
    { lat: 35.6762, lon: 139.6503 }, // Tokyo
    { lat: 25.7617, lon: -80.1918 }, // Miami
    { lat: 39.7392, lon: -104.9903 }, // Denver
    { lat: 41.9742, lon: -87.9073 }, // Chicago
    { lat: 37.6213, lon: -122.3790 }, // SF
    { lat: 30.2672, lon: -97.7431 }, // Austin
  ];
  
  return icao24List.map((icao24, index) => {
    const loc = locations[index % locations.length];
    // Add some randomness to position
    const lat = loc.lat + (Math.random() - 0.5) * 4;
    const lon = loc.lon + (Math.random() - 0.5) * 4;
    
    return {
      icao24: icao24.toLowerCase(),
      callsign: `DEMO${index + 1}`,
      origin_country: "United States",
      time_position: now - 30,
      last_contact: now,
      longitude: lon,
      latitude: lat,
      baro_altitude: 35000 + Math.random() * 10000,
      on_ground: Math.random() > 0.8,
      velocity: 400 + Math.random() * 100,
      true_track: Math.random() * 360,
      vertical_rate: 0,
      geo_altitude: 35500 + Math.random() * 10000,
      squawk: "1200",
    };
  });
}

export default function Home() {
  const [aircraft, setAircraft] = useState<AircraftWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedIcao, setSelectedIcao] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [totalTracked, setTotalTracked] = useState(0);

  const jetsToTrack = useMemo(() => {
    if (selectedCategory === 'all') return trackedJets;
    return trackedJets.filter(jet => jet.category === selectedCategory);
  }, [selectedCategory]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const icao24List = jetsToTrack.map(jet => jet.icao24.toLowerCase());
      setTotalTracked(jetsToTrack.length);
      
      let aircraftData: Aircraft[];
      
      // Only try worker if URL is configured
      if (WORKER_URL.includes('yourname')) {
        // Worker not set up yet - use mock data
        aircraftData = generateMockData(icao24List);
        setUseMockData(true);
        setError('Add your Cloudflare Worker URL to see live data (see setup guide below)');
      } else {
        try {
          aircraftData = await fetchFromWorker(icao24List);
          setUseMockData(false);
        } catch (err) {
          console.warn('Worker failed, using mock data:', err);
          aircraftData = generateMockData(icao24List);
          setUseMockData(true);
          setError('Worker unavailable - showing demo positions');
        }
      }
      
      // Merge with jet info
      const enrichedData: AircraftWithDetails[] = aircraftData
        .map(ac => {
          const jetInfo = jetLookup.get(ac.icao24.toLowerCase());
          if (!jetInfo) return null;
          return { ...ac, jetInfo };
        })
        .filter((ac): ac is AircraftWithDetails => ac !== null);
      
      setAircraft(enrichedData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load aircraft data');
    } finally {
      setLoading(false);
    }
  }, [jetsToTrack]);

  // Initial fetch and interval
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: aircraft.length };
    aircraft.forEach(ac => {
      counts[ac.jetInfo.category] = (counts[ac.jetInfo.category] || 0) + 1;
    });
    return counts;
  }, [aircraft]);

  // Filter aircraft by category
  const filteredAircraft = useMemo(() => {
    if (selectedCategory === 'all') return aircraft;
    return aircraft.filter(ac => ac.jetInfo.category === selectedCategory);
  }, [aircraft, selectedCategory]);

  return (
    <div className="min-h-screen bg-jet-dark">
      <Header />
      
      <main className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Stats & Controls */}
        <div className="mb-6 space-y-4">
          <StatsPanel aircraft={aircraft} totalTracked={totalTracked} />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <FilterTabs 
              active={selectedCategory} 
              onChange={setSelectedCategory}
              counts={categoryCounts}
            />
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error/Message */}
        {useMockData && (
          <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <p className="text-sm text-yellow-400">
                Using demo data
              </p>
            </div>
            {error && (
              <p className="text-xs text-yellow-500/70 ml-8">
                {error}
              </p>
            )}
            
            {/* Setup Guide */}
            <div className="mt-3 ml-8 p-3 bg-jet-card rounded-lg border border-gray-700">
              <p className="text-sm font-medium text-white mb-2">To get live data:</p>
              <ol className="text-xs text-gray-400 list-decimal list-inside space-y-1">
                <li>Go to <a href="https://dash.cloudflare.com" target="_blank" className="text-blue-400 hover:underline">dash.cloudflare.com</a></li>
                <li>Workers & Pages → Create Worker</li>
                <li>Name it <code className="bg-gray-800 px-1 rounded">jet-tracker-api</code></li>
                <li>Paste this code:</li>
              </ol>
              <pre className="mt-2 p-2 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto">
{`export default {
  async fetch(request) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    };
    
    const res = await fetch('https://opensky-network.org/api/states/all', {
      headers: { 'User-Agent': 'JetTracker/1.0' }
    });
    
    const data = await res.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
};`}
              </pre>
              <p className="text-xs text-gray-400 mt-2">
                5. Copy your worker URL (like <code className="bg-gray-800 px-1">https://jet-tracker-api.YOURNAME.workers.dev</code>)
              </p>
              <p className="text-xs text-gray-400 mt-1">
                6. Replace <code className="bg-gray-800 px-1">WORKER_URL</code> in <code className="bg-gray-800 px-1">app/page.tsx</code>
              </p>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)] min-h-[600px]">
          <div className="lg:col-span-2 h-full min-h-[400px]">
            <Map 
              aircraft={filteredAircraft} 
              selectedIcao={selectedIcao}
              onSelectAircraft={setSelectedIcao}
            />
          </div>

          <div className="h-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">Tracked Aircraft</h2>
              <span className="text-sm text-gray-400">
                {filteredAircraft.length} visible
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {filteredAircraft.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <RefreshCw className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-center">
                    No aircraft visible in this category<br />
                    <span className="text-sm">They may be out of ADS-B range</span>
                  </p>
                </div>
              ) : (
                filteredAircraft.map((ac) => (
                  <AircraftCard
                    key={ac.icao24}
                    aircraft={ac}
                    isSelected={ac.icao24 === selectedIcao}
                    onClick={() => setSelectedIcao(ac.icao24 === selectedIcao ? null : ac.icao24)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
