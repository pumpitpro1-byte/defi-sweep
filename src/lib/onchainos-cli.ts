import { spawn } from "child_process";

const CLI_PATH = process.env.ONCHAINOS_CLI || "onchainos";

function runCli(args: string[], timeoutMs = 45000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(CLI_PATH, args, {
      shell: process.platform === "win32",
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`onchainos CLI timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`onchainos exited ${code}: ${stderr || stdout}`));
        return;
      }
      resolve(stdout);
    });
  });
}

function parseJson(out: string): unknown {
  // CLI prints a banner then JSON — extract the first `{...}` block
  const start = out.indexOf("{");
  if (start === -1) throw new Error(`onchainos output is not JSON: ${out.slice(0, 200)}`);
  return JSON.parse(out.slice(start));
}

const CHAIN_ID_TO_SLUG: Record<string, string> = {
  "1": "ethereum",
  "56": "bsc",
  "137": "polygon",
  "42161": "arbitrum",
  "8453": "base",
  "196": "xlayer",
  "10": "optimism",
  "43114": "avalanche",
  "59144": "linea",
  "534352": "scroll",
  "324": "zksync",
};

export async function cliGetDefiPositions(address: string, chainIds: string[]) {
  const slugs = chainIds.map((id) => CHAIN_ID_TO_SLUG[id]).filter(Boolean).join(",");
  const out = await runCli([
    "defi",
    "positions",
    "--address",
    address,
    "--chains",
    slugs,
  ]);
  return parseJson(out);
}

export async function cliGetDefiPositionDetail(
  address: string,
  chainId: string,
  platformId: string
) {
  const slug = CHAIN_ID_TO_SLUG[chainId] || chainId;
  const out = await runCli([
    "defi",
    "position-detail",
    "--address",
    address,
    "--chain",
    slug,
    "--platform-id",
    platformId,
  ]);
  return parseJson(out);
}

export function isOnchainosAvailable(): boolean {
  return process.env.USE_ONCHAINOS_CLI !== "false";
}
