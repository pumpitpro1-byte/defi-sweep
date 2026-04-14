"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import DashboardPage from "../dashboard/page";

export default function AppGatewayPage() {
  const { isConnected } = useAccount();

  if (isConnected) {
    return <DashboardPage />;
  }

  return (
    <main className="relative flex-1 min-h-[calc(100vh-80px)] overflow-hidden">
      {/* Blurred dashboard skeleton behind overlay */}
      <div className="pointer-events-none select-none absolute inset-0 blur-[2px] opacity-70">
        <div className="max-w-[1280px] mx-auto px-10 pt-8 pb-16">
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[16px] border border-[rgba(0,0,0,0.07)] bg-white p-5 h-[112px]"
              >
                <div className="h-3 w-20 rounded bg-[#f2f2f2] mb-4" />
                <div className="h-7 w-28 rounded bg-[#ececec]" />
              </div>
            ))}
          </div>

          <div className="rounded-[16px] border border-[rgba(0,0,0,0.07)] bg-white p-5 mb-6">
            <div className="h-3 w-32 rounded bg-[#f2f2f2] mb-4" />
            <div className="relative h-3 rounded-full overflow-hidden bg-[#f2f2f2]">
              <div className="absolute inset-y-0 left-0 w-[35%] bg-[#e62e24]" />
              <div className="absolute inset-y-0 left-[35%] w-[25%] bg-[#f9a606]" />
              <div className="absolute inset-y-0 left-[60%] right-0 bg-[#5a8400]" />
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            {["All", "At risk", "Healthy"].map((t) => (
              <div
                key={t}
                className="px-4 py-2 rounded-full border border-[rgba(0,0,0,0.07)] text-[13px] text-[#545454] bg-white"
              >
                {t}
              </div>
            ))}
          </div>

          <div className="rounded-[16px] border border-[rgba(0,0,0,0.07)] bg-white overflow-hidden">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_0.8fr] bg-[#fafafa] border-b border-[rgba(0,0,0,0.07)]">
              {["Position", "Chain", "Type", "Value", "APY", "Health"].map((h) => (
                <div
                  key={h}
                  className="px-4 py-3 text-[12px] font-semibold uppercase text-[#888] border-r border-[rgba(0,0,0,0.05)] last:border-r-0"
                >
                  {h}
                </div>
              ))}
            </div>
            {[0, 1, 2, 3, 4].map((r) => (
              <div
                key={r}
                className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_0.8fr] border-b border-[rgba(0,0,0,0.05)] last:border-b-0"
              >
                {[0, 1, 2, 3, 4, 5].map((c) => (
                  <div
                    key={c}
                    className="px-4 py-4 border-r border-[rgba(0,0,0,0.05)] last:border-r-0"
                  >
                    <div className="h-4 rounded bg-[#f2f2f2]" style={{ width: `${40 + ((r + c) * 7) % 50}%` }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 via-white/70 to-white/95" />

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-6">
        <div className="max-w-[460px] w-full text-center rounded-[24px] border border-[rgba(0,0,0,0.08)] bg-white/90 backdrop-blur-md p-10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)]">
          <div className="mx-auto mb-6 w-14 h-14 rounded-[16px] bg-[#6c6cff]/10 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 7H5a2 2 0 010-4h14v4zM3 5v14a2 2 0 002 2h16V7M18 12a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
                stroke="#6c6cff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1
            className="text-[28px] font-extrabold tracking-[-0.4px] text-[#121212] mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Connect your wallet
          </h1>
          <p className="text-[15px] leading-[1.5] text-[#545454] mb-8">
            DeFi Sweeper needs read access to scan your wallet for stale positions, score their health, and surface one-click cleanup actions.
          </p>

          <ConnectButton.Custom>
            {({ openConnectModal, mounted }) => (
              <button
                onClick={mounted ? openConnectModal : undefined}
                className="w-full inline-block rounded-[16px] p-[3px] cursor-pointer"
                style={{
                  backgroundImage:
                    "conic-gradient(from 90deg, #b461ca -8.65%, #b461ca 7.66%, #e77193 13.36%, #e77193 26.47%, #b461ca 49.16%, #e77193 74.52%, #b461ca 91.35%, #b461ca 107.66%)",
                }}
              >
                <div
                  className="relative rounded-[14px] overflow-hidden"
                  style={{
                    backgroundImage:
                      "radial-gradient(ellipse at center, #0c0c0c 18.27%, #171717 59.14%, #222222 100%)",
                  }}
                >
                  <div className="flex items-center justify-center gap-2 px-6 py-3.5 relative z-10">
                    <span className="font-semibold text-white tracking-[-0.36px] text-[16px]">
                      Connect wallet
                    </span>
                  </div>
                  <div
                    className="absolute inset-0 pointer-events-none rounded-[inherit]"
                    style={{
                      boxShadow:
                        "inset -4px 0 3px 0 rgba(255,255,255,0.1), inset 4px 0 3px 0 rgba(255,255,255,0.1), inset 0 4px 3px 0 rgba(255,255,255,0.1), inset 0 -4px 3px 0 rgba(255,255,255,0.1)",
                    }}
                  />
                </div>
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      </div>
    </main>
  );
}
