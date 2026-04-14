"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { WalletDropdown } from "./wallet-dropdown";
import { NetworkIcon } from "./web3-icons";

export function Header() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [walletOpen, setWalletOpen] = useState(false);

  const truncated = address ? `${address.slice(0, 6)}...${address.slice(-3)}` : "";

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-[25px]">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between px-10 py-4">
          {/* Left: Logo icon + text */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <Image src="/logo-icon.svg" alt="" width={48} height={48} priority />
            <span className="text-[20px] font-extrabold text-[#222] tracking-[-0.2px] capitalize leading-4 font-[family-name:var(--font-display)]">
              Defi Sweeper
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            {/* Refresh button */}
            {isConnected && (
              <button
                onClick={() => window.location.reload()}
                className="p-1.5 rounded-[12px] border border-[rgba(0,0,0,0.07)] hover:bg-[#f2f2f2] transition-colors"
                style={{ backgroundColor: "rgba(242,242,242,0.2)" }}
                title="Refresh"
              >
                <svg className="w-6 h-6 text-[#222]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 14.652" />
                </svg>
              </button>
            )}

            {/* X Layer indicator */}
            {isConnected && (
              <div
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-[12px] border border-[rgba(0,0,0,0.07)]"
                style={{ backgroundColor: "rgba(242,242,242,0.2)" }}
                title="X Layer Testnet"
              >
                <NetworkIcon chain="xlayer" className="w-5 h-5 flex-shrink-0" />
                <span className="text-[13px] font-semibold text-[#121212] tracking-[-0.14px]">
                  X Layer Testnet
                </span>
              </div>
            )}

            {/* Wallet button */}
            {isConnected ? (
              <button
                onClick={() => setWalletOpen(true)}
                className="flex items-center gap-1 px-1.5 py-1.5 rounded-[12px] border border-[rgba(0,0,0,0.07)] transition-colors hover:bg-[#f2f2f2]"
                style={{ backgroundColor: "rgba(242,242,242,0.2)" }}
              >
                <div className="bg-[#bcff2f] rounded-[8px] p-1 flex items-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="#222"/>
                  </svg>
                </div>
                <span className="text-[14px] font-semibold text-[#121212] tracking-[-0.14px] capitalize leading-4 px-0.5">
                  {truncated}
                </span>
                <svg className="w-5 h-5 text-[#222]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal, mounted }) => (
                  <div>
                    {mounted && (
                      <button
                        onClick={openConnectModal}
                        className="px-5 py-3 rounded-[32px] text-[16px] font-semibold text-white bg-[#6c6cff] hover:bg-[#5b5be6] border border-[rgba(0,0,0,0.1)] transition-colors"
                      >
                        Connect Wallet
                      </button>
                    )}
                  </div>
                )}
              </ConnectButton.Custom>
            )}
          </div>
        </div>
      </header>

      {/* Custom dropdowns */}
      <WalletDropdown isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
    </>
  );
}
