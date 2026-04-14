# DeFi Sweeper

AI agent that scans a wallet for stale DeFi positions across six EVM chains, scores their health with a heuristic + LLM, and executes a **one-click cleanup** that logs the sweep on **X Layer** (the recovery destination).

Built for the **OKX Build X Hackathon 2026** — X Layer Arena track.

---

## Live X Layer deployment

| | |
|---|---|
| **Contract** | `SweeperRegistry` |
| **Address** | [`0xb07de4923017723e1a9948ac5d34b808303ba45e`](https://www.okx.com/web3/explorer/xlayer-test/address/0xb07de4923017723e1a9948ac5d34b808303ba45e) |
| **Network** | X Layer Testnet (chain ID **1952**) |
| **Deploy tx** | [`0x9f75ef12…93d1528`](https://www.okx.com/web3/explorer/xlayer-test/tx/0x9f75ef12353c8d13aea65aa875d005c4b66285630b9b68f0046ce8cfe93d1528) |
| **Source** | [`contracts/SweeperRegistry.sol`](./contracts/SweeperRegistry.sol) |

After every sweep, the user signs one additional X Layer tx that calls `logSweep(...)`, emitting a `PositionSwept` event. The contract tracks total sweeps, total USD recovered, and per-user sweep counts — all queryable on-chain.

---

## Hackathon fit

| Criterion | How we hit it |
|---|---|
| **X Layer Arena — "at least one part deployed on X Layer"** | `SweeperRegistry` live on X Layer Testnet. Every user sweep triggers an on-chain `PositionSwept` event. |
| **Onchain OS API usage** (Most Active Agent prize) | Scan API calls `/api/v6/defi/user/asset/platform/list` + `/api/v6/defi/user/asset/platform/detail` via HMAC, with an `onchainos` CLI subprocess fallback when HMAC credentials are stale. |
| **Meaningful development during hackathon** | 13+ Claude Code sessions, git history, Figma-matched frontend, live contract. |
| **Agentic claim backed by data** | Heuristic scoring runs server-side; optional Grok (xAI) / Groq (Llama) pass enhances each position with a one-line summary + 2-4 specific explanations. |

---

## What it does

1. **Connect wallet** on X Layer Testnet.
2. **Scan** — server calls OKX v6 DeFi endpoints for the connected address across ETH / BSC / Polygon / Arbitrum / Base / X Layer.
3. **Score** — each position gets a 0-100 health score via a heuristic (dust threshold, rewards neglect, liquidation risk, protocol age). Grok/Groq then produces a richer `aiSummary` + explanations.
4. **Sweep** — user hits "Clean up". The sheet walks through claim → withdraw → swap-to-USDC → deposit-to-Aave-on-X-Layer, each a real signed tx via wagmi + viem.
5. **Log on-chain** — after the sweep completes, the wallet signs a final tx to `SweeperRegistry.logSweep()` on X Layer. Event emitted with platform, chain, USD value, health score, destination.

---

## Tech

| Layer | Tools |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) · React 19 · TypeScript |
| Styling | TailwindCSS v4 · Red Hat Display / Text · JetBrains Mono |
| Wallet | wagmi v3 · viem · RainbowKit |
| Data | OKX Web3 v6 REST (HMAC-SHA256) · `onchainos` CLI fallback · TanStack React Query |
| AI | Grok (xAI) or Groq (Llama 3.3 70B) — OpenAI-compatible |
| Contract | Solidity 0.8.24 · compiled with `solc` · deployed via `viem` |
| Chain | X Layer Testnet (chain ID 1952) |

---

## Routes

| Path | Purpose |
|---|---|
| `/` | Marketing landing page — CTAs route to `/app` |
| `/app` | Gateway — blurred dashboard + connect card; renders full dashboard when connected |
| `/position/[id]` | Position detail view |
| `/api/scan` | OKX scan + scoring + optional Grok enhancement |
| `/api/sweep` | Builds the withdraw/swap/deposit tx sequence |
| `/api/analyze`, `/api/quote` | Scaffolds for future agent actions |

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Environment — `.env.local`

```bash
# OKX Web3 API (HMAC)  — https://web3.okx.com/build/dev-portal
OKX_PROJECT_ID=...
OKX_API_KEY=...
OKX_SECRET_KEY=...
OKX_PASSPHRASE=...

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...

# AI enhancer (optional — pick one)
XAI_API_KEY=     # https://console.x.ai
GROQ_API_KEY=    # https://console.groq.com

# Contract deployment (only needed if redeploying)
DEPLOYER_PRIVATE_KEY=0x...
# NETWORK=mainnet   # default: testnet

# Site URL for sitemap / robots
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), hit Launch app, connect a wallet (MetaMask / OKX / Rabby — auto-prompts to switch to X Layer Testnet).

### 4. Redeploy contract (optional)

```bash
node scripts/deploy-sweeper-registry.mjs        # X Layer Testnet
NETWORK=mainnet node scripts/deploy-sweeper-registry.mjs   # X Layer Mainnet
```

Writes address + ABI to `src/contracts/sweeper-registry.json` — the frontend imports it.

---

## Project structure

```
contracts/
└── SweeperRegistry.sol          # 45 LOC, event-only on-chain log
scripts/
└── deploy-sweeper-registry.mjs  # solc compile + viem deploy
src/
├── app/
│   ├── page.tsx                 # Landing
│   ├── app/                     # Gateway + connected dashboard
│   ├── dashboard/               # Dashboard implementation
│   ├── position/[id]/           # Position detail
│   ├── api/scan/                # OKX scan + scoring + AI enhance
│   ├── api/sweep/               # Build cleanup tx sequence
│   ├── sitemap.ts · robots.ts
│   └── layout.tsx               # Root metadata + providers
├── components/
│   ├── header.tsx               # Logo, X Layer pill, wallet dropdown
│   ├── position-detail-sheet.tsx   # Sweep flow + logSweep() wiring
│   └── sweep-steps.tsx          # Animated step-by-step tx tracker
├── contracts/
│   └── sweeper-registry.json    # deployed address + ABI (generated)
├── lib/
│   ├── okx-api.ts               # HMAC v6 client
│   ├── onchainos-cli.ts         # Subprocess fallback for scan
│   ├── scoring.ts               # Heuristic 0-100 health engine
│   ├── ai-enhance.ts            # Grok / Groq post-processor
│   └── types.ts
└── providers/web3-provider.tsx  # wagmi + RainbowKit, X Layer Testnet
```

---

## SEO

- `src/app/sitemap.ts` — emits `/sitemap.xml` with `/` and `/app`
- `src/app/robots.ts` — disallows `/api/` and `/position/`
- Full OpenGraph / Twitter metadata in `src/app/layout.tsx`

---

## License

MIT.
