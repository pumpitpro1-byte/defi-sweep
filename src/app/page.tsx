"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

const APP_URL = "/dashboard";

/* ─── Helpers ─── */

function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Wallet icon — exact Figma asset */
function WalletIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <Image src="/wallet-icon.svg" alt="" width={20} height={20} className={className} />
  );
}

/* Connect Wallet CTA — opens RainbowKit modal with gradient styling */
function ConnectWalletCTA({ size = "lg", label = "Connect wallet", showIcon = true }: { size?: "sm" | "lg"; label?: string; showIcon?: boolean }) {
  return (
    <ConnectButton.Custom>
      {({ openConnectModal, mounted }) => (
        <button
          onClick={mounted ? openConnectModal : undefined}
          className={`inline-block rounded-[16px] p-[3px] cursor-pointer`}
          style={{
            backgroundImage: "conic-gradient(from 90deg, #b461ca -8.65%, #b461ca 7.66%, #e77193 13.36%, #e77193 26.47%, #b461ca 49.16%, #e77193 74.52%, #b461ca 91.35%, #b461ca 107.66%)",
          }}
        >
          <div
            className="relative rounded-[16px] overflow-hidden"
            style={{
              backgroundImage: "radial-gradient(ellipse at center, #0c0c0c 18.27%, #171717 59.14%, #222222 100%)",
            }}
          >
            <div className={`flex items-center justify-center gap-2 relative z-10 ${size === "lg" ? "px-6 py-3.5" : "px-5 py-2.5"}`}>
              <span className={`font-semibold text-white tracking-[-0.36px] whitespace-nowrap ${size === "lg" ? "text-[18px]" : "text-[14px]"}`}>
                {label}
              </span>
              {showIcon && <WalletIcon className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} />}
            </div>
            <div
              className="absolute inset-0 pointer-events-none rounded-[inherit]"
              style={{
                boxShadow: "inset -4px 0 3px 0 rgba(255,255,255,0.1), inset 4px 0 3px 0 rgba(255,255,255,0.1), inset 0 4px 3px 0 rgba(255,255,255,0.1), inset 0 -4px 3px 0 rgba(255,255,255,0.1)",
              }}
            />
          </div>
        </button>
      )}
    </ConnectButton.Custom>
  );
}

/* Gradient CTA button — exact Figma node 39:32 */
function GradientCTA({ children, href, className = "" }: { children: React.ReactNode; href: string; className?: string }) {
  return (
    <a
      href={href}
      className={`inline-block rounded-[16px] p-[3px] ${className}`}
      style={{
        backgroundImage: "conic-gradient(from 90deg, #b461ca -8.65%, #b461ca 7.66%, #e77193 13.36%, #e77193 26.47%, #b461ca 49.16%, #e77193 74.52%, #b461ca 91.35%, #b461ca 107.66%)",
      }}
    >
      <div
        className="relative rounded-[16px] overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(ellipse at center, #0c0c0c 18.27%, #171717 59.14%, #222222 100%)",
        }}
      >
        <div className="flex items-center justify-center gap-2 px-6 py-3.5 relative z-10">
          {children}
        </div>
        {/* Inner glow */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit]"
          style={{
            boxShadow: "inset -4px 0 3px 0 rgba(255,255,255,0.1), inset 4px 0 3px 0 rgba(255,255,255,0.1), inset 0 4px 3px 0 rgba(255,255,255,0.1), inset 0 -4px 3px 0 rgba(255,255,255,0.1)",
          }}
        />
      </div>
    </a>
  );
}

/* ─── Browser Chrome ─── */
function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-[rgba(0,0,0,0.1)] bg-white shadow-2xl overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#f8f8f8] border-b border-[rgba(0,0,0,0.06)]">
        {/* Traffic lights */}
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        {/* Nav arrows */}
        <div className="flex gap-1 ml-3">
          <svg className="w-4 h-4 text-[#999]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <svg className="w-4 h-4 text-[#999]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
        {/* URL bar */}
        <div className="flex-1 mx-3 h-7 rounded-md bg-white border border-[rgba(0,0,0,0.08)] flex items-center px-3">
          <span className="text-xs text-[#999]">localhost:3000</span>
        </div>
        {/* Tab/share icons */}
        <div className="flex gap-2 text-[#999]">
          {/* Share */}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {/* New tab */}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {/* Sidebar */}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </div>
      </div>
      {/* Content */}
      {children}
    </div>
  );
}

