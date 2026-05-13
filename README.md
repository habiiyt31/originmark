# OriginMark — AI-Powered Onchain IP Registry & Infringement Court

A decentralized intellectual property registry powered by **GenLayer Intelligent Contracts**.

OriginMark allows creators to:
- register creative works on-chain
- verify originality using AI consensus
- file AI-powered copyright disputes
- monetize works through licensing fees

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
4. Automatically distribute royalties and infringement payouts

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
NEXT_PUBLIC_NETWORK=studionet
NEXT_PUBLIC_PINATA_JWT=YOUR_PINATA_JWT
```

Run frontend:

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

---

## Contract Methods

### Write (costs GEN gas)

| Method | Description |
|--------|-------------|
| `register_work(...)` | Register creative work with AI originality validation |
| `file_dispute(cert_id, suspect_url)` | Submit AI copyright dispute |
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

1. Contract fetches webpage content using:

```python
gl.nondet.web.get()
```

2. AI compares:
   - original registered work
   - suspicious webpage content

3. AI returns verdict:

| Verdict | Meaning |
|---------|---------|
| `infringement` | Content likely copied |
| `clear` | No meaningful similarity |
| `invalid` | URL unreachable or insufficient data |

---

## Royalty System

- creators set custom license fees
- license payments automatically transfer to creators
- infringement bonds may compensate creators
- platform fee: **5%**

---

## What's Included

- AI originality validation
- AI copyright dispute court
- royalty tracking
- creator licensing
- platform fee system
- on-chain IP registry
- GenLayer AI consensus integration

---

## Notes

- `cert_id` starts from `0`
- Registration fee: **0.01 GEN**
- Dispute bond: **0.05 GEN**
- `license_fee` stored in wei
- Creativity score range: `1–100`
- Platform fee: `500 bps (5%)`

---

## License

MIT