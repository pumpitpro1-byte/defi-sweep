import { NextRequest, NextResponse } from "next/server";
import {
  getDefiPositionDetail,
  getDefiCollectCalldata,
  getDefiWithdrawCalldata,
  getSwapData,
  getDefiInvestCalldata,
  isOkxConfigured,
} from "@/lib/okx-api";

// USDC addresses per chain
const USDC_ADDRESSES: Record<string, string> = {
  "1": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",     // Ethereum
  "56": "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",    // BSC
  "137": "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",   // Polygon
  "42161": "0xaf88d065e77c8cc2239327c5edb3a432268e5831",  // Arbitrum
  "8453": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",  // Base
  "196": "0x74b7f16337b8972027f6196a17a631ac6de26d22",    // X Layer
};

// Aave V3 USDC investment ID on X Layer (target for sweep)
const AAVE_XLAYER_USDC_INVESTMENT_ID = "9502";

interface SweepStepTx {
  to: string;
  data: string;
  value: string;
  chainId: string;
}

interface SweepStep {
  id: string;
  label: string;
  description: string;
  transactions: SweepStepTx[];
}

// ─── Simulated fallback steps ────────────────────────────────
function getSimulatedSteps(
  hasRewards: boolean,
  tokenSymbol: string,
  chainId: string
): SweepStep[] {
  const steps: SweepStep[] = [];

  if (hasRewards) {
    steps.push({
      id: "claim",
      label: "Claim Rewards",
      description: "Collect unclaimed rewards before exiting the position",
      transactions: [],
    });
  }

  steps.push({
    id: "withdraw",
    label: "Withdraw Position",
    description: "Exit the position completely (100% withdrawal)",
    transactions: [],
  });

  const isUsdc =
    tokenSymbol.toUpperCase() === "USDC" ||
    tokenSymbol.toUpperCase() === "USDC.E";

  if (!isUsdc) {
    steps.push({
      id: "swap",
      label: `Swap ${tokenSymbol} → USDC`,
      description: `Convert ${tokenSymbol} to USDC via OKX DEX Aggregator`,
      transactions: [],
    });
  }

  steps.push({
    id: "deposit",
    label: "Deposit to Aave (X Layer)",
    description: "Deposit USDC into Aave V3 on X Layer for optimized yield",
    transactions: [],
  });

  return steps;
}

