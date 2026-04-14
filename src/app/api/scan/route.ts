import { NextRequest, NextResponse } from "next/server";
import {
  getDefiPositions,
  getDefiPositionDetail,
  isOkxConfigured,
} from "@/lib/okx-api";
import {
  cliGetDefiPositions,
  cliGetDefiPositionDetail,
  isOnchainosAvailable,
} from "@/lib/onchainos-cli";
import { mockScorePosition } from "@/lib/scoring";
import { enhanceWithAi, aiProviderName } from "@/lib/ai-enhance";
import type {
  ScoredPosition,
  PositionDetail,
  RawPosition,
} from "@/lib/types";
import { getChainById } from "@/lib/chains";

type ApiLike = (address: string, chains: string[]) => Promise<unknown>;
type DetailApiLike = (address: string, chain: string, platformId: string) => Promise<unknown>;

// HMAC returns { code: "0", data: RawPosition[] }
// CLI returns  { ok: true, data: RawPosition[] | {assetStatus,updateAt,walletIdPlatformList?} }
// Normalize both shapes to { code, msg, data }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(r: any) {
  if (!r) return { code: "-1", msg: "empty response", data: null };
  if (r.code !== undefined) return r;
  if (r.ok === true) {
    // CLI success — wrap
    const inner = r.data;
    // CLI positions endpoint sometimes returns single overview object; wrap to array
    if (inner && !Array.isArray(inner) && inner.walletIdPlatformList) {
      return { code: "0", msg: "ok", data: [inner] };
    }
    return { code: "0", msg: "ok", data: Array.isArray(inner) ? inner : inner ? [inner] : [] };
  }
  return { code: "-1", msg: r.error || r.msg || "cli failed", data: null };
}

