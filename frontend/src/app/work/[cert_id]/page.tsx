"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useWork, useDisputesForWork } from "@/hooks/useContract";
import { fromWeiStr } from "@/lib/genlayer";
import { shortAddr as _s } from "@/lib/utils";

const VERDICT_STYLE: Record<string, string> = {
  infringement: "text-rust border-rust/30 bg-rust/5",
  clear:        "text-sage-light border-sage/30 bg-sage/5",
  invalid:      "text-ink-400 border-ink-600 bg-ink-800",
};

export default function WorkDetailPage({ params }: { params: { cert_id: string } }) {
  const { cert_id } = params;
  const { work, loading: workLoading } = useWork(cert_id);
  const { disputes, loading: disputeLoading } = useDisputesForWork(work ? Number(work.cert_id) : null);

  const score = work ? Number(work.creativity_score) : 0;
  const scoreColor = score >= 80 ? "text-sage-light" : score >= 50 ? "text-amber" : "text-rust";

  // ─── Loading ─────────────────────────────────────────────
  if (workLoading) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Navbar />
        <main className="flex-1 px-4 sm:px-6 py-10 max-w-4xl mx-auto w-full">
          <div className="space-y-4">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-8 w-2/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-40 w-full mt-6" />
          </div>
        </main>
      </div>
    );
  }

  // ─── Not found ───────────────────────────────────────────
  if (!work) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="font-mono text-4xl text-ink-600 mb-4">#{cert_id.padStart(4, "0")}</p>
            <h2 className="font-display text-xl text-ink-100 mb-2">Work not found</h2>
            <p className="text-sm text-ink-400 mb-6">This certificate ID doesn't exist yet.</p>
            <Link href="/explore" className="btn-secondary">Browse registry</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 sm:px-6 py-10 max-w-4xl mx-auto w-full">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-ink-500 mb-8 animate-fade-up">
          <Link href="/explore" className="hover:text-amber transition-colors">Explore</Link>
          <span>/</span>
          <span className="text-ink-300">#{String(work.cert_id).padStart(4, "0")}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left: Main info ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-5 animate-fade-up">

            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-xs text-amber/60">
                  #{String(work.cert_id).padStart(4, "0")}
                </span>
                <span className="font-mono text-xs text-ink-500 bg-ink-700 px-1.5 py-0.5 uppercase">
                  {work.media_type}
                </span>
                {!work.is_active && (
                  <span className="text-xs font-mono bg-rust/15 text-rust border border-rust/30 px-2 py-0.5">
                    revoked
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-50 leading-snug mb-3">
                {work.title}
              </h1>
              <p className="text-sm text-ink-300 leading-relaxed">{work.description}</p>
            </div>

            {/* Source */}
            {work.source_url && (
              <div className="card p-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-ink-500 mb-2">Source</p>
                <a href={work.source_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-amber hover:underline break-all">
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {work.source_url}
                </a>
              </div>
            )}

            {/* Dispute History */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-mono uppercase tracking-wider text-ink-400">
                  Dispute history
                  {disputes.length > 0 && (
                    <span className="ml-2 font-mono text-ink-500">({disputes.length})</span>
                  )}
                </p>
                {work.is_active && (
                  <Link href={`/dispute?cert_id=${work.cert_id}`}
                    className="text-xs font-mono text-amber hover:underline">
                    + File dispute
                  </Link>
                )}
              </div>

              {disputeLoading && (
                <div className="space-y-2">
                  {[1,2].map(i => <div key={i} className="skeleton h-16 w-full" />)}
                </div>
              )}

              {!disputeLoading && disputes.length === 0 && (
                <div className="border border-dashed border-ink-700 p-6 text-center">
                  <p className="text-xs text-ink-500">No disputes filed yet.</p>
                </div>
              )}

              {!disputeLoading && disputes.length > 0 && (
                <div className="space-y-3">
                  {disputes.map(d => (
                    <div key={Number(d.dispute_id)} className="card p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-[10px] font-mono text-ink-500 mb-1">
                            Dispute #{String(d.dispute_id).padStart(4, "0")}
                          </p>
                          <a href={d.suspect_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-ink-300 hover:text-amber transition-colors break-all line-clamp-1">
                            {d.suspect_url}
                          </a>
                        </div>
                        <span className={`shrink-0 text-[10px] font-mono uppercase px-2 py-1 border ${VERDICT_STYLE[d.verdict] ?? VERDICT_STYLE.invalid}`}>
                          {d.verdict}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-ink-500 mb-0.5">Confidence</p>
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-0.5 bg-ink-700">
                              <div className="h-full bg-amber/60" style={{ width: `${d.confidence}%` }} />
                            </div>
                            <span className="font-mono text-ink-300">{d.confidence}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-ink-500 mb-0.5">Filed by</p>
                          <p className="font-mono text-ink-300">{_s(d.claimant)}</p>
                        </div>
                      </div>
                      {d.reasoning && (
                        <p className="mt-3 text-xs text-ink-400 leading-relaxed border-t border-ink-700 pt-3 italic">
                          "{d.reasoning}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Stats + Actions ───────────────────── */}
          <div className="space-y-4 animate-fade-up delay-100">

            {/* Score card */}
            <div className="card p-5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-ink-500 mb-3">AI Originality Score</p>
              <p className={`font-display text-5xl font-bold leading-none mb-3 ${scoreColor}`}>
                {score}
              </p>
              <div className="h-1 bg-ink-700 overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-amber to-amber-light"
                  style={{ width: `${score}%` }} />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-ink-600">
                <span>derivative</span>
                <span>original</span>
                <span>exceptional</span>
              </div>
            </div>

            {/* Details */}
            <div className="card p-5 space-y-4">
              <p className="text-[10px] font-mono uppercase tracking-wider text-ink-500">Details</p>
              {[
                { label: "Creator",    value: _s(work.creator),                    mono: true },
                { label: "License fee", value: `${fromWeiStr(work.license_fee_wei)} GEN`, mono: true },
                { label: "Royalties",  value: `${fromWeiStr(work.total_royalties)} GEN`, mono: true, accent: "text-sage-light" },
                { label: "Status",     value: work.is_active ? "active" : "revoked", mono: true, accent: work.is_active ? "text-sage-light" : "text-rust" },
                { label: "Disputes",   value: String(disputes.length),             mono: true },
              ].map(row => (
                <div key={row.label}>
                  <p className="text-[10px] text-ink-500 mb-0.5">{row.label}</p>
                  <p className={`text-xs ${row.mono ? "font-mono" : ""} ${row.accent ?? "text-ink-200"}`}>
                    {row.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Actions */}
            {work.is_active && (
              <div className="space-y-2">
                <Link href={`/license?cert_id=${work.cert_id}`} className="btn-primary w-full text-center text-sm py-3">
                  Get license
                </Link>
                <Link href={`/dispute?cert_id=${work.cert_id}`} className="btn-secondary w-full text-center text-sm py-3">
                  File dispute
                </Link>
              </div>
            )}

            {/* Back */}
            <Link href="/explore" className="flex items-center gap-1 text-xs font-mono text-ink-500 hover:text-amber transition-colors">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to explore
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}