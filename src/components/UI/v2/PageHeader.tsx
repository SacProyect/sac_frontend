import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * PageHeader - Header de página reutilizable para V2
 */
export function PageHeader({ title, description, action, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
      <div>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        {description && <p className="text-slate-400 mt-2">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
