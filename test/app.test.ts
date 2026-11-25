import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { createStatusStore } from "../src/db/status-store.js";
import type { AppConfig } from "../src/types.js";

function makeTestApp(fetchFn?: typeof fetch) {
  const config: AppConfig = {
    port: 3003,
    dbPath: ":memory:",
    authService: "http://auth.local",
    internalApiKey: "secret-key",
    opStatusTtlMs: 12 * 3600 * 1000,
  };
  const store = createStatusStore(":memory:");
  const app = createApp({ config, store, fetchFn });
  return { app, store };
}

test("GET /health, /, /api/status, /status.svg, /status.js", async () => {
  const { app, store } = makeTestApp();
  try {
    const health = await app.request("/health");
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true });

    const root = await app.request("/");
    assert.equal(root.status, 200);
    const rootJson = (await root.json()) as { service: string; status: string };
    assert.equal(rootJson.service, "ham-badge");
    assert.equal(rootJson.status, "close");

    const svg = await app.request("/status.svg?label=STATION");
    assert.equal(svg.status, 200);
    assert.equal(svg.headers.get("content-type"), "image/svg+xml; charset=utf-8");
    assert.match(await svg.text(), /OFF AIR/);

    const js = await app.request("/status.js?label=STATION");
    assert.equal(js.status, 200);
    assert.equal(js.headers.get("x-badge-params"), "?label=STATION");
  } finally {
    store.close();
  }
});

test("POST /api/status enforces auth and updates status", async () => {
  const { app, store } = makeTestApp(async (url) => {
    const ok = String(url).includes("token=valid-token");
    return new Response(JSON.stringify({ ok }), { status: ok ? 200 : 401 });
  });

  try {
    const unauth = await app.request("/api/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "onair" }),
    });
    assert.equal(unauth.status, 401);

    // Partial update fails while OFF AIR
    const partialOff = await app.request("/api/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "secret-key",
      },
      body: JSON.stringify({ mode: "SSB" }),
    });
    assert.equal(partialOff.status, 400);

    // Turn ON AIR via Bearer token with note
    const onRes = await app.request("/api/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({ status: "野架", mode: "ssb", freq: "14.270", note: "CQWW" }),
    });
    assert.equal(onRes.status, 200);
    const onJson = (await onRes.json()) as {
      ok: boolean;
      status: string;
      mode: string;
      note: string;
      since: string;
    };
    assert.equal(onJson.ok, true);
    assert.equal(onJson.status, "onair");
    assert.equal(onJson.mode, "SSB");
    assert.equal(onJson.note, "CQWW");

    // Partial update succeeds while ON AIR without resetting since
    const partialOn = await app.request("/api/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "secret-key",
      },
      body: JSON.stringify({ freq: "7.050", note: "POTA" }),
    });
    assert.equal(partialOn.status, 200);
    const partialJson = (await partialOn.json()) as { freq: string; note: string; since: string };
    assert.equal(partialJson.freq, "7.050");
    assert.equal(partialJson.note, "POTA");
    assert.equal(partialJson.since, onJson.since);

    // SVG renders note and hides it when note=0
    const svgWithNote = await app.request("/status.svg");
    assert.match(await svgWithNote.text(), /POTA/);
    const svgWithoutNote = await app.request("/status.svg?note=0");
    assert.doesNotMatch(await svgWithoutNote.text(), /POTA/);
  } finally {
    store.close();
  }
});
