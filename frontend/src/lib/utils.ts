export function shortAddr(addr?: string | null, head = 4, tail = 4): string {
  if (!addr) return "";
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, 2 + head)}...${addr.slice(-tail)}`;
}

// Re-export wei helpers dari lib/genlayer.ts untuk backward compat
export { toWei, fromWei, fromWeiStr } from "./genlayer";

import { fromWeiStr } from "./genlayer";

/** Legacy alias — use fromWeiStr directly in new code */
export function formatGEN(wei: number | bigint | string, decimals = 4): string {
  return fromWeiStr(wei, decimals);
}

/** Legacy alias — for input strings only */
export { toWei as parseGEN } from "./genlayer";
