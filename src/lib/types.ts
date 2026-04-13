// ─── Chain ────────────────────────────────────────────────────
export interface ChainConfig {
  id: number;
  name: string;
  label: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrl: string;
  explorerUrl: string;
}

// ─── Position (from OKX DeFi Portfolio API) ──────────────────
export interface Platform {
  platformName: string;
  analysisPlatformId: string;
  investmentCount: number;
  currencyAmount: string;
  networkBalanceList: { network: string; currencyAmount: string }[];
}

export interface RawPosition {
  walletIdPlatformList: {
    walletId: string;
    platformList: Platform[];
  }[];
}

export interface PositionDetail {
  investmentId: string;
  investmentName: string;
  investType: number;
  chainId: string;
  platformName: string;
  platformId: string;
  tokenList: {
    tokenSymbol: string;
    tokenAddress: string;
    coinAmount: string;
    currencyAmount: string;
    tokenPrecision: number;
  }[];
  rewardList?: {
    tokenSymbol: string;
    coinAmount: string;
    currencyAmount: string;
  }[];
  healthRate?: string;
}

// ─── Scored Position (after AI analysis) ─────────────────────
export type HealthStatus = "DEAD" | "STALE" | "WARNING" | "HEALTHY";

export interface ScoredPosition {
  id: string;
  platformName: string;
  platformId: string;
  chain: string;
  chainLabel: string;
  investType: number;
  investTypeLabel: string;
  tokens: { symbol: string; amount: string; valueUsd: string }[];
  totalValueUsd: number;
  healthScore: number;
  healthStatus: HealthStatus;
  aiSummary: string;
  aiExplanation: string[];
  recommendation: {
    action: "hold" | "exit" | "move";
    target?: string;
    targetApy?: string;
  };
  rewards: { symbol: string; amount: string; valueUsd: string }[];
  investmentId: string;
}

// ─── Sweep Plan ──────────────────────────────────────────────
export interface SweepStep {
  label: string;
  description: string;
  status: "pending" | "executing" | "done" | "failed";
  txHash?: string;
}

export interface SweepPlan {
  positionId: string;
  steps: SweepStep[];
  estimatedRecovery: string;
  estimatedGas: string;
  targetProtocol: string;
  targetApy: string;
}

// ─── API Request/Response ────────────────────────────────────
export interface ScanRequest {
  address: string;
  chains: string[];
}

export interface AnalyzeRequest {
  address: string;
  positions: Platform[];
}

export interface SweepRequest {
  address: string;
  chain: string;
  investmentId: string;
  platformId: string;
}

// ─── Invest Type Mapping ─────────────────────────────────────
export const INVEST_TYPE_LABELS: Record<number, string> = {
  1: "Savings",
  2: "Liquidity Pool",
  3: "Farm",
  4: "Vault",
  5: "Stake",
  6: "Borrow",
  7: "Staking",
  8: "Locked",
  9: "Deposit",
  10: "Vesting",
};
