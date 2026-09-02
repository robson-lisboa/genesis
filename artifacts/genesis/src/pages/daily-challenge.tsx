import React, { useState, useEffect } from 'react';
import { useGetDailyChallenge, useSubmitMission } from '@workspace/api-client-react';
import { RpgPanel } from '@/components/ui/rpg-ui';
import { Zap, Clock, Code, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DailyChallenge() {
  const { data: challenge, isLoading } = useGetDailyChallenge();
  const submitMutation = useSubmitMission();
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (challenge?.starterCode && !code) setCode(challenge.starterCode);
  }, [challenge]);

  useEffect(() => {
    if (!challenge) return;
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(challenge.expiresAt).getTime();
      const diff = expires - now;
      
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }
      
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [challenge]);

  if (isLoading || !challenge) {
    return <div className="p-8 text-center text-primary font-mono animate-pulse">LOADING DAILY DIRECTIVE...</div>;
  }

  const handleRun = () => {
    // Note: Reusing mission submit hook for daily challenge in this implementation, 
    // assuming backend routes it correctly based on ID or we have a specific submit for it.
    // For demo, we just call submitMission with the challenge ID.
    submitMutation.mutate({
      missionId: challenge.id,
      data: { code, language: challenge.language }
    }, {
      onSuccess: (res) => setResult(res)
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Zap className="text-primary" />
            <h1 className="text-3xl font-bold font-mono tracking-widest uppercase">Daily Directive</h1>
          </div>
          <p className="text-muted-foreground">Special rotating challenge. Bonus XP available.</p>
        </div>

        <div className="flex items-center gap-4 bg-black/50 border border-white/10 p-4 rounded-lg">
          <Clock className="text-accent" />
          <div>
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Time Remaining</div>
            <div className="text-2xl font-bold font-mono text-white">{timeLeft}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Info Column */}
        <div className="space-y-6">
          <RpgPanel className="border-primary/30" variant={challenge.isCompleted ? "default" : "primary"}>
            {challenge.isCompleted && (
              <div className="absolute -top-3 -right-3 rotate-12 bg-secondary text-white font-bold font-mono px-3 py-1 rounded shadow-lg border border-white/20">
                COMPLETED
              </div>
            )}
            
            <h2 className="text-xl font-bold mb-2">{challenge.title}</h2>
            <div className="flex gap-2 mb-4">
              <span className="text-xs border border-primary/20 bg-primary/5 text-primary px-2 py-0.5 rounded font-mono">+{challenge.xpReward} XP</span>
              <span className="text-xs border border-accent/20 bg-accent/5 text-accent px-2 py-0.5 rounded font-mono">+{challenge.coinReward} COINS</span>
            </div>
            
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              {challenge.description}
            </p>

            <div className="bg-black/40 border border-white/10 p-3 rounded font-mono text-sm whitespace-pre-wrap text-gray-400">
              {challenge.instructions}
            </div>
          </RpgPanel>

          {result && (
            <RpgPanel variant={result.success ? 'secondary' : 'danger'}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? <CheckCircle2 className="text-secondary" /> : <AlertTriangle className="text-destructive" />}
                <span className={`font-bold font-mono ${result.success ? 'text-secondary' : 'text-destructive'}`}>
                  {result.success ? 'DIRECTIVE COMPLETE' : 'SYSTEM FAILURE'}
                </span>
              </div>
              <p className="text-sm text-gray-400 font-mono whitespace-pre-wrap">{result.feedback}</p>
            </RpgPanel>
          )}
        </div>

        {/* Editor Column */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-black border border-white/10 rounded-t-lg">
            <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
              <Code size={16} /> {challenge.language.toUpperCase()}
            </div>
            <button 
              onClick={handleRun}
              disabled={submitMutation.isPending || challenge.isCompleted}
              className={`
                px-6 py-1.5 font-bold font-mono text-sm rounded transition-all
                ${challenge.isCompleted ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:glow-box'}
              `}
            >
              {submitMutation.isPending ? 'PROCESSING...' : challenge.isCompleted ? 'LOCKED' : 'EXECUTE'}
            </button>
          </div>
          
          <div className="flex-1 min-h-[400px] border-x border-b border-white/10 rounded-b-lg bg-[#0d1117] relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={challenge.isCompleted}
              className="absolute inset-0 w-full h-full bg-transparent text-gray-300 font-mono text-sm p-4 resize-none focus:outline-none custom-scrollbar"
              spellCheck={false}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
