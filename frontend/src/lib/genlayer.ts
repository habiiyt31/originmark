// ─────────────────────────────────────────────────────────────
// GenLayer client setup — single source of truth.
//
// Pattern (sesuai docs genlayer-js + Viem):
//   • createClient({ chain })                  → read-only client
//   • createClient({ chain, account })         → write client
//   • client.connect(CHAIN_KEY) sebelum write  → wajib (handle Snap fallback)
//   • parseEther/formatEther dari viem         → exact wei <-> GEN conversion
//   • value = BigInt; args = plain JS values   → JANGAN BigInt di args
// ─────────────────────────────────────────────────────────────

import { createClient } from "genlayer-js";
import { studionet, testnetAsimov } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { parseEther, formatEther } from "viem";

const NETWORK = process.env.NEXT_PUBLIC_NETWORK || "studionet";
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

export const CHAIN     = NETWORK === "testnet" ? testnetAsimov : studionet;
export const CHAIN_KEY = NETWORK === "testnet" ? "testnetAsimov" : "studionet";

// Derive hex chainId dari chain object — biar selalu sync sama genlayer-js
const CHAIN_HEX = "0x" + (CHAIN as any).id.toString(16);

export const NETWORK_CONFIG = {
  chainId: CHAIN_HEX,
  chainName: NETWORK === "testnet" ? "GenLayer Testnet Asimov" : "GenLayer Studio",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: NETWORK === "testnet"
    ? ["https://rpc.genlayer.com"]
    : ["https://studio.genlayer.com/api"],
  blockExplorerUrls: NETWORK === "testnet"
    ? ["https://explorer.genlayer.com"]
    : ["https://studio.genlayer.com"],
};

// ─── CLIENTS ────────────────────────────────────────────────

export function getReadClient() {
  return createClient({ chain: CHAIN });
}

export function getWriteClient(address: string) {
  return createClient({
    chain: CHAIN,
    account: address as `0x${string}`,
  });
}

// ─── NETWORK HELPERS ────────────────────────────────────────

export async function ensureNetwork(): Promise<void> {
  if (typeof window === "undefined") return;
  const eth = (window as any).ethereum;
  if (!eth) return;
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_HEX }],
    });
  } catch (e: any) {
    // 4902 = chain belum ditambahkan; -32603 = internal error tapi sering juga karena chain belum ada
    if (e.code === 4902 || e.code === -32603) {
      try {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [NETWORK_CONFIG],
        });
      } catch (addErr) {
        console.error("Failed to add network:", addErr);
      }
    }
  }
}

export function getEthereum() {
  return (window as any).ethereum;
}

export { TransactionStatus };

// ─── UNIT CONVERSIONS (GEN ↔ wei) ───────────────────────────
// 1 GEN = 10^18 wei (sama dengan ETH).
// Verified: inflation "1000 GEN" → inflationRaw 1000000000000000000000n.

/** Parse GEN amount ("0.01", "1.5") → wei BigInt. Exact. */
export function toWei(amount: string | number): bigint {
  return parseEther(String(amount || "0"));
}

/** Convert wei → number (untuk display/sort). LOSSY untuk >MAX_SAFE_INTEGER. */
export function fromWei(wei: bigint | string | number | null | undefined): number {
  try {
    if (wei === null || wei === undefined || wei === "" || wei === 0) return 0;
    return parseFloat(formatEther(BigInt(wei as any)));
  } catch {
    return 0;
  }
}

/** Format wei → "1.2345" string. Exact (string-based). */
export function fromWeiStr(
  wei: bigint | string | number | null | undefined,
  decimals = 4
): string {
  try {
    if (wei === null || wei === undefined || wei === "") return "0";
    const full = formatEther(BigInt(wei as any));
    if (decimals <= 0) return full.split(".")[0];
    const [whole, frac = ""] = full.split(".");
    return `${whole}.${(frac + "0".repeat(decimals)).slice(0, decimals)}`;
  } catch {
    return "0";
  }
}

/**
 * Pass wei as a u256 arg.
 *
 * Contract terima u256 sebagai Python int. Frontend HARUS kirim sebagai
 * JS Number (JSON number) — bukan string (str), bukan BigInt (not JSON-serializable).
 *
 * Wei sampai ~9e15 (0.009 GEN) exact. Di atas itu, Number kehilangan presisi
 * di digit terakhir (range femto-GEN) — acceptable untuk fee comparison
 * karena u256 contract precision jauh lebih besar dari yang kita butuhin.
 */
export function weiArg(amount: string | number): number {
  return Number(toWei(amount));
}
