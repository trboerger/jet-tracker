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

// Dynamic import for Map to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-jet-card rounded-xl flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  ),
});

type Category = 'all' | 'tech' | 'business' | 'political' | 'government';

interface ApiResponse {
  aircraft: AircraftWithDetails[];
  timestamp: number;
  totalTracked: number;
  visible: number;
  source?: string;
}

// Fetch from OpenSky via CORS proxy
async function fetchOpenSkyData(icao24List: string[]): Promise<Aircraft[]> {
  const icaoSet = new Set(icao24List.map(i => i.toLowerCase()));
  const targetUrl = 'https://opensky-network.org/api/states/all';
  
  // Try multiple CORS proxies
  const proxies = [
    `https://api.codetabs.com/v1/proxy?quest=${targetUrl}`,
    `https://corsproxy.io/?${targetUrl}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
  ];
  
  let lastError;
  
  for (const proxyUrl of proxies) {
    try {
      const response = await fetch(proxyUrl, { 
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) continue;
      
      let data;
      
      if (proxyUrl.includes('allorigins.win')) {
        const wrapped = await response.json();
        if (wrapped.contents === 'Too many requests') continue;
        data = JSON.parse(wrapped.contents);
      } else {
        data = await response.json();
      }
      
      if (!data.states || !Array.isArray(data.states)) {
        continue;
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
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  
  throw lastError || new Error('All proxies failed');
}

// Generate mock data
function generateMockData(icao24List: string[]): Aircraft[] {
  const now = Math.floor(Date.now() / 1000);
  
  return icao24List.map((icao24, index) => {
    const baseLat = 30 + (index * 3) % 30;
    const baseLon = -120 + (index * 5) % 60;
    const lat = baseLat + Math.sin(now / 3600) * 5;
    const lon = baseLon + Math.cos(now / 3600) * 5;
    
    return {
      icao24: icao24.toLowerCase(),
      callsign: `DEMO${index + 1}`,
      origin_country: "United States",
      time_position: now - 30,
      last_contact: now,
      longitude: lon,
      latitude: lat,
      baro_altitude: 35000 + (index * 500) % 10000,
      on_ground: index % 5 === 0,
      velocity: 400 + (index * 20) % 100,
      true_track: (index * 45) % 360,
      vertical_rate: 0,
      geo_altitude: 35500 + (index * 500) % 10000,
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
      
      try {
        // Try to fetch real data
        aircraftData = await fetchOpenSkyData(icao24List);
        setUseMockData(false);
      } catch (err) {
        console.warn('OpenSky fetch failed, using mock data:', err);
        aircraftData = generateMockData(icao24List);
        setUseMockData(true);
        setError('Live data unavailable - showing demo positions');
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
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)] min-h-[600px]">
          {/* Map */}
          <div className="lg:col-span-2 h-full min-h-[400px]">
            <Map 
              aircraft={filteredAircraft} 
              selectedIcao={selectedIcao}
              onSelectAircraft={setSelectedIcao}
            />
          </div>

          {/* Aircraft List */}
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

        {/* Footer Info */}
        <div className="mt-6 pt-6 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-white mb-2">Data Source</h3>
              <p className="text-gray-400">
                Aircraft positions from OpenSky Network via CORS proxy. Data may be delayed 
                or unavailable for aircraft outside coverage.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Coverage</h3>
              <p className="text-gray-400">
                ADS-B receivers cover most populated areas. Military aircraft may not appear. 
                Government aircraft often use encrypted transponders.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Disclaimer</h3>
              <p className="text-gray-400">
                For entertainment and educational purposes only. Not for navigation or 
                security use. All data is publicly broadcast by aircraft transponders.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
