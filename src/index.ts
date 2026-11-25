import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createStatusStore } from "./db/status-store.js";

const config = loadConfig();
const store = createStatusStore(config.dbPath, {
  ttlMs: config.opStatusTtlMs,
});
const app = createApp({ config, store });

serve({ fetch: app.fetch, port: config.port });
console.log(`ham-badge listening on :${config.port}`);
