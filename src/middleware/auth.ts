import type { MiddlewareHandler } from "hono";

export interface AuthMiddlewareOptions {
  authService: string;
  internalApiKey: string;
  fetchFn?: typeof fetch;
}

/**
 * Create Hono middleware that authorizes requests via internal API key
 * or Bearer/Cookie token verified against the external auth service.
 */
export function createRequireAuth(options: AuthMiddlewareOptions): MiddlewareHandler {
  const { authService, internalApiKey } = options;
  const fetchImpl = options.fetchFn ?? fetch;

  return async (c, next) => {
    const apiKey = c.req.header("X-API-Key") || c.req.query("api_key") || "";
    if (internalApiKey && apiKey === internalApiKey) {
      return next();
    }

    let token = "";
    const authHeader = c.req.header("Authorization") || "";
    const bearer = authHeader.match(/^Bearer\s+(.+)$/i);
    if (bearer) {
      token = bearer[1].trim();
    } else {
      const cookie = c.req.header("Cookie") || "";
      const match = cookie.match(/admin_token=([^;]+)/);
      if (match) token = match[1].trim();
    }

    if (!token) {
      return c.json({ ok: false, error: "unauthorized" }, 401);
    }

    try {
      const res = await fetchImpl(`${authService}/verify-token?token=${encodeURIComponent(token)}`);
      if (!res.ok) return c.json({ ok: false, error: "unauthorized" }, 401);
      const data = (await res.json()) as { ok?: boolean };
      if (!data.ok) return c.json({ ok: false, error: "unauthorized" }, 401);
      return next();
    } catch {
      return c.json({ ok: false, error: "auth service unavailable" }, 502);
    }
  };
}
