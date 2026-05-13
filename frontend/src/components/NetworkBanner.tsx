"use client";
import { useEffect, useState } from "react";
import { CHAIN, NETWORK_CONFIG, getEthereum } from "@/lib/genlayer";

/**
 * NetworkBanner — small inline pill rendered in the Navbar.
 *
 * Tracks the wallet's current chainId via the EIP-1193 `chainChanged` event.
 * If the chain doesn't match the configured GenLayer chain, shows a warning
 * pill with a "Switch" button that calls wallet_switchEthereumChain.
 *
 * Renders nothing when:
 *   • Server-rendering (no window)
 *   • No wallet installed
 *   • Wallet on the correct chain
 *   • User not connected (chainId not yet known)
 */
export function NetworkBanner() {
  const expectedHex = NETWORK_CONFIG.chainId;
  const expectedId  = (CHAIN as any).id as number;
  const [currentHex, setCurrentHex] = useState<string | null>(null);
  const [switching,  setSwitching]  = useState(false);

  useEffect(() => {
    const eth = getEthereum();
    if (!eth) return;

    // Read current chainId once
    eth.request({ method: "eth_chainId" })
      .then((id: string) => setCurrentHex(id))
      .catch(() => {});

    const handler = (id: string) => setCurrentHex(id);
    eth.on?.("chainChanged", handler);
    return () => {
      try { eth.removeListener?.("chainChanged", handler); } catch {}
    };
  }, []);

  if (!currentHex) return null;
  if (currentHex.toLowerCase() === expectedHex.toLowerCase()) return null;

  async function handleSwitch() {
    const eth = getEthereum();
    if (!eth) return;
    setSwitching(true);
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: expectedHex }],
      });
    } catch (e: any) {
      if (e?.code === 4902 || e?.code === -32603) {
        try {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [NETWORK_CONFIG],
          });
        } catch (addErr) {
          console.error("Add chain failed:", addErr);
        }
      } else {
        console.error("Switch chain failed:", e);
      }
    } finally {
      setSwitching(false);
    }
  }

  return (
    <button
      onClick={handleSwitch}
      disabled={switching}
      title={`Wrong network. Expected chainId ${expectedId} (${NETWORK_CONFIG.chainName}).`}
      className="hidden sm:flex items-center gap-2 border border-rust/40 bg-rust/5 hover:bg-rust/10 px-2.5 py-1.5 rounded-sm transition-colors"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-rust animate-pulse" />
      <span className="font-mono text-[10px] uppercase tracking-wider text-rust">
        {switching ? "Switching" : "Wrong network"}
      </span>
    </button>
  );
}
