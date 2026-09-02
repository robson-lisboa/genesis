import React from 'react';
import { useGetProfile } from '@workspace/api-client-react';
import { Flame, Shield, Coins, Star } from 'lucide-react';
import { Link } from 'wouter';

export function Topbar() {
  const { data: profile, isLoading } = useGetProfile();

  if (isLoading || !profile) {
    return (
      <header className="h-16 border-b border-white/10 bg-card/50 backdrop-blur-md sticky top-0 z-30 flex items-center px-4 md:px-8">
        <div className="animate-pulse bg-white/10 h-8 w-64 rounded ml-auto"></div>
      </header>
    );
  }

  const xpProgress = (profile.xp / (profile.xp + profile.xpToNextLevel)) * 100;

  return (
    <header className="h-16 border-b border-white/10 bg-card/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-end px-4 md:px-8 gap-4 md:gap-8 scanline">
      
      {/* Streak */}
      <div className="flex items-center gap-2" title="Current Streak" data-testid="topbar-streak">
        <div className={`p-1.5 rounded bg-orange-500/10 ${profile.streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>
          <Flame size={18} className={profile.streak > 0 ? 'animate-pulse' : ''} />
        </div>
        <span className="font-mono font-bold">{profile.streak}</span>
      </div>

      {/* Coins */}
      <div className="flex items-center gap-2 text-accent" title="Cyber Coins" data-testid="topbar-coins">
        <div className="p-1.5 rounded bg-accent/10">
          <Coins size={18} />
        </div>
        <span className="font-mono font-bold">{profile.coins}</span>
      </div>

      {/* Level & XP */}
      <div className="flex items-center gap-3 hidden sm:flex">
        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">{profile.title}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-primary">XP {profile.xp}</span>
          </div>
        </div>
        
        {/* Progress Ring / Badge */}
        <div className="relative w-12 h-12 flex items-center justify-center glow-box rounded-full bg-background border border-primary/30" title={`Level ${profile.level}`}>
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/10" />
            <circle 
              cx="24" cy="24" r="22" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeDasharray="138"
              strokeDashoffset={138 - (138 * xpProgress) / 100}
              className="text-primary transition-all duration-1000 ease-out" 
            />
          </svg>
          <span className="font-bold text-primary font-mono">{profile.level}</span>
        </div>
      </div>

      {/* Profile Avatar */}
      <Link href="/profile" className="flex items-center gap-3 hover:bg-white/5 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-white/10" data-testid="topbar-profile">
        <div className="w-10 h-10 rounded-full bg-muted border border-white/20 hex-clip overflow-hidden flex items-center justify-center">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
          ) : (
            <UserIcon username={profile.username} />
          )}
        </div>
        <span className="font-medium hidden md:block">{profile.username}</span>
      </Link>
    </header>
  );
}

function UserIcon({ username }: { username: string }) {
  return (
    <div className="w-full h-full bg-secondary/20 text-secondary flex items-center justify-center font-bold text-lg">
      {username.substring(0, 2).toUpperCase()}
    </div>
  );
}
