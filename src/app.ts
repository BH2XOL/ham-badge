import { Hono } from "hono";
import { createRequireAuth } from "./middleware/auth.js";
import { registerStatusRoutes } from "./routes/status.js";
import type { AppConfig, StatusStore } from "./types.js";

export interface AppDependencies {
  config: AppConfig;
  store: StatusStore;
  fetchFn?: typeof fetch;
}

/**
 * Create a configured Hono application instance.
 */
export function createApp(deps: AppDependencies): Hono {
  const app = new Hono();
  const requireAuth = createRequireAuth({
    authService: deps.config.authService,
    internalApiKey: deps.config.internalApiKey,
    fetchFn: deps.fetchFn,
  });

  registerStatusRoutes(app, {
    store: deps.store,
    requireAuth,
  });

  return app;
}
