"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { TxStatus } from "@/components/TxStatus";
import { useWallet } from "@/hooks/useWallet";
import { useWork } from "@/hooks/useContract";
import { toWei } from "@/lib/genlayer";

const BOND = "0.05";
type TxState = { status: "idle"|"pending"|"success"|"error"; hash?: string; message?: string; };

function DisputeForm() {
  const params = useSearchParams();
  const { address, isConnected, connect, writeContract } = useWallet();
  const [certId, setCertId]      = useState(params.get("cert_id") || "");
  const [suspectUrl, setSuspect] = useState("");
  const { work, loading } = useWork(certId);
  const [tx, setTx]              = useState<TxState>({ status: "idle" });

  const valid = certId !== "" && !isNaN(Number(certId)) && suspectUrl.trim().length > 0 && work !== null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !address) { connect(); return; }
    if (!valid) return;
    setTx({ status: "pending", message: "Sending dispute transaction..." });
    try {
      // file_dispute(cert_id: u256, suspect_url: str) payable
      // - cert_id: Number, suspect_url: String
      // - value: BigInt bond
      const { txHash, timedOut } = await writeContract(
        "file_dispute",
        [Number(certId), suspectUrl],
        toWei(BOND)
      );
      setTx({
        status: timedOut ? "pending" : "success",
        hash: txHash,
        message: timedOut
          ? "Submitted. AI validators are analysing the URL (60-120s). Check explorer."
          : "Dispute resolved.",
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

      {loading && <div className="card p-4"><div className="skeleton h-4 w-2/3 mb-2" /><div className="skeleton h-3 w-full" /></div>}
      {work && !loading && (
        <div className="card p-4 border-sage/20 animate-fade-in">
          <p className="section-label mb-2 text-sage-light">Original work found</p>
          <p className="font-display text-sm font-semibold text-ink-100 mb-1">{work.title}</p>
          <p className="text-xs text-ink-400 line-clamp-2">{work.description}</p>
        </div>
      )}
      {certId !== "" && !loading && !work && (
        <div className="card p-3 border-rust/20"><p className="text-xs text-rust">No work found with ID {certId}</p></div>
      )}

      <div>
        <label className="block text-xs font-mono text-ink-400 mb-2 uppercase tracking-wider">Suspected infringing URL *</label>
        <input type="url" className="input-field" placeholder="https://example.com/copied-work"
          value={suspectUrl} onChange={e => setSuspect(e.target.value)} required />
        <p className="mt-1 text-xs text-ink-500">GenLayer will fetch and analyse this URL to determine infringement.</p>
      </div>

      <div className="card p-4 space-y-2">
        <p className="section-label">What GenLayer does</p>
        {[
          "Fetch the suspect URL content",
          "LLM compares content against your original work",
          "5 validators independently vote on verdict",
          "Infringement: bond transfers to creator (95%)",
          "Clear: bond returned. Invalid: bond forfeited.",
        ].map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="font-mono text-xs text-amber/50 mt-0.5 shrink-0">{String(i+1).padStart(2,"0")}</span>
            <p className="text-xs text-ink-300">{s}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 flex items-start gap-3">
        <div className="w-1 h-1 rounded-full bg-amber mt-2 shrink-0 animate-pulse" />
        <p className="text-xs text-ink-300 leading-relaxed">
          Bond: <span className="font-mono text-amber">{BOND} GEN</span>. Returned if infringement confirmed. Forfeited if invalid (anti-spam).
        </p>
      </div>

      <button type="submit" className="btn-primary w-full py-3.5 text-base" disabled={tx.status === "pending" || !valid}>
        {tx.status === "pending"
          ? <><div className="w-4 h-4 border border-ink-900 border-t-transparent rounded-full animate-spin" />Analysing...</>
          : !isConnected ? "Connect MetaMask"
          : <>File dispute <span className="font-mono opacity-70">{BOND} GEN bond</span></>}
      </button>
      <TxStatus {...tx} />
    </form>
  );
}

export default function DisputePage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 sm:px-6 py-10 max-w-2xl mx-auto w-full">
        <div className="mb-8 animate-fade-up">
          <p className="section-label mb-3">Infringement Court</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink-50 mb-2">File a dispute</h1>
          <p className="text-sm text-ink-300">Bond <span className="font-mono text-amber">{BOND} GEN</span> -- returned if infringement confirmed.</p>
        </div>
        <Suspense fallback={<div className="skeleton h-96 w-full" />}>
          <DisputeForm />
        </Suspense>
      </main>
    </div>
  );
}
