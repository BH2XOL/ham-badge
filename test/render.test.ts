import assert from "node:assert/strict";
import test from "node:test";
import { renderStatusJs } from "../src/render/badge-js.js";
import { renderStatusSvg } from "../src/render/badge-svg.js";

test("renderStatusSvg produces MD3 pill SVG with optional note", () => {
  const onAirSvg = renderStatusSvg(
    {
      status: "onair",
      since: "2026-11-25T13:05:00.000Z",
      mode: "SSB",
      freq: "14.270",
      note: "CQWW",
    },
    { label: "STATION", height: 40 }
  );

  assert.match(onAirSvg, /height="40"/);
  assert.match(onAirSvg, /rx="20"/);
  assert.match(onAirSvg, /<circle /);
  assert.match(onAirSvg, /STATION/);
  assert.match(onAirSvg, /ON AIR · 14\.270 SSB · CQWW 13:05Z/);
  assert.match(onAirSvg, /#146C2E/);

  const hiddenNoteSvg = renderStatusSvg(
    {
      status: "onair",
      since: "2026-11-25T13:05:00.000Z",
      mode: "SSB",
      freq: "14.270",
      note: "CQWW",
    },
    { label: "STATION", wantNote: false }
  );
  assert.doesNotMatch(hiddenNoteSvg, /CQWW/);

  const offAirSvg = renderStatusSvg(
    { status: "close", since: "", mode: "", freq: "", note: "" },
    { label: "<TAG>", height: 200 }
  );
  assert.match(offAirSvg, /height="128"/);
  assert.match(offAirSvg, /&lt;TAG&gt;/);
  assert.match(offAirSvg, /OFF AIR/);
});

test("renderStatusJs returns self-refreshing embed script", () => {
  const js = renderStatusJs();
  assert.match(js, /\/status\.svg/);
  assert.match(js, /setInterval\(refresh, 60000\)/);
});
