import assert from "node:assert/strict";
import test from "node:test";
import { createStatusStore } from "../src/db/status-store.js";

test("status store persists onair/close with note and enforces TTL", () => {
  let clock = Date.parse("2026-11-25T10:00:00.000Z");
  const store = createStatusStore(":memory:", {
    ttlMs: 12 * 3600 * 1000,
    now: () => clock,
  });

  try {
    assert.deepEqual(store.getOpStatus(), {
      status: "close",
      since: "",
      mode: "",
      freq: "",
      note: "",
    });

    const onAir = store.setOpStatus("onair", "SSB", "14.270", "CQWW");
    assert.equal(onAir.status, "onair");
    assert.equal(onAir.mode, "SSB");
    assert.equal(onAir.freq, "14.270");
    assert.equal(onAir.note, "CQWW");

    // Advance 1 hour: still onair, update mode and note without changing since
    clock += 3600 * 1000;
    const updated = store.updateOpDetails("FT8", null, "CQWW RTTY");
    assert.equal(updated.status, "onair");
    assert.equal(updated.mode, "FT8");
    assert.equal(updated.freq, "14.270");
    assert.equal(updated.note, "CQWW RTTY");
    assert.equal(updated.since, onAir.since);

    // Advance past 12h TTL: automatically degrades to close
    clock += 12 * 3600 * 1000 + 1;
    const expired = store.getOpStatus();
    assert.equal(expired.status, "close");
    assert.equal(expired.mode, "");
    assert.equal(expired.freq, "");
    assert.equal(expired.note, "");

    // Explicit close clears mode, freq, and note
    const closed = store.setOpStatus("close", "SSB", "7.050", "CQWW");
    assert.deepEqual(closed, {
      status: "close",
      since: new Date(clock).toISOString(),
      mode: "",
      freq: "",
      note: "",
    });
  } finally {
    store.close();
  }
});
