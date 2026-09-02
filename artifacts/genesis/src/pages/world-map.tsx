import React, { useRef, useEffect } from 'react';
import { useListCities } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { Lock, Unlock, Star, Zap } from 'lucide-react';

export default function WorldMap() {
  const { data: cities, isLoading } = useListCities();
  const [, setLocation] = useLocation();
  const mapRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to center on mount
  useEffect(() => {
    if (mapRef.current && cities?.length) {
      const container = mapRef.current;
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
      container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
    }
  }, [cities]);

  if (isLoading || !cities) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-primary font-mono animate-pulse tracking-widest text-xl">INITIALIZING SATELLITE LINK...</div>
      </div>
    );
  }

  // Pre-calculate lines between sequential cities
  const lines = [];
  const sortedCities = [...cities].sort((a, b) => a.id - b.id);
  for (let i = 0; i < sortedCities.length - 1; i++) {
    lines.push({
      start: sortedCities[i],
      end: sortedCities[i + 1],
      isUnlocked: sortedCities[i+1].isUnlocked
    });
  }

  return (
    <div className="w-full bg-black relative overflow-hidden" style={{ height: 'calc(100dvh - 64px)' }}>
      {/* Background grid and scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 scanline pointer-events-none" />
      
      {/* HUD overlay */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none">
        <h1 className="text-3xl font-bold font-mono text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">GLOBAL MAP</h1>
        <p className="text-primary font-mono text-sm">SECTOR 7G // ONLINE</p>
      </div>

      {/* Map Container (pan/zoom space) */}
      <div 
        ref={mapRef}
        className="w-full h-full overflow-auto relative cursor-grab active:cursor-grabbing"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Massive canvas for placing nodes */}
        <div className="relative w-[2000px] h-[1500px] mx-auto my-auto">
          
          {/* Draw connecting paths */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {lines.map((line, idx) => {
              if (!line.start.position || !line.end.position) return null;
              // Map percentage coordinates to pixel coordinates (assuming 2000x1500 space)
              const startX = (line.start.position.x / 100) * 2000;
              const startY = (line.start.position.y / 100) * 1500;
              const endX = (line.end.position.x / 100) * 2000;
              const endY = (line.end.position.y / 100) * 1500;
              
              return (
                <g key={`line-${idx}`}>
                  {/* Background track */}
                  <line 
                    x1={startX} y1={startY} x2={endX} y2={endY} 
                    stroke="rgba(255,255,255,0.1)" strokeWidth="4" strokeDasharray="8 8" 
                  />
                  {/* Glowing active path */}
                  {line.isUnlocked && (
                    <line 
                      x1={startX} y1={startY} x2={endX} y2={endY} 
                      stroke="hsl(var(--primary))" strokeWidth="2"
                      className="drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Render City Nodes */}
          {cities.map((city) => {
            if (!city.position) return null;
            
            // Generate position
            const left = `${city.position.x}%`;
            const top = `${city.position.y}%`;
            
            const isCompleted = city.completedMissions === city.totalMissions && city.totalMissions > 0;
            const statusColor = city.isUnlocked ? (isCompleted ? 'text-secondary' : 'text-primary') : 'text-muted-foreground';
            const bgColor = city.isUnlocked ? (isCompleted ? 'bg-secondary/20 border-secondary' : 'bg-primary/20 border-primary') : 'bg-black/80 border-white/10';

            return (
              <div 
                key={city.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10"
                style={{ left, top }}
              >
                {/* City Node */}
                <button
                  onClick={() => city.isUnlocked && setLocation(`/cities/${city.id}`)}
                  disabled={!city.isUnlocked}
                  className={`
                    w-20 h-20 rounded-full border-4 flex items-center justify-center
                    transition-all duration-300 relative
                    ${bgColor} ${statusColor}
                    ${city.isUnlocked ? 'hover:scale-110 cursor-pointer drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:drop-shadow-[0_0_25px_rgba(34,211,238,0.8)]' : 'cursor-not-allowed grayscale'}
                  `}
                  data-testid={`city-node-${city.id}`}
                >
                  {/* Pulsing ring for active city */}
                  {city.isUnlocked && !isCompleted && (
                    <div className="absolute inset-0 rounded-full border-2 border-primary animate-map-node pointer-events-none" />
                  )}

                  {/* Icon */}
                  {city.isUnlocked ? (
                    isCompleted ? <Star size={32} className="fill-secondary" /> : <Zap size={32} />
                  ) : (
                    <Lock size={28} />
                  )}
                </button>

                {/* City Label */}
                <div className={`mt-4 px-4 py-2 bg-black/80 backdrop-blur border rounded text-center whitespace-nowrap transition-all duration-300
                  ${city.isUnlocked ? 'border-white/20 group-hover:border-primary/50' : 'border-white/5 opacity-50'}
                `}>
                  <div className={`font-bold font-mono tracking-wider text-sm ${statusColor}`}>
                    {city.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {city.completedMissions} / {city.totalMissions} SECURED
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
