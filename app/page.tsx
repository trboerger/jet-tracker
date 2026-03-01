'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import AircraftCard from '@/components/AircraftCard';
import StatsPanel from '@/components/StatsPanel';
import FilterTabs from '@/components/FilterTabs';
import { AircraftWithDetails, Aircraft } from '@/types/aircraft';
import { trackedJets, jetLookup } from '@/lib/aircraft-data';
import { RefreshCw, AlertCircle, WifiOff } from 'lucide-react';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-jet-card rounded-xl flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  ),
});

type Category = 'all' | 'tech' | 'business' | 'political' | 'government';

// Cloudflare Worker URL
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

// Generate realistic mock data around major airports
function generateMockData(icao24List: string[]): Aircraft[] {
  const now = Math.floor(Date.now() / 1000);
  
  const locations = [
    { lat: 40.7128, lon: -74.0060, name: 'NYC' },
    { lat: 34.0522, lon: -118.2437, name: 'LA' },
    { lat: 51.5074, lon: -0.1278, name: 'London' },
    { lat: 48.8566, lon: 2.3522, name: 'Paris' },
    { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
    { lat: 25.7617, lon: -80.1918, name: 'Miami' },
    { lat: 39.7392, lon: -104.9903, name: 'Denver' },
    { lat: 41.9742, lon: -87.9073, name: 'Chicago' },
    { lat: 37.6213, lon: -122.3790, name: 'SF' },
    { lat: 30.2672, lon: -97.7431, name: 'Austin' },
    { lat: 33.7490, lon: -84.3880, name: 'Atlanta' },
    { lat: 47.6062, lon: -122.3321, name: 'Seattle' },
    { lat: 42.3601, lon: -71.0589, name: 'Boston' },
    { lat: 32.7767, lon: -96.7970, name: 'Dallas' },
    { lat: 36.1699, lon: -115.1398, name: 'Vegas' },
  ];
  
  return icao24List.map((icao24, index) => {
    const loc = locations[index % locations.length];
    // Add randomness to make positions look realistic
    const timeOffset = (Date.now() / 1000) % 3600;
    const lat = loc.lat + Math.sin(timeOffset / 600 + index) * 3;
    const lon = loc.lon + Math.cos(timeOffset / 800 + index) * 3;
    
    return {
      icao24: icao24.toLowerCase(),
      callsign: `DEMO${index + 1}`,
      origin_country: "United States",
      time_position: now - Math.floor(Math.random() * 60),
      last_contact: now,
      longitude: lon,
      latitude: lat,
      baro_altitude: 30000 + Math.random() * 15000,
      on_ground: Math.random() > 0.85,
      velocity: 350 + Math.random() * 150,
      true_track: Math.random() * 360,
      vertical_rate: (Math.random() - 0.5) * 1000,
      geo_altitude: 31000 + Math.random() * 15000,
      squawk: `${Math.floor(Math.random() * 7777).toString().padStart(4, '0')}`,
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
      
      try {
        aircraftData = await fetchFromWorker(icao24List);
        if (aircraftData.length === 0) {
          throw new Error('No aircraft found - OpenSky may be blocking requests');
        }
        setUseMockData(false);
      } catch (err) {
        console.warn('Live data unavailable:', err);
        aircraftData = generateMockData(icao24List);
        setUseMockData(true);
        setError('OpenSky is blocking Cloudflare Workers. Using demo positions around major airports.');
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

        {/* Demo Data Notice */}
        {useMockData && (
          <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <WifiOff className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-400 font-medium">
                  Using demo data - OpenSky is blocking Cloudflare Workers
                </p>
                {error && (
                  <p className="text-xs text-yellow-500/70 mt-1">
                    {error}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Aircraft are shown in realistic positions around major airports (NYC, LA, London, Tokyo, etc.) for demonstration purposes.
                </p>
                
                <div className="mt-3 flex gap-2">
                  <a 
                    href="https://opensky-network.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded transition-colors"
                  >
                    Check OpenSky Status
                  </a>
                </div>
              </div>
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
                    No aircraft visible<br />
                    <span className="text-sm">Try refreshing or select a different category</span>
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

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-white mb-2">About This Dashboard</h3>
              <p className="text-gray-400">
                Tracks 40+ high-profile aircraft including tech billionaires, business leaders, and government planes using ADS-B transponder data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Data Source</h3>
              <p className="text-gray-400">
                Normally fetches from OpenSky Network. Currently showing demo positions due to API restrictions on serverless functions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Disclaimer</h3>
              <p className="text-gray-400">
                For entertainment purposes only. Not for navigation or operational use. Aircraft positions are simulated when live data is unavailable.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
