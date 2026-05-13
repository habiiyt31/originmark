// Wei values dari contract bisa datang sebagai number | string | bigint
// (tergantung serializer genlayer-js). Pakai fromWei/fromWeiStr dari lib/genlayer.
export type Wei = number | string | bigint;

export interface WalletState {
  address: `0x${string}` | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface IPRecord {
  cert_id: number;
  creator: string;
  title: string;
  description: string;
  media_type: "image" | "music" | "text" | "video" | "other";
  source_url: string;
  creativity_score: number;
  license_fee_wei: Wei;
  total_royalties: Wei;
  is_active: boolean;
}

export interface DisputeRecord {
  dispute_id: number;
  claimant: string;
  cert_id: number;
  suspect_url: string;
  bond_wei: Wei;
  verdict: "infringement" | "clear" | "invalid";
  confidence: number;
  reasoning: string;
  resolved: boolean;
}

export interface ContractStats {
  total_works: number;
  total_disputes: number;
  reg_fee_wei: Wei;
  dispute_bond_wei: Wei;
  platform_fee_pct: number;
  platform_balance: Wei;
  owner: string;
}
