import type { HealthStatus, ScoredPosition, PositionDetail } from "./types";
import { INVEST_TYPE_LABELS } from "./types";
import { getChainByName } from "./chains";

export function getHealthStatus(score: number): HealthStatus {
  if (score <= 19) return "DEAD";
  if (score <= 49) return "STALE";
  if (score <= 79) return "WARNING";
  return "HEALTHY";
}

export function getHealthColor(status: HealthStatus): string {
  switch (status) {
    case "DEAD":
      return "#e62e24";
    case "STALE":
      return "#e62e24";
    case "WARNING":
      return "#f9a606";
    case "HEALTHY":
      return "#5a8400";
  }
}

// Scoring engine — produces realistic scores based on real position data
export function mockScorePosition(
  detail: PositionDetail,
  chain: string
): ScoredPosition {
  const totalValue = detail.tokenList.reduce(
    (sum, t) => sum + parseFloat(t.currencyAmount || "0"),
    0
  );

  const rewardValue = (detail.rewardList || []).reduce(
    (sum, r) => sum + parseFloat(r.currencyAmount || "0"),
    0
  );

  const hasRewards =
    detail.rewardList &&
    detail.rewardList.some((r) => parseFloat(r.coinAmount) > 0);

  const healthRate = detail.healthRate
    ? parseFloat(detail.healthRate)
    : undefined;

  // ─── Heuristic scoring ─────────────────────────────────────
  let score: number;

  if (totalValue < 1) {
    // Very small value (< $1) → DEAD range: 5-15
    score = 5 + Math.round(totalValue * 10);
  } else if (totalValue < 10) {
    // Small value (< $10) → STALE range: 15-30
    score = 15 + Math.round((totalValue / 10) * 15);
  } else if (totalValue < 50) {
    // Medium-small → WARNING-low range: 30-50
    score = 30 + Math.round(((totalValue - 10) / 40) * 20);
  } else if (totalValue < 100) {
    // Medium → WARNING range: 50-65
    score = 50 + Math.round(((totalValue - 50) / 50) * 15);
  } else {
    // Large value + healthy → 75-95
    score = 75 + Math.min(20, Math.round(Math.log10(totalValue) * 5));
  }

  // Unclaimed rewards penalty — suggests neglect
  if (hasRewards && rewardValue > 0.01) {
    score -= 15;
  } else if (hasRewards) {
    score -= 5;
  }

  // Health rate penalties (lending positions)
  if (healthRate !== undefined) {
    if (healthRate < 1.2) {
      score -= 25; // Liquidation danger
    } else if (healthRate < 1.5) {
      score -= 10; // Risky
    }
  }

  // Small value + has unclaimed rewards = really neglected
  if (totalValue < 10 && hasRewards) {
    score -= 5;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  const status = getHealthStatus(score);
  const chainConfig = getChainByName(chain);
  const investTypeLabel =
    INVEST_TYPE_LABELS[detail.investType] || "Unknown";

  // ─── Detailed explanations ─────────────────────────────────
  const explanations: string[] = [];

  if (totalValue < 1) {
    explanations.push(
      `Position holds only $${totalValue.toFixed(4)} — effectively dust that costs more in gas than it's worth to manage`
    );
  } else if (totalValue < 10) {
    explanations.push(
      `Position value is $${totalValue.toFixed(2)} — too small to justify gas fees for most operations`
    );
  } else if (totalValue < 50) {
    explanations.push(
      `Position value is $${totalValue.toFixed(2)} — marginal position that may not generate meaningful yield`
    );
  }

  if (hasRewards && rewardValue > 0) {
    const rewardSymbols = (detail.rewardList || [])
      .filter((r) => parseFloat(r.coinAmount) > 0)
      .map((r) => `${parseFloat(r.coinAmount).toFixed(4)} ${r.tokenSymbol}`)
      .join(", ");
    explanations.push(
      `Unclaimed rewards detected (${rewardSymbols}, ~$${rewardValue.toFixed(2)}) — position has been left unattended`
    );
  }

  if (healthRate !== undefined) {
    if (healthRate < 1.2) {
      explanations.push(
        `Health rate is ${healthRate.toFixed(2)} — critically close to liquidation threshold. Immediate action recommended`
      );
    } else if (healthRate < 1.5) {
      explanations.push(
        `Health rate is ${healthRate.toFixed(2)} — approaching liquidation risk zone. Monitor closely or reduce exposure`
      );
    }
  }

  if (detail.tokenList.length > 1) {
    const tokens = detail.tokenList.map((t) => t.tokenSymbol).join("/");
    explanations.push(
      `Multi-token ${investTypeLabel.toLowerCase()} position (${tokens}) on ${detail.platformName}`
    );
  }

  if (totalValue >= 100) {
    explanations.push(
      `Healthy position worth $${totalValue.toFixed(2)} on ${detail.platformName} — generating yield as expected`
    );
  }

  if (explanations.length === 0) {
    explanations.push(
      `${investTypeLabel} position on ${detail.platformName} with $${totalValue.toFixed(2)} value`
    );
  }

  // ─── AI Summary ────────────────────────────────────────────
  let aiSummary: string;
  if (status === "DEAD") {
    aiSummary = `Dust position ($${totalValue.toFixed(2)}) on ${detail.platformName} — sweep and consolidate`;
  } else if (status === "STALE") {
    aiSummary = `Stale ${investTypeLabel.toLowerCase()} on ${detail.platformName} — $${totalValue.toFixed(2)} sitting idle`;
  } else if (status === "WARNING") {
    aiSummary = `${investTypeLabel} on ${detail.platformName} needs attention — ${healthRate && healthRate < 1.5 ? "health rate declining" : "suboptimal allocation"}`;
  } else {
    aiSummary = `Healthy ${investTypeLabel.toLowerCase()} on ${detail.platformName} performing well at $${totalValue.toFixed(2)}`;
  }

  return {
    id: detail.investmentId,
    platformName: detail.platformName,
    platformId: detail.platformId,
    chain,
    chainLabel: chainConfig?.label || chain,
    investType: detail.investType,
    investTypeLabel,
    tokens: detail.tokenList.map((t) => ({
      symbol: t.tokenSymbol,
      amount: t.coinAmount,
      valueUsd: t.currencyAmount,
      address: t.tokenAddress,
    })),
    totalValueUsd: totalValue,
    healthScore: score,
    healthStatus: status,
    aiSummary,
    aiExplanation: explanations,
    recommendation: {
      action: score < 50 ? "exit" : score < 80 ? "move" : "hold",
      target: score < 80 ? "Aave on X Layer" : undefined,
      targetApy: score < 80 ? "2.6%" : undefined,
    },
    rewards: (detail.rewardList || []).map((r) => ({
      symbol: r.tokenSymbol,
      amount: r.coinAmount,
      valueUsd: r.currencyAmount,
    })),
    investmentId: detail.investmentId,
  };
}
