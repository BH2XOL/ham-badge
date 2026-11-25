import type { OpStatus } from "../types.js";

export interface SvgBadgeOptions {
  label?: string;
  wantSince?: boolean;
  wantMode?: boolean;
  wantFreq?: boolean;
  wantNote?: boolean;
  height?: number;
}

const DEFAULT_H = 40;
const FONT = "Roboto, 'Noto Sans', 'Segoe UI', system-ui, -apple-system, sans-serif";

// Material Design 3 (MD3) color tokens
const MD3_SURFACE_CONTAINER = "#2B2930";
const MD3_ON_SURFACE = "#E6E0E9";
const MD3_OUTLINE_VARIANT = "#49454F";

const MD3_ON_AIR_BG = "#146C2E";
const MD3_ON_AIR_FG = "#FFFFFF";
const MD3_ON_AIR_DOT = "#80E29C";

const MD3_OFF_AIR_BG = "#36343B";
const MD3_OFF_AIR_FG = "#CAC4D0";
const MD3_OFF_AIR_DOT = "#938F99";

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function escXml(s: string): string {
  return s.replace(/[&<>\"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;" })[c] as string
  );
}

export function hhmmUtc(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const d = new Date(t);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export function textWidth(s: string, fontSize: number, padX: number): number {
  let units = 0;
  for (const ch of s) {
    units += /[^\x00-\xff]/.test(ch) ? 1.8 : 1;
  }
  return Math.round(units * 6.8 * (fontSize / 11)) + padX * 2;
}

/**
 * Render a Material Design 3 (MD3) pill-shaped SVG status badge.
 */
export function renderStatusSvg(op: OpStatus, options: SvgBadgeOptions = {}): string {
  const onAir = op.status === "onair";
  const label = (options.label ?? "STATION").trim();
  const wantSince = options.wantSince ?? true;
  const wantMode = options.wantMode ?? true;
  const wantFreq = options.wantFreq ?? true;
  const wantNote = options.wantNote ?? true;

  const since = onAir && wantSince ? hhmmUtc(op.since) : "";
  const mode = onAir && wantMode && op.mode ? op.mode : "";
  const freq = onAir && wantFreq && op.freq ? op.freq : "";
  const note = onAir && wantNote && op.note ? op.note : "";

  let value = "OFF AIR";
  if (onAir) {
    const parts = ["ON AIR"];
    const detail = [freq, mode].filter(Boolean).join(" ");
    if (detail) parts.push(`· ${detail}`);
    if (note) parts.push(`· ${note}`);
    if (since) parts.push(`${since}Z`);
    value = parts.join(" ");
  }

  const h = clamp(options.height || DEFAULT_H, 16, 128);
  const scale = h / 24;
  const fs = Math.round(11 * scale);
  const padX = Math.round(12 * scale);
  const rx = Number((h / 2).toFixed(1));
  const dotR = Math.max(2, Math.round(3.5 * scale));
  const dotGap = Math.round(6 * scale);
  const dotSpace = dotR * 2 + dotGap;
  const cy = Number((h / 2).toFixed(1));
  const baseline = Math.round(h * 0.65);

  const lw = label ? textWidth(label, fs, padX) : 0;
  const rw = textWidth(value, fs, padX) + dotSpace;
  const w = lw + rw;

  const statusBg = onAir ? MD3_ON_AIR_BG : MD3_OFF_AIR_BG;
  const statusFg = onAir ? MD3_ON_AIR_FG : MD3_OFF_AIR_FG;
  const dotColor = onAir ? MD3_ON_AIR_DOT : MD3_OFF_AIR_DOT;

  const aria = label ? `${label} ${value}` : value;
  const labelRect = label
    ? `<rect width="${lw}" height="${h}" fill="${MD3_SURFACE_CONTAINER}"/>`
    : "";
  const labelText = label
    ? `<text x="${(lw / 2).toFixed(1)}" y="${baseline}" fill="${MD3_ON_SURFACE}" font-weight="500">${escXml(label)}</text>`
    : "";
  const divider = label
    ? `<line x1="${lw}" y1="0" x2="${lw}" y2="${h}" stroke="${MD3_OUTLINE_VARIANT}" stroke-width="1" stroke-opacity="0.5"/>`
    : "";

  const dotX = (lw + padX + dotR).toFixed(1);
  const valueCenterX = (lw + dotSpace + (rw - dotSpace) / 2).toFixed(1);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escXml(aria)}">
<title>${escXml(aria)}</title>
<defs>
  <clipPath id="md3-pill"><rect width="${w}" height="${h}" rx="${rx}" ry="${rx}"/></clipPath>
</defs>
<g clip-path="url(#md3-pill)">
  ${labelRect}
  <rect x="${lw}" width="${rw}" height="${h}" fill="${statusBg}"/>
  ${divider}
</g>
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${rx}" ry="${rx}" fill="none" stroke="${MD3_OUTLINE_VARIANT}" stroke-width="1" stroke-opacity="0.6"/>
<circle cx="${dotX}" cy="${cy}" r="${dotR}" fill="${dotColor}"/>
<g font-family="${FONT}" font-size="${fs}" letter-spacing="0.2" text-anchor="middle">
  ${labelText}
  <text x="${valueCenterX}" y="${baseline}" fill="${statusFg}" font-weight="600">${escXml(value)}</text>
</g>
</svg>`;
}
