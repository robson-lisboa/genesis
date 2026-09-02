import React, { useState } from 'react';
import { useGetSkillTree, useUnlockSkill } from '@workspace/api-client-react';
import { RpgPanel } from '@/components/ui/rpg-ui';
import { Network, Lock, Unlock, Zap, BrainCircuit, Code, Database, Server } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SkillTree() {
  const { data: skills, isLoading } = useGetSkillTree();
  const unlockMutation = useUnlockSkill();
  const { toast } = useToast();

  if (isLoading || !skills) {
    return <div className="p-8 text-center text-primary font-mono animate-pulse">CALCULATING NEURAL PATHWAYS...</div>;
  }

  // Group by tier
  const tiers = Array.from(new Set(skills.map(s => s.tier || 1))).sort((a, b) => a - b);
  
  const handleUnlock = (skillId: number) => {
    unlockMutation.mutate({ skillId }, {
      onSuccess: () => {
        toast({
          title: "NEURAL NODE UNLOCKED",
          description: "New capabilities integrated.",
          className: "border-primary text-primary font-mono",
        });
      },
      onError: () => {
        toast({
          title: "ACCESS DENIED",
          description: "Insufficient XP or missing prerequisites.",
          variant: "destructive",
          className: "font-mono",
        });
      }
    });
  };

  const getIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'logic': return <BrainCircuit size={24} />;
      case 'frontend': return <Code size={24} />;
      case 'backend': return <Server size={24} />;
      case 'database': return <Database size={24} />;
      default: return <Zap size={24} />;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-mono tracking-widest text-secondary drop-shadow-[0_0_10px_rgba(217,70,239,0.5)] uppercase">
          Neural Skill Tree
        </h1>
        <p className="text-muted-foreground mt-2">Spend XP to unlock new abilities and permanent stat boosts.</p>
      </div>

      <div className="flex-1 relative overflow-auto bg-black/50 border border-white/5 rounded-xl p-8 md:p-16 custom-scrollbar">
        {/* Ambient background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,70,239,0.1)_0%,transparent_70%)] pointer-events-none" />

        <div className="flex flex-col items-center gap-16 md:gap-24 relative z-10 min-w-max mx-auto">
          {tiers.map(tier => {
            const tierSkills = skills.filter(s => (s.tier || 1) === tier);
            return (
              <div key={tier} className="relative w-full flex flex-col items-center">
                <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-white/10 font-mono text-6xl font-black pointer-events-none select-none">
                  T{tier}
                </div>
                
                <div className="flex justify-center gap-12 md:gap-24 relative">
                  {tierSkills.map(skill => {
                    const isUnlockable = !skill.isUnlocked && skill.prerequisites.every(preId => 
                      skills.find(s => s.id === preId)?.isUnlocked
                    );

                    return (
                      <div key={skill.id} className="relative group flex flex-col items-center w-48">
                        {/* Connecting lines conceptually (SVG approach requires absolute coords, simplify by visual stack) */}
                        <button
                          onClick={() => isUnlockable && handleUnlock(skill.id)}
                          disabled={!isUnlockable && !skill.isUnlocked}
                          className={`
                            relative w-20 h-20 rotate-45 border-2 flex items-center justify-center transition-all duration-300
                            ${skill.isUnlocked 
                              ? 'bg-secondary/20 border-secondary drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]' 
                              : isUnlockable
                                ? 'bg-primary/10 border-primary/50 hover:bg-primary/20 hover:border-primary hover:scale-110 cursor-pointer'
                                : 'bg-black/80 border-white/10 grayscale cursor-not-allowed opacity-50'}
                          `}
                          data-testid={`skill-node-${skill.id}`}
                        >
                          <div className="-rotate-45 relative z-10">
                            {skill.isUnlocked ? (
                              <span className="text-secondary">{getIcon(skill.category)}</span>
                            ) : isUnlockable ? (
                              <Unlock size={24} className="text-primary" />
                            ) : (
                              <Lock size={24} className="text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        <div className="mt-6 text-center">
                          <h3 className={`font-bold font-mono text-sm tracking-wider mb-1 ${skill.isUnlocked ? 'text-secondary' : 'text-gray-300'}`}>
                            {skill.name}
                          </h3>
                          <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{skill.description}</div>
                          {!skill.isUnlocked && (
                            <span className="text-xs font-mono px-2 py-1 rounded bg-black/50 border border-white/10 text-primary">
                              COST: {skill.xpCost} XP
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
