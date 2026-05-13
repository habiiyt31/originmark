"use client";
import { useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { TxStatus } from "@/components/TxStatus";
import { useWallet } from "@/hooks/useWallet";
import { weiArg, toWei } from "@/lib/genlayer";

const REG_FEE = "0.01";
const MEDIA_TYPES = ["image", "music", "text", "video", "other"] as const;
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "";

const EXAMPLES = [
  {
    title: "Digital Sunrise #001",
    description: "Generative artwork depicting mountain sunrise using procedural color gradients and Perlin noise patterns. Created with p5.js, each render is unique yet consistent in composition.",
    media_type: "image",
    source_url: "https://picsum.photos/seed/sunrise001/800/600",
    license_fee: "0.005",
  },
  {
    title: "Lo-Fi Study Beat Vol.3",
    description: "Original lo-fi hip hop instrumental composed for study and relaxation. Features jazz-sampled chords, vinyl crackle, and a 85bpm drum groove. All sounds recorded and processed by the creator.",
    media_type: "music",
    source_url: "https://freemusicarchive.org",
    license_fee: "0.01",
  },
  {
    title: "The Blockchain Manifesto",
    description: "An original essay exploring the philosophical implications of decentralized trust systems and how trustless computation changes the social contract between individuals and institutions.",
    media_type: "text",
    source_url: "https://example.com",
    license_fee: "0.002",
  },
];

type TxState     = { status: "idle"|"pending"|"success"|"error"; hash?: string; message?: string; result?: string; };
type UploadState = { status: "idle"|"uploading"|"done"|"error"; message?: string; };

export default function RegisterPage() {
  const { address, isConnected, connect, writeContract } = useWallet();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: "", description: "", media_type: "image", source_url: "", license_fee: "0.005" });
  const [tx, setTx]         = useState<TxState>({ status: "idle" });
  const [upload, setUpload] = useState<UploadState>({ status: "idle" });
  const [fileName, setFileName] = useState("");
  const [exampleIdx, setExampleIdx] = useState(0);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const valid = form.title.trim().length >= 3 && form.description.trim().length >= 20 && form.source_url.trim().length > 0;

  function fillExample() {
    const ex = EXAMPLES[exampleIdx % EXAMPLES.length];
    setForm({ title: ex.title, description: ex.description, media_type: ex.media_type, source_url: ex.source_url, license_fee: ex.license_fee });
    setExampleIdx(i => i + 1);
    setFileName(""); setUpload({ status: "idle" });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUpload({ status: "uploading", message: "Uploading to IPFS via Pinata..." });
    try {
      if (!PINATA_JWT) {
        set("source_url", URL.createObjectURL(file));
        setUpload({ status: "done", message: "File loaded locally. Add NEXT_PUBLIC_PINATA_JWT for permanent IPFS URL." });
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      formData.append("network", "public");
      const res = await fetch("https://uploads.pinata.cloud/v3/files", {
        method: "POST",
        headers: { Authorization: `Bearer ${PINATA_JWT}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`Pinata ${res.status}: ${await res.text()}`);
      const data = await res.json();
      const cid  = data?.data?.cid;
      if (!cid) throw new Error("No CID returned");
      const url = `https://ipfs.io/ipfs/${cid}`;
      set("source_url", url);
      setUpload({ status: "done", message: `Uploaded: ${url}` });
    } catch (err: any) {
      setUpload({ status: "error", message: err?.message || "Upload failed" });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !address) { connect(); return; }
    if (!valid) return;
    setTx({ status: "pending", message: "Sending transaction..." });
    try {
      // register_work(title: str, description: str, media_type: str, source_url: str, license_fee: u256) payable
      // args: 4 strings + 1 wei-as-string-digit (u256 wei overflows Number.MAX_SAFE_INTEGER)
      // value: BigInt registration fee
      const { txHash, timedOut } = await writeContract(
        "register_work",
        [
          form.title,
          form.description,
          form.media_type,
          form.source_url,
          weiArg(form.license_fee), // string of digits — NEVER BigInt in args
        ],
        toWei(REG_FEE) // BigInt
      );
      setTx({
        status: timedOut ? "pending" : "success",
        hash: txHash,
        message: timedOut
          ? "Submitted. AI validators are reaching consensus (30-90s). Check explorer for result."
          : "Work registered!",
      });
      if (!timedOut) {
        setForm({ title: "", description: "", media_type: "image", source_url: "", license_fee: "0.005" });
        setFileName(""); setUpload({ status: "idle" });
      }
    } catch (err: any) {
      setTx({ status: "error", message: err?.message || "Transaction failed" });
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 sm:px-6 py-10 max-w-2xl mx-auto w-full">
        <div className="mb-8 animate-fade-up">
          <p className="section-label mb-3">IP Registration</p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink-50 mb-2">Register your work</h1>
              <p className="text-sm text-ink-300">AI judges originality. Fee: <span className="font-mono text-amber">{REG_FEE} GEN</span></p>
            </div>
            <button type="button" onClick={fillExample}
              className="shrink-0 flex items-center gap-1.5 border border-amber/40 text-amber hover:bg-amber/10 px-3 py-2 rounded-sm text-xs font-mono transition-colors mt-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Fill example
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5 animate-fade-up delay-100">
          <div>
            <label className="block text-xs font-mono text-ink-400 mb-2 uppercase tracking-wider">Title *</label>
            <input type="text" className="input-field" placeholder="My Digital Artwork #001"
              value={form.title} onChange={e => set("title", e.target.value)} minLength={3} required />
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-400 mb-2 uppercase tracking-wider">
              Description * <span className="normal-case text-ink-500">(min 20 chars)</span>
            </label>
            <textarea className="input-field min-h-[100px]"
              placeholder="Describe your work -- style, technique, what makes it unique..."
              value={form.description} onChange={e => set("description", e.target.value)} minLength={20} required />
            <p className="mt-1 text-xs text-ink-500 text-right">{form.description.length} chars</p>
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-400 mb-2 uppercase tracking-wider">Media type *</label>
            <select className="input-field" value={form.media_type} onChange={e => set("media_type", e.target.value)}>
              {MEDIA_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-400 mb-2 uppercase tracking-wider">Source file or URL *</label>
            <div onClick={() => fileRef.current?.click()}
              className={`card p-4 mb-3 cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                upload.status === "done"  ? "border-sage/40 bg-sage/5" :
                upload.status === "error" ? "border-rust/40 bg-rust/5" :
                "hover:border-amber/40 hover:bg-ink-700"}`}>
              <input ref={fileRef} type="file" className="hidden"
                accept="image/*,audio/*,video/*,.pdf,.txt,.md,.doc,.docx"
                onChange={handleFileUpload} />
              <div className="w-8 h-8 border border-ink-500 flex items-center justify-center shrink-0">
                {upload.status === "uploading" ? <div className="w-3 h-3 border border-amber border-t-transparent rounded-full animate-spin" />
                 : upload.status === "done"    ? <div className="w-3 h-3 rounded-full bg-sage-light" />
                 : upload.status === "error"   ? <div className="w-3 h-3 rounded-full bg-rust" />
                 : <svg className="w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                   </svg>}
              </div>
              <div className="flex-1 min-w-0">
                {fileName ? (
                  <>
                    <p className="text-sm text-ink-100 truncate">{fileName}</p>
                    {upload.message && <p className={`text-xs mt-0.5 truncate ${upload.status === "error" ? "text-rust" : upload.status === "done" ? "text-sage-light" : "text-amber"}`}>{upload.message}</p>}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-ink-200">Click to upload file</p>
                    <p className="text-xs text-ink-500 mt-0.5">Image, audio, video, PDF, text</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-ink-700" />
              <span className="text-xs text-ink-500">or paste URL</span>
              <div className="flex-1 h-px bg-ink-700" />
            </div>
            <input type="text" className="input-field" placeholder="https://example.com/your-work"
              value={form.source_url}
              onChange={e => { set("source_url", e.target.value); if (e.target.value) { setFileName(""); setUpload({ status: "idle" }); } }} />
            <p className="mt-1 text-xs text-ink-500">GenLayer validators will fetch this URL to verify your work.</p>
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-400 mb-2 uppercase tracking-wider">License fee (GEN)</label>
            <input type="number" step="0.001" min="0" className="input-field"
              value={form.license_fee} onChange={e => set("license_fee", e.target.value)} />
            <p className="mt-1 text-xs text-ink-500">Amount others pay to license your work. 95% goes to you.</p>
          </div>

          <div className="card p-4 flex items-start gap-3">
            <div className="w-1 h-1 rounded-full bg-amber mt-2 shrink-0 animate-pulse" />
            <p className="text-xs text-ink-300 leading-relaxed">
              Fee: <span className="font-mono text-amber">{REG_FEE} GEN</span>. AI validates originality. Takes 30-90 seconds.
            </p>
          </div>

          <button type="submit" className="btn-primary w-full py-3.5 text-base" disabled={tx.status === "pending" || !valid}>
            {tx.status === "pending"
              ? <><div className="w-4 h-4 border border-ink-900 border-t-transparent rounded-full animate-spin" />Processing...</>
              : !isConnected ? "Connect MetaMask to register"
              : <>Register work <span className="font-mono opacity-70">{REG_FEE} GEN</span></>}
          </button>
          <TxStatus {...tx} />
        </form>
      </main>
    </div>
  );
}
