'use client';

import { Radar, Github, Info } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-gray-800 bg-jet-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Radar className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-jet-dark animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Jet<span className="text-blue-500">Tracker</span>
              </h1>
              <p className="text-xs text-gray-400">Real-Time Aircraft Monitoring</p>
            </div>
          </div>
          
          {/* Center - Live indicator */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-jet-dark rounded-full border border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-300">Live ADS-B Feed</span>
            </div>
            <div className="w-px h-4 bg-gray-700 mx-2" />
            <span className="text-xs text-gray-500">OpenSky Network</span>
          </div>
          
          {/* Right side */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => alert('Jet Tracker monitors aircraft transponder data from the OpenSky Network. Data is for entertainment purposes only.')}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Info className="w-5 h-5" />
            </button>
            <a 
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
