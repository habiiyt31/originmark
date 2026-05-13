"use client";
import { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { WorkCard } from "@/components/WorkCard";
import { useAllWorks } from "@/hooks/useContract";
import type { IPRecord } from "@/types";

const MEDIA_FILTERS = ["all", "image", "music", "text", "video", "other"] as const;
type MediaFilter = typeof MEDIA_FILTERS[number];
type SortKey = "newest" | "oldest" | "score" | "license";

export default function ExplorePage() {
  const { works, loading, error, refetch } = useAllWorks();
  const [query, setQuery]       = useState("");
  const [media, setMedia]       = useState<MediaFilter>("all");
  const [sort, setSort]         = useState<SortKey>("newest");
  const [showRevoked, setShowR] = useState(false);

  const filtered = useMemo(() => {
    let xs: IPRecord[] = [...works];
    if (!showRevoked) xs = xs.filter(w => w.is_active);
    if (media !== "all") xs = xs.filter(w => w.media_type === media);
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      xs = xs.filter(w =>
        w.title.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        String(w.cert_id).includes(q)
      );
    }
    xs.sort((a, b) => {
      switch (sort) {
        case "newest":  return Number(b.cert_id) - Number(a.cert_id);
        case "oldest":  return Number(a.cert_id) - Number(b.cert_id);
        case "score":   return Number(b.creativity_score) - Number(a.creativity_score);
        case "license": return Number(b.license_fee_wei) - Number(a.license_fee_wei);
      }
    });
    return xs;
  }, [works, query, media, sort, showRevoked]);

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 sm:px-6 py-10 max-w-6xl mx-auto w-full">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 animate-fade-up">
          <div>
            <p className="section-label mb-2">Public registry</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink-50">Explore works</h1>
            <p className="text-sm text-ink-400 mt-2">
              Every work registered on OriginMark. AI-verified originality, on-chain provenance.
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-medium text-amber">{works.length}</p>
            <p className="text-xs text-ink-400">total registered</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-3 animate-fade-up delay-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              className="input-field flex-1"
              placeholder="Search by title, description, or cert ID..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <select
              className="input-field sm:w-40"
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="score">Highest score</option>
              <option value="license">Highest license</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {MEDIA_FILTERS.map(m => (
              <button
                key={m}
                onClick={() => setMedia(m)}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm border transition-all ${
                  media === m
                    ? "border-amber text-amber bg-amber/10"
                    : "border-ink-600 text-ink-400 hover:border-ink-500 hover:text-ink-200"
                }`}
              >
                {m}
              </button>
            ))}
            <div className="flex-1" />
            <label className="flex items-center gap-2 text-xs text-ink-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showRevoked}
                onChange={e => setShowR(e.target.checked)}
                className="w-3.5 h-3.5 accent-amber"
              />
              show revoked
            </label>
            <button
              onClick={refetch}
              className="text-xs font-mono text-ink-400 hover:text-amber transition-colors px-2 py-1"
              title="Refresh"
            >
              ↻ refresh
            </button>
          </div>
        </div>

        {/* Content states */}
        {error && (
          <div className="border border-rust/30 bg-rust/5 text-rust p-4 rounded-sm text-sm mb-6">
            Failed to load works: {error}
          </div>
        )}

        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card p-5 space-y-3">
                <div className="skeleton h-3 w-12" />
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-2/3" />
                <div className="skeleton h-px w-full my-2" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="skeleton h-8 w-full" />
                  <div className="skeleton h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up delay-200">
            {filtered.map(work => (
              <WorkCard key={Number(work.cert_id)} work={work} showActions />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && works.length > 0 && (
          <div className="text-center py-20">
            <div className="w-12 h-12 border border-dashed border-ink-600 flex items-center justify-center mx-auto mb-4">
              <div className="w-4 h-4 border border-ink-500" />
            </div>
            <p className="text-sm text-ink-400">No works match your filters.</p>
            <button
              onClick={() => { setQuery(""); setMedia("all"); setShowR(false); }}
              className="mt-3 text-xs font-mono text-amber hover:underline"
            >
              clear filters
            </button>
          </div>
        )}

        {!loading && works.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="w-16 h-16 border border-dashed border-ink-600 flex items-center justify-center mx-auto mb-6">
              <div className="w-5 h-5 border border-ink-500" />
            </div>
            <h3 className="font-display text-lg text-ink-100 mb-2">No works yet</h3>
            <p className="text-sm text-ink-400 mb-6">Be the first to register a creative work.</p>
            <a href="/register" className="btn-primary">Register a work</a>
          </div>
        )}
      </main>
    </div>
  );
}
