'use client';

import { cn } from '@/lib/utils';

type Category = 'all' | 'tech' | 'business' | 'political' | 'government';

interface FilterTabsProps {
  active: Category;
  onChange: (category: Category) => void;
  counts: Record<string, number>;
}

const tabs: { value: Category; label: string; color: string }[] = [
  { value: 'all', label: 'All Aircraft', color: 'bg-gray-500' },
  { value: 'tech', label: 'Tech CEOs', color: 'bg-purple-500' },
  { value: 'business', label: 'Business', color: 'bg-blue-500' },
  { value: 'political', label: 'Political', color: 'bg-red-500' },
  { value: 'government', label: 'Government', color: 'bg-amber-500' },
];

export default function FilterTabs({ active, onChange, counts }: FilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
            active === tab.value
              ? "bg-gray-700 text-white"
              : "bg-jet-card text-gray-400 hover:bg-gray-800 hover:text-white"
          )}
        >
          <div className={cn("w-2 h-2 rounded-full", tab.color)} />
          {tab.label}
          {counts[tab.value] !== undefined && (
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              active === tab.value ? "bg-gray-600" : "bg-gray-800"
            )}>
              {counts[tab.value] || 0}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
