"use client";

import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";

const VALUE_PROPS = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    title: "Scan",
    desc: "Find forgotten positions across all chains",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Score",
    desc: "AI health analysis for every position",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: "Sweep",
    desc: "One-click cleanup to better yields",
  },
];

export default function LandingPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push("/dashboard");
    }
  }, [isConnected, router]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="text-5xl mb-4">🧹</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.96px] text-[#0a0a0a] font-[family-name:var(--font-display)]">
            DeFi Sweeper
          </h1>
          <p className="text-lg text-[#545454] max-w-lg mx-auto">
            Your DeFi positions are leaking money.
            <br />
            <span className="text-[#121212] font-semibold">
              Let&apos;s fix that.
            </span>
          </p>
        </motion.div>

        {/* Connect CTA — points to header wallet button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex justify-center"
        >
          <p className="text-sm text-[#545454] bg-[#f2f2f2] rounded-[32px] px-6 py-3 border border-[rgba(0,0,0,0.1)]">
            Connect your wallet above to start scanning
          </p>
        </motion.div>

        {/* Value Props */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8"
        >
          {VALUE_PROPS.map((prop) => (
            <div key={prop.title} className="text-center space-y-2">
              <div className="text-[#6c6cff] flex justify-center">
                {prop.icon}
              </div>
              <h3 className="font-semibold text-[#121212]">{prop.title}</h3>
              <p className="text-xs text-[#545454]">{prop.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex justify-center gap-8 pt-4 text-xs text-[#545454]"
        >
          <span>$20M+ recoverable</span>
          <span>·</span>
          <span>158K wallets affected</span>
          <span>·</span>
          <span>475 dead DeFi sites</span>
        </motion.div>

        {/* Footer */}
        <p className="text-xs text-[#A3A3A3] pt-8">
          Built on X Layer · Powered by OKX OnchainOS · AI by Claude
        </p>
      </div>
    </main>
  );
}
