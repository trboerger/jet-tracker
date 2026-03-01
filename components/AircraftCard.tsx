'use client';

import { AircraftWithDetails } from '@/types/aircraft';
import { 
  Plane, 
  Navigation, 
  Wind, 
  MapPin, 
  Radio,
  Activity,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { formatAltitude, formatSpeed, formatHeading, getCategoryColor, getCategoryLabel, cn } from '@/lib/utils';

interface AircraftCardProps {
  aircraft: AircraftWithDetails;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function AircraftCard({ aircraft, isSelected, onClick }: AircraftCardProps) {
  const statusColor = aircraft.on_ground ? 'text-yellow-500' : 'text-green-500';
  const statusText = aircraft.on_ground ? 'On Ground' : 'In Flight';
  
  // Calculate last update time
  const lastUpdate = aircraft.last_contact 
    ? Math.floor((Date.now() / 1000 - aircraft.last_contact) / 60)
    : null;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "card-hover cursor-pointer rounded-xl p-4 border transition-all duration-200",
        isSelected 
          ? "bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/20" 
          : "bg-jet-card border-gray-800 hover:border-gray-700"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("w-3 h-3 rounded-full", getCategoryColor(aircraft.jetInfo.category))} />
          <div>
            <h3 className="font-bold text-white">{aircraft.jetInfo.owner}</h3>
            <p className="text-xs text-gray-400">{getCategoryLabel(aircraft.jetInfo.category)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Activity className={cn("w-4 h-4", statusColor)} />
          <span className={cn("text-xs font-medium", statusColor)}>{statusText}</span>
        </div>
      </div>
      
      {/* Aircraft Info */}
      <div className="mb-3">
        <p className="text-sm text-gray-300">{aircraft.jetInfo.name}</p>
        <p className="text-xs text-gray-500">{aircraft.jetInfo.type}</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <ArrowUpRight className="w-4 h-4 text-blue-400" />
          <span className="text-gray-300">{formatAltitude(aircraft.geo_altitude)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Wind className="w-4 h-4 text-green-400" />
          <span className="text-gray-300">{formatSpeed(aircraft.velocity)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Navigation className="w-4 h-4 text-purple-400" style={{ transform: `rotate(${aircraft.true_track || 0}deg)` }} />
          <span className="text-gray-300">{formatHeading(aircraft.true_track)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Radio className="w-4 h-4 text-amber-400" />
          <span className="text-gray-300">{aircraft.callsign || 'N/A'}</span>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>
            {lastUpdate !== null 
              ? lastUpdate < 1 
                ? 'Just now' 
                : `${lastUpdate}m ago`
              : 'Unknown'
            }
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="w-3 h-3" />
          <span className="font-mono text-xs">{aircraft.icao24.toUpperCase()}</span>
        </div>
      </div>
      
      {/* Description */}
      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
        {aircraft.jetInfo.description}
      </p>
    </div>
  );
}
