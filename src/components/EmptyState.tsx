type Props = {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
};

export default function EmptyState({ icon = "inbox", title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center fade-in">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
        <span className="material-symbols-outlined text-2xl text-gray-400">{icon}</span>
      </div>
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      {description && <p className="mt-1.5 max-w-xs text-sm text-gray-500">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="mt-5 rounded-lg bg-green-700 px-4 py-2 text-xs font-bold text-white hover:bg-green-800 transition-colors">
          {action.label}
        </button>
      )}
    </div>
  );
}
