import { spawnSync } from "child_process";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreateTokens: number;
  totalTokens: number;
  calls: number;
  costUsd: number;
}

const _usage: TokenUsage = {
  inputTokens: 0, outputTokens: 0,
  cacheReadTokens: 0, cacheCreateTokens: 0,
  totalTokens: 0, calls: 0, costUsd: 0,
};

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function floatEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function getTokenUsage(): TokenUsage {
  return { ..._usage };
}

export function resetTokenUsage(): void {
  _usage.inputTokens = 0;
  _usage.outputTokens = 0;
  _usage.cacheReadTokens = 0;
  _usage.cacheCreateTokens = 0;
  _usage.totalTokens = 0;
  _usage.calls = 0;
  _usage.costUsd = 0;
}

export function callClaude(prompt: string, opts?: { timeout?: number }): string {
  const maxCalls = intEnv("MAX_CLAUDE_CALLS_PER_RUN", 80);
  const maxCost = floatEnv("MAX_CLAUDE_COST_PER_RUN", 3);
  if (maxCalls > 0 && _usage.calls >= maxCalls) {
    console.warn(`[claude] budget skip: calls=${_usage.calls} max=${maxCalls}`);
    return "";
  }
  if (maxCost > 0 && _usage.costUsd >= maxCost) {
    console.warn(`[claude] budget skip: cost=$${_usage.costUsd.toFixed(4)} max=$${maxCost}`);
    return "";
  }

  const timeout = opts?.timeout ?? 120_000;
  const r = spawnSync("claude", ["-p", "--output-format", "json"], {
    input: prompt,
    encoding: "utf-8",
    timeout,
    maxBuffer: 20 * 1024 * 1024,
  });

  _usage.calls++;

  if (r.error) {
    console.error("[claude] error:", r.error.message);
    return "";
  }

  const stdout = (r.stdout ?? "").trim();

  // --output-format json returns JSONL; find the result line
  const lines = stdout.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const obj = JSON.parse(lines[i]);
      if (obj.type === "result") {
        if (obj.usage) {
          _usage.inputTokens += obj.usage.input_tokens ?? 0;
          _usage.outputTokens += obj.usage.output_tokens ?? 0;
          _usage.cacheReadTokens += obj.usage.cache_read_input_tokens ?? 0;
          _usage.cacheCreateTokens += obj.usage.cache_creation_input_tokens ?? 0;
          _usage.totalTokens +=
            (obj.usage.input_tokens ?? 0) +
            (obj.usage.output_tokens ?? 0) +
            (obj.usage.cache_read_input_tokens ?? 0) +
            (obj.usage.cache_creation_input_tokens ?? 0);
        }
        if (obj.total_cost_usd) {
          _usage.costUsd += obj.total_cost_usd;
        }
        return obj.result ?? "";
      }
    } catch { /* skip non-JSON lines */ }
  }

  // fallback: treat entire stdout as text (legacy --print behavior)
  return stdout;
}

export function logTokenUsage(): void {
  const u = _usage;
  if (u.calls === 0) return;
  const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
  console.log(
    `[claude] token usage: calls=${u.calls} input=${fmtK(u.inputTokens)} output=${fmtK(u.outputTokens)} cache_read=${fmtK(u.cacheReadTokens)} cache_create=${fmtK(u.cacheCreateTokens)} total=${fmtK(u.totalTokens)} cost=$${u.costUsd.toFixed(4)}`
  );
}
