import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Terminal, Map, Medal, Trophy, Network, 
  User, Bot, Zap, Menu, X
} from 'lucide-react';
import { useGetProfile } from '@workspace/api-client-react';

const NAV_ITEMS = [
  { href: '/', icon: Terminal, label: 'Command Center' },
  { href: '/world', icon: Map, label: 'World Map' },
  { href: '/daily-challenge', icon: Zap, label: 'Daily Challenge' },
  { href: '/skills', icon: Network, label: 'Skill Tree' },
  { href: '/achievements', icon: Trophy, label: 'Achievements' },
  { href: '/leaderboard', icon: Medal, label: 'Leaderboard' },
  { href: '/ai-mentor', icon: Bot, label: 'AI Mentor' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function Sidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-white/10 rounded text-primary"
        data-testid="button-mobile-menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-40 h-dvh w-64
        bg-card/90 backdrop-blur-xl border-r border-white/10
        flex flex-col transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-wider uppercase glow-text">
            <Terminal size={24} className="text-primary" />
            <span>Gênesis</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || 
                            (item.href !== '/' && location.startsWith(item.href));
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 group
                  ${isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20 glow-box' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}
                `}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <item.icon size={20} className={isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'} />
                <span className={`font-medium ${isActive ? 'glow-text' : ''}`}>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-muted-foreground text-center font-mono opacity-50">
            v1.0.0-beta // ONLINE
          </div>
        </div>
      </aside>
      
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
