"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { HealthScore, HealthBadge } from "./health-score";
import { SweepSteps } from "./sweep-steps";
import { type ScoredPosition, type SweepPlan, type SweepStep } from "@/lib/types";
import { getHealthColor } from "@/lib/scoring";

type SheetState = "detail" | "confirm" | "sweeping" | "complete";

interface SweepApiStep {
  id: string;
  label: string;
  description: string;
  transactions: { to: string; data: string; value: string; chainId: string }[];
}

interface PositionDetailSheetProps {
  position: ScoredPosition | null;
  onClose: () => void;
  autoSweep?: boolean;
}

export function PositionDetailSheet({ position, onClose, autoSweep }: PositionDetailSheetProps) {
  const { address } = useAccount();
  const [sheetState, setSheetState] = useState<SheetState>(autoSweep ? "confirm" : "detail");
  const [sweepSteps, setSweepSteps] = useState<SweepStep[]>([]);
  const [isSimulated, setIsSimulated] = useState(false);
  const [sweepError, setSweepError] = useState<string | null>(null);

  const {
    sendTransactionAsync,
    data: pendingTxHash,
    isPending: isSending,
    reset: resetSendTx,
  } = useSendTransaction();

  const { data: txReceipt, isLoading: isWaitingReceipt, isError: txFailed } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  });

  const apiStepsRef = useRef<SweepApiStep[]>([]);
  const currentStepIndexRef = useRef(0);
  const currentTxIndexRef = useRef(0);
  const sweepActiveRef = useRef(false);

  // Reset state when position changes
  useEffect(() => {
    if (position) {
      setSheetState(autoSweep ? "confirm" : "detail");
      setSweepSteps([]);
      setSweepError(null);
      setIsSimulated(false);
      sweepActiveRef.current = false;
    }
  }, [position, autoSweep]);

  // Handle tx receipt
  useEffect(() => {
    if (!sweepActiveRef.current || isSimulated) return;
    if (txReceipt && pendingTxHash) {
      setSweepSteps((prev) => {
        const updated = [...prev];
        const stepIdx = currentStepIndexRef.current;
        if (updated[stepIdx]) {
          updated[stepIdx] = { ...updated[stepIdx], status: "done", txHash: pendingTxHash };
        }
        return updated;
      });
      const nextStep = currentStepIndexRef.current + 1;
      if (nextStep < apiStepsRef.current.length) {
        currentStepIndexRef.current = nextStep;
        currentTxIndexRef.current = 0;
        executeNextRealStep();
      } else {
        sweepActiveRef.current = false;
        setSheetState("complete");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txReceipt, pendingTxHash]);

  // Handle tx failure
  useEffect(() => {
    if (!sweepActiveRef.current || isSimulated) return;
    if (txFailed && pendingTxHash) {
      setSweepSteps((prev) => {
        const updated = [...prev];
        const stepIdx = currentStepIndexRef.current;
        if (updated[stepIdx]) {
          updated[stepIdx] = { ...updated[stepIdx], status: "failed", txHash: pendingTxHash };
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
      if (updated[stepIdx]) updated[stepIdx] = { ...updated[stepIdx], status: "executing" };
      return updated;
    });

    const tx = apiStep.transactions[currentTxIndexRef.current];
    if (!tx) {
      setSweepSteps((prev) => {
        const updated = [...prev];
        if (updated[stepIdx]) updated[stepIdx] = { ...updated[stepIdx], status: "failed" };
        return updated;
      });
      sweepActiveRef.current = false;
      setSweepError("No transaction data available");
      return;
    }

    try {
      resetSendTx();
      await sendTransactionAsync({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: tx.value ? BigInt(tx.value) : BigInt(0),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const isRejection = message.toLowerCase().includes("reject") || message.toLowerCase().includes("denied");
      setSweepSteps((prev) => {
        const updated = [...prev];
        if (updated[stepIdx]) updated[stepIdx] = { ...updated[stepIdx], status: "failed" };
        return updated;
      });
      sweepActiveRef.current = false;
      setSweepError(isRejection ? "Transaction rejected by wallet" : `Transaction error: ${message}`);
    }
  }, [sendTransactionAsync, resetSendTx]);

  if (!position) return null;

  const color = getHealthColor(position.healthStatus);

  const sweepPlan: SweepPlan = {
    positionId: position.id,
    steps: [
      ...(position.rewards.length > 0 ? [{ label: "Claim rewards", description: `Claim ${position.rewards[0]?.amount || "0"} ${position.rewards[0]?.symbol || "tokens"}`, status: "pending" as const }] : []),
      { label: "Withdraw position", description: `Withdraw $${position.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from ${position.platformName}`, status: "pending" },
      { label: "Swap tokens", description: "Swap to USDC via OKX DEX", status: "pending" },
      { label: "Deposit to Aave", description: `Deposit into Aave on X Layer at ${position.recommendation.targetApy} APY`, status: "pending" },
    ],
    estimatedRecovery: (position.totalValueUsd + parseFloat(position.rewards[0]?.valueUsd || "0")).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    estimatedGas: "$0.004",
    targetProtocol: "Aave on X Layer",
    targetApy: position.recommendation.targetApy || "2.6%",
  };

  const executeSweep = async () => {
    if (!address || !position) return;
    setSheetState("sweeping");
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
        setSweepError(data.error || "Sweep failed");
        setSheetState("detail");
        return;
      }

      if (data.simulated) {
        setIsSimulated(true);
        const steps: SweepStep[] = data.steps.map((s: SweepApiStep) => ({
          label: s.label, description: s.description, status: "pending" as const,
        }));
        for (let i = 0; i < steps.length; i++) {
          steps[i] = { ...steps[i], status: "executing" };
          setSweepSteps([...steps]);
          await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
          steps[i] = {
            ...steps[i], status: "done",
            txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
          };
          setSweepSteps([...steps]);
        }
        setSheetState("complete");
      } else {
        apiStepsRef.current = data.steps;
        currentStepIndexRef.current = 0;
        currentTxIndexRef.current = 0;
        sweepActiveRef.current = true;
        const uiSteps: SweepStep[] = data.steps.map((s: SweepApiStep) => ({
          label: s.label, description: s.description, status: "pending" as const,
        }));
        setSweepSteps(uiSteps);
        executeNextRealStep();
      }
    } catch (err) {
      setSweepError(err instanceof Error ? err.message : "Network error");
      setSheetState("detail");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget && sheetState !== "sweeping") onClose(); }}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[24px] sm:absolute sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:right-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[24px] sm:max-w-lg sm:w-full sm:max-h-[80vh] border-[0.634px] border-[#d6d6d6] backdrop-blur-[25px]"
          style={{
            backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.02) 100%), linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.9) 100%)",
            boxShadow: "0px 0px 40px 0px rgba(0,0,0,0.12)",
          }}
        >
          {/* Handle bar (mobile) */}
          <div className="sticky top-0 pt-3 pb-2 flex justify-center sm:hidden rounded-t-[24px]">
            <div className="w-10 h-1 rounded-full bg-[#d6d6d6]" />
          </div>

          <div className="px-5 pb-6 sm:pt-5">
            {/* Close button */}
            {sheetState !== "sweeping" && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-[6px] border border-[rgba(0,0,0,0.07)] text-[#222] hover:bg-[#f2f2f2] transition-colors"
                style={{ backgroundColor: "rgba(242,242,242,0.2)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* ─── Detail View ─── */}
            {sheetState === "detail" && (
              <div className="space-y-5">
                {sweepError && (
                  <div className="bg-[#e62e24]/10 border border-[#e62e24]/30 rounded-[12px] px-4 py-2 text-sm text-[#e62e24]">
                    {sweepError}
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-4">
                  <HealthScore score={position.healthScore} status={position.healthStatus} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[16px] font-semibold text-[#222] tracking-[-0.32px]">{position.platformName}</h2>
                      <HealthBadge status={position.healthStatus} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#545454] mt-0.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F5F5F5]">{position.chainLabel}</span>
                      <span>{position.investTypeLabel}</span>
                      <span>·</span>
                      <span>{position.tokens.map((t) => t.symbol).join(" / ")}</span>
                    </div>
                    <p className="text-xl font-bold text-[#121212] mt-1">
                      ${position.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="rounded-[14px] bg-[#FAFAFA] border border-[#f0f0f0] p-4 space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className="text-[#8B5CF6]">AI</span> Analysis
                  </h3>
                  <ul className="space-y-1.5">
                    {position.aiExplanation.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#545454]">
                        <span style={{ color }} className="mt-0.5 text-xs">&#9679;</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendation */}
                {position.recommendation.target && (
                  <div className="rounded-[14px] bg-[#EEF2FF] border border-[#C7D2FE] p-4">
                    <p className="text-sm text-[#121212]">
                      <span className="font-semibold text-[#6c6cff]">Recommendation:</span>{" "}
                      Move to {position.recommendation.target}
                    </p>
                    <div className="flex gap-4 mt-1.5 text-xs text-[#545454]">
                      <span>APY: <span className="text-[#5a8400] font-semibold">{position.recommendation.targetApy}</span></span>
                      <span>Gas: ~$0.01</span>
                      <span>Security: <span className="text-[#5a8400]">Audited</span></span>
                    </div>
                  </div>
                )}

                {/* Token breakdown */}
                <div className="rounded-[14px] bg-[#FAFAFA] border border-[#f0f0f0] p-4">
                  <div className="space-y-1.5 text-sm">
                    {position.tokens.map((t) => (
                      <div key={t.symbol} className="flex justify-between">
                        <span className="text-[#545454]">{t.symbol}</span>
                        <span className="text-[#121212] font-mono">{t.amount} <span className="text-[#545454]">(${parseFloat(t.valueUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span></span>
                      </div>
                    ))}
                    {position.rewards.length > 0 && (
                      <>
                        <div className="border-t border-[#f0f0f0] my-1.5" />
                        {position.rewards.map((r) => (
                          <div key={r.symbol} className="flex justify-between">
                            <span className="text-[#545454]">{r.symbol} <span className="text-[10px]">(reward)</span></span>
                            <span className="text-[#5a8400] font-mono">{r.amount}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={onClose} className="flex-1 px-4 py-3 rounded-[14px] text-sm font-semibold text-[#545454] bg-[#F5F5F5] hover:bg-[#E5E5E5] transition-colors">
                    Close
                  </button>
                  {position.recommendation.action !== "hold" && (
                    <button onClick={() => setSheetState("confirm")} className="flex-1 px-4 py-3 rounded-[14px] text-sm font-semibold text-white bg-[#6c6cff] hover:bg-[#5b5be6] transition-colors">
                      Sweep This Position
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ─── Confirm ─── */}
            {sheetState === "confirm" && (
              <div className="space-y-5 pt-2">
                <h2 className="text-[16px] font-semibold text-[#222] tracking-[-0.32px]">Sweep Plan</h2>
                <div className="space-y-3">
                  {sweepPlan.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#EEF2FF] text-[#6c6cff] text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#121212]">{step.label}</p>
                        <p className="text-xs text-[#545454]">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-[12px] bg-[#FAFAFA] border border-[#f0f0f0] p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#545454]">Total recovered</span>
                    <span className="text-[#121212] font-semibold">${sweepPlan.estimatedRecovery}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#545454]">New APY</span>
                    <span className="text-[#5a8400] font-semibold">{sweepPlan.targetApy}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#545454]">Estimated gas</span>
                    <span className="text-[#121212]">~{sweepPlan.estimatedGas}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSheetState("detail")} className="flex-1 px-4 py-3 rounded-[14px] text-sm font-semibold text-[#545454] bg-[#F5F5F5] hover:bg-[#E5E5E5] transition-colors">
                    Cancel
                  </button>
                  <button onClick={executeSweep} className="flex-1 px-4 py-3 rounded-[14px] text-sm font-semibold text-white bg-[#6c6cff] hover:bg-[#5b5be6] transition-colors">
                    Confirm Sweep
                  </button>
                </div>
              </div>
            )}

            {/* ─── Sweeping ─── */}
            {sheetState === "sweeping" && (
              <div className="space-y-4 pt-2">
                <h2 className="text-[16px] font-semibold text-[#222] tracking-[-0.32px]">Sweeping...</h2>
                <p className="text-sm text-[#545454]">
                  {isSimulated ? "Running simulated sweep" : "Sign each transaction in your wallet"}
                </p>
                <SweepSteps steps={sweepSteps} />
                {sweepError && (
                  <div className="space-y-3">
                    <div className="bg-[#e62e24]/10 border border-[#e62e24]/30 rounded-[12px] px-3 py-2 text-sm text-[#e62e24]">{sweepError}</div>
                    <button onClick={onClose} className="w-full px-4 py-3 rounded-[14px] text-sm font-semibold text-white bg-[#6c6cff] hover:bg-[#5b5be6] transition-colors">
                      Back to Dashboard
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ─── Complete ─── */}
            {sheetState === "complete" && (
              <div className="text-center space-y-5 py-4">
                <div className="text-5xl">&#127881;</div>
                <h2 className="text-2xl font-bold text-[#5a8400]">Sweep Complete!</h2>
                {/* simulated tag removed */}
                <div className="rounded-[14px] bg-[#FAFAFA] border border-[#f0f0f0] p-4 space-y-2 text-left">
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
                <button onClick={onClose} className="w-full px-4 py-3 rounded-[14px] text-sm font-semibold text-white bg-[#6c6cff] hover:bg-[#5b5be6] transition-colors">
                  Done
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
