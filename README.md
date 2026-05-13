# OriginMark — AI-Powered Onchain IP Registry & Infringement Court

OriginMark is an AI-Powered On-Chain IP Registry & Infringement Court, built on GenLayer.

OriginMark allows creators to:
- register creative works on-chain
- verify originality using AI consensus
- file AI-powered copyright disputes
- monetize works through licensing fees

## Quick Demo (3 minutes)

Want to try it out? You'll need MetaMask + some GEN on Studionet.

1. **Connect** MetaMask to GenLayer Studionet (the app will prompt you to switch networks).
2. **Register a work** — click "Fill example" on the Register page, hit submit. Wait 30-90 seconds for AI validators to score originality. You'll get a `cert_id` and a creativity score (1-100).
3. **Browse the registry** at `/explore` — search, filter by media type, sort by score.
4. **File a dispute** at `/dispute` — submit a `cert_id` and a suspect URL. The contract will fetch that URL and AI validators will rule on infringement.
5. **License a work** at `/license` — pay the license fee, 95% goes to the creator instantly.

---

## Supported Media Types

| Type | Description |
|------|-------------|
| `image` | Artwork, illustrations, photos |
| `music` | Audio and music files |
| `text` | Articles, writing, documents |
| `video` | Video content |
| `other` | Other digital creative assets |

---

## What Makes OriginMark Unique

Unlike traditional copyright systems that rely on centralized moderation or legal review, OriginMark uses **GenLayer Intelligent Contracts** to:

1. Evaluate originality using AI directly on-chain
2. Fetch and inspect suspicious webpages during disputes
3. Reach deterministic AI consensus using `eq_principle.prompt_comparative`
4. Automatically distribute royalties and dispute bonds based on verdict

This is only possible on GenLayer — regular smart contracts cannot read the internet or reach consensus on subjective claims like originality and infringement.

---

## Project Structure

```bash
originmark/
  contracts/
    proof_of_creative_work.py      # GenLayer Intelligent Contract

  frontend/
    src/
      app/                         # Next.js pages
      components/                  # UI components
      hooks/                       # Wallet + contract hooks
      lib/                         # GenLayer helpers
      types/                       # Shared types

    package.json
    .env.example

  README.md
```

---

## Setup

### 1. Deploy Contract

```bash
genlayer network set studionet
genvm-lint check contracts/proof_of_creative_work.py
genlayer deploy --contract contracts/proof_of_creative_work.py
```

Copy the deployed contract address.

---

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_GENLAYER_CHAIN=studionet
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_NETWORK=studionet
NEXT_PUBLIC_PINATA_JWT=YOUR_PINATA_JWT
```

Run frontend:

```bash
npm run dev
```

Open `http://localhost:3000`

---

## Contract Methods

### Write (costs GEN gas)

| Method | Description |
|--------|-------------|
| `register_work(...)` | Register creative work with AI originality validation |
| `file_dispute(cert_id, suspect_url)` | Submit AI copyright dispute (requires 0.05 GEN bond) |
| `request_license(cert_id)` | Purchase a license from creator |
| `update_license_fee(cert_id, new_fee)` | Update licensing fee |
| `revoke_work(cert_id)` | Disable registered work |
| `withdraw_fees()` | Owner withdraws platform fees |

### Read (free)

| Method | Description |
|--------|-------------|
| `get_work(cert_id)` | Get single registered work |
| `get_all_works()` | List all works |
| `get_creator_works(addr)` | Get creator works |
| `get_dispute(dispute_id)` | Get dispute details |
| `get_stats()` | Platform statistics |
| `get_owner()` | Contract owner |

---

## AI Originality Logic

When a creator registers a work:

1. AI compares the submission against existing registered works
2. Checks:
   - duplicate similarity
   - creative quality
   - originality
3. Returns:
   - approval result
   - creativity score (1–100)

All approvals go through:

```python
gl.eq_principle.prompt_comparative
```

to ensure deterministic validator consensus.

---

## AI Dispute Resolution

When a dispute is submitted:

1. Claimant posts a **0.05 GEN bond**
2. Contract fetches webpage content using:

```python
gl.nondet.web.get()
```

3. AI compares the original registered work against the suspect webpage content
4. AI returns a verdict, and the bond is settled automatically:

| Verdict | Meaning | Bond Settlement |
|---------|---------|-----------------|
| `infringement` | Content likely copied | 95% to original creator, 5% to platform |
| `clear` | No meaningful similarity | Refunded to claimant |
| `invalid` | URL unreachable or insufficient data | Forfeited to platform |

The bond mechanism prevents spam disputes — frivolous claims cost the claimant, while legitimate ones reward the original creator.

---

## Royalty System

- Creators set custom license fees per work
- License payments split automatically: **95% creator / 5% platform**
- Confirmed infringement bonds split the same way (95/5)
- Platform fees withdrawable only by contract owner

---

## What's Included

- AI originality validation at registration
- AI copyright dispute court with web-reading capability
- Bond-based anti-spam dispute system
- License marketplace with automatic royalty split
- Creator-controlled work revocation
- Public registry with search & filter
- GenLayer AI consensus integration

---

## Parameters

| Setting | Value |
|---------|-------|
| Registration fee | `0.01 GEN` |
| Dispute bond | `0.05 GEN` |
| Platform fee | `500 bps (5%)` |
| Creativity score range | `1–100` |
| `cert_id` starts from | `0` |
| `license_fee` stored as | wei |

---

## Tech Stack

- **Intelligent Contract**: Python on GenLayer (`gl.eq_principle.prompt_comparative`, `gl.nondet.web.get`)
- **Frontend**: Next.js 14 + TypeScript
- **Wallet**: MetaMask via `genlayer-js` SDK
- **Storage**: IPFS via Pinata

---

## License

MIT