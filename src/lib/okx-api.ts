import CryptoJS from "crypto-js";
import axios, { type AxiosRequestConfig } from "axios";

const BASE_URL = "https://web3.okx.com";

function getTimestamp(): string {
  return new Date().toISOString();
}

function sign(
  timestamp: string,
  method: string,
  requestPath: string,
  body: string
): string {
  const secretKey = process.env.OKX_SECRET_KEY || "";
  const prehash = timestamp + method.toUpperCase() + requestPath + body;
  return CryptoJS.enc.Base64.stringify(
    CryptoJS.HmacSHA256(prehash, secretKey)
  );
}

function getHeaders(method: string, path: string, body: string = "") {
  const timestamp = getTimestamp();
  return {
    "OK-ACCESS-KEY": process.env.OKX_API_KEY || "",
    "OK-ACCESS-SIGN": sign(timestamp, method, path, body),
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": process.env.OKX_PASSPHRASE || "",
    "OK-ACCESS-PROJECT": process.env.OKX_PROJECT_ID || "",
    "Content-Type": "application/json",
  };
}

// ─── Generic request helpers ─────────────────────────────────

export async function okxGet<T = unknown>(
  path: string,
  params?: Record<string, string>,
  timeoutMs: number = 30000
): Promise<T> {
  const queryString = params
    ? "?" + new URLSearchParams(params).toString()
    : "";
  const fullPath = path + queryString;
  const headers = getHeaders("GET", fullPath);

  const config: AxiosRequestConfig = {
    method: "GET",
    url: BASE_URL + fullPath,
    headers,
    timeout: timeoutMs,
  };

  const response = await axios(config);
  return response.data;
}

export async function okxPost<T = unknown>(
  path: string,
  body: Record<string, unknown>,
  timeoutMs: number = 30000
): Promise<T> {
  const bodyStr = JSON.stringify(body);
  const headers = getHeaders("POST", path, bodyStr);

  const config: AxiosRequestConfig = {
    method: "POST",
    url: BASE_URL + path,
    headers,
    data: body,
    timeout: timeoutMs,
  };

  const response = await axios(config);
  return response.data;
}

// ─── OKX Response wrapper ────────────────────────────────────

interface OkxResponse<T = unknown> {
  code: string;
  msg: string;
  data: T;
}

// ─── DeFi Portfolio (v6 — POST) ──────────────────────────────

export async function getDefiPositions(address: string, chains: string[]) {
  return okxPost<OkxResponse>("/api/v6/defi/user/asset/platform/list", {
    address,
    chains: chains.join(","),
  });
}

export async function getDefiPositionDetail(
  address: string,
  chain: string,
  platformId: string
) {
  return okxPost<OkxResponse>("/api/v6/defi/user/asset/platform/detail", {
    address,
    chainId: chain,
    analysisPlatformId: platformId,
  });
}

// ─── DeFi Product Discovery (v6) ─────────────────────────────

export async function searchDefiProducts(
  token: string,
  chain?: string,
  platform?: string
) {
  const body: Record<string, unknown> = { tokenSymbol: token };
  if (chain) body.chainId = chain;
  if (platform) body.platformName = platform;
  return okxPost<OkxResponse>("/api/v6/defi/product/search", body);
}

export async function getDefiProductDetail(investmentId: string) {
  return okxPost<OkxResponse>("/api/v6/defi/product/detail", {
    investmentId,
  });
}

// ─── DeFi Invest/Withdraw/Collect — v6 transaction routes ────

export async function getDefiInvestCalldata(params: {
  investmentId: string;
  address: string;
  token: string;
  amount: string;
  chain: string;
}) {
  return okxPost<OkxResponse>("/api/v6/defi/transaction/enter", {
    investmentId: params.investmentId,
    userWalletAddress: params.address,
    userInputList: [
      {
        tokenAddress: params.token,
        chainIndex: params.chain,
        coinAmount: params.amount,
      },
    ],
  });
}

export async function getDefiWithdrawCalldata(params: {
  investmentId: string;
  address: string;
  chain: string;
  ratio: string;
  platformId: string;
}) {
  return okxPost<OkxResponse>("/api/v6/defi/transaction/exit", {
    investmentId: params.investmentId,
    userWalletAddress: params.address,
    chainId: params.chain,
    redeemRatio: params.ratio,
    analysisPlatformId: params.platformId,
  });
}

export async function getDefiCollectCalldata(params: {
  address: string;
  chain: string;
  rewardType: string;
  investmentId?: string;
  platformId?: string;
}) {
  const body: Record<string, unknown> = {
    userWalletAddress: params.address,
    chainId: params.chain,
    rewardType: params.rewardType,
  };
  if (params.investmentId) body.investmentId = params.investmentId;
  if (params.platformId) body.analysisPlatformId = params.platformId;
  return okxPost<OkxResponse>("/api/v6/defi/transaction/claim", body);
}

// ─── Wallet Portfolio (v6) ───────────────────────────────────

export async function getTokenBalances(address: string, chains: string[]) {
  return okxGet<OkxResponse>(
    "/api/v6/dex/balance/all-token-balances-by-address",
    {
      address,
      chains: chains.join(","),
    }
  );
}

// ─── Security (v6) ───────────────────────────────────────────

export async function scanToken(chainId: string, tokenAddress: string) {
  return okxGet<OkxResponse>("/api/v6/security/token-scan", {
    chainId,
    tokenAddress,
  });
}

// ─── DEX Swap (v6) ───────────────────────────────────────────

export async function getSwapQuote(params: {
  chainId: string;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  slippage?: string;
}) {
  return okxGet<OkxResponse>("/api/v6/dex/aggregator/quote", {
    chainId: params.chainId,
    fromTokenAddress: params.fromTokenAddress,
    toTokenAddress: params.toTokenAddress,
    amount: params.amount,
    slippage: params.slippage || "0.01",
  });
}

export async function getSwapData(params: {
  chainId: string;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  userWalletAddress: string;
  slippage?: string;
}) {
  return okxGet<OkxResponse>("/api/v6/dex/aggregator/swap", {
    chainId: params.chainId,
    fromTokenAddress: params.fromTokenAddress,
    toTokenAddress: params.toTokenAddress,
    amount: params.amount,
    userWalletAddress: params.userWalletAddress,
    slippage: params.slippage || "0.01",
  });
}

// ─── Utility: check if OKX API keys are configured ──────────

export function isOkxConfigured(): boolean {
  return !!(
    process.env.OKX_API_KEY &&
    process.env.OKX_SECRET_KEY &&
    process.env.OKX_PASSPHRASE &&
    process.env.OKX_PROJECT_ID
  );
}
