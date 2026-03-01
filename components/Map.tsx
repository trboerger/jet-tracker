'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AircraftWithDetails } from '@/types/aircraft';
import { formatAltitude, formatSpeed, formatHeading, getCategoryColor } from '@/lib/utils';

// Fix for default markers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon.src || '/marker-icon.png',
  shadowUrl: iconShadow.src || '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  aircraft: AircraftWithDetails[];
  selectedIcao?: string | null;
  onSelectAircraft?: (icao24: string) => void;
}

// Custom aircraft icon based on category
function createAircraftIcon(category: string, isSelected: boolean) {
  const color = getCategoryColor(category).replace('bg-', '');
  const colors: Record<string, string> = {
    'purple-500': '#a855f7',
    'red-500': '#ef4444',
    'blue-500': '#3b82f6',
    'amber-500': '#f59e0b',
    'gray-500': '#6b7280',
  };
  
  const hexColor = colors[color] || '#3b82f6';
  const size = isSelected ? 40 : 28;
  
  return L.divIcon({
    className: 'custom-aircraft-icon',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${hexColor};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 20px ${hexColor}80, 0 4px 15px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        animation: ${isSelected ? 'pulse 2s infinite' : 'none'};
      ">
        <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 12h20M12 2v20M12 2l-4 4M12 2l4 4"/>
        </svg>
        ${isSelected ? `<div style="
          position: absolute;
          width: ${size * 2}px;
          height: ${size * 2}px;
          border: 2px solid ${hexColor};
          border-radius: 50%;
          animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        "></div>` : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Map bounds fitter
function MapBounds({ aircraft }: { aircraft: AircraftWithDetails[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (aircraft.length > 0) {
      const bounds = L.latLngBounds(
        aircraft
          .filter(ac => ac.latitude && ac.longitude)
          .map(ac => [ac.latitude!, ac.longitude!])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
      }
    }
  }, [aircraft, map]);
  
  return null;
}

// Selected aircraft tracker
function SelectedTracker({ selectedIcao, aircraft }: { selectedIcao: string | null; aircraft: AircraftWithDetails[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedIcao) {
      const selected = aircraft.find(ac => ac.icao24 === selectedIcao);
      if (selected?.latitude && selected?.longitude) {
        map.setView([selected.latitude, selected.longitude], 8, { animate: true });
      }
    }
  }, [selectedIcao, aircraft, map]);
  
  return null;
}

export default function Map({ aircraft, selectedIcao, onSelectAircraft }: MapProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const validAircraft = useMemo(() => 
    aircraft.filter(ac => ac.latitude !== null && ac.longitude !== null),
    [aircraft]
  );
  
  if (!mounted) {
    return (
      <div className="w-full h-full bg-jet-card rounded-xl flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <MapContainer
      center={[39.8283, -98.5795]}
      zoom={4}
      className="w-full h-full rounded-xl"
      style={{ background: '#0a0a0f' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapBounds aircraft={validAircraft} />
      <SelectedTracker selectedIcao={selectedIcao || null} aircraft={validAircraft} />
      
      {validAircraft.map((ac) => (
        <Marker
          key={ac.icao24}
          position={[ac.latitude!, ac.longitude!]}
          icon={createAircraftIcon(ac.jetInfo.category, ac.icao24 === selectedIcao)}
          eventHandlers={{
            click: () => onSelectAircraft?.(ac.icao24),
          }}
        >
          <Popup className="custom-popup">
            <div className="min-w-[200px] p-2">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${getCategoryColor(ac.jetInfo.category)}`} />
                <span className="font-bold text-gray-900">{ac.jetInfo.owner}</span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><span className="font-semibold">Aircraft:</span> {ac.jetInfo.name}</p>
                <p><span className="font-semibold">Type:</span> {ac.jetInfo.type}</p>
                <p><span className="font-semibold">Callsign:</span> {ac.callsign || 'N/A'}</p>
                <p><span className="font-semibold">Altitude:</span> {formatAltitude(ac.geo_altitude)}</p>
                <p><span className="font-semibold">Speed:</span> {formatSpeed(ac.velocity)}</p>
                <p><span className="font-semibold">Heading:</span> {formatHeading(ac.true_track)}</p>
                <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                  {ac.jetInfo.description}
                </p>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
