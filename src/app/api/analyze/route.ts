import { NextRequest, NextResponse } from "next/server";
import { mockScorePosition } from "@/lib/scoring";
import type { PositionDetail, ScoredPosition } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { positions } = await req.json();

    if (!positions || !Array.isArray(positions)) {
      return NextResponse.json(
        { error: "positions array is required" },
        { status: 400 }
      );
    }

    // Score each position using the enhanced scoring engine
    const scoredPositions: ScoredPosition[] = positions.map(
      (pos: PositionDetail & { chain?: string }) => {
        const chain = pos.chain || pos.chainId || "1";
        return mockScorePosition(pos, chain);
      }
    );

    // Sort by healthScore ascending (worst first)
    scoredPositions.sort((a, b) => a.healthScore - b.healthScore);

    return NextResponse.json({
      ok: true,
      data: scoredPositions,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Failed to analyze positions" },
      { status: 500 }
    );
  }
}
