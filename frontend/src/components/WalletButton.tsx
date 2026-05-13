"use client";
import { useWallet } from "@/hooks/useWallet";
import { shortAddr } from "@/lib/utils";

export function WalletButton() {
  const { address, isConnected, isConnecting, connect, disconnect, mounted } = useWallet();

  // Render placeholder konsisten antara SSR & client biar ngga hydration mismatch
  if (!mounted) {
    return (
      <button className="btn-primary text-sm px-4 py-2" disabled>
        Connect Wallet
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <button onClick={disconnect}
        className="flex items-center gap-2 border border-ink-600 hover:border-amber/50 px-3 py-1.5 rounded-sm transition-colors group">
        <span className="w-1.5 h-1.5 rounded-full bg-sage-light" />
        <span className="font-mono text-xs text-ink-200 group-hover:text-amber transition-colors">
          {shortAddr(address)}
        </span>
      </button>
    );
  }
  return (
    <button onClick={connect} disabled={isConnecting} className="btn-primary text-sm px-4 py-2">
      {isConnecting
        ? <><div className="w-3 h-3 border border-ink-900 border-t-transparent rounded-full animate-spin" />Connecting</>
        : "Connect Wallet"}
    </button>
  );
}
