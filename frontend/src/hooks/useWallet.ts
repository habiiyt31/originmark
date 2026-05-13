"use client";
import { useState, useEffect, useCallback } from "react";
import {
  ensureNetwork, getWriteClient, getEthereum,
  CONTRACT_ADDRESS, TransactionStatus, CHAIN_KEY,
} from "@/lib/genlayer";

const STORAGE_KEY = "originmark:disconnected";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isConnecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const connect = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) { setError("MetaMask not detected. Install it first."); return; }
    setConnecting(true);
    setError(null);
    try {
      // User explicit-connect → clear remembered-disconnect flag
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      await ensureNetwork();
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      if (accounts[0]) setAddress(accounts[0]);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Connection rejected");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    // Web3 wallets ngga punya real disconnect API. Kita clear local state
    // dan ingat user pilih disconnect — jangan auto-reconnect on next load.
    setAddress(null);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const eth = getEthereum();
    if (!eth) return;

    let disconnected = false;
    try { disconnected = localStorage.getItem(STORAGE_KEY) === "1"; } catch {}
    if (disconnected) return;

    eth.request({ method: "eth_accounts" })
      .then((accs: string[]) => { if (accs[0]) setAddress(accs[0]); })
      .catch(() => {});

    const handler = (accs: string[]) => setAddress(accs[0] ?? null);
    eth.on?.("accountsChanged", handler);
    return () => {
      try { eth.removeListener?.("accountsChanged", handler); } catch {}
    };
  }, [mounted]);

  /**
   * Send a write transaction.
   *
   * RULES:
   *   • args = plain JS Number atau String. NEVER BigInt.
   *     Untuk u256 kecil (cert_id) → Number.
   *     Untuk u256 besar (wei amount) → String of digits (pakai weiArg helper).
   *   • value = BigInt (atau undefined → defaults to 0n).
   */
  const writeContract = useCallback(async (
    functionName: string,
    args: unknown[],
    value?: bigint
  ): Promise<{ txHash: `0x${string}`; receipt?: unknown; timedOut?: boolean }> => {
    if (!address) throw new Error("Not connected");
    await ensureNetwork();
    const client = getWriteClient(address);

    // Some wallets (e.g. OKX) ngga implement MetaMask Snap methods seperti
    // `wallet_getSnaps` yang di-probe genlayer-js saat connect. Swallow error
    // spesifik ini — itu cuma feature detection; tx jalan tanpa Snap.
    try {
      await (client as any).connect(CHAIN_KEY as any);
    } catch (e: any) {
      const msg = String(e?.message || e || "");
      if (!/wallet_getSnaps|Method not found|snap/i.test(msg)) throw e;
      console.warn("Wallet does not support Snaps — continuing anyway:", msg);
    }

    const txHash = await client.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      functionName,
      args: args as any,
      value: value ?? BigInt(0),
    }) as `0x${string}`;

    // Wait for ACCEPTED dengan timeout 60s — fallback aman kalau RPC lambat
    try {
      const receipt = await Promise.race([
        client.waitForTransactionReceipt({
          hash: txHash as any,
          status: TransactionStatus.ACCEPTED,
        }),
        new Promise(resolve =>
          setTimeout(() => resolve({ timedOut: true }), 60000)
        ),
      ]);
      if ((receipt as any)?.timedOut) return { txHash, timedOut: true };
      return { txHash, receipt };
    } catch (e) {
      console.warn("Wait receipt failed, tx likely in progress:", txHash);
      return { txHash };
    }
  }, [address]);

  return {
    address: address as `0x${string}` | null,
    isConnected: !!address,
    isConnecting,
    error,
    mounted,
    connect,
    disconnect,
    writeContract,
  };
}
