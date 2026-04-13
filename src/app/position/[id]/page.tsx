"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { HealthScore, HealthBadge } from "@/components/health-score";
import { SweepConfirm } from "@/components/sweep-confirm";
import { SweepSteps } from "@/components/sweep-steps";
import { type ScoredPosition, type SweepPlan, type SweepStep } from "@/lib/types";
import { getHealthColor } from "@/lib/scoring";

type PageState = "loading" | "not-found" | "detail" | "confirm" | "sweeping" | "complete";

interface SweepApiStep {
  id: string;
  label: string;
  description: string;
  transactions: { to: string; data: string; value: string; chainId: string }[];
}

export default function PositionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoSweep = searchParams.get("sweep") === "true";
  const { address, isConnected } = useAccount();
  const [position, setPosition] = useState<ScoredPosition | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [sweepSteps, setSweepSteps] = useState<SweepStep[]>([]);
  const [isSimulated, setIsSimulated] = useState(false);
  const [sweepError, setSweepError] = useState<string | null>(null);

  // wagmi v3 send transaction hook
  const {
    sendTransactionAsync,
    data: pendingTxHash,
    isPending: isSending,
    reset: resetSendTx,
  } = useSendTransaction();

  // Watch for tx receipt
  const { data: txReceipt, isLoading: isWaitingReceipt, isError: txFailed } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  });

  // Sweep execution state machine
  const apiStepsRef = useRef<SweepApiStep[]>([]);
  const currentStepIndexRef = useRef(0);
  const currentTxIndexRef = useRef(0);
  const sweepActiveRef = useRef(false);

  const id = params.id as string;

  // Load position from localStorage
  useEffect(() => {
    if (!isConnected) {
      localStorage.removeItem("defi-sweeper-positions");
      router.push("/");
      return;
    }

    const stored = localStorage.getItem("defi-sweeper-positions");
    if (stored) {
      try {
        const positions: ScoredPosition[] = JSON.parse(stored);
        const found = positions.find((p) => p.id === id);
        if (found) {
          setPosition(found);
          setPageState(autoSweep ? "confirm" : "detail");
        } else {
          setPageState("not-found");
        }
      } catch {
        setPageState("not-found");
      }
    } else {
      setPageState("not-found");
    }
  }, [isConnected, router, id]);

  // Handle tx receipt completion during real sweep
  useEffect(() => {
    if (!sweepActiveRef.current || isSimulated) return;

    if (txReceipt && pendingTxHash) {
      // Transaction succeeded
      setSweepSteps((prev) => {
        const updated = [...prev];
        const stepIdx = currentStepIndexRef.current;
        if (updated[stepIdx]) {
          updated[stepIdx] = {
            ...updated[stepIdx],
            status: "done",
            txHash: pendingTxHash,
          };
        }
        return updated;
      });

      // Move to next step
      const nextStep = currentStepIndexRef.current + 1;
      if (nextStep < apiStepsRef.current.length) {
        currentStepIndexRef.current = nextStep;
        currentTxIndexRef.current = 0;
        // Trigger next step execution
        executeNextRealStep();
      } else {
        // All steps done
        sweepActiveRef.current = false;
        setPageState("complete");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txReceipt, pendingTxHash]);

  // Handle tx failure during real sweep
  useEffect(() => {
    if (!sweepActiveRef.current || isSimulated) return;

    if (txFailed && pendingTxHash) {
      setSweepSteps((prev) => {
        const updated = [...prev];
        const stepIdx = currentStepIndexRef.current;
        if (updated[stepIdx]) {
          updated[stepIdx] = {
            ...updated[stepIdx],
            status: "failed",
            txHash: pendingTxHash,
          };
        }
        return updated;
      });
      sweepActiveRef.current = false;
      setSweepError("Transaction failed on-chain");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txFailed, pendingTxHash]);

  const executeNextRealStep = useCallback(async () => {
    const stepIdx = currentStepIndexRef.current;
    const steps = apiStepsRef.current;
    if (stepIdx >= steps.length) return;

    const apiStep = steps[stepIdx];

    setSweepSteps((prev) => {
      const updated = [...prev];
      if (updated[stepIdx]) {
        updated[stepIdx] = { ...updated[stepIdx], status: "executing" };
      }
      return updated;
    });

    // Execute the first transaction in this step
    const tx = apiStep.transactions[currentTxIndexRef.current];
    if (!tx) {
      // No transaction data for this step — mark as failed
      setSweepSteps((prev) => {
        const updated = [...prev];
        if (updated[stepIdx]) {
          updated[stepIdx] = { ...updated[stepIdx], status: "failed" };
        }
        return updated;
      });
      sweepActiveRef.current = false;
      setSweepError("No transaction data available for this step");
      return;
    }

    try {
      resetSendTx();
      await sendTransactionAsync({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: tx.value ? BigInt(tx.value) : BigInt(0),
      });
      // Receipt handling is done in the useEffect above
    } catch (err) {
      // User rejected or network error
      const message = err instanceof Error ? err.message : "Unknown error";
      const isRejection = message.toLowerCase().includes("reject") || message.toLowerCase().includes("denied");
      setSweepSteps((prev) => {
        const updated = [...prev];
        if (updated[stepIdx]) {
          updated[stepIdx] = { ...updated[stepIdx], status: "failed" };
        }
        return updated;
      });
      sweepActiveRef.current = false;
      setSweepError(
        isRejection
          ? "Transaction rejected by wallet"
          : message.toLowerCase().includes("network")
            ? "Network error — check your connection"
            : `Transaction error: ${message}`
      );
    }
  }, [sendTransactionAsync, resetSendTx]);

  if (!position && pageState === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center text-[#545454]">
        Loading...
      </div>
    );
  }

  // Not found state
  if (pageState === "not-found" || !position) {
    return (
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <svg className="w-16 h-16 text-[#545454]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <h2 className="text-xl font-bold text-[#121212]">Position not found</h2>
          <p className="text-sm text-[#545454] max-w-md">
            It may have been removed from cache.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#6c6cff] hover:bg-[#5b5be6] transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  const sweepPlan: SweepPlan = {
    positionId: position.id,
    steps: [
      { label: "Claim rewards", description: `Claim ${position.rewards[0]?.amount || "0"} ${position.rewards[0]?.symbol || "tokens"}`, status: "pending" },
      { label: "Withdraw position", description: `Withdraw $${position.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from ${position.platformName}`, status: "pending" },
      { label: "Swap tokens", description: "Swap to USDC via OKX DEX", status: "pending" },
      { label: "Deposit to Aave", description: `Deposit into Aave on X Layer at ${position.recommendation.targetApy} APY`, status: "pending" },
    ],
    estimatedRecovery: (position.totalValueUsd + parseFloat(position.rewards[0]?.valueUsd || "0")).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    estimatedGas: "$0.004",
    targetProtocol: "Aave on X Layer",
    targetApy: position.recommendation.targetApy || "2.6%",
  };

  const simulateSweep = async () => {
    setPageState("sweeping");
    setIsSimulated(true);
    const steps = [...sweepPlan.steps];

    for (let i = 0; i < steps.length; i++) {
      steps[i] = { ...steps[i], status: "executing" };
      setSweepSteps([...steps]);
      await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
      steps[i] = {
        ...steps[i],
        status: "done",
        txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      };
      setSweepSteps([...steps]);
    }

    setPageState("complete");
  };

  const executeSweep = async () => {
    if (!address || !position) return;

    setPageState("sweeping");
    setSweepError(null);
    setIsSimulated(false);

    try {
      const response = await fetch("/api/sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          chain: position.chain,
          investmentId: position.investmentId,
          platformId: position.platformId,
          tokens: position.tokens,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        setSweepError(data.error || "Sweep API returned an error");
        setPageState("detail");
        return;
      }

      if (data.simulated) {
        // Run simulated sweep with fake delays
        setIsSimulated(true);
        const steps: SweepStep[] = data.steps.map((s: SweepApiStep) => ({
          label: s.label,
          description: s.description,
          status: "pending" as const,
        }));

        for (let i = 0; i < steps.length; i++) {
          steps[i] = { ...steps[i], status: "executing" };
          setSweepSteps([...steps]);
          await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
          steps[i] = {
            ...steps[i],
            status: "done",
            txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
          };
          setSweepSteps([...steps]);
        }

        setPageState("complete");
      } else {
        // Real sweep with wallet signing
        apiStepsRef.current = data.steps;
        currentStepIndexRef.current = 0;
        currentTxIndexRef.current = 0;
        sweepActiveRef.current = true;

        // Initialize UI steps
        const uiSteps: SweepStep[] = data.steps.map((s: SweepApiStep) => ({
          label: s.label,
          description: s.description,
          status: "pending" as const,
        }));
        setSweepSteps(uiSteps);

        // Start executing the first step
        executeNextRealStep();
      }
    } catch (err) {
      setSweepError(err instanceof Error ? err.message : "Network error — check your connection");
      setPageState("detail");
    }
  };

  const color = getHealthColor(position.healthStatus);

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-sm text-[#545454] hover:text-[#121212] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>

      {pageState === "detail" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Sweep error banner */}
          {sweepError && (
            <div className="bg-[#e62e24]/10 border border-[#e62e24]/30 rounded-lg px-4 py-2.5 text-sm text-[#e62e24]">
              {sweepError}
            </div>
          )}

          {/* Header */}
          <div className="flex items-center gap-4">
            <HealthScore score={position.healthScore} status={position.healthStatus} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{position.platformName}</h1>
                <span className="px-2 py-0.5 rounded text-xs bg-[#F5F5F5] text-[#545454]">
                  {position.chainLabel}
                </span>
                <HealthBadge status={position.healthStatus} />
              </div>
              <p className="text-[#545454] mt-1">
                {position.investTypeLabel} · {position.tokens.map((t) => t.symbol).join(" / ")}
              </p>
              <p className="text-2xl font-bold mt-2">
                ${position.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <span className="text-[#8B5CF6]">AI</span> Why this position is at risk
            </h2>
            <ul className="space-y-2">
              {position.aiExplanation.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#545454]">
                  <span style={{ color }} className="mt-0.5">&#8226;</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendation */}
          {position.recommendation.target && (
            <div className="rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] p-5">
              <h3 className="font-semibold text-[#6c6cff] mb-2">Recommendation</h3>
              <p className="text-sm text-[#121212]">
                Move to <span className="font-semibold">{position.recommendation.target}</span>
              </p>
              <div className="flex gap-6 mt-2 text-sm text-[#545454]">
                <span>APY: <span className="text-[#5a8400] font-semibold">{position.recommendation.targetApy}</span></span>
                <span>Gas: <span className="text-[#121212]">~$0.01</span></span>
                <span>Security: <span className="text-[#5a8400]">Audited</span></span>
              </div>
            </div>
          )}

          {/* Position data table */}
          <div className="rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] p-5">
            <h3 className="font-semibold mb-3">Position Details</h3>
            <div className="space-y-2 text-sm">
              {position.tokens.map((token) => (
                <div key={token.symbol} className="flex justify-between">
                  <span className="text-[#545454]">{token.symbol}</span>
                  <span className="text-[#121212] font-mono">
                    {token.amount} (${parseFloat(token.valueUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </span>
                </div>
              ))}
              {position.rewards.length > 0 && (
                <>
                  <div className="border-t border-[#E5E5E5] my-2" />
                  <p className="text-xs text-[#545454] uppercase">Unclaimed Rewards</p>
                  {position.rewards.map((reward) => (
                    <div key={reward.symbol} className="flex justify-between">
                      <span className="text-[#545454]">{reward.symbol}</span>
                      <span className="text-[#5a8400] font-mono">
                        {reward.amount} (${parseFloat(reward.valueUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex-1 px-4 py-3 rounded-xl text-sm text-[#545454] bg-[#F5F5F5] hover:bg-[#E5E5E5] transition-colors"
            >
              Dismiss
            </button>
            {position.recommendation.action !== "hold" && (
              <button
                onClick={() => setPageState("confirm")}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-[#6c6cff] hover:bg-[#5b5be6] transition-colors"
              >
                Sweep This Position
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      {pageState === "confirm" && (
        <SweepConfirm
          plan={sweepPlan}
          onConfirm={executeSweep}
          onCancel={() => setPageState("detail")}
        />
      )}

      {/* Sweep Progress */}
      {pageState === "sweeping" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-xl font-bold">Sweeping...</h2>
          <p className="text-sm text-[#545454]">
            {isSimulated ? "Running simulated sweep" : "Sign each transaction in your wallet"}
          </p>
          {isSending && (
            <div className="bg-[#6c6cff]/10 border border-[#6c6cff]/30 rounded-lg px-4 py-2 text-sm text-[#6c6cff]">
              Waiting for wallet signature...
            </div>
          )}
          {isWaitingReceipt && (
            <div className="bg-[#f9a606]/10 border border-[#f9a606]/30 rounded-lg px-4 py-2 text-sm text-[#f9a606]">
              Waiting for on-chain confirmation...
            </div>
          )}
          <SweepSteps steps={sweepSteps} />
          {sweepError && (
            <div className="space-y-3">
              <div className="bg-[#e62e24]/10 border border-[#e62e24]/30 rounded-lg px-4 py-2.5 text-sm text-[#e62e24]">
                {sweepError}
              </div>
              <button
                onClick={() => {
                  sweepActiveRef.current = false;
                  setSweepError(null);
                  setPageState("detail");
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#6c6cff] hover:bg-[#5b5be6] transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Complete */}
      {pageState === "complete" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 py-8"
        >
          <div className="text-6xl">&#127881;</div>
          <h2 className="text-3xl font-bold text-[#5a8400]">Sweep Complete!</h2>
          {/* simulated tag removed */}
          <div className="rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] p-6 space-y-3 max-w-sm mx-auto text-left">
            <div className="flex justify-between text-sm">
              <span className="text-[#545454]">Recovered</span>
              <span className="text-[#121212] font-bold">${sweepPlan.estimatedRecovery}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#545454]">Now earning</span>
              <span className="text-[#5a8400] font-bold">{sweepPlan.targetApy} APY</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#545454]">Gas spent</span>
              <span className="text-[#121212]">{sweepPlan.estimatedGas}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#545454]">Transactions</span>
              <span className="text-[#121212]">{sweepSteps.length}</span>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#6c6cff] hover:bg-[#5b5be6] transition-colors"
            >
              Sweep Another Position
            </button>
          </div>
        </motion.div>
      )}
    </main>
  );
}
