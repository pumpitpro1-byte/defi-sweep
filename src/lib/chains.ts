import { type ChainConfig } from "./types";

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    id: 196,
    name: "xlayer",
    label: "X Layer",
    nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
    rpcUrl: "https://rpc.xlayer.tech",
    explorerUrl: "https://www.okx.com/web3/explorer/xlayer",
  },
  {
    id: 1,
    name: "ethereum",
    label: "Ethereum",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: "https://eth.llamarpc.com",
    explorerUrl: "https://etherscan.io",
  },
  {
    id: 42161,
    name: "arbitrum",
    label: "Arbitrum",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
  },
  {
    id: 8453,
    name: "base",
    label: "Base",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
  },
  {
    id: 56,
    name: "bsc",
    label: "BSC",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrl: "https://bsc-dataseed.binance.org",
    explorerUrl: "https://bscscan.com",
  },
  {
    id: 137,
    name: "polygon",
    label: "Polygon",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrl: "https://polygon-rpc.com",
    explorerUrl: "https://polygonscan.com",
  },
];

export const DEFAULT_SCAN_CHAINS = SUPPORTED_CHAINS.map((c) => c.name);

export function getChainByName(name: string): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find(
    (c) => c.name === name.toLowerCase() || c.label.toLowerCase() === name.toLowerCase()
  );
}

export function getChainById(id: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find((c) => c.id === id);
}

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const chain = getChainById(chainId);
  if (!chain) return `https://www.okx.com/web3/explorer/xlayer/tx/${txHash}`;
  return `${chain.explorerUrl}/tx/${txHash}`;
}
