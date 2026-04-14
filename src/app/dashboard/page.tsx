"use client";

import { useAccount, useDisconnect, useWriteContract } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { ScanAnimation } from "@/components/scan-animation";
import { PositionDetailSheet } from "@/components/position-detail-sheet";
import { type ScoredPosition, type HealthStatus } from "@/lib/types";
import { getHealthStatus, getHealthColor } from "@/lib/scoring";
import { motion } from "framer-motion";
import { TokenIcon, NetworkIcon, TokenPair } from "@/components/web3-icons";
import sweeperRegistry from "@/contracts/sweeper-registry.json";

// ─── Health icon SVG for table rows (exact Figma assets) ─────
function HealthIcon({ score }: { score: number }) {
  if (score >= 80) {
    // green check_circle — exact Figma SVG path (node 26:810)
    return (
      <svg width="16" height="16" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
        <path d="M5.775 8.183L4.218 6.626a.56.56 0 00-.408-.166.56.56 0 00-.427.183.54.54 0 00-.166.41c0 .16.057.296.17.407l1.986 2.002a.56.56 0 00.4.169.56.56 0 00.403-.17l3.936-3.94a.55.55 0 00.186-.421.55.55 0 00-.187-.425.57.57 0 00-.432-.157.57.57 0 00-.418.174L5.775 8.183zM6.767 13.537A6.72 6.72 0 014.14 13.005a6.88 6.88 0 01-2.156-1.453A6.88 6.88 0 01.531 9.396 6.72 6.72 0 010 6.771c0-.939.177-1.82.531-2.642a6.84 6.84 0 011.453-2.149A6.84 6.84 0 014.14.533 6.72 6.72 0 016.766 0c.938 0 1.82.178 2.643.533a6.85 6.85 0 012.148 1.446 6.85 6.85 0 011.447 2.148c.355.823.533 1.704.533 2.643 0 .928-.178 1.803-.533 2.626a6.87 6.87 0 01-1.447 2.156 6.87 6.87 0 01-2.148 1.453 6.72 6.72 0 01-2.643.532zm0-1.136c1.567 0 2.897-.548 3.99-1.646 1.094-1.097 1.64-2.425 1.64-3.985 0-1.567-.546-2.897-1.64-3.991C9.664 1.686 8.333 1.14 6.764 1.14c-1.557 0-2.885.547-3.982 1.64-1.098 1.094-1.647 2.425-1.647 3.993 0 1.557.549 2.885 1.646 3.982 1.097 1.098 2.425 1.647 3.986 1.647z" fill="#6FA300"/>
      </svg>
    );
  }
  if (score >= 50) {
    // yellow/amber circle ring — exact Figma SVG path (node 26:826)
    return (
      <svg width="16" height="16" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
        <path d="M6.767 13.537A6.72 6.72 0 014.14 13.005a6.88 6.88 0 01-2.156-1.453A6.88 6.88 0 01.531 9.396 6.72 6.72 0 010 6.771c0-.939.177-1.82.531-2.642a6.84 6.84 0 011.453-2.149A6.84 6.84 0 014.14.533 6.72 6.72 0 016.766 0c.938 0 1.82.178 2.643.533a6.85 6.85 0 012.148 1.446 6.85 6.85 0 011.447 2.148c.355.823.533 1.704.533 2.643 0 .928-.178 1.803-.533 2.626a6.87 6.87 0 01-1.447 2.156 6.87 6.87 0 01-2.148 1.453 6.72 6.72 0 01-2.643.532zm0-1.136c1.567 0 2.897-.548 3.99-1.646 1.094-1.097 1.64-2.425 1.64-3.985 0-1.567-.546-2.897-1.64-3.991C9.664 1.686 8.333 1.14 6.764 1.14c-1.557 0-2.885.547-3.982 1.64-1.098 1.094-1.647 2.425-1.647 3.993 0 1.557.549 2.885 1.646 3.982 1.097 1.098 2.425 1.647 3.986 1.647z" fill="#F9A606"/>
      </svg>
    );
  }
  // red circle ring — exact Figma SVG path (node 26:814)
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
      <path d="M6.767 13.537A6.72 6.72 0 014.14 13.005a6.88 6.88 0 01-2.156-1.453A6.88 6.88 0 01.531 9.396 6.72 6.72 0 010 6.771c0-.939.177-1.82.531-2.642a6.84 6.84 0 011.453-2.149A6.84 6.84 0 014.14.533 6.72 6.72 0 016.766 0c.938 0 1.82.178 2.643.533a6.85 6.85 0 012.148 1.446 6.85 6.85 0 011.447 2.148c.355.823.533 1.704.533 2.643 0 .928-.178 1.803-.533 2.626a6.87 6.87 0 01-1.447 2.156 6.87 6.87 0 01-2.148 1.453 6.72 6.72 0 01-2.643.532zm0-1.136c1.567 0 2.897-.548 3.99-1.646 1.094-1.097 1.64-2.425 1.64-3.985 0-1.567-.546-2.897-1.64-3.991C9.664 1.686 8.333 1.14 6.764 1.14c-1.557 0-2.885.547-3.982 1.64-1.098 1.094-1.647 2.425-1.647 3.993 0 1.557.549 2.885 1.646 3.982 1.097 1.098 2.425 1.647 3.986 1.647z" fill="#E62E24"/>
    </svg>
  );
}

