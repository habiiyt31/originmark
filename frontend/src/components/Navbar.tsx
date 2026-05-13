"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "./WalletButton";
import { NetworkBanner } from "./NetworkBanner";
import { useState } from "react";

const LINKS = [
  { href: "/explore",  label: "Explore"  },
  { href: "/register", label: "Register" },
  { href: "/dispute",  label: "Dispute"  },
  { href: "/license",  label: "License"  },
  { href: "/my-works", label: "My Works" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-ink-700 bg-ink-900/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-6 h-6 border border-amber flex items-center justify-center group-hover:bg-amber/10 transition-colors">
              <div className="w-2 h-2 bg-amber" />
            </div>
            <span className="font-display text-base sm:text-lg font-semibold text-ink-100 tracking-tight">OriginMark</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {LINKS.map(l => (
              <Link key={l.href} href={l.href}
                className={`px-3 py-1.5 text-sm rounded-sm transition-all ${pathname === l.href ? "text-amber bg-amber/10" : "text-ink-300 hover:text-ink-100 hover:bg-ink-700"}`}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <NetworkBanner />
            <WalletButton />
            <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-ink-300 hover:text-ink-100" aria-label="Menu">
              <div className="flex flex-col gap-1.5 w-5">
                <span className={`block h-px bg-current transition-all ${open ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block h-px bg-current transition-all ${open ? "opacity-0" : ""}`} />
                <span className={`block h-px bg-current transition-all ${open ? "-rotate-45 -translate-y-2" : ""}`} />
              </div>
            </button>
          </div>
        </div>
        {open && (
          <nav className="md:hidden border-t border-ink-700 py-3 flex flex-col gap-1">
            {LINKS.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className={`px-3 py-2.5 text-sm rounded-sm transition-all ${pathname === l.href ? "text-amber bg-amber/10" : "text-ink-300 hover:text-ink-100 hover:bg-ink-700"}`}>
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
