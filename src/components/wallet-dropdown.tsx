"use client";

import { useAccount, useDisconnect, useBalance } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { NetworkIcon } from "./web3-icons";

interface WalletDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletDropdown({ isOpen, onClose }: WalletDropdownProps) {
  const { address, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  if (!isOpen || !address) return null;

  const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  const handleLoadDemo = () => {
    window.dispatchEvent(new CustomEvent("defi-sweeper:load-demo"));
    onClose();
  };

  const handleScanAddress = () => {
    window.dispatchEvent(new CustomEvent("defi-sweeper:scan-address"));
    onClose();
  };

  const explorerUrl = chain?.blockExplorers?.default?.url
    ? `${chain.blockExplorers.default.url}/address/${address}`
    : `https://etherscan.io/address/${address}`;

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
            className="absolute top-20 right-10 sm:right-20 w-[320px] rounded-[24px] border-[0.634px] border-[#d6d6d6] backdrop-blur-[25px] p-4 flex flex-col gap-4"
            style={{
              backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.02) 100%), linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.9) 100%)",
              boxShadow: "0px 0px 40px 0px rgba(0,0,0,0.12)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-semibold text-[#222] tracking-[-0.32px] leading-[1.46]">
                Account
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

            {/* Address + Balance */}
            <div className="flex flex-col gap-1">
              <p className="text-[14px] font-medium text-[#121212] tracking-[-0.28px] leading-[1.46] font-mono">
                {truncated}
              </p>
              {balance && (
                <p className="text-[14px] font-medium text-[#545454] tracking-[-0.28px] leading-[1.46]">
                  {(Number(balance.value) / 10 ** balance.decimals).toFixed(4)} {balance.symbol}
                </p>
              )}
              {chain && (
                <div className="flex items-center gap-1.5 mt-1">
                  <NetworkIcon chain={String(chain.id)} className="w-4 h-4" />
                  <span className="text-[12px] font-medium text-[#222] tracking-[-0.24px]">
                    Connected to {chain.name}
                  </span>
                  <span className="w-[8px] h-[8px] rounded-full bg-[#5a8400] ml-1" />
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-[#f0f0f0]" />

            {/* Actions */}
            <div className="flex flex-col gap-[7px]">
              {/* Copy Address */}
              <button
                onClick={copyAddress}
                className="w-full flex items-center gap-3 p-2 rounded-[10px] hover:bg-[rgba(108,108,255,0.06)] transition-colors text-left"
              >
                <svg className="w-5 h-5 text-[#545454] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                </svg>
                <span className="text-[14px] font-medium text-[#121212] tracking-[-0.28px] leading-[1.46]">
                  Copy address
                </span>
              </button>

              {/* Divider */}
              <div className="border-t border-[#f0f0f0]" />

              {/* View on Explorer */}
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full flex items-center gap-3 p-2 rounded-[10px] hover:bg-[rgba(108,108,255,0.06)] transition-colors"
              >
                <svg className="w-5 h-5 text-[#545454] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                <span className="text-[14px] font-medium text-[#121212] tracking-[-0.28px] leading-[1.46]">
                  View on Explorer
                </span>
              </a>

              {/* Divider */}
              <div className="border-t border-[#f0f0f0]" />

              {/* Use demo data */}
              <button
                onClick={handleLoadDemo}
                className="w-full flex items-center gap-3 p-2 rounded-[10px] hover:bg-[rgba(108,108,255,0.06)] transition-colors text-left"
              >
                <svg className="w-5 h-5 text-[#545454] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
                <span className="text-[14px] font-medium text-[#121212] tracking-[-0.28px] leading-[1.46]">
                  Use demo data
                </span>
              </button>

              {/* Spectator mode — scan another wallet */}
              <button
                onClick={handleScanAddress}
                className="w-full flex items-center gap-3 p-2 rounded-[10px] hover:bg-[rgba(108,108,255,0.06)] transition-colors text-left"
              >
                <svg className="w-5 h-5 text-[#545454] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-[14px] font-medium text-[#121212] tracking-[-0.28px] leading-[1.46]">
                  Spectator mode
                </span>
              </button>

              {/* Divider */}
              <div className="border-t border-[#f0f0f0]" />

              {/* Disconnect */}
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-3 p-2 rounded-[10px] hover:bg-[rgba(230,46,36,0.06)] transition-colors"
              >
                <svg className="w-5 h-5 text-[#e62e24] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                <span className="text-[14px] font-medium text-[#e62e24] tracking-[-0.28px] leading-[1.46]">
                  Disconnect
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
