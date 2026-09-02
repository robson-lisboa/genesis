import React from 'react';
import { useGetCity, useListCityMissions } from '@workspace/api-client-react';
import { useRoute, Link } from 'wouter';
import { RpgPanel, ProgressBar } from '@/components/ui/rpg-ui';
import { ChevronLeft, Skull, Target, Lock, Play, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function CityDetail() {
  const [, params] = useRoute('/cities/:id');
  const cityId = params?.id ? parseInt(params.id) : 0;
  
  const { data: city, isLoading: cityLoading } = useGetCity(cityId);
  
  if (cityLoading || !city) {
    return (
      <div className="p-8 flex justify-center text-primary font-mono animate-pulse">
        ESTABLISHING CONNECTION TO SECTOR...
      </div>
    );
  }

  const progress = city.totalMissions > 0 ? (city.completedMissions / city.totalMissions) * 100 : 0;

  return (
    <div className="min-h-full bg-background animate-in fade-in duration-500">
      
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 scanline" />
        
        <div className="absolute top-6 left-6 z-20">
          <Link href="/world" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-mono uppercase text-sm">
            <ChevronLeft size={16} /> Return to Map
          </Link>
        </div>

        <div className="absolute bottom-8 left-6 md:left-12 z-20 max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-1 bg-white/10 backdrop-blur border border-white/20 rounded text-xs font-mono text-primary uppercase">
              Difficulty: {city.difficulty}
            </span>
            <span className="text-secondary font-mono text-sm tracking-widest">{city.theme}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-mono tracking-wider glow-text mb-4 uppercase">
            {city.name}
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            {city.description}
          </p>
        </div>
      </div>

      <div className="p-6 md:p-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Quest Log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold font-mono tracking-widest">MISSION LOG</h2>
            <div className="text-right">
              <div className="text-sm text-muted-foreground font-mono mb-1">CITY SECURED: {Math.round(progress)}%</div>
              <ProgressBar value={progress} className="w-48" />
            </div>
          </div>

          <div className="space-y-4">
            {city.missions.map((mission, index) => (
              <MissionCard key={mission.id} mission={mission} index={index} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Boss Intel */}
          <RpgPanel title="Sector Threat Intel" variant="danger" className="bg-destructive/5">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-24 h-24 rounded-full bg-black border-4 border-destructive flex items-center justify-center mb-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-destructive/20 group-hover:bg-destructive/40 transition-colors" />
                <Skull size={40} className="text-destructive drop-shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wider text-destructive mb-2">{city.boss.name}</h3>
              <p className="text-sm text-gray-400 mb-6">{city.boss.description}</p>
              
              <div className="w-full flex items-center justify-between font-mono text-sm p-3 bg-black/50 rounded border border-destructive/20">
                <span className="text-muted-foreground">STATUS</span>
                {city.boss.isDefeated ? (
                  <span className="text-secondary font-bold flex items-center gap-2"><CheckCircle2 size={16}/> ELIMINATED</span>
                ) : (
                  <span className="text-destructive font-bold flex items-center gap-2"><ShieldAlert size={16}/> ACTIVE</span>
                )}
              </div>
            </div>
          </RpgPanel>

          {/* Rewards Intel */}
          <RpgPanel title="Sector Completion Rewards">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded">
                <span className="text-muted-foreground text-sm uppercase font-mono">Completion XP</span>
                <span className="font-bold text-primary">+{city.xpReward} XP</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded">
                <span className="text-muted-foreground text-sm uppercase font-mono">Status</span>
                <span className="font-bold text-gray-300">
                  {city.completedMissions} / {city.totalMissions}
                </span>
              </div>
            </div>
          </RpgPanel>
        </div>
      </div>
    </div>
  );
}

function MissionCard({ mission, index }: { mission: any, index: number }) {
  const isPlayable = mission.isUnlocked && !mission.isCompleted;
  
  let statusBadge;
  if (mission.isCompleted) statusBadge = <span className="text-secondary flex items-center gap-1"><CheckCircle2 size={14}/> COMPLETED</span>;
  else if (!mission.isUnlocked) statusBadge = <span className="text-muted-foreground flex items-center gap-1"><Lock size={14}/> LOCKED</span>;
  else statusBadge = <span className="text-primary flex items-center gap-1"><Target size={14}/> ACTIVE</span>;

  const cardContent = (
    <div
      className={`
        block relative overflow-hidden border p-5 rounded-lg transition-all duration-300
        ${mission.isCompleted ? 'bg-black/60 border-secondary/30' : ''}
        ${!mission.isUnlocked ? 'bg-black/80 border-white/5 opacity-60 grayscale' : ''}
        ${isPlayable ? 'bg-primary/5 border-primary/30 hover:border-primary/80 hover:bg-primary/10 cursor-pointer group' : ''}
      `}
    >
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Number Badge */}
        <div className={`
          w-12 h-12 shrink-0 rounded flex items-center justify-center font-mono text-xl font-bold border
          ${isPlayable ? 'bg-primary/20 text-primary border-primary/50 group-hover:scale-110 transition-transform' : 'bg-white/5 text-muted-foreground border-white/10'}
        `}>
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`text-lg font-bold ${isPlayable ? 'group-hover:text-primary transition-colors' : ''}`}>
              {mission.title}
            </h4>
            <div className="font-mono text-xs font-bold tracking-wider">{statusBadge}</div>
          </div>
          <p className="text-sm text-gray-400 line-clamp-1 mb-3">{mission.description}</p>
          
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <span className="text-primary border border-primary/20 bg-primary/5 px-2 py-0.5 rounded">+{mission.xpReward} XP</span>
            <span className="text-accent border border-accent/20 bg-accent/5 px-2 py-0.5 rounded">+{mission.coinReward} COINS</span>
            <span className="text-muted-foreground uppercase">{mission.type}</span>
            <span className="text-muted-foreground uppercase">{mission.difficulty}</span>
          </div>
        </div>

        {/* Action Button for Active Missions */}
        {isPlayable && (
          <div className="shrink-0 p-3 bg-primary text-background rounded-full group-hover:bg-white transition-colors self-end md:self-center ml-auto">
            <Play size={20} className="fill-current" />
          </div>
        )}
      </div>
    </div>
  );

  return isPlayable ? (
    <Link href={`/missions/${mission.id}`} data-testid={`link-mission-${mission.id}`}>
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
}
