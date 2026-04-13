"use client";

import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { ScanAnimation } from "@/components/scan-animation";
import { PositionDetailSheet } from "@/components/position-detail-sheet";
import { type ScoredPosition, type HealthStatus } from "@/lib/types";
import { getHealthStatus, getHealthColor } from "@/lib/scoring";
import { motion } from "framer-motion";
import { tokenIcons } from "@web3icons/react";

// ─── Token Icon helper ───────────────────────────────────────
function TokenIcon({ symbol }: { symbol: string }) {
  const normalized = symbol.toUpperCase().replace(/\./g, "");
  const key = `Token${normalized}`;
  const IconComponent = (tokenIcons as Record<string, React.ComponentType<{ className?: string }>>)[key];
  if (IconComponent) return <IconComponent className="w-6 h-6 flex-shrink-0" />;
  return (
    <div className="w-6 h-6 flex-shrink-0 rounded-full bg-[#e5e5e5] flex items-center justify-center text-[10px] font-bold text-[#545454]">
      {symbol.slice(0, 2)}
    </div>
  );
}

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

// ─── Demo data ───────────────────────────────────────────────
function generateDemoPositions(address: string): ScoredPosition[] {
  return [
    {
      id: "demo-1",
      platformName: "SushiSwap",
      platformId: "sushi-1",
      chain: "ethereum",
      chainLabel: "Ethereum",
      investType: 2,
      investTypeLabel: "Liquidity Pool",
      tokens: [
        { symbol: "ETH", amount: "0.21", valueUsd: "190.00" },
        { symbol: "USDC", amount: "190", valueUsd: "190.00" },
      ],
      totalValueUsd: 380,
      healthScore: 12,
      healthStatus: "DEAD" as HealthStatus,
      aiSummary: "Yield dropped 95%, protocol inactive 6 months",
      aiExplanation: [
        "Yield dropped from 12% to 0.3% since entry",
        "Protocol TVL fell 85% in 3 months",
        "No GitHub commits in 5 months",
        "Position lost $23 to impermanent loss",
      ],
      recommendation: { action: "exit" as const, target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [{ symbol: "SUSHI", amount: "2.3", valueUsd: "2.30" }],
      investmentId: "demo-inv-1",
    },
    {
      id: "demo-2",
      platformName: "Curve Finance",
      platformId: "curve-1",
      chain: "ethereum",
      chainLabel: "Ethereum",
      investType: 2,
      investTypeLabel: "Liquidity Pool",
      tokens: [
        { symbol: "DAI", amount: "75", valueUsd: "75.00" },
        { symbol: "USDC", amount: "75", valueUsd: "75.00" },
      ],
      totalValueUsd: 150,
      healthScore: 35,
      healthStatus: "STALE" as HealthStatus,
      aiSummary: "Very low APY, better opportunities available",
      aiExplanation: [
        "Current APY is 0.1% — below savings account rates",
        "Pool TVL declining steadily",
        "Small position size ($150) doesn't justify monitoring effort",
      ],
      recommendation: { action: "move" as const, target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [],
      investmentId: "demo-inv-2",
    },
    {
      id: "demo-3",
      platformName: "Aave V3",
      platformId: "aave-1",
      chain: "arbitrum",
      chainLabel: "Arbitrum",
      investType: 1,
      investTypeLabel: "Savings",
      tokens: [{ symbol: "USDC", amount: "500", valueUsd: "500.00" }],
      totalValueUsd: 500,
      healthScore: 72,
      healthStatus: "WARNING" as HealthStatus,
      aiSummary: "Decent yield but X Layer offers better rates",
      aiExplanation: [
        "Current APY 1.8% — below X Layer Aave (2.6%)",
        "Position is healthy but could be optimized",
        "Arbitrum gas costs eat into small yields",
      ],
      recommendation: { action: "move" as const, target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [{ symbol: "ARB", amount: "0.5", valueUsd: "0.45" }],
      investmentId: "demo-inv-3",
    },
    {
      id: "demo-4",
      platformName: "Lido",
      platformId: "lido-1",
      chain: "ethereum",
      chainLabel: "Ethereum",
      investType: 7,
      investTypeLabel: "Staking",
      tokens: [{ symbol: "stETH", amount: "1.2", valueUsd: "2160.00" }],
      totalValueUsd: 2160,
      healthScore: 92,
      healthStatus: "HEALTHY" as HealthStatus,
      aiSummary: "Position is performing well — steady staking rewards",
      aiExplanation: [
        "Lido is the largest ETH staking protocol",
        "Consistent 3.2% APY",
        "High TVL, audited, battle-tested",
      ],
      recommendation: { action: "hold" as const },
      rewards: [],
      investmentId: "demo-inv-4",
    },
  ].map((p) => ({ ...p, id: `${address.slice(0, 8)}-${p.id}` }));
}

// ─── Filter type ─────────────────────────────────────────────
type FilterTab = "ALL" | "At risk" | "Healthy";

// ─── Main Page ───────────────────────────────────────────────
export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const [isScanning, setIsScanning] = useState(true);
  const [positions, setPositions] = useState<ScoredPosition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");

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
    if (!address) return;
    setIsScanning(true);
    setError(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await response.json();
      if (data.positions && data.positions.length > 0) {
        setPositions(data.positions);
        localStorage.setItem("defi-sweeper-positions", JSON.stringify(data.positions));
      } else {
        setPositions([]);
      }
    } catch {
      setError("Failed to scan positions. Please try again.");
    } finally {
      setIsScanning(false);
    }
  }, [address]);

  const loadDemoData = useCallback(() => {
    if (!address) return;
    const demo = generateDemoPositions(address);
    setPositions(demo);
    localStorage.setItem("defi-sweeper-positions", JSON.stringify(demo));
    setError(null);
    setIsScanning(false);
  }, [address]);

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
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

  // Risk bar segments
  const deadCount = useMemo(() => positions.filter((p) => p.healthStatus === "DEAD" || p.healthStatus === "STALE").length, [positions]);
  const warningCount = useMemo(() => positions.filter((p) => p.healthStatus === "WARNING").length, [positions]);

  const deadPct = activeCount > 0 ? (deadCount / activeCount) * 100 : 0;
  const warningPct = activeCount > 0 ? (warningCount / activeCount) * 100 : 0;
  const healthyPct = activeCount > 0 ? (healthyCount / activeCount) * 100 : 0;

  // ─── Guard states ──────────────────────────────────────────
  if (!isConnected) return null;

  if (isScanning) {
    return <ScanAnimation address={address} />;
  }

  if (error) {
    return (
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
              onClick={scanPositions}
              className="px-6 py-2.5 rounded-[32px] text-sm font-semibold bg-[#6c6cff] text-white hover:bg-[#5b5be6] transition-colors"
            >
              Retry
            </button>
            <button
              onClick={loadDemoData}
              className="px-6 py-2.5 rounded-[32px] text-sm font-semibold bg-[#f2f2f2] text-[#222] hover:bg-[#e5e5e5] transition-colors"
            >
              Use Demo Data
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (positions.length === 0) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <svg className="w-16 h-16 mx-auto text-[#545454]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <h2 className="text-2xl font-bold text-[#121212]" style={{ fontFamily: "var(--font-display)" }}>
            No DeFi Positions Found
          </h2>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadDemoData}
              className="px-6 py-2.5 rounded-[32px] text-sm font-semibold bg-[#6c6cff] text-white hover:bg-[#5b5be6] transition-colors"
            >
              Use Demo Data
            </button>
            <button
              onClick={scanPositions}
              className="px-6 py-2.5 rounded-[32px] text-sm font-semibold bg-[#f2f2f2] text-[#222] hover:bg-[#e5e5e5] transition-colors"
            >
              Rescan
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ─── Success: full dashboard ───────────────────────────────
  return (
    <main className="max-w-[1280px] mx-auto px-20 pt-8 pb-12 flex flex-col gap-8">
      {/* ─── Header row ───────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1
          className="text-[48px] font-extrabold text-[#0a0a0a] leading-[1.2] tracking-[-0.96px] font-[family-name:var(--font-display)]"
        >
          Portfolio
        </h1>
        <button
          onClick={() => { const f = positions.find((p) => p.healthScore < 50); if (f) openSweep(f); }}
          className="px-3 py-3 rounded-[32px] text-[16px] font-semibold bg-[#6c6cff] text-white hover:bg-[#5b5be6] border border-[rgba(0,0,0,0.1)] transition-colors whitespace-nowrap leading-[16px] capitalize"
        >
          Sweep all
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
            { label: "Total Value", value: totalValue >= 1000 ? `${(totalValue / 1000).toFixed(2)}K` : `$${totalValue.toFixed(2)}`, sub: `($${totalValue >= 1000 ? (totalValue / 1000).toFixed(2) + "k" : totalValue.toFixed(2)} USD)` },
            { label: "Active Positions", value: activeCount.toString(), sub: "" },
            { label: "Avg APY", value: `${avgApy.toFixed(2)}%`, sub: "" },
            { label: "At Risk positions", value: atRiskCount.toString(), sub: "" },
            { label: "Health positions", value: healthyCount.toString(), sub: "" },
          ].map((m, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-[14px] font-semibold text-[#545454] tracking-[-0.28px] leading-[1.46]">{m.label}</span>
              <div className="flex items-center gap-1">
                <span className="text-[16px] font-semibold text-[#121212] tracking-[-0.32px] leading-[1.46]">{m.value}</span>
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
          {/* Progress bar — no border */}
          <div
            className="w-full h-6 rounded-[85.6px] overflow-clip relative shrink-0"
            style={{ backgroundColor: "#a1eb00" }}
          >
            {/* Yellow segment (warning) — z-index 1 */}
            {warningPct > 0 && (
              <div
                className="absolute rounded-[261px]"
                style={{
                  top: 0,
                  left: 0,
                  width: `${Math.max(deadPct + warningPct, 10)}%`,
                  height: "100%",
                  backgroundColor: "#f9a606",
                  zIndex: 1,
                }}
              />
            )}
            {/* Red segment (high risk) — z-index 2, on top */}
            {deadPct > 0 && (
              <div
                className="absolute rounded-[261px]"
                style={{
                  top: 0,
                  left: 0,
                  width: `${Math.max(deadPct, 5)}%`,
                  height: "100%",
                  backgroundColor: "#e62e24",
                  zIndex: 2,
                }}
              />
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: "#e62e24" }} />
              <span className="text-[14px] font-medium text-[#545454]">Position at high risk</span>
              <span className="text-[14px] font-semibold text-[#222]">
                {deadCount} ({deadPct.toFixed(0)}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: "#f9a606" }} />
              <span className="text-[14px] font-medium text-[#545454]">Position at medium risk</span>
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
                <th className="border-[0.5px] border-[#f0f0f0] h-[41px] pr-3 text-right text-[14px] font-semibold text-[#545454] tracking-[-0.28px] leading-[1.46] whitespace-nowrap">Wallet</th>
                <th className="border-[0.5px] border-[#f0f0f0] h-[41px] pr-3 text-right text-[14px] font-semibold text-[#545454] tracking-[-0.28px] leading-[1.46] whitespace-nowrap">desposit</th>
                <th className="border-[0.5px] border-[#f0f0f0] h-[41px] pr-3 text-right text-[14px] font-semibold text-[#545454] tracking-[-0.28px] leading-[1.46] whitespace-nowrap">APY</th>
                <th className="border-[0.5px] border-[#f0f0f0] h-[41px] pr-3 text-right text-[14px] font-semibold text-[#545454] tracking-[-0.28px] leading-[1.46] whitespace-nowrap">Health scrore</th>
                <th className="border-[0.5px] border-[#f0f0f0] h-[41px] px-4 text-center text-[14px] font-semibold text-[#545454] tracking-[-0.28px] leading-[1.46] whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedPositions.map((p) => {
                const apy = p.healthScore >= 80 ? "2.3%" : p.healthScore >= 50 ? "2.6%" : p.healthScore >= 30 ? "3.9%" : "4.1%";
                return (
                  <tr key={p.id} onClick={() => openDetail(p)} className="cursor-pointer hover:bg-[#fafafa] transition-colors">
                    <td className="border-[0.5px] border-[#f0f0f0] h-[56px] pl-3 py-3">
                      <div className="flex gap-1 items-center p-1 rounded-[34px]">
                        <TokenIcon symbol={p.tokens[0]?.symbol || "?"} />
                        <span className="text-[16px] font-semibold text-[#121212] tracking-[-0.32px] leading-[1.46] whitespace-nowrap">{p.platformName}</span>
                      </div>
                    </td>
                    <td className="border-[0.5px] border-[#f0f0f0] h-[56px] pr-3 text-right">
                      <span className="text-[16px] font-medium text-[#121212] tracking-[-0.32px] leading-[1.46] whitespace-nowrap">
                        {Number(p.tokens[0]?.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="border-[0.5px] border-[#f0f0f0] h-[56px] pr-3 text-right">
                      <span className="text-[16px] font-medium text-[#121212] tracking-[-0.32px] leading-[1.46] whitespace-nowrap">
                        {Number(p.totalValueUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="border-[0.5px] border-[#f0f0f0] h-[56px] pr-3 text-right">
                      <span className="text-[16px] font-medium text-[#121212] tracking-[-0.32px] leading-[1.46] whitespace-nowrap">{apy}</span>
                    </td>
                    <td className="border-[0.5px] border-[#f0f0f0] h-[56px] pr-3">
                      <div className="flex gap-[7px] items-center justify-end">
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
