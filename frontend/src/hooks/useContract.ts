"use client";
import { useState, useEffect, useCallback } from "react";
import { getReadClient, CONTRACT_ADDRESS } from "@/lib/genlayer";
import type { IPRecord, DisputeRecord, ContractStats } from "@/types";

// ─────────────────────────────────────────────────────────────
// Read hooks
// args: plain JS values — Number untuk u256 kecil, string untuk str
// ─────────────────────────────────────────────────────────────

function isValidContract(): boolean {
  return !!CONTRACT_ADDRESS &&
    CONTRACT_ADDRESS !== "0xYourContractAddressHere" &&
    CONTRACT_ADDRESS.startsWith("0x");
}

export function useStats() {
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!isValidContract()) { setLoading(false); return; }
    setLoading(true);
    try {
      const client = getReadClient();
      const result = await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: "get_stats",
        args: [],
      });
      setStats(result as unknown as ContractStats);
    } catch (e) {
      console.error("get_stats:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  return { stats, loading, refetch: fetchStats };
}

export function useWork(certIdStr: string) {
  const [work, setWork] = useState<IPRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (certIdStr === "" || isNaN(Number(certIdStr)) || !isValidContract()) {
      setWork(null);
      return;
    }
    setLoading(true);
    try {
      const client = getReadClient();
      const result = await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: "get_work",
        args: [Number(certIdStr)] as any, // Number — small u256, NEVER BigInt
      }) as any;
      setWork(result && result.cert_id !== undefined ? (result as IPRecord) : null);
    } catch (e) {
      console.error("get_work:", e);
      setWork(null);
    } finally {
      setLoading(false);
    }
  }, [certIdStr]);

  useEffect(() => {
    // Debounce 600ms — user mengetik certId
    const t = setTimeout(fetch, 600);
    return () => clearTimeout(t);
  }, [fetch]);

  return { work, loading, refetch: fetch };
}

export function useMyWorks(address: string | null) {
  const [works, setWorks] = useState<IPRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWorks = useCallback(async () => {
    if (!address || !isValidContract()) { setWorks([]); return; }
    setLoading(true);
    try {
      const client = getReadClient();
      const ids = await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: "get_creator_works",
        args: [address] as any, // String — address
      }) as Array<number | bigint | string>;

      if (!ids || ids.length === 0) { setWorks([]); return; }

      const records = await Promise.all(
        ids.map(async (id) => {
          const idNum = Number(id);
          try {
            const r = await client.readContract({
              address: CONTRACT_ADDRESS as `0x${string}`,
              functionName: "get_work",
              args: [idNum] as any,
            }) as any;
            return r && r.cert_id !== undefined ? (r as IPRecord) : null;
          } catch { return null; }
        })
      );
      setWorks(records.filter(Boolean) as IPRecord[]);
    } catch (e) {
      console.error("get_creator_works:", e);
      setWorks([]);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { fetchWorks(); }, [fetchWorks]);
  return { works, loading, refetch: fetchWorks };
}

export function useDispute(disputeIdStr: string) {
  const [dispute, setDispute] = useState<DisputeRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (disputeIdStr === "" || isNaN(Number(disputeIdStr)) || !isValidContract()) {
      setDispute(null); return;
    }
    setLoading(true);
    try {
      const client = getReadClient();
      const result = await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: "get_dispute",
        args: [Number(disputeIdStr)] as any,
      }) as any;
      setDispute(result && result.dispute_id !== undefined ? (result as DisputeRecord) : null);
    } catch (e) {
      console.error("get_dispute:", e);
      setDispute(null);
    } finally {
      setLoading(false);
    }
  }, [disputeIdStr]);

  useEffect(() => { fetch(); }, [fetch]);
  return { dispute, loading, refetch: fetch };
}

// ─────────────────────────────────────────────────────────────
// NEW: useAllWorks — fetch all registered works (for /explore page)
// Reads get_all_works() which returns full IPRecord[] from contract
// ─────────────────────────────────────────────────────────────
export function useAllWorks() {
  const [works, setWorks]     = useState<IPRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!isValidContract()) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const client = getReadClient();
      const result = await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: "get_all_works",
        args: [],
      }) as any;

      // Contract bisa return: array of IPRecord OR array of cert_ids
      // (depending on contract impl). Handle both.
      if (!Array.isArray(result) || result.length === 0) {
        setWorks([]);
        return;
      }

      const first = result[0];
      // Case A: array of full IPRecord objects
      if (first && typeof first === "object" && "cert_id" in first) {
        setWorks(result as IPRecord[]);
        return;
      }

      // Case B: array of cert_ids → fetch each
      const records = await Promise.all(
        (result as Array<number | bigint | string>).map(async (id) => {
          try {
            const r = await client.readContract({
              address: CONTRACT_ADDRESS as `0x${string}`,
              functionName: "get_work",
              args: [Number(id)] as any,
            }) as any;
            return r && r.cert_id !== undefined ? (r as IPRecord) : null;
          } catch { return null; }
        })
      );
      setWorks(records.filter(Boolean) as IPRecord[]);
    } catch (e: any) {
      console.error("get_all_works:", e);
      setError(e?.message ?? "Failed to load works");
      setWorks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  return { works, loading, error, refetch: fetchAll };
}

// ─────────────────────────────────────────────────────────────
// NEW: useDisputesForWork — fetch dispute history for a given cert_id
// Scans total_disputes from stats, then filters by cert_id
// ─────────────────────────────────────────────────────────────
export function useDisputesForWork(certId: number | null) {
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [loading, setLoading]   = useState(false);

  const fetchDisputes = useCallback(async () => {
    if (certId === null || !isValidContract()) { setDisputes([]); return; }
    setLoading(true);
    try {
      const client = getReadClient();

      // Try to get exact dispute_count from stats first — avoids brute-forcing
      // get_dispute(0..N) on every render (RPC spam).
      // get_stats() can transiently fail on Studio ("Error getting the
      // contract state") even when get_dispute itself works fine — so we
      // fall back to a small bounded scan instead of giving up entirely.
      const FALLBACK_SCAN = 10;
      let totalDisputes: number | null = null;

      try {
        const stats = await client.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          functionName: "get_stats",
          args: [],
        }) as any;
        totalDisputes = Number(stats?.total_disputes ?? 0);
      } catch (e) {
        console.warn("get_stats failed, falling back to bounded scan:", e);
        totalDisputes = null;
      }

      if (totalDisputes !== null && totalDisputes <= 0) {
        setDisputes([]);
        return;
      }

      const scanCount = totalDisputes ?? FALLBACK_SCAN;

      // Fetch all known disputes in parallel, then filter by cert_id.
      // Missing/erroring IDs (e.g. out of range when using the fallback
      // cap) resolve to null and are dropped.
      const results = await Promise.all(
        Array.from({ length: scanCount }, (_, id) =>
          client.readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            functionName: "get_dispute",
            args: [id] as any,
          }).then((r: any) => {
            if (!r || r.dispute_id === undefined) return null;
            return { ...r, reasoning: r.reasoning ?? r.reason ?? "" } as DisputeRecord;
          }).catch(() => null)
        )
      );

      const found = results.filter(
        (r): r is DisputeRecord => r !== null && Number(r.cert_id) === certId
      );
      setDisputes(found);
    } catch (e) {
      console.error("disputes-for-work:", e);
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  }, [certId]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);
  return { disputes, loading, refetch: fetchDisputes };
}