/* ─── Nav ─── */
function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-[rgba(0,0,0,0.1)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2">
          <Image src="/logo-icon.svg" alt="" width={28} height={28} />
          <span className="font-display text-base font-extrabold text-[#222]">
            Defi Sweeper
          </span>
        </a>
        <ConnectWalletCTA size="sm" />
      </div>
    </nav>
  );
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-0 md:pt-24 md:pb-0">
      <div className="mx-auto max-w-6xl px-6">
        {/* Two-column hero text */}
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          {/* Left — Heading */}
          <FadeIn>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.1] tracking-[-0.96px] text-[#0a0a0a] md:text-[52px]">
              Your DeFi money is leaking. We fix&nbsp;it.
            </h1>
          </FadeIn>

          {/* Right — Description + CTA, aligned to top */}
          <FadeIn delay={0.15}>
            <div className="md:pt-2">
              <p className="text-[16px] font-medium leading-[1.5] text-[#545454] md:text-[18px] md:leading-[1.6]">
                DeFi Sweeper finds dead positions, explains the risk in plain English, and moves your funds to better opportunities&nbsp;&mdash;&nbsp;automatically.
              </p>
              <div className="mt-6">
                <ConnectWalletCTA size="lg" />
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Hero image */}
        <FadeIn delay={0.3}>
          <div className="mt-12" style={{ perspective: "1200px" }}>
            <motion.div
              initial={{ rotateX: 25, rotateY: -5, scale: 0.9, opacity: 0 }}
              animate={{ rotateX: 0, rotateY: 0, scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div
                whileHover={{ rotateX: 2, rotateY: -2, scale: 1.01 }}
                transition={{ duration: 0.4 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <Image
                  src="/hero-image.svg"
                  alt="DeFi Sweeper Dashboard"
                  width={1200}
                  height={750}
                  className="w-full"
                  priority
                />
              </motion.div>
            </motion.div>
          </div>
        </FadeIn>
      </div>

      {/* Blur overlay at bottom of hero section — fades into white */}
      <div className="relative h-[120px] -mt-[120px] pointer-events-none z-10">
        <div className="absolute inset-0 backdrop-blur-[8px]" style={{ maskImage: "linear-gradient(to top, black 0%, black 30%, transparent 100%)", WebkitMaskImage: "linear-gradient(to top, black 0%, black 30%, transparent 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, white 0%, rgba(255,255,255,0.8) 40%, transparent 100%)" }} />
      </div>
    </section>
  );
}

/* ─── Product Screenshot ─── */
function ProductScreenshot() {
  return (
    <section className="pb-24 md:pb-32">
      <div className="mx-auto max-w-5xl px-6" style={{ perspective: "1200px" }}>
        <motion.div
          initial={{ rotateX: 25, rotateY: -5, scale: 0.9, opacity: 0 }}
          animate={{ rotateX: 0, rotateY: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <motion.div
            whileHover={{ rotateX: 2, rotateY: -2, scale: 1.01 }}
            transition={{ duration: 0.4 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <BrowserChrome>
              {/* Dashboard content */}
              <div className="p-5 md:p-7 bg-white">
                {/* App nav bar mock */}
                <div className="flex items-center justify-between pb-4 border-b border-[rgba(0,0,0,0.06)]">
                  <div className="flex items-center gap-3">
                    <Image src="/logo-icon.svg" alt="" width={28} height={28} />
                    <span className="font-display text-[15px] font-extrabold text-[#222]">
                      Defi Sweeper
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#627EEA]" />
                    <div className="h-7 px-3 rounded-[8px] bg-[#f2f2f2] flex items-center gap-2">
                      <div className="w-4 h-4 rounded-[5px] bg-[#bcff2f]" />
                      <span className="text-[11px] font-semibold text-[#222]">
                        0x8bf6...4220
                      </span>
                    </div>
                  </div>
                </div>

                {/* Portfolio heading */}
                <div className="flex items-center justify-between mt-5 mb-4">
                  <h3 className="font-display text-[28px] font-extrabold text-[#0a0a0a] tracking-[-0.56px]">
                    Portfolio
                  </h3>
                  <span className="px-4 py-2 rounded-[32px] bg-[#6c6cff] text-white text-xs font-semibold cursor-pointer">
                    Sweep All
                  </span>
                </div>

                {/* Metrics strip */}
                <div className="flex items-center justify-between rounded-[16px] border border-[rgba(0,0,0,0.06)] px-5 py-3 mb-4 bg-white/60 backdrop-blur">
                  {["Total Value", "Active Positions", "Avg APY", "At Risk", "Healthy"].map(
                    (label, i) => (
                      <div key={label} className="text-center">
                        <p className="text-[11px] font-semibold text-[#545454]">
                          {label}
                        </p>
                        <p className="text-[14px] font-semibold text-[#121212]">
                          {["$13.66K", "56", "3.71%", "16", "16"][i]}
                        </p>
                      </div>
                    )
                  )}
                </div>

                {/* Risk bar */}
                <div className="w-full h-3.5 rounded-full bg-[#a1eb00] mb-4 relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full w-[60%] bg-[#f9a606] rounded-full"
                    style={{ zIndex: 1 }}
                  />
                  <div
                    className="absolute top-0 left-0 h-full w-[35%] bg-[#e62e24] rounded-full"
                    style={{ zIndex: 2 }}
                  />
                </div>

                {/* Table */}
                <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] overflow-hidden">
                  <div className="grid grid-cols-6 px-4 py-2.5 bg-[#fafafa] text-[11px] font-semibold text-[#545454]">
                    <span>Assets</span>
                    <span className="text-right">Wallet</span>
                    <span className="text-right">Deposit</span>
                    <span className="text-right">APY</span>
                    <span className="text-right">Health</span>
                    <span className="text-right">Action</span>
                  </div>
                  {[
                    { name: "Lido staked ETH", val: "5,660", dep: "5,660", apy: "2.3%", score: 86, healthy: true },
                    { name: "Ethereum", val: "3,200", dep: "0.00", apy: "4.1%", score: 20, healthy: false },
                    { name: "USD Coin", val: "4,789", dep: "4,789", apy: "5.8%", score: 86, healthy: true },
                    { name: "USDS Stablecoin", val: "9,823", dep: "9,823", apy: "3.9%", score: 20, healthy: false },
                  ].map((row) => (
                    <div
                      key={row.name}
                      className="grid grid-cols-6 px-4 py-3 border-t border-[rgba(0,0,0,0.04)] text-[12px] items-center"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#627EEA] flex-shrink-0" />
                        <span className="font-semibold text-[#121212] truncate">
                          {row.name}
                        </span>
                      </div>
                      <span className="text-right text-[#121212]">{row.val}</span>
                      <span className="text-right text-[#121212]">{row.dep}</span>
                      <span className="text-right text-[#121212]">{row.apy}</span>
                      <div className="flex items-center justify-end gap-1">
                        <div
                          className={`w-3 h-3 rounded-full border-[1.5px] ${
                            row.healthy ? "border-[#6FA300]" : "border-[#e62e24]"
                          }`}
                        />
                        <span className="text-[#121212]">{row.score}</span>
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-[#f2f2f2] text-[10px] font-semibold text-[#222]">
                          Details
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            row.healthy
                              ? "bg-[#a1eb00] text-[#222]"
                              : "bg-[#6c6cff] text-white"
                          }`}
                        >
                          {row.healthy ? "Health" : "Sweep"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </BrowserChrome>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Features (Figma node 45:212) ─── */
function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-6 flex flex-col items-center gap-[72px]">
        <FadeIn>
          <h2 className="text-center font-[family-name:var(--font-display)] text-[48px] font-extrabold text-black tracking-[-0.36px]">
            Built for real DeFi users
          </h2>
        </FadeIn>

        <div className="w-full px-0 md:px-10 flex flex-col gap-[10px]">
          {/* Top row — 3 cards */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* AI Health Score — orange bg */}
            <FadeIn delay={0}>
              <div className="bg-[#f9a606] rounded-[26px] p-[14px] w-full md:w-[262px] h-[366px] overflow-hidden flex flex-col gap-[18px]">
                <div className="flex flex-col text-[#222]">
                  <h3 className="font-[family-name:var(--font-display)] text-[20px] font-extrabold leading-[1.3]">AI Health Score</h3>
                  <div className="text-[16px] font-medium leading-[1.46]">
                    <p className="mb-0">Know what&apos;s worth keeping</p>
                    <p>Every position scored from 0–100 based on real signals.</p>
                  </div>
                </div>
                <div className="flex-1 flex items-end justify-center">
                  <Image src="/features/health-score.svg" alt="Health Score" width={208} height={287} className="w-[208px]" />
                </div>
              </div>
            </FadeIn>

            {/* One-Click Cleanup — gray bg */}
            <FadeIn delay={0.08}>
              <div className="bg-[rgba(242,242,242,0.7)] border-[2.321px] border-[#dbdbdb] rounded-[28px] p-[18px] w-full md:w-[307px] h-[366px] flex flex-col gap-[81px] items-center">
                <div className="flex flex-col text-[#222] w-full">
                  <h3 className="font-[family-name:var(--font-display)] text-[20px] font-extrabold leading-[1.3]">One-Click Cleanup</h3>
                  <div className="text-[16px] font-medium leading-[1.46]">
                    <p className="mb-0">Fix it instantly</p>
                    <p>Exit bad positions and move funds to better yield in seconds.</p>
                  </div>
                </div>
                <div className="relative">
                  {/* Sweep button illustration */}
                  <div className="flex items-center gap-2 px-7 py-4 rounded-[19px] relative" style={{ backgroundImage: "radial-gradient(ellipse at center, #000 0%, #080808 25%, #0f0f0f 50%, #1f1f1f 100%)" }}>
                    <Image src="/features/sweep-icon.svg" alt="" width={37} height={37} />
                    <span className="text-[21px] font-semibold text-white text-center tracking-[-0.42px]">Sweep all</span>
                    <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ boxShadow: "inset -4px 0 3px 0 rgba(255,255,255,0.1), inset 4px 0 3px 0 rgba(255,255,255,0.1), inset 0 4px 3.5px 0 rgba(255,255,255,0.1), inset 0 -4px 3.5px 0 rgba(255,255,255,0.1)" }} />
                  </div>
                  <Image src="/features/sweep-cursor.svg" alt="" width={29} height={34} className="absolute -bottom-4 right-0" />
                </div>
              </div>
            </FadeIn>

            {/* Plain English Insights — exact Figma node 45:134 */}
            <FadeIn delay={0.16}>
              <div className="bg-[rgba(242,242,242,0.7)] border-[2.321px] border-[#dbdbdb] rounded-[28px] p-[18px] flex-1 h-[366px] flex flex-col items-center justify-between overflow-hidden relative">
                {/* Warm glow — bottom right, orange/yellow */}
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[250px] h-[250px] rounded-full opacity-40 blur-[50px] pointer-events-none" style={{ background: "radial-gradient(circle, #f9a606 0%, #ffc107 50%, transparent 80%)" }} />

                {/* Text content — top */}
                <div className="flex flex-col w-full relative z-10">
                  <h3 className="font-[family-name:var(--font-display)] text-[20px] font-extrabold leading-[1.3] text-black">Plain English Insights</h3>
                  <p className="text-[16px] font-medium leading-[1.46] text-[#222]">
                    Finally understand your positions<br />
                    We explain exactly what&apos;s happening and why it matters.
                  </p>
                </div>

                {/* AI chip illustration — frosted glass container */}
                <div className="backdrop-blur-[1.5px] border-[1.4px] border-[rgba(219,219,219,0.7)] rounded-[19px] w-full flex items-center justify-center p-5 relative z-10" style={{ backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.02) 100%), linear-gradient(90deg, rgba(250,250,255,0.05) 0%, rgba(250,250,255,0.05) 100%)" }}>
                  <Image src="/features/ai-chip.svg" alt="AI" width={160} height={160} />
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Bottom row — 2 full-width cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Wallet Scanner */}
            <FadeIn delay={0.24}>
              <div className="bg-[rgba(242,242,242,0.7)] border-[2.321px] border-[#dbdbdb] rounded-[28px] p-[18px] flex-1 h-[366px] flex flex-col items-center justify-between overflow-hidden relative">
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[280px] h-[200px] rounded-full opacity-30 blur-[60px]" style={{ background: "radial-gradient(circle, #6c6cff 0%, #b461ca 40%, #e77193 70%, transparent 100%)" }} />
                <div className="flex flex-col w-full text-[#222] relative z-10">
                  <h3 className="font-[family-name:var(--font-display)] text-[20px] font-extrabold leading-[1.3]">Wallet Scanner</h3>
                  <p className="text-[16px] font-medium leading-[1.46]">
                    See everything in one place<br />
                    All chains. All protocols. No gaps.
                  </p>
                </div>
                <div className="backdrop-blur-[1.5px] border-[1.4px] border-[#dbdbdb] rounded-[19px] w-full flex items-center justify-center p-5 relative z-10" style={{ backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.02) 100%), linear-gradient(90deg, rgba(250,250,255,0.05) 0%, rgba(250,250,255,0.05) 100%)" }}>
                  <Image src="/features/wallet-scanner.svg" alt="Scanner" width={160} height={160} />
                </div>
              </div>
            </FadeIn>

            {/* Ongoing Monitoring — uses notification SVG */}
            <FadeIn delay={0.32}>
              <div className="bg-[rgba(242,242,242,0.7)] border-[2.321px] border-[#dbdbdb] rounded-[28px] p-[18px] flex-1 h-[366px] flex flex-col gap-[37px]">
                <div className="flex flex-col w-full text-[#222]">
                  <h3 className="font-[family-name:var(--font-display)] text-[20px] font-extrabold leading-[1.3]">Ongoing Monitoring</h3>
                  <div className="text-[16px] font-medium leading-[1.46]">
                    <p className="mb-0">Stay ahead without effort</p>
                    <p>Get alerts when positions turn stale.</p>
                  </div>
                </div>
                {/* Notification SVG asset */}
                <div className="flex-1 flex items-start justify-center overflow-hidden px-2">
                  <Image src="/features/notifications.svg" alt="Monitoring notifications" width={397} height={220} className="w-full max-w-[397px]" />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Launch app button */}
        <FadeIn delay={0.4}>
          <ConnectWalletCTA size="lg" label="Launch app" showIcon={false} />
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── How It Works (sticky + horizontal scroll on vertical scroll) ─── */
function HowItWorks() {
  const steps = [
    { num: "/features/num-1.svg", title: "Scan your wallet", body: "We detect every DeFi position across chains instantly." },
    { num: "/features/num-2.svg", title: "Score every position", body: "Each position gets a health score based on yield, activity, risk, and performance." },
    { num: "/features/num-3.svg", title: "Explain the risk", body: "No charts. No jargon. Just clear reasons why a position is dying." },
    { num: "/features/num-4.svg", title: "Clean it up", body: "Withdraw, swap, and redeploy — automatically." },
  ];

  return (
    <section id="how-it-works" className="py-24">
      <div className="mx-auto max-w-6xl px-6 flex flex-col items-center gap-[72px]">
        <FadeIn>
          <h2 className="text-center font-[family-name:var(--font-display)] text-[48px] font-extrabold text-black tracking-[-0.36px]">
            How it works
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {steps.map((s, i) => (
                <div
                  key={s.title}
              className="bg-[rgba(242,242,242,0.7)] border-[2.321px] border-[#dbdbdb] rounded-[26px] p-6 flex flex-col gap-4 items-start justify-center"
            >
              <Image src={s.num} alt="" width={25} height={32} className="h-8 w-auto" />
              <div className="flex flex-col gap-2 text-[#222] w-full">
                <h3 className="font-[family-name:var(--font-display)] text-[20px] font-extrabold leading-[1.3]">{s.title}</h3>
                <p className="text-[20px] font-medium leading-[1.46]">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
/* ─── CTA (Figma node 49:469) ─── */
function CTA() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 flex flex-col items-center gap-0">
        {/* Gradient logo */}
        <FadeIn>
          <div className="mb-8">
            <Image src="/cta-logo.svg" alt="" width={120} height={120} />
          </div>
        </FadeIn>

        {/* Heading */}
        <FadeIn delay={0.1}>
          <h2 className="font-[family-name:var(--font-display)] text-[36px] md:text-[48px] font-extrabold text-black tracking-[-0.36px] text-center leading-[1.15] max-w-[600px]">
            There&apos;s money sitting in your wallet right now.
          </h2>
        </FadeIn>

        {/* Launch app button */}
        <FadeIn delay={0.2}>
          <div className="mt-8">
            <ConnectWalletCTA size="lg" label="Launch app" showIcon={false} />
          </div>
        </FadeIn>

        {/* Partner icons */}
        <FadeIn delay={0.3}>
          <div className="mt-12 flex items-center justify-center gap-8">
            <Image src="/cta-icons/Frame.png" alt="Uniswap" width={40} height={40} className="opacity-80 hover:opacity-100 transition-opacity" />
            <Image src="/cta-icons/Frame-1.png" alt="OKX" width={40} height={40} className="opacity-80 hover:opacity-100 transition-opacity" />
            <Image src="/cta-icons/idzD_X2kvB_1776067148421 1.png" alt="Coinbase" width={40} height={40} className="opacity-80 hover:opacity-100 transition-opacity" />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── Footer (Figma node 49:530) ─── */
function Footer() {
  return (
    <footer className="px-10 pb-10">
      <div className="bg-[#0d0c09] rounded-[32px] relative overflow-hidden px-10 md:px-[140px] py-16 flex flex-col md:flex-row items-start justify-between gap-10">
        {/* Subtle center glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          <img src="/footer/glow.svg" alt="" className="w-[948px] h-[522px] opacity-20" />
        </div>

        {/* Left — Logo + description */}
        <div className="flex flex-col gap-6 max-w-[396px] relative z-10">
          <div className="flex items-center gap-3">
            <img src="/footer/logo-white.svg" alt="" className="w-[48px] h-[48px]" />
            <span className="font-[family-name:var(--font-display)] text-[24px] font-extrabold text-white tracking-[-0.24px] capitalize leading-4">
              Defi Sweeper
            </span>
          </div>
          <p className="text-[18px] font-medium text-white leading-[1.46] tracking-[-0.36px]">
            DeFi Sweeper finds dead positions, explains the risk in plain English, and moves your funds to better opportunities — automatically.
          </p>
        </div>

        {/* Right — Contact + Social icons */}
        <div className="flex flex-col gap-4 items-end relative z-10">
          <h3 className="font-[family-name:var(--font-display)] text-[20px] font-extrabold text-white leading-[1.3]">
            Contact
          </h3>
          <div className="flex items-center gap-4">
            {/* X / Twitter */}
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
              <img src="/footer/x-icon.svg" alt="X" className="w-[21px] h-[21px]" />
            </a>
            {/* LinkedIn */}
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
              <img src="/footer/linkedin-icon.svg" alt="LinkedIn" className="w-[21px] h-[21px]" />
            </a>
            {/* Discord */}
            <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
              <img src="/footer/discord-icon.svg" alt="Discord" className="w-[26px] h-[20px]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ─── */
export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  React.useEffect(() => {
    if (isConnected) {
      router.push("/dashboard");
    }
  }, [isConnected, router]);

  return (
    <div className="relative overflow-x-hidden">
      {/* Gradient background — centered behind hero, scrolls with page */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-[1000px] -z-10 overflow-hidden">
        <img
          src="/gradient-bg.svg"
          alt=""
          className="absolute left-1/2 top-[300px] -translate-x-1/2 -translate-y-1/2 blur-[50px] opacity-80"
          style={{ width: "1108px", height: "1168px" }}
        />
      </div>

      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}
