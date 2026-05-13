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
      const stats = await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: "get_stats",
        args: [],
      }) as unknown as ContractStats;

      const total = Number(stats?.total_disputes ?? 0);
      if (total === 0) { setDisputes([]); return; }

      // Fetch all disputes, filter by cert_id
      const ids = Array.from({ length: total }, (_, i) => i);
      const all = await Promise.all(
        ids.map(async (id) => {
          try {
            const r = await client.readContract({
              address: CONTRACT_ADDRESS as `0x${string}`,
              functionName: "get_dispute",
              args: [id] as any,
            }) as any;
            return r && r.dispute_id !== undefined ? (r as DisputeRecord) : null;
          } catch { return null; }
        })
      );
      setDisputes(
        all.filter((d): d is DisputeRecord => d !== null && Number(d.cert_id) === certId)
      );
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