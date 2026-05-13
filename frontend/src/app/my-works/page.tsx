"use client";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { WorkCard } from "@/components/WorkCard";
import { TxStatus } from "@/components/TxStatus";
import { useWallet } from "@/hooks/useWallet";
import { useMyWorks } from "@/hooks/useContract";

type TxState = { status: "idle"|"pending"|"success"|"error"; hash?: string; message?: string; };

export default function MyWorksPage() {
  const { address, isConnected, connect, writeContract } = useWallet();
  const { works, loading, refetch } = useMyWorks(address);
  const [revokingId, setRevoking] = useState<number | null>(null);
  const [tx, setTx]               = useState<TxState>({ status: "idle" });

  async function revoke(certId: number) {
    if (!address) return;
    setRevoking(certId);
    setTx({ status: "pending", message: `Revoking work #${certId}...` });
    try {
      // revoke_work(cert_id: u256) — cert_id Number, no value
      const { txHash, timedOut } = await writeContract(
        "revoke_work",
        [Number(certId)]
      );
      setTx({
        status: timedOut ? "pending" : "success",
        hash: txHash,
        message: timedOut
          ? `Revoke submitted. Confirming...`
          : `Work #${certId} revoked.`,
      });
      await refetch();
    } catch (err: any) {
      setTx({ status: "error", message: err?.message || "Failed to revoke" });
    } finally {
      setRevoking(null);
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-12 h-12 border border-ink-600 flex items-center justify-center mx-auto mb-6">
              <div className="w-4 h-4 border border-ink-400" />
            </div>
            <h2 className="font-display text-xl font-semibold text-ink-100 mb-2">Connect your wallet</h2>
            <p className="text-sm text-ink-400 mb-6">Connect MetaMask to view your registered works.</p>
            <button onClick={connect} className="btn-primary">Connect MetaMask</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 sm:px-6 py-10 max-w-6xl mx-auto w-full">
        <div className="flex items-end justify-between mb-8 gap-4 animate-fade-up">
          <div>
            <p className="section-label mb-2">Your portfolio</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink-50">My Works</h1>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-medium text-amber">{works.length}</p>
            <p className="text-xs text-ink-400">registered</p>
          </div>
        </div>

        {tx.status !== "idle" && <div className="mb-6"><TxStatus {...tx} /></div>}

        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="card p-5 space-y-3">
                <div className="skeleton h-3 w-12" /><div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-3 w-full" /><div className="skeleton h-3 w-2/3" />
              </div>
            ))}
          </div>
        )}

        {!loading && works.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {works.map(work => (
              <div key={work.cert_id} className="relative group">
                <WorkCard work={work} showActions />
                {work.is_active && (
                  <button onClick={() => revoke(work.cert_id)} disabled={revokingId === work.cert_id}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono text-rust hover:underline px-2 py-1">
                    {revokingId === work.cert_id ? "..." : "revoke"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && works.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 border border-dashed border-ink-600 flex items-center justify-center mx-auto mb-6">
              <div className="w-5 h-5 border border-ink-500" />
            </div>
            <h3 className="font-display text-lg text-ink-100 mb-2">No works yet</h3>
            <p className="text-sm text-ink-400 mb-6">Register your first creative work to see it here.</p>
            <a href="/register" className="btn-primary">Register a work</a>
          </div>
        )}
      </main>
    </div>
  );
}
