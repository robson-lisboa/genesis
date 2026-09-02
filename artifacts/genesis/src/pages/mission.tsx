import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useGetMission, useSubmitMission, useRequestMissionHint } from '@workspace/api-client-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ChevronLeft, Play, CheckCircle2, XCircle, Lightbulb, Terminal, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Mission() {
  const [, params] = useRoute('/missions/:id');
  const [, setLocation] = useLocation();
  const missionId = params?.id ? parseInt(params.id) : 0;
  
  const { data: mission, isLoading } = useGetMission(missionId);
  const submitMutation = useSubmitMission();
  const hintMutation = useRequestMissionHint();
  const { toast } = useToast();

  const [code, setCode] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const [hints, setHints] = useState<string[]>([]);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Initialize code when mission loads
  React.useEffect(() => {
    if (mission?.challenge?.starterCode && !code) {
      setCode(mission.challenge.starterCode);
    }
  }, [mission]);

  if (isLoading || !mission) {
    return (
      <div className="h-full flex items-center justify-center font-mono text-primary animate-pulse text-xl">
        DECRYPTING MISSION FILES...
      </div>
    );
  }

  const handleRun = () => {
    submitMutation.mutate({
      missionId,
      data: { code, language: mission.challenge.language }
    }, {
      onSuccess: (res) => {
        setSubmissionResult(res);
        if (res.success) {
          toast({
            title: "TESTS PASSED",
            description: `Mission accomplished! +${res.xpEarned} XP`,
            className: "bg-green-950 border-green-500 text-green-400 font-mono",
          });
        } else {
          toast({
            title: "TESTS FAILED",
            description: "Check compiler output for details.",
            variant: "destructive",
            className: "font-mono",
          });
        }
      }
    });
  };

  const handleHint = () => {
    hintMutation.mutate({
      missionId,
      data: { currentHintLevel: hintLevel }
    }, {
      onSuccess: (res) => {
        setHints([...hints, res.hint]);
        setHintLevel(res.hintLevel);
      }
    });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-card shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLocation(`/cities/${mission.cityId}`)}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-mono text-sm"
          >
            <ChevronLeft size={16} /> ABORT
          </button>
          <div className="h-4 w-px bg-white/20" />
          <h1 className="font-bold font-mono tracking-wider">{mission.title}</h1>
          {mission.isCompleted && <span className="text-xs bg-secondary/20 text-secondary border border-secondary/30 px-2 py-0.5 rounded font-mono">SECURED</span>}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <span className="text-xs border border-primary/20 bg-primary/5 text-primary px-2 py-1 rounded font-mono">+{mission.xpReward} XP</span>
            <span className="text-xs border border-accent/20 bg-accent/5 text-accent px-2 py-1 rounded font-mono">+{mission.coinReward} COINS</span>
          </div>
          <button 
            onClick={handleRun}
            disabled={submitMutation.isPending}
            className="px-6 py-1.5 bg-primary text-primary-foreground font-bold font-mono text-sm rounded hover:bg-primary/90 hover:glow-box transition-all flex items-center gap-2 disabled:opacity-50"
            data-testid="button-run-code"
          >
            {submitMutation.isPending ? <span className="animate-pulse">COMPILING...</span> : <><Play size={16} className="fill-current" /> RUN TESTS</>}
          </button>
        </div>
      </div>

      {/* Main Split Pane */}
      <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        
        {/* LEFT PANE: Mission Briefing */}
        <Panel defaultSize={40} minSize={30} className="flex flex-col bg-card border-r border-white/10 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth custom-scrollbar">
            
            <section>
              <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Mission Briefing</h2>
              <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-foreground prose-a:text-primary max-w-none">
                <p>{mission.description}</p>
                <div className="bg-black/50 p-4 border border-white/10 rounded-lg mt-6 font-mono text-sm whitespace-pre-wrap">
                  {mission.challenge.instructions}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Test Cases</h2>
              <div className="space-y-3">
                {mission.challenge.testCases.map((tc, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded p-3 text-sm font-mono">
                    <div className="text-muted-foreground mb-1">Input:</div>
                    <div className="text-white mb-3">{tc.input}</div>
                    <div className="text-muted-foreground mb-1">Expected Output:</div>
                    <div className="text-primary">{tc.expectedOutput}</div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Tactical Intel</h2>
                <button 
                  onClick={handleHint}
                  disabled={hintMutation.isPending}
                  className="text-xs text-accent hover:text-accent/80 flex items-center gap-1 font-mono disabled:opacity-50"
                  data-testid="button-request-hint"
                >
                  <Lightbulb size={14} /> REQUEST HINT
                </button>
              </div>
              
              {hints.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-4 border border-dashed border-white/10 rounded">
                  No hints requested.
                </div>
              ) : (
                <div className="space-y-3">
                  {hints.map((hint, idx) => (
                    <div key={idx} className="bg-accent/10 border border-accent/20 text-accent-foreground p-3 rounded text-sm font-mono">
                      <span className="text-accent font-bold mr-2">HINT {idx + 1}:</span>
                      {hint}
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </Panel>

        <PanelResizeHandle className="w-2 bg-background hover:bg-white/10 transition-colors flex flex-col justify-center items-center cursor-col-resize z-10 border-x border-white/5">
          <div className="w-0.5 h-8 bg-white/20 rounded-full" />
        </PanelResizeHandle>

        {/* RIGHT PANE: Code Editor & Console */}
        <Panel defaultSize={60} minSize={30} className="flex flex-col bg-[#0d1117] relative">
          
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
              <Terminal size={14} />
              <span>TERMINAL // {mission.challenge.language.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex-1 relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="absolute inset-0 w-full h-full bg-transparent text-gray-300 font-mono text-sm p-4 resize-none focus:outline-none focus:ring-0 leading-relaxed custom-scrollbar"
              spellCheck={false}
              data-testid="textarea-code-editor"
              placeholder="// Write your solution here..."
            />
          </div>

          {/* Console / Output Panel */}
          {submissionResult && (
            <div className={`
              h-64 border-t shrink-0 flex flex-col font-mono text-sm overflow-hidden
              ${submissionResult.success ? 'border-green-500/30 bg-green-950/20' : 'border-destructive/30 bg-destructive/10'}
            `}>
              <div className={`px-4 py-2 border-b font-bold flex items-center gap-2
                ${submissionResult.success ? 'border-green-500/30 text-green-400' : 'border-destructive/30 text-destructive'}
              `}>
                {submissionResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {submissionResult.success ? 'SYSTEM COMPLIANCE ACHIEVED' : 'SYSTEM FAILURE DETECTED'}
                <button onClick={() => setSubmissionResult(null)} className="ml-auto text-muted-foreground hover:text-white">
                  <XCircle size={14} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto whitespace-pre-wrap text-gray-300 flex-1">
                {submissionResult.feedback}
                
                <div className="mt-4 border-t border-white/10 pt-4 flex gap-8">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">TESTS PASSED</div>
                    <div className={`text-lg font-bold ${submissionResult.success ? 'text-green-400' : 'text-destructive'}`}>
                      {submissionResult.testsPassed} / {submissionResult.totalTests}
                    </div>
                  </div>
                  {submissionResult.success && (
                    <>
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">XP EARNED</div>
                        <div className="text-lg font-bold text-primary">+{submissionResult.xpEarned}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">COINS EARNED</div>
                        <div className="text-lg font-bold text-accent">+{submissionResult.coinEarned}</div>
                      </div>
                    </>
                  )}
                </div>

                {submissionResult.leveledUp && (
                  <div className="mt-4 p-3 bg-secondary/20 border border-secondary/50 text-secondary rounded flex items-center justify-center gap-3 animate-pulse">
                    <AlertCircle size={20} />
                    <span className="font-bold tracking-widest">LEVEL UP DETECTED: LEVEL {submissionResult.newLevel}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </Panel>
      </PanelGroup>
    </div>
  );
}
