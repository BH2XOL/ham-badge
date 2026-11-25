import type { AppConfig } from "./types.js";

export const DEFAULT_OP_STATUS_TTL_MS = 12 * 3600 * 1000;

/**
 * Load runtime configuration from environment variables with safe defaults.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsedPort = Number(env.PORT || 3003);
  return {
    port: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3003,
    dbPath: env.DB_PATH || "./ham-status.db",
    authService: env.AUTH_SERVICE || "http://127.0.0.1:3002",
    internalApiKey: env.STATUS_API_KEY || "",
    opStatusTtlMs: DEFAULT_OP_STATUS_TTL_MS,
  };
}
