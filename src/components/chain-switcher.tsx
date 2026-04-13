"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";

const CHAINS = [
  { id: 1, name: "Ethereum", icon: "🔷" },
  { id: 42161, name: "Arbitrum", icon: "🔵" },
  { id: 196, name: "X Layer", icon: "⬡" },
  { id: 8453, name: "Base", icon: "🔵" },
  { id: 56, name: "BSC", icon: "🟡" },
  { id: 137, name: "Polygon", icon: "🟣" },
];

interface ChainSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChainSwitcher({ isOpen, onClose }: ChainSwitcherProps) {
  const { chain: currentChain } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
          style={{ background: "rgba(0,0,0,0.3)" }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-20 right-10 sm:right-20 w-[360px] rounded-[24px] border-[0.634px] border-[#d6d6d6] backdrop-blur-[25px] p-4 flex flex-col gap-4"
            style={{
              backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.02) 100%), linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.9) 100%)",
              boxShadow: "0px 0px 40px 0px rgba(0,0,0,0.12)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-semibold text-[#222] tracking-[-0.32px] leading-[1.46]">
                Switch network
              </p>
              <button
                onClick={onClose}
                className="p-1.5 rounded-[6px] border border-[rgba(0,0,0,0.07)] text-[#222] hover:bg-[#f2f2f2] transition-colors"
                style={{ backgroundColor: "rgba(242,242,242,0.2)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chain list */}
            <div className="flex flex-col gap-[7px]">
              {CHAINS.map((chain, i) => {
                const isConnected = currentChain?.id === chain.id;
                return (
                  <div key={chain.id}>
                    <button
                      onClick={() => {
                        if (!isConnected) {
                          switchChain({ chainId: chain.id });
                        }
                        onClose();
                      }}
                      className={`w-full flex items-center gap-2.5 p-1 rounded-[10px] transition-colors ${
                        isConnected
                          ? "bg-[rgba(108,108,255,0.1)] border border-[rgba(108,108,255,0.2)]"
                          : "hover:bg-[rgba(108,108,255,0.06)] border border-transparent"
                      }`}
                    >
                      {/* Chain icon */}
                      <div className="flex items-center p-1">
                        <div className="w-6 h-6 rounded-full bg-[#627EEA] flex items-center justify-center text-white text-[10px] font-bold">
                          {chain.name.charAt(0)}
                        </div>
                      </div>
                      {/* Chain name */}
                      <span className="text-[14px] font-medium text-[#121212] tracking-[-0.28px] leading-[1.46] flex-1 text-left">
                        {chain.name}
                      </span>
                      {/* Connected indicator */}
                      {isConnected && (
                        <div className="flex items-center gap-1 pr-1">
                          <span className="w-[10px] h-[10px] rounded-full bg-[#5a8400]" />
                          <span className="text-[12px] font-medium text-[#222] tracking-[-0.24px]">
                            connected
                          </span>
                        </div>
                      )}
                    </button>
                    {/* Divider (not after last item) */}
                    {i < CHAINS.length - 1 && (
                      <div className="border-t border-[#f0f0f0] mt-[7px]" />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
