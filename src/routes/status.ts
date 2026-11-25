import type { Hono, MiddlewareHandler } from "hono";
import { normalizeFreq, normalizeMode, normalizeNote, parseStatusValue } from "../domain/status-parser.js";
import { renderStatusJs } from "../render/badge-js.js";
import { renderStatusSvg } from "../render/badge-svg.js";
import type { StatusStore } from "../types.js";

export interface StatusRouteDeps {
  store: StatusStore;
  requireAuth: MiddlewareHandler;
}

function isFlagEnabled(raw: string | null): boolean {
  return raw === null || !["0", "false", "no", "off"].includes(raw.toLowerCase());
}

/**
 * Register health, status API, SVG badge, and JS embed routes on a Hono instance.
 */
export function registerStatusRoutes(app: Hono, deps: StatusRouteDeps): void {
  const { store, requireAuth } = deps;

  app.get("/health", (c) => c.json({ ok: true }));
  app.get("/", (c) => c.json({ service: "ham-badge", ...store.getOpStatus() }));
  app.get("/api/status", (c) => c.json(store.getOpStatus()));

  app.post("/api/status", requireAuth, async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const hasStatus = body.status !== undefined || body.value !== undefined;
    const rawStatus = String(body.status ?? body.value ?? "").trim();

    const parsedMode = normalizeMode(body.mode);
    if (body.mode !== undefined && parsedMode === null) {
      return c.json({ ok: false, error: "mode 格式无效（仅支持 1-12 位字母/数字/-//）" }, 400);
    }

    const parsedFreq = normalizeFreq(body.freq);
    if (body.freq !== undefined && parsedFreq === null) {
      return c.json({ ok: false, error: "freq 格式无效（仅支持 1-16 位字母/数字/./-/）" }, 400);
    }

    const parsedNote = normalizeNote(body.note);
    if (body.note !== undefined && parsedNote === null) {
      return c.json({ ok: false, error: "note 格式无效（最多 32 个字符，不能包含控制字符）" }, 400);
    }

    // Allow updating mode / freq / note while ON AIR without resetting op_since
    if (!hasStatus && (parsedMode !== null || parsedFreq !== null || parsedNote !== null)) {
      const cur = store.getOpStatus();
      if (cur.status !== "onair") {
        return c.json({ ok: false, error: "当前为 OFF AIR，请同时传入 status: onair" }, 400);
      }
      const state = store.updateOpDetails(parsedMode, parsedFreq, parsedNote);
      return c.json({ ok: true, ...state });
    }

    const next = parseStatusValue(rawStatus);
    if (!next) {
      return c.json(
        {
          ok: false,
          error: `status 无法识别: ${JSON.stringify(rawStatus.toLowerCase())}，请用 onair 或 close`,
        },
        400
      );
    }

    const state = store.setOpStatus(next, parsedMode ?? "", parsedFreq ?? "", parsedNote ?? "");
    return c.json({ ok: true, ...state });
  });

  app.get("/status.svg", (c) => {
    const url = new URL(c.req.url);
    const op = store.getOpStatus();
    const height = parseInt(url.searchParams.get("h") || "", 10) || undefined;

    const svg = renderStatusSvg(op, {
      label: url.searchParams.get("label") ?? "STATION",
      wantSince: isFlagEnabled(url.searchParams.get("since")),
      wantMode: isFlagEnabled(url.searchParams.get("mode")),
      wantFreq: isFlagEnabled(url.searchParams.get("freq")),
      wantNote: isFlagEnabled(url.searchParams.get("note")),
      height,
    });

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  });

  app.get("/status.js", (c) => {
    const url = new URL(c.req.url);
    const passthrough = url.search;

    return new Response(renderStatusJs(), {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store",
        ...(passthrough ? { "X-Badge-Params": passthrough } : {}),
      },
    });
  });
}
