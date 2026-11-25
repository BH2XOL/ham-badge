import type { OpStatusValue } from "../types.js";

export const ON_VALUES = new Set(["onair", "on", "on_air", "on air", "open", "野架", "野架中"]);
export const OFF_VALUES = new Set(["close", "closed", "off", "offair", "off_air", "off air", "qrt", "shutdown", "收工", "关闭"]);

/**
 * Normalize operating mode (uppercased, 1-12 chars of A-Z, 0-9, /, -).
 * Returns "" for empty input, or null when missing/invalid.
 */
export function normalizeMode(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim().toUpperCase();
  if (!s) return "";
  if (!/^[A-Z0-9/-]{1,12}$/.test(s)) return null;
  return s;
}

/**
 * Normalize operating frequency (1-16 chars of A-Z, a-z, 0-9, ., /, -).
 * Returns "" for empty input, or null when missing/invalid.
 */
export function normalizeFreq(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  if (!s) return "";
  if (!/^[A-Za-z0-9./-]{1,16}$/.test(s)) return null;
  return s;
}

/**
 * Normalize operating note/remark (collapsed whitespace, max 32 chars, no control chars).
 * Returns "" for empty input, or null when missing/invalid.
 */
export function normalizeNote(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return "";
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return null;
  const s = trimmed.replace(/\s+/g, " ");
  if (s.length > 32) return null;
  return s;
}

/**
 * Map raw status string/alias to canonical OpStatusValue, or null if unrecognized.
 */
export function parseStatusValue(raw: string): OpStatusValue | null {
  const normalized = raw.trim().toLowerCase();
  if (ON_VALUES.has(normalized)) return "onair";
  if (OFF_VALUES.has(normalized)) return "close";
  return null;
}
