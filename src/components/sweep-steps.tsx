"use client";

import { type SweepStep } from "@/lib/types";
import { motion } from "framer-motion";

interface SweepStepsProps {
  steps: SweepStep[];
  onComplete?: () => void;
}

function StepIcon({ status }: { status: SweepStep["status"] }) {
  switch (status) {
    case "done":
      return (
        <div className="w-6 h-6 rounded-full bg-[#5a8400] flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case "executing":
      return (
        <motion.div
          className="w-6 h-6 rounded-full border-2 border-[#6c6cff] border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      );
    case "failed":
      return (
        <div className="w-6 h-6 rounded-full bg-[#e62e24] flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-6 h-6 rounded-full border-2 border-[#E5E5E5]" />
      );
  }
}

export function SweepSteps({ steps }: SweepStepsProps) {
  const completedCount = steps.filter((s) => s.status === "done").length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[#E5E5E5] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#6c6cff] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <StepIcon status={step.status} />
              {i < steps.length - 1 && (
                <div
                  className={`w-0.5 h-8 mt-1 ${
                    step.status === "done" ? "bg-[#5a8400]" : "bg-[#E5E5E5]"
                  }`}
                />
              )}
            </div>
            <div className="flex-1 pb-4">
              <p
                className={`font-medium ${
                  step.status === "executing"
                    ? "text-[#121212]"
                    : step.status === "done"
                      ? "text-[#5a8400]"
                      : step.status === "failed"
                        ? "text-[#e62e24]"
                        : "text-[#757575]"
                }`}
              >
                {step.label}
              </p>
              <p className="text-sm text-[#545454]">{step.description}</p>
              {step.txHash && (
                <a
                  href={`https://www.okx.com/web3/explorer/xlayer/tx/${step.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#6c6cff] hover:text-[#8383ff] font-mono mt-1 inline-block"
                >
                  {step.txHash.slice(0, 10)}...{step.txHash.slice(-8)}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
