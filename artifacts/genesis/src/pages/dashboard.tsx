import React from 'react';
import { useGetDashboardStats, useGetDailyChallenge, useGetActivityFeed } from '@workspace/api-client-react';
import { RpgPanel, ProgressBar } from '@/components/ui/rpg-ui';
import { Target, Zap, Clock, Shield, Map as MapIcon, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: daily, isLoading: dailyLoading } = useGetDailyChallenge();
  const { data: activities, isLoading: activityLoading } = useGetActivityFeed();

  if (statsLoading || dailyLoading || activityLoading || !stats || !daily || !activities) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 bg-white/10 w-1/3 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-white/10 rounded" />
          <div className="h-40 bg-white/10 rounded" />
          <div className="h-40 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-mono tracking-tight glow-text uppercase">Command Center</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Your training awaits.</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Global Rank" value={`#${stats.globalRank}`} icon={Shield} color="text-primary" />
        <StatCard title="Cities Secured" value={`${stats.citiesCompleted} / ${stats.totalCities}`} icon={MapIcon} color="text-secondary" />
        <StatCard title="Missions Cleared" value={`${stats.missionsCompleted} / ${stats.totalMissions}`} icon={Target} color="text-accent" />
        <StatCard title="Combat Hours" value={`${stats.hoursThisWeek}h`} icon={Clock} color="text-green-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Daily Challenge */}
          <RpgPanel title="Urgent Directive" variant={daily.isCompleted ? 'default' : 'primary'} className="overflow-hidden">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="p-4 bg-primary/10 rounded-full glow-box shrink-0">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold">{daily.title}</h3>
                  {daily.isCompleted && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-mono border border-green-500/30">COMPLETED</span>}
                </div>
                <p className="text-muted-foreground text-sm mb-4">{daily.description}</p>
                <div className="flex items-center gap-4 text-sm font-mono">
                  <span className="text-primary flex items-center gap-1"><Zap size={14}/> {daily.xpReward} XP</span>
                  <span className="text-accent flex items-center gap-1"><Clock size={14}/> Resets at Midnight</span>
                </div>
              </div>
              <div>
                <Link 
                  href="/daily-challenge"
                  className={`px-6 py-3 rounded font-mono font-bold tracking-wider transition-all flex items-center gap-2 ${
                    daily.isCompleted 
                    ? 'bg-white/10 text-white/50 hover:bg-white/20' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:glow-box'
                  }`}
                  data-testid="link-daily-challenge"
                >
                  {daily.isCompleted ? 'REVIEW' : 'INITIALIZE'} <ChevronRight size={18} />
                </Link>
              </div>
            </div>
          </RpgPanel>

          {/* Continue Journey */}
          <RpgPanel title="Active Sector" className="bg-[url('https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center relative">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Continue Exploration</h3>
                <p className="text-gray-400 mb-4">Access the World Map to deploy to the next sector.</p>
                <ProgressBar value={45} className="w-full max-w-xs mb-2" />
                <div className="text-xs text-muted-foreground font-mono">SECTOR PROGRESS: 45%</div>
              </div>
              <Link 
                href="/world"
                className="px-8 py-4 bg-secondary text-secondary-foreground font-bold tracking-widest uppercase rounded hover:glow-box-secondary transition-all shrink-0 border border-secondary"
                data-testid="link-world-map"
              >
                ENTER WORLD MAP
              </Link>
            </div>
          </RpgPanel>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          {/* Recent Activity */}
          <RpgPanel title="Comms Feed">
            <div className="space-y-4">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex gap-4 items-start border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-mono">
                      <span>{new Date(activity.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      {activity.xpEarned > 0 && <span className="text-primary">+{activity.xpEarned} XP</span>}
                    </div>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="text-center text-muted-foreground py-8 text-sm">No recent comms</div>
              )}
            </div>
          </RpgPanel>

          {/* Skill Radar */}
          <RpgPanel title="Combat Effectiveness">
             <div className="space-y-3">
               {stats.categoryStrengths?.map(cat => (
                 <div key={cat.category}>
                   <div className="flex justify-between text-xs mb-1 font-mono">
                     <span className="text-muted-foreground uppercase">{cat.category}</span>
                     <span className="text-primary">{cat.score}%</span>
                   </div>
                   <ProgressBar value={cat.score} color={cat.score > 80 ? 'bg-secondary' : 'bg-primary'} />
                 </div>
               ))}
               {(!stats.categoryStrengths || stats.categoryStrengths.length === 0) && (
                 <div className="text-center text-muted-foreground py-4 text-sm">Insufficient data</div>
               )}
             </div>
          </RpgPanel>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color: string }) {
  return (
    <div className="bg-black/40 border border-white/10 p-5 flex items-center gap-4 relative overflow-hidden group hover:border-white/30 transition-colors">
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
      <div className={`p-3 rounded bg-white/5 ${color} border border-white/5`}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-muted-foreground text-xs font-mono uppercase tracking-wider mb-1">{title}</div>
        <div className="text-2xl font-bold font-mono">{value}</div>
      </div>
    </div>
  );
}
