#!/usr/bin/env node
/**
 * Compile + deploy SweeperRegistry.sol to X Layer (chain 196).
 *
 * Requires:
 *   DEPLOYER_PRIVATE_KEY  — hex, with or without 0x prefix. Wallet must hold OKB on X Layer.
 *
 * Usage:
 *   node scripts/deploy-sweeper-registry.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const solc = require("solc");

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ── Load .env.local ──
const envPath = resolve(root, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
  }
}

// ── Auto-generate deployer if none exists ──
let pk = process.env.DEPLOYER_PRIVATE_KEY;
if (!pk) {
  const { generatePrivateKey } = await import("viem/accounts");
  pk = generatePrivateKey();
  const line = `\nDEPLOYER_PRIVATE_KEY=${pk}\n`;
  writeFileSync(envPath, (existsSync(envPath) ? readFileSync(envPath, "utf8") : "") + line);
  console.log("→ Generated new deployer key and saved to .env.local");
}
const privateKey = pk.startsWith("0x") ? pk : `0x${pk}`;

// ── Compile ──
const src = readFileSync(resolve(root, "contracts/SweeperRegistry.sol"), "utf8");
const input = {
  language: "Solidity",
  sources: { "SweeperRegistry.sol": { content: src } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};

console.log("→ Compiling SweeperRegistry.sol …");
const out = JSON.parse(solc.compile(JSON.stringify(input)));
if (out.errors?.some((e) => e.severity === "error")) {
  for (const e of out.errors) console.error(e.formattedMessage);
  process.exit(1);
}
const c = out.contracts["SweeperRegistry.sol"].SweeperRegistry;
const abi = c.abi;
const bytecode = "0x" + c.evm.bytecode.object;
console.log(`  abi entries: ${abi.length}`);
console.log(`  bytecode:    ${bytecode.length - 2} hex chars (${(bytecode.length - 2) / 2} bytes)`);

// ── Deploy via viem ──
const { createWalletClient, createPublicClient, http, defineChain } = await import("viem");
const { privateKeyToAccount } = await import("viem/accounts");

const isTestnet = (process.env.NETWORK || "testnet").toLowerCase() === "testnet";
const xlayer = isTestnet
  ? defineChain({
      id: 1952,
      name: "X Layer Testnet",
      nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
      rpcUrls: { default: { http: ["https://testrpc.xlayer.tech"] } },
      blockExplorers: {
        default: { name: "OKX Explorer", url: "https://www.okx.com/web3/explorer/xlayer-test" },
      },
    })
  : defineChain({
      id: 196,
      name: "X Layer",
      nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
      rpcUrls: { default: { http: ["https://rpc.xlayer.tech"] } },
      blockExplorers: {
        default: { name: "OKX Explorer", url: "https://www.okx.com/web3/explorer/xlayer" },
      },
    });
console.log(`→ Target: ${xlayer.name} (chainId ${xlayer.id})`);

const account = privateKeyToAccount(privateKey);
const pub = createPublicClient({ chain: xlayer, transport: http() });
const wallet = createWalletClient({ account, chain: xlayer, transport: http() });

const bal = await pub.getBalance({ address: account.address });
console.log(`\n→ Deployer: ${account.address}`);
console.log(`  Balance:  ${Number(bal) / 1e18} OKB`);
if (bal === 0n) {
  console.error("\n✗ Deployer has 0 OKB on " + xlayer.name);
  if (isTestnet) {
    console.error("  Fund via faucet:  https://web3.okx.com/xlayer/faucet");
    console.error("  Paste this address:", account.address);
  } else {
    console.error("  Send OKB to:", account.address);
  }
  console.error("\n  Then re-run:  node scripts/deploy-sweeper-registry.mjs");
  process.exit(1);
}

console.log("\n→ Deploying to X Layer …");
const hash = await wallet.deployContract({ abi, bytecode });
console.log(`  tx hash: ${hash}`);

const receipt = await pub.waitForTransactionReceipt({ hash });
if (receipt.status !== "success") {
  console.error("✗ Deployment reverted");
  process.exit(1);
}
const address = receipt.contractAddress;
console.log(`\n✓ Deployed: ${address}`);
console.log(`  Explorer: https://www.okx.com/web3/explorer/xlayer/address/${address}`);

// ── Write artifacts ──
const outDir = resolve(root, "src/contracts");
mkdirSync(outDir, { recursive: true });
writeFileSync(
  resolve(outDir, "sweeper-registry.json"),
  JSON.stringify({ address, abi, deployedBy: account.address, network: "xlayer", chainId: 196, txHash: hash }, null, 2)
);
console.log(`  artifact written to src/contracts/sweeper-registry.json`);
