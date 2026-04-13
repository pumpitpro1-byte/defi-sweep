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

// ─── DeFi Portfolio ──────────────────────────────────────────

export async function getDefiPositions(address: string, chains: string[]) {
  return okxGet<OkxResponse>("/api/v5/defi/user/asset-overview", {
    address,
    chainIds: chains.join(","),
  });
}

export async function getDefiPositionDetail(
  address: string,
  chain: string,
  platformId: string
) {
  return okxGet<OkxResponse>("/api/v5/defi/user/asset-detail", {
    address,
    chainId: chain,
    analysisPlatformId: platformId,
  });
}

// ─── DeFi Product Discovery ─────────────────────────────────

export async function searchDefiProducts(
  token: string,
  chain?: string,
  platform?: string
) {
  const params: Record<string, string> = {
    tokenSymbol: token,
  };
  if (chain) params.chainId = chain;
  if (platform) params.platformName = platform;
  return okxGet<OkxResponse>("/api/v5/defi/explore/product/list", params);
}

export async function getDefiProductDetail(investmentId: string) {
  return okxGet<OkxResponse>("/api/v5/defi/explore/product/detail", {
    investmentId,
  });
}

// ─── DeFi Invest/Withdraw/Collect (calldata generation) ─────

export async function getDefiInvestCalldata(params: {
  investmentId: string;
  address: string;
  token: string;
  amount: string;
  chain: string;
}) {
  return okxPost<OkxResponse>("/api/v5/defi/invest/subscribe", {
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
  return okxPost<OkxResponse>("/api/v5/defi/invest/redeem", {
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
  return okxPost<OkxResponse>("/api/v5/defi/invest/claim", body);
}

// ─── Wallet Portfolio ────────────────────────────────────────

export async function getTokenBalances(address: string, chains: string[]) {
  return okxGet<OkxResponse>(
    "/api/v5/wallet/asset/all-token-balances-by-address",
    {
      address,
      chains: chains.join(","),
    }
  );
}

// ─── Security ────────────────────────────────────────────────

export async function scanToken(chainId: string, tokenAddress: string) {
  return okxGet<OkxResponse>("/api/v5/dex/pre-transaction/scan-token", {
    chainId,
    tokenAddress,
  });
}

// ─── DEX Swap ────────────────────────────────────────────────

export async function getSwapQuote(params: {
  chainId: string;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  slippage?: string;
}) {
  return okxGet<OkxResponse>("/api/v5/dex/aggregator/quote", {
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
  return okxGet<OkxResponse>("/api/v5/dex/aggregator/swap", {
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
