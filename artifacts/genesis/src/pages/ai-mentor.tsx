import React, { useState, useRef, useEffect } from 'react';
import { useGetAiChatHistory, useSendAiMessage } from '@workspace/api-client-react';
import { RpgPanel } from '@/components/ui/rpg-ui';
import { Send, Bot, User, Cpu, Sparkles, Terminal } from 'lucide-react';

type Mode = 'mentor' | 'debugger' | 'professor';

export default function AiMentor() {
  const { data: history, isLoading } = useGetAiChatHistory();
  const sendMutation = useSendAiMessage();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('mentor');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Optimistic UI state
  const [localMessages, setLocalMessages] = useState<any[]>([]);

  useEffect(() => {
    if (history && localMessages.length === 0) {
      setLocalMessages(history);
    }
  }, [history]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMutation.isPending) return;

    const messageText = input;
    setInput('');

    // Optimistic append
    const tempId = Date.now();
    setLocalMessages(prev => [...prev, { id: tempId, role: 'user', message: messageText, createdAt: new Date().toISOString() }]);

    sendMutation.mutate({
      data: { message: messageText, mode }
    }, {
      onSuccess: (res) => {
        setLocalMessages(prev => prev.filter(m => m.id !== tempId).concat([
          { id: tempId, role: 'user', message: messageText, createdAt: new Date().toISOString() },
          res
        ]));
      },
      onError: () => {
        setLocalMessages(prev => prev.filter(m => m.id !== tempId));
      }
    });
  };

  const getModeConfig = (m: Mode) => {
    switch (m) {
      case 'mentor': return { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', icon: Bot, label: 'Mentor AI' };
      case 'debugger': return { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', icon: Terminal, label: 'Debug Protocol' };
      case 'professor': return { color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/30', icon: Sparkles, label: 'Professor Core' };
    }
  };

  const currentMode = getModeConfig(mode);
  const ModeIcon = currentMode.icon;

  return (
    <div className="h-full flex flex-col md:flex-row bg-background">
      
      {/* Sidebar: Mode Selection */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-card/50 p-4 shrink-0 flex flex-col">
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">AI Personas</h2>
        <div className="space-y-2">
          {(['mentor', 'debugger', 'professor'] as Mode[]).map((m) => {
            const config = getModeConfig(m);
            const Icon = config.icon;
            const isActive = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                  ${isActive ? `${config.bg} ${config.border} ${config.color}` : 'border-transparent hover:bg-white/5 text-gray-400'}
                `}
                data-testid={`mode-select-${m}`}
              >
                <Icon size={18} />
                <span className="font-mono text-sm tracking-wide">{config.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="mt-auto hidden md:block pt-8">
          <div className="p-4 border border-white/10 bg-black/40 rounded text-xs text-muted-foreground font-mono leading-relaxed">
            SYSTEM NOTE: The AI Mentor has complete access to your skill tree and mission history. Ask for guidance, code reviews, or architectural advice.
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-0" />
        
        {/* Header */}
        <div className="h-16 border-b border-white/10 flex items-center px-6 relative z-10 shrink-0 bg-black/40">
          <div className={`flex items-center gap-3 ${currentMode.color}`}>
            <ModeIcon size={24} />
            <span className="font-bold font-mono tracking-widest uppercase">{currentMode.label} Online</span>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative z-10 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center text-primary font-mono animate-pulse">ESTABLISHING UPLINK...</div>
          ) : localMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground font-mono">
              CONNECTION ESTABLISHED. WAITING FOR INPUT.
            </div>
          ) : (
            localMessages.map((msg, i) => {
              const isAi = msg.role === 'assistant';
              return (
                <div key={msg.id || i} className={`flex gap-4 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center border ${
                    isAi ? `bg-black/50 ${currentMode.color} ${currentMode.border}` : 'bg-primary/20 text-primary border-primary/50'
                  }`}>
                    {isAi ? <Cpu size={16} /> : <User size={16} />}
                  </div>
                  <div className={`max-w-[80%] rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed ${
                    isAi ? 'bg-card border border-white/10 text-gray-300' : 'bg-primary/10 border border-primary/20 text-primary-foreground'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          {sendMutation.isPending && (
            <div className="flex gap-4">
               <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center border bg-black/50 ${currentMode.color} ${currentMode.border}`}>
                  <Cpu size={16} className="animate-pulse" />
               </div>
               <div className="bg-card border border-white/10 rounded-lg p-4 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                 <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-75" />
                 <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-150" />
               </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-black/60 border-t border-white/10 relative z-10 shrink-0">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Send message to ${currentMode.label}...`}
              className="w-full bg-white/5 border border-white/20 rounded-full py-4 pl-6 pr-16 text-sm text-foreground focus:outline-none focus:border-primary focus:bg-white/10 transition-all font-mono"
              disabled={sendMutation.isPending}
              data-testid="input-chat-message"
            />
            <button
              type="submit"
              disabled={!input.trim() || sendMutation.isPending}
              className="absolute right-2 p-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors"
              data-testid="button-send-message"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
