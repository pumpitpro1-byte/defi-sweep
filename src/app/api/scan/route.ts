import { NextRequest, NextResponse } from "next/server";
import {
  getDefiPositions,
  getDefiPositionDetail,
  isOkxConfigured,
} from "@/lib/okx-api";
import { mockScorePosition } from "@/lib/scoring";
import type {
  ScoredPosition,
  PositionDetail,
  RawPosition,
} from "@/lib/types";
import { getChainById } from "@/lib/chains";

// Default chains to scan (EVM only — compatible with 0x addresses)
const DEFAULT_CHAIN_IDS = ["1", "56", "137", "42161", "8453", "196"];

// ─── Demo fallback data ──────────────────────────────────────
function getDemoPositions(): ScoredPosition[] {
  return [
    {
      id: "demo-1",
      platformName: "Aave V3",
      platformId: "10",
      chain: "ethereum",
      chainLabel: "Ethereum",
      investType: 1,
      investTypeLabel: "Savings",
      tokens: [
        { symbol: "USDC", amount: "0.38", valueUsd: "0.38" },
      ],
      totalValueUsd: 0.38,
      healthScore: 8,
      healthStatus: "DEAD",
      aiSummary: "Dust position ($0.38) on Aave V3 — sweep and consolidate",
      aiExplanation: [
        "Position holds only $0.38 — effectively dust that costs more in gas than it's worth to manage",
      ],
      recommendation: { action: "exit", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [],
      investmentId: "demo-inv-1",
    },
    {
      id: "demo-2",
      platformName: "Uniswap V3",
      platformId: "20",
      chain: "arbitrum",
      chainLabel: "Arbitrum",
      investType: 2,
      investTypeLabel: "Liquidity Pool",
      tokens: [
        { symbol: "WETH", amount: "0.003", valueUsd: "7.50" },
        { symbol: "USDC", amount: "8.20", valueUsd: "8.20" },
      ],
      totalValueUsd: 15.7,
      healthScore: 28,
      healthStatus: "STALE",
      aiSummary: "Stale liquidity pool on Uniswap V3 — $15.70 sitting idle",
      aiExplanation: [
        "Position value is $15.70 — too small to justify gas fees for most operations",
        "Unclaimed rewards detected (0.0001 WETH, ~$0.25) — position has been left unattended",
      ],
      recommendation: { action: "exit", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [{ symbol: "WETH", amount: "0.0001", valueUsd: "0.25" }],
      investmentId: "demo-inv-2",
    },
    {
      id: "demo-3",
      platformName: "Compound V3",
      platformId: "30",
      chain: "base",
      chainLabel: "Base",
      investType: 6,
      investTypeLabel: "Borrow",
      tokens: [
        { symbol: "USDC", amount: "45.00", valueUsd: "45.00" },
      ],
      totalValueUsd: 45.0,
      healthScore: 35,
      healthStatus: "STALE",
      aiSummary: "Borrow on Compound V3 needs attention — health rate declining",
      aiExplanation: [
        "Position value is $45.00 — marginal position that may not generate meaningful yield",
        "Health rate is 1.35 — approaching liquidation risk zone. Monitor closely or reduce exposure",
      ],
      recommendation: { action: "exit", target: "Aave on X Layer", targetApy: "2.6%" },
      rewards: [],
      investmentId: "demo-inv-3",
    },
    {
      id: "demo-4",
      platformName: "Lido",
      platformId: "40",
      chain: "ethereum",
      chainLabel: "Ethereum",
      investType: 7,
      investTypeLabel: "Staking",
      tokens: [
        { symbol: "stETH", amount: "0.52", valueUsd: "1340.00" },
      ],
      totalValueUsd: 1340.0,
      healthScore: 88,
      healthStatus: "HEALTHY",
      aiSummary: "Healthy staking on Lido performing well at $1340.00",
      aiExplanation: [
        "Healthy position worth $1340.00 on Lido — generating yield as expected",
      ],
      recommendation: { action: "hold" },
      rewards: [],
      investmentId: "demo-inv-4",
    },
  ];
}

// ─── Address validation ──────────────────────────────────────
function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// ─── Main handler ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, chains } = body;

    if (!address) {
      return NextResponse.json(
        { error: "address is required" },
        { status: 400 }
      );
    }

    if (!isValidEvmAddress(address)) {
      return NextResponse.json(
        { error: "Invalid address format — must be 0x followed by 40 hex characters" },
        { status: 400 }
      );
    }

    // Fall back to demo data if OKX API keys are not configured
    if (!isOkxConfigured()) {
      return NextResponse.json({
        ok: true,
        demo: true,
        positions: getDemoPositions(),
      });
    }

    const chainIds = chains && chains.length > 0 ? chains : DEFAULT_CHAIN_IDS;

    // Step 1: Get positions overview
    let positionsResponse;
    try {
      positionsResponse = await getDefiPositions(address, chainIds);
    } catch (err) {
      console.error("OKX positions API error:", err);
      return NextResponse.json({
        ok: true,
        demo: true,
        positions: getDemoPositions(),
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseData = positionsResponse as any;
    if (
      responseData?.code !== "0" ||
      !responseData?.data
    ) {
      console.error("OKX positions API returned non-zero code:", responseData?.code, responseData?.msg);
      return NextResponse.json({
        ok: true,
        demo: true,
        positions: getDemoPositions(),
      });
    }

    // Parse platform list from positions overview
    const rawData = responseData.data as RawPosition[];
    const platforms: Array<{
      platformName: string;
      analysisPlatformId: string;
      chains: string[];
    }> = [];

    for (const wallet of rawData || []) {
      if (!wallet.walletIdPlatformList) continue;
      for (const walletEntry of wallet.walletIdPlatformList) {
        for (const platform of walletEntry.platformList || []) {
          const chainList = (platform.networkBalanceList || []).map(
            (n) => n.network
          );
          platforms.push({
            platformName: platform.platformName,
            analysisPlatformId: platform.analysisPlatformId,
            chains: chainList,
          });
        }
      }
    }

    if (platforms.length === 0) {
      return NextResponse.json({
        ok: true,
        positions: [],
      });
    }

    // Step 2: Get position details for each platform (parallel with timeout)
    const detailPromises = platforms.flatMap((platform) =>
      // For each chain the platform is active on, fetch details
      (platform.chains.length > 0 ? platform.chains : chainIds).map(
        (chainId: string) => {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 10000)
          );
          const fetchPromise = getDefiPositionDetail(
            address,
            chainId,
            platform.analysisPlatformId
          );
          return Promise.race([fetchPromise, timeoutPromise])
            .then((result) => ({
              status: "fulfilled" as const,
              value: result,
              platformName: platform.platformName,
              chainId,
            }))
            .catch((err) => ({
              status: "rejected" as const,
              reason: err,
              platformName: platform.platformName,
              chainId,
            }));
        }
      )
    );

    const detailResults = await Promise.all(detailPromises);

    // Step 3: Parse detail results and score each position
    const scoredPositions: ScoredPosition[] = [];

    for (const result of detailResults) {
      if (result.status === "rejected") {
        console.warn(
          `Failed to get detail for ${result.platformName} on chain ${result.chainId}:`,
          result.reason
        );
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detailResponse = result.value as any;
      if (detailResponse?.code !== "0" || !detailResponse?.data) continue;

      // data is an array of wallet detail entries
      const detailDataArray = Array.isArray(detailResponse.data)
        ? detailResponse.data
        : [detailResponse.data];

      for (const detailData of detailDataArray) {
        const detailList =
          detailData?.walletIdPlatformDetailList ||
          detailData?.platformDetailList ||
          [];

        for (const platformDetail of detailList) {
          const investments = platformDetail?.investmentList || [];

          for (const investment of investments) {
            const posDetail: PositionDetail = {
              investmentId: String(investment.investmentId || ""),
              investmentName: investment.investmentName || "",
              investType: parseInt(investment.investType || "0"),
              chainId: result.chainId,
              platformName: result.platformName,
              platformId: platformDetail?.analysisPlatformId || "",
              tokenList: (investment.tokenList || []).map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (t: any) => ({
                  tokenSymbol: t.tokenSymbol || "",
                  tokenAddress: t.tokenAddress || "",
                  coinAmount: t.coinAmount || "0",
                  currencyAmount: t.currencyAmount || "0",
                  tokenPrecision: parseInt(t.tokenPrecision || "18"),
                })
              ),
              rewardList: (investment.rewardList || investment.earnedTokenList || []).map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (r: any) => ({
                  tokenSymbol: r.tokenSymbol || "",
                  coinAmount: r.coinAmount || "0",
                  currencyAmount: r.currencyAmount || "0",
                })
              ),
              healthRate: investment.healthRate || undefined,
            };

            const chainConfig = getChainById(parseInt(result.chainId));
            const chainName = chainConfig?.name || result.chainId;

            const scored = mockScorePosition(posDetail, chainName);
            scoredPositions.push(scored);
          }
        }
      }
    }

    // Sort by healthScore ascending (worst positions first)
    scoredPositions.sort((a, b) => a.healthScore - b.healthScore);

    return NextResponse.json({
      ok: true,
      positions: scoredPositions,
    });
  } catch (error) {
    console.error("Scan error:", error);
    // Critical fallback — always return demo data so the app works
    return NextResponse.json({
      ok: true,
      demo: true,
      positions: getDemoPositions(),
    });
  }
}