// ─── Main handler ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, chain, investmentId, platformId, tokens } = body;

    if (!address || !investmentId) {
      return NextResponse.json(
        { error: "address and investmentId are required" },
        { status: 400 }
      );
    }

    const chainId = chain || "1";
    const mainTokenSymbol =
      tokens?.[0]?.symbol || "TOKEN";

    // If OKX API not configured, return simulated steps
    if (!isOkxConfigured()) {
      return NextResponse.json({
        ok: true,
        simulated: true,
        steps: getSimulatedSteps(false, mainTokenSymbol, chainId),
      });
    }

    // ── Step 0: Fresh position-detail (MANDATORY per OKX docs) ──
    let positionData;
    let hasRewards = false;
    let posTokenSymbol = mainTokenSymbol;
    let posTokenAddress = "";

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detailResponse = (await getDefiPositionDetail(
        address,
        chainId,
        platformId || ""
      )) as any;

      if (detailResponse?.code === "0" && detailResponse?.data) {
        const dataArray = Array.isArray(detailResponse.data)
          ? detailResponse.data
          : [detailResponse.data];

        for (const entry of dataArray) {
          const detailList =
            entry?.walletIdPlatformDetailList ||
            entry?.platformDetailList ||
            [];

          for (const pd of detailList) {
            for (const inv of pd?.investmentList || []) {
              if (String(inv.investmentId) === String(investmentId)) {
                positionData = inv;
                hasRewards =
                  (inv.rewardList || inv.earnedTokenList || []).some(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (r: any) => parseFloat(r.coinAmount || "0") > 0
                  );
                if (inv.tokenList?.[0]) {
                  posTokenSymbol = inv.tokenList[0].tokenSymbol || mainTokenSymbol;
                  posTokenAddress = inv.tokenList[0].tokenAddress || "";
                }
                break;
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("Failed to fetch fresh position-detail:", err);
    }

    // If we couldn't get position data, return simulated
    if (!positionData) {
      return NextResponse.json({
        ok: true,
        simulated: true,
        steps: getSimulatedSteps(false, mainTokenSymbol, chainId),
      });
    }

    const steps: SweepStep[] = [];
    let anyStepFailed = false;

    // ── Step 1: Claim rewards (if they exist) ────────────────
    if (hasRewards) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const claimResult = (await getDefiCollectCalldata({
          address,
          chain: chainId,
          rewardType: "REWARD_INVESTMENT",
          investmentId,
          platformId: platformId || undefined,
        })) as any;

        if (claimResult?.code === "0" && claimResult?.data?.dataList) {
          steps.push({
            id: "claim",
            label: "Claim Rewards",
            description: "Collect unclaimed rewards before exiting the position",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            transactions: claimResult.data.dataList.map((d: any) => ({
              to: d.to || "",
              data: d.serializedData || "",
              value: d.value || "0",
              chainId,
            })),
          });
        } else {
          anyStepFailed = true;
        }
      } catch (err) {
        console.warn("Claim calldata generation failed:", err);
        anyStepFailed = true;
      }
    }

    // ── Step 2: Withdraw (full exit, ratio=1) ────────────────
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const withdrawResult = (await getDefiWithdrawCalldata({
        investmentId,
        address,
        chain: chainId,
        ratio: "1",
        platformId: platformId || "",
      })) as any;

      if (withdrawResult?.code === "0" && withdrawResult?.data?.dataList) {
        steps.push({
          id: "withdraw",
          label: "Withdraw Position",
          description: "Exit the position completely (100% withdrawal)",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transactions: withdrawResult.data.dataList.map((d: any) => ({
            to: d.to || "",
            data: d.serializedData || "",
            value: d.value || "0",
            chainId,
          })),
        });
      } else {
        anyStepFailed = true;
      }
    } catch (err) {
      console.warn("Withdraw calldata generation failed:", err);
      anyStepFailed = true;
    }

    // ── Step 3: Swap to USDC (if not already USDC) ───────────
    const isUsdc =
      posTokenSymbol.toUpperCase() === "USDC" ||
      posTokenSymbol.toUpperCase() === "USDC.E";

    if (!isUsdc && posTokenAddress) {
      const usdcAddress = USDC_ADDRESSES[chainId] || USDC_ADDRESSES["196"];
      const tokenAmount =
        positionData.tokenList?.[0]?.coinAmount || "0";

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const swapResult = (await getSwapData({
          chainId,
          fromTokenAddress: posTokenAddress.toLowerCase(),
          toTokenAddress: usdcAddress,
          amount: tokenAmount,
          userWalletAddress: address,
          slippage: "0.01",
        })) as any;

        if (swapResult?.code === "0" && swapResult?.data?.[0]?.tx) {
          const tx = swapResult.data[0].tx;
          steps.push({
            id: "swap",
            label: `Swap ${posTokenSymbol} → USDC`,
            description: `Convert ${posTokenSymbol} to USDC via OKX DEX Aggregator`,
            transactions: [
              {
                to: tx.to || "",
                data: tx.data || "",
                value: tx.value || "0",
                chainId,
              },
            ],
          });
        } else {
          anyStepFailed = true;
        }
      } catch (err) {
        console.warn("Swap calldata generation failed:", err);
        anyStepFailed = true;
      }
    }

    // ── Step 4: Deposit USDC into Aave on X Layer ────────────
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const investResult = (await getDefiInvestCalldata({
        investmentId: AAVE_XLAYER_USDC_INVESTMENT_ID,
        address,
        token: USDC_ADDRESSES["196"],
        amount: "0", // Placeholder — actual amount determined after swap
        chain: "196",
      })) as any;

      if (investResult?.code === "0" && investResult?.data?.dataList) {
        steps.push({
          id: "deposit",
          label: "Deposit to Aave (X Layer)",
          description: "Deposit USDC into Aave V3 on X Layer for optimized yield",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transactions: investResult.data.dataList.map((d: any) => ({
            to: d.to || "",
            data: d.serializedData || "",
            value: d.value || "0",
            chainId: "196",
          })),
        });
      } else {
        anyStepFailed = true;
      }
    } catch (err) {
      console.warn("Invest calldata generation failed:", err);
      anyStepFailed = true;
    }

    // ── Critical fallback: if ANY step failed, return simulated ──
    if (anyStepFailed || steps.length === 0) {
      return NextResponse.json({
        ok: true,
        simulated: true,
        steps: getSimulatedSteps(hasRewards, posTokenSymbol, chainId),
      });
    }

    return NextResponse.json({
      ok: true,
      simulated: false,
      steps,
    });
  } catch (error) {
    console.error("Sweep error:", error);
    // Ultimate fallback
    return NextResponse.json({
      ok: true,
      simulated: true,
      steps: getSimulatedSteps(false, "TOKEN", "1"),
    });
  }
}
