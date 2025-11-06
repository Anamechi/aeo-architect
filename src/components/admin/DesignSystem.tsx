import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Premium Card with gradient border
export function PremiumCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative rounded-lg bg-gradient-primary p-[2px] shadow-lg hover:shadow-xl transition-shadow", className)}>
      <div className="bg-card rounded-lg p-6 h-full">
        {children}
      </div>
    </div>
  );
}

// Gradient Button
export function GradientButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "bg-gradient-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold",
        "hover:opacity-90 transition-all shadow-md hover:shadow-lg",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Section Header with gradient text
export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground text-lg">{subtitle}</p>
      )}
    </div>
  );
}

// Stats Card
export function StatsCard({ 
  label, 
  value, 
  icon,
  trend 
}: { 
  label: string; 
  value: string | number; 
  icon?: ReactNode;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <div className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow border border-border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        {icon}
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold">{value}</p>
        {trend && (
          <span className={cn(
            "text-sm font-medium",
            trend.positive ? "text-success" : "text-destructive"
          )}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}

// Content Preview Card
export function ContentPreview({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(
      "bg-gradient-subtle rounded-lg p-8 shadow-xl border border-border",
      "prose prose-lg max-w-none",
      "prose-headings:text-foreground prose-p:text-foreground",
      "prose-a:text-primary hover:prose-a:text-primary-hover",
      "prose-strong:text-foreground prose-code:text-foreground",
      className
    )}>
      {children}
    </div>
  );
}

// Loading Skeleton for content
export function ContentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-3/4"></div>
      <div className="h-4 bg-muted rounded w-full"></div>
      <div className="h-4 bg-muted rounded w-5/6"></div>
      <div className="h-4 bg-muted rounded w-4/5"></div>
      <div className="h-6 bg-muted rounded w-2/3 mt-6"></div>
      <div className="h-4 bg-muted rounded w-full"></div>
      <div className="h-4 bg-muted rounded w-full"></div>
    </div>
  );
}

// Badge with icon
export function IconBadge({ 
  children, 
  icon, 
  variant = 'default' 
}: { 
  children: ReactNode; 
  icon?: ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}) {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-accent text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
      variants[variant]
    )}>
      {icon}
      {children}
    </span>
  );
}
