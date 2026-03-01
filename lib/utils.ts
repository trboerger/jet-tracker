import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAltitude(altitude: number | null): string {
  if (altitude === null) return "Unknown";
  const feet = Math.round(altitude * 3.28084);
  return `${feet.toLocaleString()} ft`;
}

export function formatSpeed(speed: number | null): string {
  if (speed === null) return "Unknown";
  const knots = Math.round(speed * 1.94384);
  return `${knots} kts`;
}

export function formatHeading(heading: number | null): string {
  if (heading === null) return "Unknown";
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(heading / 22.5) % 16;
  return `${Math.round(heading)}° ${directions[index]}`;
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'tech':
      return 'bg-purple-500';
    case 'political':
      return 'bg-red-500';
    case 'business':
      return 'bg-blue-500';
    case 'government':
      return 'bg-amber-500';
    default:
      return 'bg-gray-500';
  }
}

export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'tech':
      return 'Tech Billionaire';
    case 'political':
      return 'Political';
    case 'business':
      return 'Business';
    case 'government':
      return 'Government';
    default:
      return 'Unknown';
  }
}
