import React, { useState } from 'react';
import { useListAchievements } from '@workspace/api-client-react';
import { Trophy, Star, Shield, Zap, Flame, Crown } from 'lucide-react';
import { RpgPanel } from '@/components/ui/rpg-ui';

export default function Achievements() {
  const { data: achievements, isLoading } = useListAchievements();
  const [filter, setFilter] = useState<'ALL' | 'EARNED' | 'LOCKED'>('ALL');

  if (isLoading || !achievements) {
    return <div className="p-8 text-center text-primary font-mono animate-pulse">SYNCING ACCOLADES...</div>;
  }

  const filtered = achievements.filter(a => {
    if (filter === 'EARNED') return a.isEarned;
    if (filter === 'LOCKED') return !a.isEarned;
    return true;
  });

  const earnedCount = achievements.filter(a => a.isEarned).length;
  const totalXP = achievements.filter(a => a.isEarned).reduce((sum, a) => sum + a.xpReward, 0);

  const getRarityColor = (rarity: string) => {
    switch (rarity.toUpperCase()) {
      case 'LEGENDARY': return 'text-orange-400 border-orange-400/50 bg-orange-400/10 drop-shadow-[0_0_10px_rgba(251,146,60,0.8)]';
      case 'EPIC': return 'text-secondary border-secondary/50 bg-secondary/10 drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]';
      case 'RARE': return 'text-primary border-primary/50 bg-primary/10';
      default: return 'text-gray-300 border-white/20 bg-white/5';
    }
  };

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'crown': return Crown;
      case 'flame': return Flame;
      case 'zap': return Zap;
      case 'shield': return Shield;
      default: return Star;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-widest text-accent drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] uppercase flex items-center gap-3">
            <Trophy className="text-accent" size={32} /> Hall of Glory
          </h1>
          <p className="text-muted-foreground mt-2">Your permanent record of exceptional performance.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-black/40 border border-white/10 p-3 rounded text-center min-w-[120px]">
            <div className="text-xs text-muted-foreground font-mono uppercase mb-1">UNLOCKED</div>
            <div className="text-2xl font-bold text-white">{earnedCount} / {achievements.length}</div>
          </div>
          <div className="bg-black/40 border border-white/10 p-3 rounded text-center min-w-[120px]">
            <div className="text-xs text-muted-foreground font-mono uppercase mb-1">BONUS XP</div>
            <div className="text-2xl font-bold text-accent">+{totalXP}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 font-mono text-sm">
        {['ALL', 'EARNED', 'LOCKED'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded transition-colors border ${
              filter === f 
                ? 'bg-accent text-accent-foreground border-accent font-bold' 
                : 'bg-black/40 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(achievement => {
          const isEarned = achievement.isEarned;
          const rarityStyle = isEarned ? getRarityColor(achievement.rarity) : 'text-gray-600 border-white/5 bg-black/80 grayscale opacity-50';
          const Icon = getIcon(achievement.icon);

          return (
            <div 
              key={achievement.id}
              className={`relative border p-5 rounded-lg overflow-hidden transition-all duration-300 ${rarityStyle}`}
            >
              {isEarned && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full -mr-4 -mt-4" />
              )}
              
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-full border ${isEarned ? 'bg-black/40' : 'bg-transparent'} ${rarityStyle.split(' ')[1]}`}>
                  <Icon size={24} className={isEarned ? '' : 'opacity-30'} />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono tracking-widest uppercase border px-2 py-0.5 rounded-full bg-black/50">
                    {achievement.rarity}
                  </span>
                  {isEarned && achievement.earnedAt && (
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {new Date(achievement.earnedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-1 leading-tight">{achievement.title}</h3>
                <p className={`text-sm mb-4 ${isEarned ? 'text-gray-300' : 'text-gray-500'}`}>
                  {achievement.description}
                </p>
                <div className="font-mono text-xs font-bold tracking-wider">
                  +{achievement.xpReward} XP
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground font-mono">
          NO DATA FOUND FOR CURRENT FILTER.
        </div>
      )}
    </div>
  );
}
