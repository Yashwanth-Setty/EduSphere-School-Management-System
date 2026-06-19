interface KpiCardProps {
  label: string;
  value: string | number;
  trend: { value: number; label: string } | null;
  icon: string;
}

export function KpiCard({ label, value, trend, icon }: KpiCardProps) {
  return (
    <div className="bg-white rounded-lg border border-border p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-semibold text-text-900 mt-1">{value}</p>
          {trend && (
            <p
              className={`text-xs mt-1 ${trend.value >= 0 ? "text-success" : "text-danger"}`}
              aria-label={`${trend.value >= 0 ? "Up" : "Down"} ${Math.abs(trend.value)}% ${trend.label}`}
            >
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <span className="text-2xl" aria-hidden="true">{icon}</span>
      </div>
    </div>
  );
}
