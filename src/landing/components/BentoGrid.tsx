import { cn } from '@/lib/utils';

interface BentoCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  delay?: number;
  span?: 'col-span-1' | 'col-span-2' | 'row-span-1' | 'row-span-2';
}

export function BentoCard({
  title,
  description,
  icon,
  className,
  delay = 0,
  span = 'col-span-1'
}: BentoCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-slate-200/50 bg-white p-8 transition-all duration-500 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:shadow-none',
        span,
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:from-slate-800/50 dark:to-transparent" />
      
      <div className="relative z-10">
        <div className="mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 transition-transform duration-300 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-purple-500 group-hover:text-white dark:from-slate-800 dark:to-slate-700 dark:text-slate-300">
          {icon}
        </div>
        
        <h3 className="mb-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h3>
        
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </div>

      <div className="absolute bottom-0 right-0 size-32 translate-x-8 translate-y-8 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  );
}

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {children}
    </div>
  );
}
