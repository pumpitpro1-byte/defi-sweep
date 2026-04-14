"use client";

import { type SweepPlan } from "@/lib/types";

interface SweepConfirmProps {
  plan: SweepPlan;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SweepConfirm({ plan, onConfirm, onCancel }: SweepConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
      <div
        className="w-full max-w-md rounded-t-[24px] sm:rounded-[24px] p-4 space-y-4 border-[0.634px] border-[#d6d6d6] backdrop-blur-[25px]"
        style={{
          backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.02) 100%), linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.9) 100%)",
          boxShadow: "0px 0px 40px 0px rgba(0,0,0,0.12)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#222] tracking-[-0.32px]">Sweep Plan</h2>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-[6px] border border-[rgba(0,0,0,0.07)] text-[#222] hover:bg-[#f2f2f2] transition-colors"
            style={{ backgroundColor: "rgba(242,242,242,0.2)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Steps preview */}
        <div className="space-y-2">
          {plan.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3 p-1 rounded-[10px]">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[rgba(108,108,255,0.1)] text-[#6c6cff] text-xs font-semibold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="text-[14px] font-medium text-[#121212] tracking-[-0.28px]">
                  {step.label}
                </p>
                <p className="text-[12px] text-[#545454] tracking-[-0.24px]">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-[#f0f0f0]" />

        {/* Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-[14px]">
            <span className="text-[#545454] font-medium tracking-[-0.28px]">Total recovered</span>
            <span className="text-[#121212] font-semibold tracking-[-0.28px]">${plan.estimatedRecovery}</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-[#545454] font-medium tracking-[-0.28px]">New APY</span>
            <span className="text-[#5a8400] font-semibold tracking-[-0.28px]">{plan.targetApy}</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-[#545454] font-medium tracking-[-0.28px]">Estimated gas</span>
            <span className="text-[#121212] font-medium tracking-[-0.28px]">~{plan.estimatedGas}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-full text-[14px] font-semibold text-[#222] bg-[#f2f2f2] hover:bg-[#e5e5e5] border border-[rgba(0,0,0,0.07)] transition-colors tracking-[-0.28px]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 rounded-full text-[14px] font-semibold text-white bg-[#6c6cff] hover:bg-[#5b5be6] border border-[rgba(0,0,0,0.1)] transition-colors tracking-[-0.28px]"
          >
            Confirm Sweep
          </button>
        </div>
      </div>
    </div>
  );
}
