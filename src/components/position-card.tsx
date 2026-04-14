"use client";

import { type ScoredPosition } from "@/lib/types";
import { HealthScore, HealthBadge } from "./health-score";
import { NetworkIcon, TokenPair } from "./web3-icons";

interface PositionCardProps {
  position: ScoredPosition;
  onSweep?: (position: ScoredPosition) => void;
  onDetail?: (position: ScoredPosition) => void;
}

export function PositionCard({ position, onSweep, onDetail }: PositionCardProps) {
  const isActionable = position.healthScore < 50;

  return (
    <div
      onClick={() => onDetail?.(position)}
      className="group rounded-xl border border-[#E5E5E5] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-4 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB] transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center gap-4">
        {/* Health Score */}
        <HealthScore
          score={position.healthScore}
          status={position.healthStatus}
          size="sm"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[#121212] truncate">
              {position.platformName}
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F5F5F5] text-[#545454]">
              <NetworkIcon chain={position.chain} className="w-3 h-3" />
              {position.chainLabel}
            </span>
            <HealthBadge status={position.healthStatus} />
          </div>
          <div className="flex items-center gap-2 text-sm text-[#545454]">
            <span>{position.investTypeLabel}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <TokenPair symbols={position.tokens.map((t) => ({ symbol: t.symbol, address: t.address }))} className="w-4 h-4" />
              {position.tokens.map((t) => t.symbol).join(" / ")}
            </span>
          </div>
          <p className="text-xs text-[#545454] mt-1 truncate">
            {position.aiSummary}
          </p>
        </div>

        {/* Value + Action */}
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-[#121212]">
            ${position.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex gap-2 justify-end">
            <span className="text-xs text-[#6c6cff] group-hover:text-[#8383ff] transition-colors">
              Details →
            </span>
            {isActionable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSweep?.(position);
                }}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#6c6cff] text-white hover:bg-[#5b5be6] transition-colors"
              >
                Sweep
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
