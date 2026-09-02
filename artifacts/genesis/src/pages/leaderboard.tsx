import React from 'react';
import { useGetLeaderboard, useGetProfile } from '@workspace/api-client-react';
import { Medal, Flame } from 'lucide-react';

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 100 });
  const { data: profile } = useGetProfile();

  if (isLoading || !leaderboard) {
    return <div className="p-8 text-center text-primary font-mono animate-pulse">FETCHING GLOBAL RANKINGS...</div>;
  }

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
      case 2: return 'bg-gray-300/10 border-gray-300/50 text-gray-300 shadow-[0_0_15px_rgba(209,213,219,0.2)]';
      case 3: return 'bg-amber-600/10 border-amber-600/50 text-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.2)]';
      default: return 'bg-black/40 border-white/5 text-gray-400';
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold font-mono tracking-widest text-primary drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] uppercase mb-2">
          Global Rankings
        </h1>
        <p className="text-muted-foreground">Top 100 Operatives Worldwide</p>
      </div>

      <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
        
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-mono text-muted-foreground uppercase tracking-widest">
          <div className="col-span-2 md:col-span-1 text-center">Rank</div>
          <div className="col-span-6 md:col-span-5">Operative</div>
          <div className="col-span-4 md:col-span-3 text-right">Title</div>
          <div className="hidden md:block md:col-span-1 text-center">Streak</div>
          <div className="hidden md:block md:col-span-2 text-right">Total XP</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5">
          {leaderboard.map((entry) => {
            const isMe = profile?.id === entry.studentId;
            const rankStyle = getRankStyle(entry.rank);

            return (
              <div 
                key={entry.studentId} 
                className={`
                  grid grid-cols-12 gap-4 p-4 items-center transition-colors hover:bg-white/5
                  ${isMe ? 'bg-primary/5 border-l-2 border-l-primary' : ''}
                `}
              >
                {/* Rank */}
                <div className="col-span-2 md:col-span-1 flex justify-center">
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-mono font-bold border ${rankStyle}`}>
                    {entry.rank}
                  </div>
                </div>

                {/* User Info */}
                <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-muted hex-clip overflow-hidden shrink-0 border border-white/20">
                    {entry.avatarUrl ? (
                      <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary/20 text-secondary flex items-center justify-center font-bold">
                        {entry.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      <span className={isMe ? 'text-primary' : 'text-white'}>{entry.username}</span>
                      {isMe && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono border border-primary/30">YOU</span>}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">Level {entry.level}</div>
                  </div>
                </div>

                {/* Title */}
                <div className="col-span-4 md:col-span-3 text-right text-sm font-mono text-gray-400 uppercase">
                  {entry.title}
                </div>

                {/* Streak */}
                <div className="hidden md:flex md:col-span-1 justify-center items-center gap-1 font-mono text-sm">
                  {entry.streak > 0 ? (
                    <><Flame size={14} className="text-orange-500" /> {entry.streak}</>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>

                {/* XP */}
                <div className="hidden md:block md:col-span-2 text-right font-mono text-primary font-bold">
                  {entry.xp.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
