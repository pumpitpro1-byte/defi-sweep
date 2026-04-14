"use client";

import { tokenIcons, networkIcons } from "@web3icons/react";
import { tokens as tokenMetadata } from "@web3icons/common";
import type { ComponentType } from "react";

// Build an address → component-suffix map once, using @web3icons/common metadata.
// Metadata entries look like: { symbol: "usdc", filePath: "token:USDC", addresses: { ethereum: "0xA0b8...", base: "0x833...", ... } }
// We normalize every address to lowercase for lookup.
const ADDRESS_TO_SUFFIX: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const t of tokenMetadata as any[]) {
    if (!t?.filePath || !t?.addresses) continue;
    const suffix = String(t.filePath).split(":")[1]; // "token:USDC" → "USDC"
    if (!suffix) continue;
    for (const addr of Object.values(t.addresses as Record<string, string>)) {
      if (typeof addr === "string" && addr.startsWith("0x")) {
        map[addr.toLowerCase()] = suffix;
      }
    }
  }
  return map;
})();

type IconComp = ComponentType<{ className?: string }>;

// Symbols whose icons live under a different key in @web3icons/react.
// Keys are normalized (uppercase, dots stripped).
const TOKEN_ALIAS: Record<string, string> = {
  WETH: "ETH",
  STETH: "ETH",
  WBTC: "BTC",
  WMATIC: "MATIC",
  WBNB: "BNB",
  USDCE: "USDC",    // USDC.e → USDC
  USDTE: "USDT",    // USDT.e → USDT
  DAIE: "DAI",      // DAI.e → DAI
  AUSDC: "USDC",    // Aave aUSDC
  AUSDT: "USDT",
  ADAI: "DAI",
  AWETH: "ETH",
  AAWETH: "ETH",
  CUSDC: "USDC",    // Compound
  CUSDT: "USDT",
  CDAI: "DAI",
  SUSHI: "SUSHI",
};

// chain-id (OKX network index) → lowercase slug/key
const CHAIN_ID_TO_NETWORK_KEY: Record<string, string> = {
  "1": "Ethereum",
  "56": "BinanceSmartChain",
  "137": "Polygon",
  "42161": "ArbitrumOne",
  "8453": "Base",
  "196": "XLayer",
  "10": "Optimism",
  "43114": "Avalanche",
  "324": "Zksync",
  "59144": "Linea",
  "534352": "Scroll",
  "1952": "XLayer",    // testnet
};

// chain slug strings we might see ("ethereum", "base", etc.)
const CHAIN_SLUG_TO_KEY: Record<string, string> = {
  ethereum: "Ethereum",
  eth: "Ethereum",
  bsc: "BinanceSmartChain",
  binance: "BinanceSmartChain",
  bnb: "BinanceSmartChain",
  polygon: "Polygon",
  matic: "Polygon",
  arbitrum: "ArbitrumOne",
  arb: "ArbitrumOne",
  base: "Base",
  xlayer: "XLayer",
  "x-layer": "XLayer",
  "x layer": "XLayer",
  okb: "XLayer",
  optimism: "Optimism",
  op: "Optimism",
  avalanche: "Avalanche",
  avax: "Avalanche",
  zksync: "Zksync",
  linea: "Linea",
  scroll: "Scroll",
};

function normalizeSymbol(symbol: string): string {
  return symbol.toUpperCase().replace(/\./g, "").replace(/-/g, "");
}

function lookupToken(symbol: string, address?: string): IconComp | null {
  const map = tokenIcons as unknown as Record<string, IconComp>;

  // 1. Address lookup via web3icons metadata (handles weird token symbols,
  //    aave/compound wrappers, etc.)
  if (address) {
    const suffix = ADDRESS_TO_SUFFIX[address.toLowerCase()];
    if (suffix) {
      const hit = map[`Token${suffix}`];
      if (hit) return hit;
    }
  }

  // 2. Alias table (WETH→ETH, STETH→ETH, USDC.e→USDC, etc.)
  const raw = normalizeSymbol(symbol);
  const canonical = TOKEN_ALIAS[raw] || raw;
  return map[`Token${canonical}`] || map[`Token${raw}`] || null;
}

function lookupNetwork(chain: string): IconComp | null {
  const key =
    CHAIN_ID_TO_NETWORK_KEY[chain] ||
    CHAIN_SLUG_TO_KEY[chain.toLowerCase()] ||
    null;
  if (!key) return null;
  const map = networkIcons as unknown as Record<string, IconComp>;
  return map[`Network${key}`] || null;
}

export function TokenIcon({
  symbol,
  address,
  className = "w-6 h-6 flex-shrink-0",
}: {
  symbol: string;
  address?: string;
  className?: string;
}) {
  const Icon = lookupToken(symbol, address);
  if (Icon) return <Icon className={className} />;
  return (
    <div
      className={`${className} rounded-full bg-[#e5e5e5] flex items-center justify-center text-[10px] font-bold text-[#545454]`}
    >
      {symbol.slice(0, 3).toUpperCase()}
    </div>
  );
}

export function NetworkIcon({
  chain,
  className = "w-4 h-4 flex-shrink-0",
}: {
  chain: string;
  className?: string;
}) {
  const Icon = lookupNetwork(chain);
  if (Icon) return <Icon className={className} />;
  return (
    <div
      className={`${className} rounded-full bg-[#e5e5e5] flex items-center justify-center text-[8px] font-bold text-[#545454]`}
    >
      {chain.slice(0, 1).toUpperCase()}
    </div>
  );
}

/**
 * Renders a stacked pair of token icons (like Uniswap LP positions).
 * Falls back to a single icon if only one token.
 */
interface TokenInput {
  symbol: string;
  address?: string;
}

function asInput(t: string | TokenInput): TokenInput {
  return typeof t === "string" ? { symbol: t } : t;
}

export function TokenPair({
  symbols,
  className = "w-6 h-6",
}: {
  symbols: (string | TokenInput)[];
  className?: string;
}) {
  const valid = symbols.map(asInput).filter((t) => t.symbol).slice(0, 2);
  if (valid.length === 0) return <TokenIcon symbol="?" className={className} />;
  if (valid.length === 1) {
    return <TokenIcon symbol={valid[0].symbol} address={valid[0].address} className={className} />;
  }
  return (
    <div className="relative flex-shrink-0" style={{ width: 40, height: 24 }}>
      <div className="absolute left-0 top-0 rounded-full ring-2 ring-white overflow-hidden">
        <TokenIcon symbol={valid[0].symbol} address={valid[0].address} className={className} />
      </div>
      <div className="absolute left-4 top-0 rounded-full ring-2 ring-white overflow-hidden">
        <TokenIcon symbol={valid[1].symbol} address={valid[1].address} className={className} />
      </div>
    </div>
  );
}
