"use client";
import { shortAddr } from "@/lib/utils";

interface Props {
  hash?: string;
  status: "idle" | "pending" | "success" | "error";
  message?: string;
  result?: string;
}

export function TxStatus({ hash, status, message, result }: Props) {
  if (status === "idle") return null;
  const colors: Record<string, string> = {
    pending: "border-amber/30 bg-amber/5 text-amber",
    success: "border-sage/30 bg-sage/5 text-sage-light",
    error:   "border-rust/30 bg-rust/5 text-rust",
  };
  return (
    <div className={`rounded-sm border p-4 text-sm ${colors[status]}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {status === "pending" && <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />}
          {status === "success" && <div className="w-3 h-3 rounded-full bg-sage-light" />}
          {status === "error"   && <div className="w-3 h-3 rounded-full bg-rust" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium">
            {status === "pending" && "Transaction pending..."}
            {status === "success" && "Transaction confirmed"}
            {status === "error"   && "Transaction failed"}
          </p>
          {message && <p className="text-xs mt-1 opacity-75">{message}</p>}
          {hash && (
            <a href={`https://explorer-studio.genlayer.com/tx/${hash}`} target="_blank" rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-mono opacity-60 hover:opacity-100 transition-opacity">
              {shortAddr(hash, 6, 6)}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
          {result && status === "success" && (
            <details className="mt-2">
              <summary className="text-xs opacity-60 cursor-pointer hover:opacity-100">View result</summary>
              <pre className="mt-2 text-xs font-mono bg-ink-900/50 p-2 rounded-sm overflow-x-auto opacity-80">
                {(() => { try { return JSON.stringify(JSON.parse(result), null, 2); } catch { return result; } })()}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
