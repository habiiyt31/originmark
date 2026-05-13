"use client";
import Link from "next/link";
import { fromWeiStr } from "@/lib/genlayer";
import { shortAddr } from "@/lib/utils";
import type { IPRecord } from "@/types";

const MEDIA_ICONS: Record<string, string> = {
  image: "IMG", music: "AUD", text: "TXT", video: "VID", other: "OTH",
};

export function WorkCard({ work, showActions = false }: { work: IPRecord; showActions?: boolean }) {
  return (
    <article className="card-hover p-5 group">
      <div className="flex items-start justify-between mb-4">
        <Link href={`/work/${work.cert_id}`} className="font-mono text-xs text-amber/60 hover:text-amber transition-colors">
          #{String(work.cert_id).padStart(4, "0")}
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-500 bg-ink-700 px-1.5 py-0.5">{MEDIA_ICONS[work.media_type] ?? "OTH"}</span>
          {!work.is_active && <span className="text-xs font-mono bg-rust/15 text-rust border border-rust/30 px-2 py-0.5">revoked</span>}
        </div>
      </div>

      <Link href={`/work/${work.cert_id}`} className="block group/title">
        <h3 className="font-display text-base font-semibold text-ink-100 mb-1 line-clamp-2 leading-snug group-hover/title:text-amber transition-colors">
          {work.title}
        </h3>
      </Link>
      <p className="text-xs text-ink-300 line-clamp-2 mb-4 leading-relaxed">{work.description}</p>

      <div className="divider mb-4" />

      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        <div>
          <p className="text-ink-400 mb-0.5">Creator</p>
          <p className="font-mono text-ink-200">{shortAddr(work.creator)}</p>
        </div>
        <div>
          <p className="text-ink-400 mb-1">Score</p>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-0.5 bg-ink-700">
              <div className="h-full bg-amber" style={{ width: `${work.creativity_score}%` }} />
            </div>
            <span className="font-mono text-amber">{work.creativity_score}</span>
          </div>
        </div>
        <div>
          <p className="text-ink-400 mb-0.5">License</p>
          <p className="font-mono text-ink-200">{fromWeiStr(work.license_fee_wei)} GEN</p>
        </div>
        <div>
          <p className="text-ink-400 mb-0.5">Royalties</p>
          <p className="font-mono text-sage-light">{fromWeiStr(work.total_royalties)} GEN</p>
        </div>
      </div>

      {work.source_url && (
        <a href={work.source_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-ink-400 hover:text-amber transition-colors truncate mb-4">
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="truncate">{work.source_url}</span>
        </a>
      )}

      {showActions && work.is_active && (
        <div className="flex gap-2 mb-3">
          <Link href={`/dispute?cert_id=${work.cert_id}`} className="btn-secondary text-xs px-3 py-2 flex-1 text-center">Dispute</Link>
          <Link href={`/license?cert_id=${work.cert_id}`} className="btn-primary text-xs px-3 py-2 flex-1 text-center">License</Link>
        </div>
      )}

      <Link href={`/work/${work.cert_id}`}
        className="flex items-center justify-center gap-1 text-xs font-mono text-ink-500 hover:text-amber transition-colors w-full py-1">
        View details
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </article>
  );
}