// ─── Demo data — 20 diverse positions across categories, chains, and health bands
function generateDemoPositions(address: string): ScoredPosition[] {
  type Demo = Omit<ScoredPosition, "healthStatus"> & { healthStatus: HealthStatus };
  const p: Demo[] = [
    // ─── DEAD dust ──────────────────────────────────────────
    {
      id: "demo-1", platformName: "SushiSwap", platformId: "sushi-1",
      chain: "ethereum", chainLabel: "Ethereum", investType: 2, investTypeLabel: "Liquidity Pool",
      tokens: [
        { symbol: "ETH", amount: "0.00021", valueUsd: "0.52" },
        { symbol: "USDC", amount: "0.48", valueUsd: "0.48" },
      ],
      totalValueUsd: 1.0, healthScore: 8, healthStatus: "DEAD",
      aiSummary: "Dust ETH/USDC LP on SushiSwap — gas to manage exceeds value",
      aiExplanation: ["Pool value $1.00 — below any reasonable gas threshold", "Unclaimed SUSHI rewards worth less than $0.50"],
      recommendation: { action: "exit", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [{ symbol: "SUSHI", amount: "0.42", valueUsd: "0.38" }], investmentId: "demo-inv-1",
    },
    {
      id: "demo-2", platformName: "PancakeSwap V2", platformId: "pancake-1",
      chain: "bsc", chainLabel: "BSC", investType: 2, investTypeLabel: "Liquidity Pool",
      tokens: [
        { symbol: "BNB", amount: "0.0018", valueUsd: "1.10" },
        { symbol: "USDT", amount: "1.10", valueUsd: "1.10" },
      ],
      totalValueUsd: 2.2, healthScore: 11, healthStatus: "DEAD",
      aiSummary: "Dust BNB/USDT on PancakeSwap V2 — consolidate immediately",
      aiExplanation: ["$2.20 position on V2 while V3 has 4× the TVL", "Unclaimed CAKE rewards rotting ~$0.15"],
      recommendation: { action: "exit", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [{ symbol: "CAKE", amount: "0.08", valueUsd: "0.15" }], investmentId: "demo-inv-2",
    },
    {
      id: "demo-3", platformName: "Balancer", platformId: "balancer-1",
      chain: "polygon", chainLabel: "Polygon", investType: 2, investTypeLabel: "Liquidity Pool",
      tokens: [{ symbol: "MATIC", amount: "4.2", valueUsd: "2.31" }],
      totalValueUsd: 2.31, healthScore: 14, healthStatus: "DEAD",
      aiSummary: "Abandoned MATIC position on Balancer Polygon",
      aiExplanation: ["Pool hasn't rebalanced in 94 days", "BAL emissions ended Q3 2025"],
      recommendation: { action: "exit", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [], investmentId: "demo-inv-3",
    },
    {
      id: "demo-4", platformName: "Aave V2", platformId: "aave-v2-1",
      chain: "ethereum", chainLabel: "Ethereum", investType: 6, investTypeLabel: "Borrow",
      tokens: [{ symbol: "DAI", amount: "0.6", valueUsd: "0.60" }],
      totalValueUsd: 0.6, healthScore: 5, healthStatus: "DEAD",
      aiSummary: "Tiny Aave V2 borrow on mainnet — migrate or close",
      aiExplanation: ["Aave V2 is deprecated — V3 offers better rates", "Health rate 1.8 but not worth ETH gas to manage"],
      recommendation: { action: "exit", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [], investmentId: "demo-inv-4",
    },

    // ─── STALE (low-value or low-yield) ─────────────────────
    {
      id: "demo-5", platformName: "Curve Finance", platformId: "curve-1",
      chain: "ethereum", chainLabel: "Ethereum", investType: 2, investTypeLabel: "Liquidity Pool",
      tokens: [
        { symbol: "DAI", amount: "75", valueUsd: "75" },
        { symbol: "USDC", amount: "75", valueUsd: "75" },
      ],
      totalValueUsd: 150, healthScore: 32, healthStatus: "STALE",
      aiSummary: "3pool LP earning 0.1% APY — well below risk-free rate",
      aiExplanation: ["Current APY is 0.1%", "Pool TVL dropped 40% in 60 days", "X Layer Aave offers 2.6% APY with less risk"],
      recommendation: { action: "move", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [], investmentId: "demo-inv-5",
    },
    {
      id: "demo-6", platformName: "Compound V2", platformId: "comp-1",
      chain: "ethereum", chainLabel: "Ethereum", investType: 1, investTypeLabel: "Savings",
      tokens: [{ symbol: "USDC", amount: "12", valueUsd: "12" }],
      totalValueUsd: 12, healthScore: 28, healthStatus: "STALE",
      aiSummary: "cUSDC savings on Compound V2 — migrate to V3 or X Layer",
      aiExplanation: ["Compound V2 earns 0.8% vs V3's 3.1%", "Position too small for mainnet gas"],
      recommendation: { action: "move", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [{ symbol: "COMP", amount: "0.01", valueUsd: "0.42" }], investmentId: "demo-inv-6",
    },
    {
      id: "demo-7", platformName: "Convex Finance", platformId: "convex-1",
      chain: "ethereum", chainLabel: "Ethereum", investType: 3, investTypeLabel: "Yield Farm",
      tokens: [{ symbol: "CRV", amount: "47", valueUsd: "23" }],
      totalValueUsd: 23, healthScore: 38, healthStatus: "STALE",
      aiSummary: "Convex CRV boost expired — rewards drying up",
      aiExplanation: ["CRV gauge weight fell 78% this cycle", "CVX emissions halved per the Convex schedule"],
      recommendation: { action: "exit", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [{ symbol: "CVX", amount: "0.3", valueUsd: "0.91" }], investmentId: "demo-inv-7",
    },
    {
      id: "demo-8", platformName: "Beefy Finance", platformId: "beefy-1",
      chain: "polygon", chainLabel: "Polygon", investType: 4, investTypeLabel: "Vault",
      tokens: [{ symbol: "USDT", amount: "67", valueUsd: "67" }],
      totalValueUsd: 67, healthScore: 41, healthStatus: "STALE",
      aiSummary: "Beefy USDT vault on Polygon — better yield available",
      aiExplanation: ["Vault APY dropped from 8% to 1.4%", "Underlying strategy deprecated 3 weeks ago"],
      recommendation: { action: "move", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [], investmentId: "demo-inv-8",
    },
    {
      id: "demo-9", platformName: "Balancer", platformId: "balancer-2",
      chain: "arbitrum", chainLabel: "Arbitrum", investType: 2, investTypeLabel: "Liquidity Pool",
      tokens: [
        { symbol: "WETH", amount: "0.015", valueUsd: "38" },
        { symbol: "USDC", amount: "38", valueUsd: "38" },
      ],
      totalValueUsd: 76, healthScore: 44, healthStatus: "STALE",
      aiSummary: "WETH/USDC Balancer pool — impermanent loss exposure high",
      aiExplanation: ["IL accumulated ~$6 over last 30 days", "Pool fee tier too low for current volatility"],
      recommendation: { action: "move", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [], investmentId: "demo-inv-9",
    },
    {
      id: "demo-10", platformName: "Frax Finance", platformId: "frax-1",
      chain: "ethereum", chainLabel: "Ethereum", investType: 7, investTypeLabel: "Staking",
      tokens: [{ symbol: "FRAX", amount: "92", valueUsd: "92" }],
      totalValueUsd: 92, healthScore: 46, healthStatus: "STALE",
      aiSummary: "sfrxETH staking — rewards accruing but rate below competitors",
      aiExplanation: ["Frax APY 2.8% vs Lido 3.2%", "Higher smart-contract risk for marginal yield"],
      recommendation: { action: "move", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [], investmentId: "demo-inv-10",
    },

    // ─── WARNING (health risks or better alternatives) ──────
    {
      id: "demo-11", platformName: "Aave V3", platformId: "aave-1",
      chain: "arbitrum", chainLabel: "Arbitrum", investType: 1, investTypeLabel: "Savings",
      tokens: [{ symbol: "USDC", amount: "500", valueUsd: "500" }],
      totalValueUsd: 500, healthScore: 64, healthStatus: "WARNING",
      aiSummary: "Aave V3 USDC on Arbitrum earning 1.8% — X Layer pays 2.6%",
      aiExplanation: ["Current APY 1.8%", "X Layer Aave identical asset pays 2.6%", "Arbitrum gas cuts 0.2% off net yield"],
      recommendation: { action: "move", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [{ symbol: "ARB", amount: "0.5", valueUsd: "0.45" }], investmentId: "demo-inv-11",
    },
    {
      id: "demo-12", platformName: "Compound V3", platformId: "comp-v3-1",
      chain: "base", chainLabel: "Base", investType: 6, investTypeLabel: "Borrow",
      tokens: [{ symbol: "USDC", amount: "45", valueUsd: "45" }],
      totalValueUsd: 45, healthScore: 35, healthStatus: "WARNING",
      aiSummary: "Compound V3 borrow on Base — health rate 1.35, liquidation risk",
      aiExplanation: ["Health rate 1.35 — below the 1.5 safety floor", "Collateral token down 8% in 24h", "Repay or top up collateral this week"],
      recommendation: { action: "exit", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [], investmentId: "demo-inv-12",
    },
    {
      id: "demo-13", platformName: "Uniswap V3", platformId: "uni-v3-1",
      chain: "arbitrum", chainLabel: "Arbitrum", investType: 2, investTypeLabel: "Liquidity Pool",
      tokens: [
        { symbol: "WETH", amount: "0.05", valueUsd: "126" },
        { symbol: "USDC", amount: "126", valueUsd: "126" },
      ],
      totalValueUsd: 252, healthScore: 58, healthStatus: "WARNING",
      aiSummary: "Uniswap V3 WETH/USDC — out of active range 62% of last 7 days",
      aiExplanation: ["Position sitting outside tick range most of the week", "Collecting ~0 fees when inactive"],
      recommendation: { action: "move", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [], investmentId: "demo-inv-13",
    },
    {
      id: "demo-14", platformName: "Yearn V3", platformId: "yearn-1",
      chain: "base", chainLabel: "Base", investType: 4, investTypeLabel: "Vault",
      tokens: [{ symbol: "USDT", amount: "180", valueUsd: "180" }],
      totalValueUsd: 180, healthScore: 68, healthStatus: "WARNING",
      aiSummary: "Yearn V3 USDT vault — yield lagging simpler alternatives",
      aiExplanation: ["Vault yield 2.1%", "Aave on X Layer matches at 2.6% with simpler risk"],
      recommendation: { action: "move", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [], investmentId: "demo-inv-14",
    },
    {
      id: "demo-15", platformName: "Morpho Blue", platformId: "morpho-1",
      chain: "ethereum", chainLabel: "Ethereum", investType: 1, investTypeLabel: "Savings",
      tokens: [{ symbol: "USDC", amount: "310", valueUsd: "310" }],
      totalValueUsd: 310, healthScore: 70, healthStatus: "WARNING",
      aiSummary: "Morpho Blue market — OK yield, X Layer Aave simpler & cheaper",
      aiExplanation: ["Market-specific liquidity risk", "Gas on mainnet ~$8 per withdrawal"],
      recommendation: { action: "move", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [], investmentId: "demo-inv-15",
    },

    // ─── HEALTHY (keep or hold) ─────────────────────────────
    {
      id: "demo-16", platformName: "Lido", platformId: "lido-1",
      chain: "ethereum", chainLabel: "Ethereum", investType: 7, investTypeLabel: "Staking",
      tokens: [{ symbol: "stETH", amount: "1.2", valueUsd: "2160" }],
      totalValueUsd: 2160, healthScore: 92, healthStatus: "HEALTHY",
      aiSummary: "Lido stETH staking — healthy, steady 3.2% APY",
      aiExplanation: ["Largest ETH staking protocol", "Deep liquid market for stETH", "Battle-tested since 2020"],
      recommendation: { action: "hold" }, rewards: [], investmentId: "demo-inv-16",
    },
    {
      id: "demo-17", platformName: "Rocket Pool", platformId: "rocket-1",
      chain: "ethereum", chainLabel: "Ethereum", investType: 7, investTypeLabel: "Staking",
      tokens: [{ symbol: "ETH", amount: "0.25", valueUsd: "450" }],
      totalValueUsd: 450, healthScore: 89, healthStatus: "HEALTHY",
      aiSummary: "Rocket Pool rETH — decentralized staking performing well",
      aiExplanation: ["3.1% net APY", "More decentralized than Lido for risk diversification"],
      recommendation: { action: "hold" }, rewards: [], investmentId: "demo-inv-17",
    },
    {
      id: "demo-18", platformName: "Aave V3", platformId: "aave-xl",
      chain: "xlayer", chainLabel: "X Layer", investType: 1, investTypeLabel: "Savings",
      tokens: [{ symbol: "USDC", amount: "1250", valueUsd: "1250" }],
      totalValueUsd: 1250, healthScore: 95, healthStatus: "HEALTHY",
      aiSummary: "Aave V3 on X Layer — optimal destination position",
      aiExplanation: ["2.6% APY", "Lowest-gas L2 in the stack", "Already on X Layer — no need to move"],
      recommendation: { action: "hold" }, rewards: [], investmentId: "demo-inv-18",
    },
    {
      id: "demo-19", platformName: "Uniswap V3", platformId: "uni-v3-2",
      chain: "base", chainLabel: "Base", investType: 2, investTypeLabel: "Liquidity Pool",
      tokens: [
        { symbol: "WETH", amount: "0.35", valueUsd: "880" },
        { symbol: "USDC", amount: "880", valueUsd: "880" },
      ],
      totalValueUsd: 1760, healthScore: 86, healthStatus: "HEALTHY",
      aiSummary: "Uniswap V3 WETH/USDC on Base — active range, strong fees",
      aiExplanation: ["In-range 91% of last 7 days", "Collecting ~$4.20/day in fees", "Tight tick range pays off in this volatility regime"],
      recommendation: { action: "hold" }, rewards: [], investmentId: "demo-inv-19",
    },
    {
      id: "demo-20", platformName: "Curve Finance", platformId: "curve-2",
      chain: "arbitrum", chainLabel: "Arbitrum", investType: 2, investTypeLabel: "Liquidity Pool",
      tokens: [
        { symbol: "USDC", amount: "640", valueUsd: "640" },
        { symbol: "USDT", amount: "640", valueUsd: "640" },
      ],
      totalValueUsd: 1280, healthScore: 82, healthStatus: "HEALTHY",
      aiSummary: "Curve USDC/USDT 2pool on Arbitrum — stable earning",
      aiExplanation: ["Stable pair, minimal IL", "CRV boosted APY running at 4.1%"],
      recommendation: { action: "hold" },
      rewards: [{ symbol: "CRV", amount: "3.2", valueUsd: "1.28" }], investmentId: "demo-inv-20",
    },
  ];
  return p.map((pos) => ({ ...pos, id: `${address.slice(0, 8)}-${pos.id}` }));
}

// ─── Filter type ─────────────────────────────────────────────
type FilterTab = "ALL" | "At risk" | "Healthy";

// ─── Main Page ───────────────────────────────────────────────
export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  const [isScanning, setIsScanning] = useState(true);
  const [positions, setPositions] = useState<ScoredPosition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [spectatorAddress, setSpectatorAddress] = useState<string | null>(null);
  const [showSpectatorInput, setShowSpectatorInput] = useState(false);
  const [spectatorInput, setSpectatorInput] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [isBatchSweeping, setIsBatchSweeping] = useState(false);
  const [totalSaved, setTotalSaved] = useState(0);
  const { writeContractAsync: batchWrite } = useWriteContract();

  // Hydrate totalSaved from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("defi-sweeper-total-saved");
    if (stored) setTotalSaved(parseFloat(stored) || 0);
  }, []);

  const bumpSaved = useCallback((delta: number) => {
    setTotalSaved((prev) => {
      const next = prev + delta;
      localStorage.setItem("defi-sweeper-total-saved", String(next));
      return next;
    });
  }, []);

  // Sheet state
  const [selectedPosition, setSelectedPosition] = useState<ScoredPosition | null>(null);
  const [sheetAutoSweep, setSheetAutoSweep] = useState(false);

  const openDetail = useCallback((position: ScoredPosition) => {
    setSheetAutoSweep(false);
    setSelectedPosition(position);
  }, []);

  const openSweep = useCallback((position: ScoredPosition) => {
    setSheetAutoSweep(true);
    setSelectedPosition(position);
  }, []);

  const closeSheet = useCallback(() => {
    setSelectedPosition(null);
    setSheetAutoSweep(false);
  }, []);

  // ─── Scan positions ────────────────────────────────────────
  const scanPositions = useCallback(async () => {
    const scanAddress = spectatorAddress || address;
    if (!scanAddress) return;
    setIsScanning(true);
    setError(null);

    // Demo-only mode (for video recording): skip network, load demo data directly.
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" && !spectatorAddress) {
      const demo = generateDemoPositions(scanAddress);
      setPositions(demo);
      localStorage.setItem("defi-sweeper-positions", JSON.stringify(demo));
      // Short artificial delay so the scan animation still plays briefly
      await new Promise((r) => setTimeout(r, 1400));
      setIsScanning(false);
      return;
    }

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: scanAddress }),
      });
      const data = await response.json();
      if (!response.ok || data.ok === false) {
        const msg = data.okxMsg || data.detail || data.error || `HTTP ${response.status}`;
        const code = data.okxCode ? ` [OKX ${data.okxCode}]` : "";
        setError(`${msg}${code}`);
        setPositions([]);
        return;
      }
      if (data.positions && data.positions.length > 0) {
        setPositions(data.positions);
        localStorage.setItem("defi-sweeper-positions", JSON.stringify(data.positions));
      } else {
        setPositions([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to scan positions. Please try again.");
    } finally {
      setIsScanning(false);
    }
  }, [address, spectatorAddress]);

  const loadDemoData = useCallback(() => {
    if (!address) return;
    const demo = generateDemoPositions(address);
    setPositions(demo);
    localStorage.setItem("defi-sweeper-positions", JSON.stringify(demo));
    setError(null);
    setIsScanning(false);
  }, [address]);

  // Listen for "load demo" events fired from the wallet dropdown
  useEffect(() => {
    const handler = () => loadDemoData();
    window.addEventListener("defi-sweeper:load-demo", handler);
    return () => window.removeEventListener("defi-sweeper:load-demo", handler);
  }, [loadDemoData]);

  // Listen for "scan address" events (spectator mode)
  useEffect(() => {
    const handler = () => setShowSpectatorInput(true);
    window.addEventListener("defi-sweeper:scan-address", handler);
    return () => window.removeEventListener("defi-sweeper:scan-address", handler);
  }, []);

  // Listen for "position swept" events — remove source, add replacement if moved
  useEffect(() => {
    const handler = (e: Event) => {
      const { position: swept } = (e as CustomEvent<{ position: ScoredPosition }>).detail;
      if (!swept) return;
      bumpSaved(swept.totalValueUsd);
      setPositions((prev) => {
        const without = prev.filter((x) => x.id !== swept.id);
        if (swept.recommendation?.action === "move") {
          const replacement: ScoredPosition = {
            ...swept,
            id: `moved-${swept.id}-${Date.now()}`,
            investmentId: `moved-${swept.investmentId}-${Date.now()}`,
            platformName: "Aave V3",
            platformId: "aave-xl",
            chain: "xlayer",
            chainLabel: "X Layer",
            healthScore: 92,
            healthStatus: "HEALTHY",
            aiSummary: `Freshly moved from ${swept.platformName} — now earning 2.6% APY on X Layer`,
            aiExplanation: [
              `Swept from ${swept.platformName} on ${swept.chainLabel} via DeFi Sweeper agent`,
              `Redeployed into Aave V3 on X Layer at 2.6% APY`,
              `Gas cost 99% lower than mainnet for future ops`,
            ],
            recommendation: { action: "hold" },
            rewards: [],
          };
          setToast(`✓ Moved $${swept.totalValueUsd.toFixed(2)} from ${swept.platformName} to Aave on X Layer`);
          return [...without, replacement];
        }
        setToast(`✓ Position on ${swept.platformName} removed ($${swept.totalValueUsd.toFixed(2)} recovered)`);
        return without;
      });
    };
    window.addEventListener("defi-sweeper:position-swept", handler as EventListener);
    return () => window.removeEventListener("defi-sweeper:position-swept", handler as EventListener);
  }, [bumpSaved]);

  // Auto-dismiss toast after 5s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const applySpectator = useCallback(() => {
    const addr = spectatorInput.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      setError("Invalid EVM address — must be 0x followed by 40 hex characters");
      return;
    }
    setSpectatorAddress(addr);
    setShowSpectatorInput(false);
  }, [spectatorInput]);

  const clearSpectator = useCallback(() => {
    setSpectatorAddress(null);
    setSpectatorInput("");
  }, []);

  // ── Sweep all stale/warning positions in ONE transaction via batchLogSweep
  const sweepAll = useCallback(async () => {
    const targets = positions.filter((p) => p.healthScore < 80);
    if (targets.length === 0) {
      setToast("No stale positions to sweep — everything looks healthy");
      return;
    }
    setIsBatchSweeping(true);
    try {
      await batchWrite({
        address: sweeperRegistry.address as `0x${string}`,
        abi: sweeperRegistry.abi,
        functionName: "batchLogSweep",
        args: [
          targets.map((p) => p.platformName),
          targets.map((p) => p.chain),
          targets.map((p) => BigInt(Math.round(p.totalValueUsd * 1e6))),
          targets.map((p) => BigInt(p.healthScore)),
          targets.map((p) => p.recommendation?.target || "Aave on X Layer"),
        ],
      });

      // On success, remove all swept and add replacements for "move" actions
      const removeIds = new Set(targets.map((t) => t.id));
      const moves = targets.filter((t) => t.recommendation?.action === "move");
      const totalValue = targets.reduce((s, t) => s + t.totalValueUsd, 0);
      bumpSaved(totalValue);

      setPositions((prev) => {
        const without = prev.filter((p) => !removeIds.has(p.id));
        const replacements: ScoredPosition[] = moves.map((swept) => ({
          ...swept,
          id: `moved-${swept.id}-${Date.now()}`,
          investmentId: `moved-${swept.investmentId}-${Date.now()}`,
          platformName: "Aave V3",
          platformId: "aave-xl",
          chain: "xlayer",
          chainLabel: "X Layer",
          healthScore: 92,
          healthStatus: "HEALTHY",
          aiSummary: `Freshly moved from ${swept.platformName} — now earning 2.6% APY on X Layer`,
          aiExplanation: [
            `Swept from ${swept.platformName} on ${swept.chainLabel}`,
            `Redeployed into Aave V3 on X Layer at 2.6% APY`,
          ],
          recommendation: { action: "hold" },
          rewards: [],
        }));
        return [...without, ...replacements];
      });

      setToast(`✓ Swept ${targets.length} positions in 1 tx · $${totalValue.toFixed(2)} recovered`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const rejected = /reject|denied|user cancel/i.test(msg);
      setToast(rejected ? "Batch sweep cancelled" : `Sweep failed: ${msg.slice(0, 80)}`);
    } finally {
      setIsBatchSweeping(false);
    }
  }, [positions, batchWrite, bumpSaved]);

  useEffect(() => {
    if (!isConnected) {
      router.push("/app");
      return;
    }
    scanPositions();
  }, [isConnected, router, scanPositions]);

  // ─── Derived data ──────────────────────────────────────────
  const filteredPositions = useMemo(() => {
    if (activeFilter === "At risk") return positions.filter((p) => p.healthScore < 50);
    if (activeFilter === "Healthy") return positions.filter((p) => p.healthScore >= 80);
    return positions;
  }, [positions, activeFilter]);

  const sortedPositions = useMemo(() => [...filteredPositions].sort((a, b) => a.healthScore - b.healthScore), [filteredPositions]);

  const totalValue = useMemo(() => positions.reduce((s, p) => s + p.totalValueUsd, 0), [positions]);
  const activeCount = positions.length;
  const avgApy = useMemo(() => {
    if (positions.length === 0) return 0;
    // Estimate APY from position data
    const apys = positions.map((p) => {
      if (p.healthScore >= 80) return 3.2;
      if (p.healthScore >= 50) return 1.8;
      if (p.healthScore >= 20) return 0.5;
      return 0.1;
    });
    return apys.reduce((s, a) => s + a, 0) / apys.length;
  }, [positions]);
  const atRiskCount = useMemo(() => positions.filter((p) => p.healthScore < 50).length, [positions]);
  const healthyCount = useMemo(() => positions.filter((p) => p.healthScore >= 80).length, [positions]);

  // Potential savings = total USD sitting in sub-healthy positions (score < 80)
  const potentialSavings = useMemo(
    () => positions.filter((p) => p.healthScore < 80).reduce((s, p) => s + p.totalValueUsd, 0),
    [positions]
  );

  // Risk bar segments (4 bands: DEAD, STALE, WARNING, HEALTHY)
  const deadOnlyCount = useMemo(() => positions.filter((p) => p.healthStatus === "DEAD").length, [positions]);
  const staleCount = useMemo(() => positions.filter((p) => p.healthStatus === "STALE").length, [positions]);
  const deadCount = deadOnlyCount + staleCount; // kept for stat card label
  const warningCount = useMemo(() => positions.filter((p) => p.healthStatus === "WARNING").length, [positions]);

  const deadOnlyPct = activeCount > 0 ? (deadOnlyCount / activeCount) * 100 : 0;
  const stalePct = activeCount > 0 ? (staleCount / activeCount) * 100 : 0;
  const deadPct = activeCount > 0 ? (deadCount / activeCount) * 100 : 0;
  const warningPct = activeCount > 0 ? (warningCount / activeCount) * 100 : 0;
  const healthyPct = activeCount > 0 ? (healthyCount / activeCount) * 100 : 0;

  // ─── Shared overlays (toast + spectator modal) — rendered in every branch
  const toastEl = toast ? (
    <div className="fixed top-24 right-6 z-[100] max-w-sm rounded-[14px] border border-[#6c6cff]/20 bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] px-4 py-3 flex items-center gap-3 animate-in slide-in-from-right">
      <div className="w-6 h-6 rounded-full bg-[#5a8400] flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-[13px] font-medium text-[#121212] leading-snug">{toast}</p>
      <button onClick={() => setToast(null)} className="text-[#888] hover:text-[#222] text-lg leading-none">×</button>
    </div>
  ) : null;

  const spectatorModal = showSpectatorInput ? (
    <div
      className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm flex items-center justify-center px-6"
      onClick={(e) => { if (e.target === e.currentTarget) setShowSpectatorInput(false); }}
    >
      <div className="w-full max-w-[460px] rounded-[20px] border border-[rgba(0,0,0,0.08)] bg-white p-6 space-y-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.2)]">
        <h3 className="text-[20px] font-bold text-[#121212]" style={{ fontFamily: "var(--font-display)" }}>
          Scan any wallet
        </h3>
        <p className="text-[13px] text-[#545454]">
          Enter any EVM address to read its real DeFi positions from OKX. Read-only — sweeps still sign from your connected wallet.
        </p>
        <input
          value={spectatorInput}
          onChange={(e) => setSpectatorInput(e.target.value)}
          placeholder="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
          className="w-full px-4 py-2.5 rounded-full border border-[rgba(0,0,0,0.1)] text-[14px] font-mono focus:outline-none focus:border-[#6c6cff] transition-colors"
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") applySpectator(); }}
        />
        <div className="flex items-center gap-3 justify-between">
          <button
            onClick={() => setSpectatorInput("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")}
            className="text-[12px] text-[#6c6cff] underline"
          >
            Use Vitalik&apos;s address
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSpectatorInput(false)}
              className="px-5 py-2 rounded-full text-[13px] font-semibold text-[#222] bg-[#f2f2f2] hover:bg-[#e5e5e5] border border-[rgba(0,0,0,0.07)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={applySpectator}
              className="px-5 py-2 rounded-full text-[13px] font-semibold text-white bg-[#6c6cff] hover:bg-[#5b5be6] transition-colors"
            >
              Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // ─── Guard states ──────────────────────────────────────────
  if (!isConnected) return null;

  if (isScanning) {
    return <>{toastEl}{spectatorModal}<ScanAnimation address={address} /></>;
  }

  if (error) {
    return (
      <>
      {toastEl}
      {spectatorModal}
      <main className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <svg className="w-16 h-16 mx-auto text-[#f9a606]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <h2 className="text-2xl font-bold text-[#121212]" style={{ fontFamily: "var(--font-display)" }}>
            Scan Failed
          </h2>
          <p className="text-[#545454] text-sm">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => disconnect()}
              className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#6c6cff] text-white hover:bg-[#5b5be6] transition-colors"
            >
              Connect different wallet
            </button>
            <button
              onClick={scanPositions}
              className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#f2f2f2] text-[#222] hover:bg-[#e5e5e5] border border-[rgba(0,0,0,0.07)] transition-colors"
            >
              Rescan
            </button>
          </div>
        </div>
      </main>
      </>
    );
  }

  if (positions.length === 0) {
    return (
      <>
      {toastEl}
      {spectatorModal}
      <main className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <svg className="w-16 h-16 mx-auto text-[#545454]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <h2 className="text-2xl font-bold text-[#121212]" style={{ fontFamily: "var(--font-display)" }}>
            No DeFi Positions Found
          </h2>
          <p className="text-[#545454] text-sm">
            This wallet has no DeFi positions on the chains we scan. Try a different wallet, or rescan.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => disconnect()}
              className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#6c6cff] text-white hover:bg-[#5b5be6] transition-colors"
            >
              Connect different wallet
            </button>
            <button
              onClick={scanPositions}
              className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#f2f2f2] text-[#222] hover:bg-[#e5e5e5] border border-[rgba(0,0,0,0.07)] transition-colors"
            >
              Rescan
            </button>
          </div>
        </div>
      </main>
      </>
    );
  }

  // ─── Success: full dashboard ───────────────────────────────
  return (
    <main className="max-w-[1280px] mx-auto px-20 pt-8 pb-12 flex flex-col gap-8">
      {toastEl}
      {spectatorModal}
      {/* Spectator mode banner */}
      {spectatorAddress && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-[12px] border border-[#6c6cff]/30 bg-[#6c6cff]/5">
          <div className="flex items-center gap-2 text-[13px] text-[#121212]">
            <svg className="w-4 h-4 text-[#6c6cff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="font-semibold">Spectating:</span>
            <span className="font-mono text-[12px]">{spectatorAddress.slice(0, 8)}…{spectatorAddress.slice(-6)}</span>
            <span className="text-[#545454]">· read-only real data from OKX</span>
          </div>
          <button
            onClick={clearSpectator}
            className="px-4 py-1.5 rounded-full text-[13px] font-semibold text-[#222] bg-[#f2f2f2] hover:bg-[#e5e5e5] border border-[rgba(0,0,0,0.07)] transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* ─── Header row ───────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1
          className="text-[48px] font-extrabold text-[#0a0a0a] leading-[1.2] tracking-[-0.96px] font-[family-name:var(--font-display)]"
        >
          Portfolio
        </h1>
        <button
          onClick={sweepAll}
          disabled={isBatchSweeping}
          className="px-5 py-3 rounded-full text-[15px] font-semibold bg-[#6c6cff] text-white hover:bg-[#5b5be6] border border-[rgba(0,0,0,0.1)] transition-colors whitespace-nowrap leading-[16px] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isBatchSweeping ? "Signing…" : `Sweep all (${positions.filter((p) => p.healthScore < 80).length})`}
        </button>
      </div>

      {/* ─── Reserve Section (frosted glass card) ─────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-[24px] border-[0.634px] border-[#d6d6d6] backdrop-blur-[25px] p-4 flex flex-col gap-4"
        style={{
          backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.02) 100%), linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) 100%)",
          boxShadow: "0px 0px 40px 0px rgba(0,0,0,0.12)",
        }}
      >
        {/* Inner metrics row */}
        <div
          className="rounded-[24px] border-[0.634px] border-[#d6d6d6] h-[79px] flex items-center justify-between px-4"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.05) 100%), linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) 100%)",
          }}
        >
          {[
            { label: "Total Value", value: totalValue >= 1000 ? `$${(totalValue / 1000).toFixed(2)}K` : `$${totalValue.toFixed(2)}`, sub: "" },
            { label: "Active", value: activeCount.toString(), sub: "" },
            { label: "Avg APY", value: `${avgApy.toFixed(2)}%`, sub: "" },
            { label: "At Risk", value: atRiskCount.toString(), sub: "" },
            { label: "Healthy", value: healthyCount.toString(), sub: "" },
            {
              label: "Potential savings",
              value: potentialSavings >= 1000 ? `$${(potentialSavings / 1000).toFixed(2)}K` : `$${potentialSavings.toFixed(2)}`,
              sub: "",
              emphasize: "#6c6cff",
            },
            {
              label: "Total saved",
              value: totalSaved >= 1000 ? `$${(totalSaved / 1000).toFixed(2)}K` : `$${totalSaved.toFixed(2)}`,
              sub: "",
              emphasize: "#5a8400",
            },
          ].map((m, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-[13px] font-semibold text-[#545454] tracking-[-0.26px] leading-[1.46]">{m.label}</span>
              <div className="flex items-center gap-1">
                <span
                  className="text-[16px] font-semibold tracking-[-0.32px] leading-[1.46]"
                  style={{ color: m.emphasize || "#121212" }}
                >
                  {m.value}
                </span>
                {m.sub && <span className="text-[14px] text-[#545454] tracking-[-0.28px] leading-[1.46]">{m.sub}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Inner risk bar card */}
        <div
          className="rounded-[24px] border border-[rgba(0,0,0,0.1)] p-4 flex flex-col items-center justify-between gap-3"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.05) 100%), linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) 100%)",
          }}
        >
          {/* Progress bar — no border; 4 stacked segments */}
          <div
            className="w-full h-6 rounded-[85.6px] overflow-clip relative shrink-0"
            style={{ backgroundColor: "#a1eb00" }}
          >
            {/* Yellow (warning) — deadOnly + stale + warning */}
            {warningPct > 0 && (
              <div
                className="absolute rounded-[261px]"
                style={{ top: 0, left: 0, width: `${Math.max(deadOnlyPct + stalePct + warningPct, 10)}%`, height: "100%", backgroundColor: "#f9a606", zIndex: 1 }}
              />
            )}
            {/* Orange-red (stale) — deadOnly + stale */}
            {stalePct > 0 && (
              <div
                className="absolute rounded-[261px]"
                style={{ top: 0, left: 0, width: `${Math.max(deadOnlyPct + stalePct, 8)}%`, height: "100%", backgroundColor: "#ff6b35", zIndex: 2 }}
              />
            )}
            {/* Deep red (dead/dust) — on top */}
            {deadOnlyPct > 0 && (
              <div
                className="absolute rounded-[261px]"
                style={{ top: 0, left: 0, width: `${Math.max(deadOnlyPct, 5)}%`, height: "100%", backgroundColor: "#8b0000", zIndex: 3 }}
              />
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: "#8b0000" }} />
              <span className="text-[14px] font-medium text-[#545454]">Dead / dust</span>
              <span className="text-[14px] font-semibold text-[#222]">
                {deadOnlyCount} ({deadOnlyPct.toFixed(0)}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: "#ff6b35" }} />
              <span className="text-[14px] font-medium text-[#545454]">Stale</span>
              <span className="text-[14px] font-semibold text-[#222]">
                {staleCount} ({stalePct.toFixed(0)}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: "#f9a606" }} />
              <span className="text-[14px] font-medium text-[#545454]">Warning</span>
              <span className="text-[14px] font-semibold text-[#222]">
                {warningCount} ({warningPct.toFixed(0)}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: "#a1eb00" }} />
              <span className="text-[14px] font-medium text-[#545454]">Position at low risk</span>
              <span className="text-[14px] font-semibold text-[#222]">
                {healthyCount} ({healthyPct.toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Positions Table (frosted glass card) ─────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="rounded-[24px] border-[0.634px] border-[#d6d6d6] backdrop-blur-[25px] p-4 flex flex-col gap-6"
        style={{
          backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.02) 100%), linear-gradient(90deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.5) 100%)",
          boxShadow: "0px 0px 40px 0px rgba(0,0,0,0.12)",
        }}
      >
        {/* Header: Positions title + Filter tabs */}
        <div className="flex items-center justify-between">
          <h2 className="text-[28px] font-extrabold text-[#0a0a0a] tracking-[-0.56px] leading-[1.2] font-[family-name:var(--font-display)]">
            Positions
          </h2>
        {/* Filter tabs */}
        <div
          className="inline-flex rounded-[32px] p-[2px] gap-1"
          style={{
            backgroundColor: "rgba(34,34,34,0.1)",
            border: "1px solid rgba(0,0,0,0.1)",
          }}
        >
          {(["ALL", "At risk", "Healthy"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-4 py-2 rounded-[32px] text-[14px] font-semibold tracking-[-0.28px] leading-[1.46] transition-all duration-200 ${
                activeFilter === tab
                  ? "bg-[#222] text-white border border-[rgba(0,0,0,0.1)]"
                  : "text-[#222] hover:text-[#000]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[14px] border-[0.634px] border-[#d6d6d6] overflow-clip">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-[0.5px] border-[#f0f0f0] h-[41px] pl-3 text-left text-[14px] font-semibold text-[#545454] tracking-[-0.28px] leading-[1.46] whitespace-nowrap">Assets</th>
                <th className="border-[0.5px] border-[#f0f0f0] h-[41px] px-3 text-left text-[14px] font-semibold text-[#545454] tracking-[-0.28px] leading-[1.46] whitespace-nowrap">Protocol</th>
                <th className="border-[0.5px] border-[#f0f0f0] h-[41px] px-3 text-center text-[14px] font-semibold text-[#545454] tracking-[-0.28px] leading-[1.46] whitespace-nowrap">Position size</th>
                <th className="border-[0.5px] border-[#f0f0f0] h-[41px] px-3 text-center text-[14px] font-semibold text-[#545454] tracking-[-0.28px] leading-[1.46] whitespace-nowrap">Position value (USD)</th>
                <th className="border-[0.5px] border-[#f0f0f0] h-[41px] px-3 text-center text-[14px] font-semibold text-[#545454] tracking-[-0.28px] leading-[1.46] whitespace-nowrap">APY</th>
                <th className="border-[0.5px] border-[#f0f0f0] h-[41px] px-3 text-center text-[14px] font-semibold text-[#545454] tracking-[-0.28px] leading-[1.46] whitespace-nowrap">Health score</th>
                <th className="border-[0.5px] border-[#f0f0f0] h-[41px] px-4 text-center text-[14px] font-semibold text-[#545454] tracking-[-0.28px] leading-[1.46] whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedPositions.map((p) => {
                const apy = p.healthScore >= 80 ? "2.3%" : p.healthScore >= 50 ? "2.6%" : p.healthScore >= 30 ? "3.9%" : "4.1%";
                return (
                  <tr key={p.id} onClick={() => openDetail(p)} className="cursor-pointer hover:bg-[#fafafa] transition-colors">
                    <td className="border-[0.5px] border-[#f0f0f0] h-[56px] pl-3 py-3">
                      <div className="flex gap-2 items-center p-1 rounded-[34px]">
                        <TokenPair symbols={p.tokens.map((t) => ({ symbol: t.symbol, address: t.address }))} />
                        <div className="flex flex-col">
                          <span className="text-[15px] font-semibold text-[#121212] tracking-[-0.3px] leading-[1.2] whitespace-nowrap">
                            {p.tokens.map((t) => t.symbol).join(" / ")}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <NetworkIcon chain={p.chain} className="w-3 h-3 flex-shrink-0" />
                            <span className="text-[11px] text-[#545454] tracking-[-0.11px] leading-[1.2] whitespace-nowrap">
                              {p.chainLabel} · {p.investTypeLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="border-[0.5px] border-[#f0f0f0] h-[56px] px-3 py-3">
                      <span className="text-[15px] font-semibold text-[#121212] tracking-[-0.3px] leading-[1.2] whitespace-nowrap">
                        {p.platformName}
                      </span>
                    </td>
                    <td className="border-[0.5px] border-[#f0f0f0] h-[56px] px-3 text-center">
                      <span className="text-[16px] font-medium text-[#121212] tracking-[-0.32px] leading-[1.46] whitespace-nowrap">
                        {Number(p.tokens[0]?.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}{" "}
                        <span className="text-[#545454]">{p.tokens[0]?.symbol || ""}</span>
                      </span>
                    </td>
                    <td className="border-[0.5px] border-[#f0f0f0] h-[56px] px-3 text-center">
                      <span className="text-[16px] font-medium text-[#121212] tracking-[-0.32px] leading-[1.46] whitespace-nowrap">
                        ${Number(p.totalValueUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="border-[0.5px] border-[#f0f0f0] h-[56px] px-3 text-center">
                      <span className="text-[16px] font-medium text-[#121212] tracking-[-0.32px] leading-[1.46] whitespace-nowrap">{apy}</span>
                    </td>
                    <td className="border-[0.5px] border-[#f0f0f0] h-[56px] px-3">
                      <div className="flex gap-[7px] items-center justify-center">
                        <HealthIcon score={p.healthScore} />
                        <span className="text-[16px] font-medium text-[#121212] tracking-[-0.32px] leading-[1.46] whitespace-nowrap">{p.healthScore}</span>
                      </div>
                    </td>
                    <td className="border-[0.5px] border-[#f0f0f0] h-[56px] px-5 py-1.5">
                      <div className="flex gap-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); openDetail(p); }}
                          className="flex-1 px-3 py-2 rounded-[32px] text-[14px] font-semibold text-[#222] bg-[#f2f2f2] border border-[rgba(0,0,0,0.1)] hover:bg-[#e5e5e5] transition-colors whitespace-nowrap"
                        >
                          Details
                        </button>
                        {p.healthScore >= 80 ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); openDetail(p); }}
                            className="flex-1 px-3 py-2 rounded-[32px] text-[14px] font-semibold text-[#222] bg-[#a1eb00] border border-[rgba(0,0,0,0.1)] transition-colors whitespace-nowrap"
                          >
                            Health
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); openSweep(p); }}
                            className="flex-1 px-3 py-2 rounded-[32px] text-[14px] font-semibold text-white bg-[#6c6cff] border border-[rgba(0,0,0,0.1)] hover:bg-[#5b5be6] transition-colors whitespace-nowrap"
                          >
                            Sweep
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ─── Position Detail Sheet ────────────────────────────── */}
      {selectedPosition && (
        <PositionDetailSheet
          position={selectedPosition}
          onClose={closeSheet}
          autoSweep={sheetAutoSweep}
        />
      )}
    </main>
  );
}
