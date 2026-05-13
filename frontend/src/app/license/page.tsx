"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { TxStatus } from "@/components/TxStatus";
import { useWallet } from "@/hooks/useWallet";
import { useWork } from "@/hooks/useContract";
import { fromWeiStr } from "@/lib/genlayer";

type TxState = { status: "idle"|"pending"|"success"|"error"; hash?: string; message?: string; };

// Coerce contract return (number | string | bigint) → BigInt safely.
function toBigIntSafe(v: number | string | bigint): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "string") return BigInt(v);
  return BigInt(Math.trunc(v));
}

function LicenseForm() {
  const params = useSearchParams();
  const { address, isConnected, connect, writeContract } = useWallet();
  const [certId, setCertId] = useState(params.get("cert_id") || "");
  const { work, loading } = useWork(certId);
  const [tx, setTx] = useState<TxState>({ status: "idle" });

  const valid = certId !== "" && work !== null && work.is_active;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !address) { connect(); return; }
    if (!valid || !work) return;
    setTx({ status: "pending", message: "Sending payment..." });
    try {
      // request_license(cert_id: u256) payable
      // - cert_id: Number (small u256), NEVER BigInt
      // - value: BigInt (license fee dari contract, bisa wei besar)
      const { txHash, timedOut } = await writeContract(
        "request_license",
        [Number(certId)],
        toBigIntSafe(work.license_fee_wei)
      );
      setTx({
        status: timedOut ? "pending" : "success",
        hash: txHash,
        message: timedOut
          ? "Submitted. Waiting for consensus..."
          : "License granted. 95% sent directly to creator.",
      });
    } catch (err: any) {
      setTx({ status: "error", message: err?.message || "Transaction failed" });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 animate-fade-up delay-100">
      <div>
        <label className="block text-xs font-mono text-ink-400 mb-2 uppercase tracking-wider">Certificate ID *</label>
        <input type="number" min="0" className="input-field" placeholder="0"
          value={certId} onChange={e => setCertId(e.target.value)} required />
        <p className="mt-1 text-xs text-ink-500">cert_id starts from 0. Check in My Work.</p>
      </div>

      {loading && <div className="card p-5 space-y-3"><div className="skeleton h-4 w-2/3" /><div className="skeleton h-3 w-full" /></div>}
      {work && !loading && (
        <div className="card p-5 animate-fade-in">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-display text-base font-semibold text-ink-100 mb-1">{work.title}</p>
              <p className="text-xs text-ink-400 uppercase tracking-wide">{work.media_type}</p>
            </div>
            {!work.is_active && <span className="text-xs font-mono bg-rust/15 text-rust border border-rust/30 px-2 py-0.5">revoked</span>}
          </div>
          <p className="text-xs text-ink-300 line-clamp-2 mb-4">{work.description}</p>
          <div className="divider mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-ink-400 mb-1">License fee</p>
              <p className="font-mono text-lg font-medium text-amber">{fromWeiStr(work.license_fee_wei)} GEN</p>
            </div>
            <div>
              <p className="text-xs text-ink-400 mb-1">Creator receives</p>
              <p className="font-mono text-lg font-medium text-sage-light">{fromWeiStr(toBigIntSafe(work.license_fee_wei) * 95n / 100n)} GEN</p>
            </div>
          </div>
        </div>
      )}
      {certId !== "" && !loading && !work && (
        <div className="card p-3 border-rust/20"><p className="text-xs text-rust">No work found with ID {certId}</p></div>
      )}

      <div className="card p-4 flex items-start gap-3">
        <div className="w-1 h-1 rounded-full bg-amber mt-2 shrink-0" />
        <p className="text-xs text-ink-300 leading-relaxed">95% goes directly to creator on-chain. 5% platform fee. No middlemen.</p>
      </div>

      <button type="submit" className="btn-primary w-full py-3.5 text-base" disabled={tx.status === "pending" || !valid}>
        {tx.status === "pending"
          ? <><div className="w-4 h-4 border border-ink-900 border-t-transparent rounded-full animate-spin" />Processing...</>
          : !isConnected ? "Connect MetaMask"
          : work ? <>Pay and license <span className="font-mono opacity-70">{fromWeiStr(work.license_fee_wei)} GEN</span></>
          : "Enter a certificate ID"}
      </button>
      <TxStatus {...tx} />
    </form>
  );
}

export default function LicensePage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 sm:px-6 py-10 max-w-2xl mx-auto w-full">
        <div className="mb-8 animate-fade-up">
          <p className="section-label mb-3">Licensing</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink-50 mb-2">Request a license</h1>
          <p className="text-sm text-ink-300">95% to creator, 5% platform. Instant, on-chain transfer.</p>
        </div>
        <Suspense fallback={<div className="skeleton h-96 w-full" />}>
          <LicenseForm />
        </Suspense>
      </main>
    </div>
  );
}
