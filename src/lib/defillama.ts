import axios from "axios";

const BASE = "https://api.llama.fi";

export async function getProtocolTvl(slug: string) {
  try {
    const { data } = await axios.get(`${BASE}/protocol/${slug}`, {
      timeout: 10000,
    });
    return {
      name: data.name,
      tvl: data.tvl,
      chainTvls: data.chainTvls,
      audits: data.audits,
      audit_note: data.audit_note,
      category: data.category,
      url: data.url,
    };
  } catch {
    return null;
  }
}

export async function getYieldPools(chain?: string) {
  try {
    const { data } = await axios.get(`${BASE}/yields/pools`, {
      timeout: 10000,
    });
    if (chain) {
      return data.data?.filter(
        (p: { chain: string }) => p.chain.toLowerCase() === chain.toLowerCase()
      );
    }
    return data.data;
  } catch {
    return [];
  }
}
