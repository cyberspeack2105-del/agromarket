type Props = {
  label: string;
  value: string;
  sub?: string;
  trend?: { value: string; up: boolean };
  icon?: string;
  accent?: boolean;
};

export default function StatCard({ label, value, sub, trend, icon, accent }: Props) {
  return (
    <div className={`stat-card fade-in ${accent ? "border-green-200 shadow-[0_4px_12px_rgba(21,128,61,0.06)]" : ""}`}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">
          {label}
        </span>
        {icon && (
          <span
            className={`material-symbols-outlined text-lg ${accent ? "text-green-700" : "text-[#6B7280]"}`}
            style={accent ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            {icon}
          </span>
        )}
      </div>

      <p className="mt-3 font-[var(--font-poppins)] text-2xl font-semibold text-gray-900">
        {value}
      </p>

      {sub && <p className="mt-0.5 text-xs text-[#6B7280]">{sub}</p>}

      {trend && (
        <div
          className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${
            trend.up ? "text-green-700" : "text-[#F85149]"
          }`}
        >
          <span className="material-symbols-outlined text-sm">
            {trend.up ? "trending_up" : "trending_down"}
          </span>
          {trend.value}
        </div>
      )}
    </div>
  );
}
