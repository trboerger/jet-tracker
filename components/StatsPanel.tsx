'use client';

import { AircraftWithDetails } from '@/types/aircraft';
import { Plane, Eye, Radio, AlertTriangle } from 'lucide-react';

interface StatsPanelProps {
  aircraft: AircraftWithDetails[];
  totalTracked: number;
}

export default function StatsPanel({ aircraft, totalTracked }: StatsPanelProps) {
  const inFlight = aircraft.filter(ac => !ac.on_ground).length;
  const onGround = aircraft.filter(ac => ac.on_ground).length;
  const visible = aircraft.length;
  
  // Group by category
  const byCategory = aircraft.reduce((acc, ac) => {
    acc[ac.jetInfo.category] = (acc[ac.jetInfo.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const stats = [
    { 
      label: 'Tracked Aircraft', 
      value: visible, 
      total: totalTracked,
      icon: Plane,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    { 
      label: 'In Flight', 
      value: inFlight, 
      icon: Radio,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    { 
      label: 'On Ground', 
      value: onGround, 
      icon: Eye,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10'
    },
  ];
  
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div 
          key={stat.label}
          className="bg-jet-card border border-gray-800 rounded-xl p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`${stat.bgColor} p-1.5 rounded-lg`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <span className="text-xs text-gray-400">{stat.label}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{stat.value}</span>
            {stat.total && (
              <span className="text-xs text-gray-500">/ {stat.total}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
