import { NextRequest, NextResponse } from "next/server";
import { getSwapQuote, isOkxConfigured } from "@/lib/okx-api";

// ─── Mock quote fallback ─────────────────────────────────────
function getMockQuote(
  amount: string,
  fromToken: string,
  toToken: string
) {
  const inputAmount = parseFloat(amount) || 380000000;
  // Simulate a small spread (0.13%)
  const outputAmount = Math.floor(inputAmount * 0.9987);
  return {
    fromAmount: String(inputAmount),
    toAmount: String(outputAmount),
    priceImpact: "0.13",
    estimatedGas: "0.004",
    route: "OKX DEX Aggregator (simulated)",
  };
}

export async function POST(req: NextRequest) {
  try {
    const { chainId, fromToken, toToken, amount } = await req.json();

    if (!fromToken || !toToken || !amount) {
      return NextResponse.json(
        { error: "fromToken, toToken, and amount are required" },
        { status: 400 }
      );
    }

    // Fallback if OKX API not configured
    if (!isOkxConfigured()) {
      return NextResponse.json({
        ok: true,
        demo: true,
        data: getMockQuote(amount, fromToken, toToken),
      });
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await getSwapQuote({
        chainId: chainId || "196",
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: amount,
      })) as any;

      if (result?.code === "0" && result?.data?.[0]) {
        const quoteData = result.data[0];
        const routeNames = (quoteData.dexRouterList || [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((r: any) => r.dexName || "Unknown DEX")
          .join(" → ");

        return NextResponse.json({
          ok: true,
          data: {
            fromAmount: quoteData.fromTokenAmount || amount,
            toAmount: quoteData.toTokenAmount || "0",
            priceImpact: quoteData.priceImpactPercent || "0",
            estimatedGas: quoteData.estimateGasFee || "0",
            route: routeNames || "OKX DEX Aggregator",
          },
        });
      }

      // API returned non-zero code — fall back to mock
      console.warn("OKX quote API returned non-zero code:", result?.code, result?.msg);
      return NextResponse.json({
        ok: true,
        demo: true,
        data: getMockQuote(amount, fromToken, toToken),
      });
    } catch (err) {
      console.error("OKX quote API error:", err);
      return NextResponse.json({
        ok: true,
        demo: true,
        data: getMockQuote(amount, fromToken, toToken),
      });
    }
  } catch (error) {
    console.error("Quote error:", error);
    return NextResponse.json({
      ok: true,
      demo: true,
      data: getMockQuote("380000000", "", ""),
    });
  }
}