// Scan across all major EVM chains — users can hold stale positions anywhere.
// The cleanup always routes funds INTO X Layer (the recommendation target).
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
    const { address, chains, demo } = body;
    const url = new URL(req.url);
    const demoMode = demo === true || url.searchParams.get("demo") === "1";

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

    // Explicit demo mode only — no silent fallback
    if (demoMode) {
      return NextResponse.json({
        ok: true,
        demo: true,
        positions: getDemoPositions(),
      });
    }

    const hmacConfigured = isOkxConfigured();
    const cliAvailable = isOnchainosAvailable();

    if (!hmacConfigured && !cliAvailable) {
      return NextResponse.json(
        {
          ok: false,
          error: "No data source configured",
          detail: "Set OKX_* env vars or install the onchainos CLI",
        },
        { status: 503 }
      );
    }

    const chainIds = chains && chains.length > 0 ? chains : DEFAULT_CHAIN_IDS;

    // Step 1: Get positions overview — HMAC first, CLI fallback
    let positionsResponse: unknown;
    let source: "hmac" | "cli" = "hmac";
    let hmacErr: string | null = null;

    const tryFetch = async (fn: ApiLike) => fn(address, chainIds);

    if (hmacConfigured) {
      try {
        positionsResponse = normalize(await tryFetch(getDefiPositions));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((positionsResponse as any)?.code !== "0") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          hmacErr = `OKX ${(positionsResponse as any)?.code}: ${(positionsResponse as any)?.msg}`;
          positionsResponse = undefined;
        }
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any;
        hmacErr = e?.response?.data?.msg || e?.message || "hmac failed";
        console.warn("HMAC auth failed, trying onchainos CLI:", hmacErr);
      }
    }

    if (!positionsResponse && cliAvailable) {
      try {
        source = "cli";
        positionsResponse = normalize(await tryFetch(cliGetDefiPositions));
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any;
        // Both upstream sources failed — log for server debugging but show users
        // a clean "no positions" state rather than an infrastructure error.
        console.warn("[scan] both HMAC and CLI failed:", { hmacErr, cliErr: e?.message });
        return NextResponse.json({ ok: true, source: "unavailable", positions: [] });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseData = positionsResponse as any;
    if (responseData?.code !== "0" || !responseData?.data) {
      console.warn("[scan] upstream non-zero code:", responseData?.code, responseData?.msg);
      return NextResponse.json({ ok: true, source, positions: [] });
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
          // Prefer numeric chainIndex, fall back to network name
          const chainList = (platform.networkBalanceList || []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (n: any) => String(n.chainIndex || n.network)
          );
          platforms.push({
            platformName: platform.platformName,
            analysisPlatformId: String(platform.analysisPlatformId),
            chains: chainList,
          });
        }
      }
    }

    if (platforms.length === 0) {
      return NextResponse.json({
        ok: true,
        source,
        positions: [],
      });
    }

    const fetchDetail: DetailApiLike =
      source === "cli" ? cliGetDefiPositionDetail : getDefiPositionDetail;

    // Build flat list of (platform, chain) jobs
    const jobs = platforms.flatMap((platform) =>
      (platform.chains.length > 0 ? platform.chains : chainIds).map((chainId: string) => ({
        platform,
        chainId,
      }))
    );

    // HMAC can do parallel. CLI rate-limits, so run sequential with retry/backoff.
    type DetailResult =
      | { status: "fulfilled"; value: unknown; platformName: string; chainId: string }
      | { status: "rejected"; reason: unknown; platformName: string; chainId: string };

    const runOne = async (
      platform: { platformName: string; analysisPlatformId: string },
      chainId: string
    ): Promise<DetailResult> => {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 20000)
      );
      try {
        const value = await Promise.race([
          fetchDetail(address, chainId, platform.analysisPlatformId),
          timeoutPromise,
        ]);
        return {
          status: "fulfilled",
          value,
          platformName: platform.platformName,
          chainId,
        };
      } catch (err) {
        return {
          status: "rejected",
          reason: err,
          platformName: platform.platformName,
          chainId,
        };
      }
    };

    let detailResults: DetailResult[];
    if (source === "cli") {
      detailResults = [];
      for (const { platform, chainId } of jobs) {
        let r = await runOne(platform, chainId);
        // One retry on rate-limit after a short backoff
        if (
          r.status === "rejected" &&
          /rate limit/i.test(String((r.reason as Error)?.message || ""))
        ) {
          await new Promise((res) => setTimeout(res, 1500));
          r = await runOne(platform, chainId);
        }
        detailResults.push(r);
      }
    } else {
      detailResults = await Promise.all(
        jobs.map(({ platform, chainId }) => runOne(platform, chainId))
      );
    }

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
      const detailResponse = normalize(result.value) as any;
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
          // Legacy HMAC schema: platformDetail.investmentList[]
          // CLI v6 schema:     platformDetail.networkHoldVoList[].investTokenBalanceVoList[]
          //                    Each entry has .positionList[] with .assetsTokenList[]
          type RawInvestment = Record<string, unknown>;
          const investments: RawInvestment[] = [];

          if (Array.isArray(platformDetail?.investmentList)) {
            investments.push(...platformDetail.investmentList);
          }
          if (Array.isArray(platformDetail?.networkHoldVoList)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const nh of platformDetail.networkHoldVoList as any[]) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              for (const inv of (nh.investTokenBalanceVoList || []) as any[]) {
                investments.push({ ...inv, chainIndex: nh.chainIndex });
              }
            }
          }

          for (const investment of investments) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const inv = investment as any;

            // CLI: tokens are under positionList[].assetsTokenList[]
            // HMAC: tokens are under tokenList[]
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tokens: any[] = inv.tokenList
              ? inv.tokenList
              : (inv.positionList || []).flatMap(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (p: any) => p.assetsTokenList || []
                );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rewards: any[] = inv.rewardList
              ? inv.rewardList
              : inv.earnedTokenList
                ? inv.earnedTokenList
                : (inv.positionList || []).flatMap(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (p: any) => p.rewardList || p.availableRewards || []
                  );

            const investmentId = String(
              inv.investmentId || inv.investmentKey || inv.positionList?.[0]?.investmentKey || ""
            );
            const investmentName = String(
              inv.investmentName || inv.investName || ""
            );

            const posDetail: PositionDetail = {
              investmentId,
              investmentName,
              investType: parseInt(String(inv.investType || "0")),
              chainId: result.chainId,
              platformName: result.platformName,
              platformId: String(platformDetail?.analysisPlatformId || ""),
              tokenList: tokens.map((t) => ({
                tokenSymbol: t.tokenSymbol || t.symbol || t.tokenName || "",
                tokenAddress: t.tokenAddress || "",
                coinAmount: String(t.coinAmount || t.amount || "0"),
                currencyAmount: String(t.currencyAmount || t.valueUsd || "0"),
                tokenPrecision: parseInt(String(t.tokenPrecision || t.decimals || "18")),
              })),
              rewardList: rewards.map((r) => ({
                tokenSymbol: r.tokenSymbol || r.symbol || "",
                coinAmount: String(r.coinAmount || r.amount || "0"),
                currencyAmount: String(r.currencyAmount || r.valueUsd || "0"),
              })),
              healthRate: inv.healthRate || undefined,
            };

            // Skip empty positions (no tokens and no value)
            const hasValue = posDetail.tokenList.some(
              (t) => parseFloat(t.currencyAmount) > 0 || parseFloat(t.coinAmount) > 0
            );
            if (!hasValue) continue;

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

    // Optional LLM enhancement — Grok (xAI) or Groq (Llama). Falls back silently.
    const enhanced = await enhanceWithAi(scoredPositions);

    return NextResponse.json({
      ok: true,
      source,
      aiProvider: aiProviderName(),
      positions: enhanced,
    });
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = error as any;
    console.error("Scan error:", e);
    return NextResponse.json(
      { ok: false, error: "Scan failed", detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}
