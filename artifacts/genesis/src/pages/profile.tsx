import React, { useState } from 'react';
import { useGetProfile, useUpdateProfile, useGetDashboardStats } from '@workspace/api-client-react';
import { RpgPanel, ProgressBar, Hexagon } from '@/components/ui/rpg-ui';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { User, Shield, Zap, Target, Edit3, Check, X, Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const updateMutation = useUpdateProfile();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '' });

  React.useEffect(() => {
    if (profile && !isEditing) {
      setEditForm({ username: profile.username, bio: profile.bio || '' });
    }
  }, [profile, isEditing]);

  if (profileLoading || statsLoading || !profile || !stats) {
    return <div className="p-8 text-center text-primary font-mono animate-pulse">LOADING DOSSIER...</div>;
  }

  const handleSave = () => {
    updateMutation.mutate({ data: editForm }, {
      onSuccess: () => {
        setIsEditing(false);
        toast({ title: "PROFILE UPDATED", className: "font-mono border-primary text-primary" });
      }
    });
  };

  // Format data for Recharts
  const radarData = stats.categoryStrengths?.map(c => ({
    subject: c.category,
    A: c.score,
    fullMark: 100,
  })) || [];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Identity Card */}
      <RpgPanel className="overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
        
        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          <div className="shrink-0 flex flex-col items-center">
            <Hexagon size="xl" image={profile.avatarUrl || undefined} className="mb-4">
              {!profile.avatarUrl && <User size={48} className="text-muted-foreground" />}
            </Hexagon>
            <div className="font-mono text-xl text-primary glow-text mb-1 tracking-widest uppercase">
              LVL {profile.level}
            </div>
            <div className="text-xs text-muted-foreground font-mono uppercase">Global Rank #{profile.rank}</div>
          </div>

          <div className="flex-1 w-full">
            <div className="flex items-start justify-between mb-4">
              <div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.username}
                    onChange={e => setEditForm({...editForm, username: e.target.value})}
                    className="bg-black/50 border border-primary/50 text-2xl font-bold font-mono px-3 py-1 rounded w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-primary mb-2"
                  />
                ) : (
                  <h1 className="text-3xl md:text-4xl font-bold font-mono tracking-wider uppercase mb-1">
                    {profile.username}
                  </h1>
                )}
                <div className="text-secondary font-mono tracking-widest text-sm flex items-center gap-2">
                  <Shield size={14} /> {profile.title}
                </div>
              </div>

              {isEditing ? (
                <div className="flex gap-2">
                  <button onClick={handleSave} className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors">
                    <Check size={18} />
                  </button>
                  <button onClick={() => setIsEditing(false)} className="p-2 bg-destructive/20 text-destructive rounded hover:bg-destructive/30 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsEditing(true)} className="p-2 border border-white/10 rounded text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                  <Edit3 size={18} />
                </button>
              )}
            </div>

            <div className="bg-black/40 border border-white/5 p-4 rounded-lg mb-6 text-sm text-gray-300 leading-relaxed min-h-[80px]">
              {isEditing ? (
                <textarea 
                  value={editForm.bio}
                  onChange={e => setEditForm({...editForm, bio: e.target.value})}
                  className="w-full bg-transparent border-none resize-none focus:outline-none"
                  placeholder="Enter your operative bio..."
                  rows={3}
                />
              ) : (
                profile.bio || <span className="text-gray-600 italic">No bio provided.</span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground uppercase">Next Level Progress</span>
                <span className="text-primary">{profile.xp} / {profile.xp + profile.xpToNextLevel} XP</span>
              </div>
              <ProgressBar value={profile.xp} max={profile.xp + profile.xpToNextLevel} />
            </div>
          </div>
        </div>
      </RpgPanel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Radar Chart */}
        <RpgPanel title="Skill Matrix" className="h-[400px]">
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'monospace' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Skills" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm">
              INSUFFICIENT COMBAT DATA
            </div>
          )}
        </RpgPanel>

        {/* Stats Grid */}
        <div className="space-y-4">
          <StatBox label="Total Experience" value={stats.totalXp.toLocaleString()} icon={Zap} color="text-primary" />
          <StatBox label="Longest Streak" value={`${stats.longestStreak} DAYS`} icon={Flame} color="text-orange-500" />
          <StatBox label="Missions Cleared" value={stats.totalMissions} icon={Target} color="text-secondary" />
          <StatBox label="Neural Nodes Unlocked" value={stats.skillsUnlocked} icon={Zap} color="text-accent" />
          <StatBox label="Accuracy Rate" value={`${stats.accuracyRate}%`} icon={Shield} color="text-green-400" />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="bg-black/40 border border-white/10 p-4 flex items-center justify-between rounded group hover:border-white/20 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded bg-white/5 ${color}`}>
          <Icon size={20} />
        </div>
        <span className="text-muted-foreground text-sm font-mono uppercase">{label}</span>
      </div>
      <span className="text-xl font-bold font-mono">{value}</span>
    </div>
  );
}
