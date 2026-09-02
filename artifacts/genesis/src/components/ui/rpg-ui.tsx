import React from 'react';

interface RpgPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'danger';
}

export function RpgPanel({ children, title, variant = 'default', className = '', ...props }: RpgPanelProps) {
  const borderColors = {
    default: 'border-white/10',
    primary: 'border-primary/50',
    secondary: 'border-secondary/50',
    danger: 'border-destructive/50',
  };

  const cornerColors = {
    default: 'border-white/20',
    primary: 'border-primary',
    secondary: 'border-secondary',
    danger: 'border-destructive',
  };

  return (
    <div 
      className={`relative bg-black/40 backdrop-blur-md border ${borderColors[variant]} p-6 ${className}`}
      {...props}
    >
      {/* Decorative corners */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-left-2 ${cornerColors[variant]}`} style={{ borderLeftStyle: 'solid' }} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-right-2 ${cornerColors[variant]}`} style={{ borderRightStyle: 'solid' }} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-left-2 ${cornerColors[variant]}`} style={{ borderLeftStyle: 'solid' }} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-right-2 ${cornerColors[variant]}`} style={{ borderRightStyle: 'solid' }} />

      {title && (
        <div className="absolute -top-3 left-4 bg-background px-2 text-xs font-mono font-bold tracking-widest uppercase text-muted-foreground">
          {title}
        </div>
      )}

      {children}
    </div>
  );
}

interface HexagonProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  image?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Hexagon({ children, image, size = 'md', className = '', ...props }: HexagonProps) {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  return (
    <div 
      className={`relative hex-clip bg-muted flex items-center justify-center ${sizes[size]} ${className}`}
      {...props}
    >
      {image ? (
        <img src={image} alt="hex" className="w-full h-full object-cover" />
      ) : children}
      <div className="absolute inset-0 border-2 border-white/20 hex-clip pointer-events-none" />
    </div>
  );
}

export function ProgressBar({ value, max = 100, color = 'bg-primary', className = '' }: { value: number, max?: number, color?: string, className?: string }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className={`h-2 bg-black/50 rounded-full overflow-hidden border border-white/10 ${className}`}>
      <div 
        className={`h-full ${color} transition-all duration-500 ease-out`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
