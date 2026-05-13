"use client";
import { useStats } from "@/hooks/useContract";
import { fromWeiStr } from "@/lib/genlayer";

export function StatsBar() {
  const { stats, loading } = useStats();

  if (loading) {
    return (
      <section className="border-y border-ink-700 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-ink-700">
            {[1,2,3,4].map(i => (
              <div key={i} className="sm:px-8 first:pl-0 last:pr-0">
                <div className="skeleton h-8 w-16 mb-2" /><div className="skeleton h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!stats) return null;

  const items = [
    { label: "Works registered",  value: String(stats.total_works) },
    { label: "Disputes resolved", value: String(stats.total_disputes) },
    { label: "Registration fee",  value: `${fromWeiStr(stats.reg_fee_wei, 2)} GEN` },
    { label: "Platform fee",      value: `${stats.platform_fee_pct}%` },
  ];

  return (
    <section className="border-y border-ink-700 py-8 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-ink-700">
          {items.map(s => (
            <div key={s.label} className="sm:px-8 first:pl-0 last:pr-0">
              <p className="font-mono text-2xl sm:text-3xl font-medium text-amber mb-1">{s.value}</p>
              <p className="text-xs text-ink-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
