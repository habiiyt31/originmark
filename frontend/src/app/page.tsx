"use client";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { StatsBar } from "@/components/StatsBar";

export default function HomePage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative px-4 sm:px-6 pt-20 sm:pt-28 pb-20 sm:pb-32 max-w-6xl mx-auto">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
            backgroundImage: "linear-gradient(#C8912A 1px,transparent 1px),linear-gradient(90deg,#C8912A 1px,transparent 1px)",
            backgroundSize: "80px 80px"
          }} />
          <div className="relative">
            <p className="section-label mb-6 animate-fade-in">On-chain intellectual property</p>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-ink-50 leading-[1.05] mb-6 animate-fade-up delay-100">
              Your creative work,<br />
              <span className="text-amber italic">protected by AI.</span>
            </h1>
            <p className="text-ink-300 text-base sm:text-lg max-w-xl leading-relaxed mb-10 animate-fade-up delay-200">
              Register IP on GenLayer. When someone plagiarises your work, our on-chain AI court
              fetches the evidence, judges the case, and transfers the settlement automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-up delay-300">
              <Link href="/register" className="btn-primary text-base px-8 py-3.5">Register a work</Link>
              <Link href="/dispute"  className="btn-secondary text-base px-8 py-3.5">File a dispute</Link>
            </div>
          </div>
        </section>

        <StatsBar />

        <section className="px-4 sm:px-6 py-20 sm:py-28 max-w-6xl mx-auto">
          <p className="section-label mb-10">How it works</p>
          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
            {[
              { num: "01", title: "Register your work", body: "Upload your file or paste a URL. Pay 0.01 GEN. AI validators judge originality via Optimistic Democracy." },
              { num: "02", title: "File a dispute",     body: "Found a copy? Submit the URL. GenLayer fetches the page, AI validators vote on infringement." },
              { num: "03", title: "Auto settlement",    body: "Infringement confirmed: bond transfers to creator instantly. No lawyers, enforced by smart contract." },
            ].map((step, i) => (
              <div key={step.num} className="animate-fade-up" style={{ animationDelay: `${i * 120}ms` }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-xs text-amber/50">{step.num}</span>
                  <div className="flex-1 h-px bg-amber/20" />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink-100 mb-2">{step.title}</h3>
                <p className="text-sm text-ink-300 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 sm:px-6 pb-20 sm:pb-28 max-w-6xl mx-auto">
          <div className="border border-ink-600 rounded-sm p-8 sm:p-12 bg-gradient-to-br from-ink-800 to-ink-900 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5 pointer-events-none"
              style={{ background: "radial-gradient(circle, #C8912A 0%, transparent 70%)" }} />
            <p className="section-label mb-4">Powered by GenLayer</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink-50 mb-4 max-w-md">
              The first IP registry that can read the internet.
            </h2>
            <p className="text-sm text-ink-300 max-w-md mb-8 leading-relaxed">
              GenLayer Intelligent Contracts fetch URLs, analyse content, and reach
              consensus through AI validators, making real-world IP enforcement possible on-chain.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="btn-primary">Start registering</Link>
              <a href="https://docs.genlayer.com" target="_blank" rel="noopener noreferrer" className="btn-secondary">Read the docs</a>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-ink-700 py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-500">
          <p className="font-display italic">OriginMark</p>
          <p className="font-mono">Built on GenLayer Studionet</p>
        </div>
      </footer>
    </div>
  );
}
