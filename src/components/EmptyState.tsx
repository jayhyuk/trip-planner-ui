interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon = "🗺️", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="text-base font-medium text-slate-800">{title}</p>
      {description && <p className="max-w-xs text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
