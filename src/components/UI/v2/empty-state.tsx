interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, message, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      {icon && <div className="mb-4">{icon}</div>}
      <p className="text-slate-400 font-semibold mb-1">{title}</p>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
