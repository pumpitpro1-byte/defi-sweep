"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const SCAN_MESSAGES = [
  "Scanning X Layer positions...",
  "Checking Ethereum positions...",
  "Analyzing Arbitrum positions...",
  "Scanning BSC positions...",
  "Checking protocol health...",
  "Scoring your positions...",
];

export function ScanAnimation({ address }: { address?: string }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % SCAN_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      {/* Radar animation */}
      <div className="relative w-32 h-32">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[#6c6cff]/30"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-4 rounded-full border-2 border-[#6c6cff]/50"
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0.2, 0.7] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.3,
          }}
        />
        <div className="absolute inset-8 rounded-full bg-[#6c6cff]/20 flex items-center justify-center">
          <motion.div
            className="w-8 h-8 rounded-full bg-[#6c6cff]"
            animate={{ scale: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </div>

      {/* Status text */}
      <div className="text-center">
        <motion.p
          key={messageIndex}
          className="text-lg text-[#121212] font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {SCAN_MESSAGES[messageIndex]}
        </motion.p>
        {truncatedAddress && (
          <p className="text-sm text-[#545454] mt-2 font-mono">
            {truncatedAddress}
          </p>
        )}
        <p className="text-xs text-[#545454] mt-4">
          Usually takes 10-15 seconds
        </p>
      </div>
    </div>
  );
}
