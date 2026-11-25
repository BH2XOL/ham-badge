import assert from "node:assert/strict";
import test from "node:test";
import { normalizeFreq, normalizeMode, normalizeNote, parseStatusValue } from "../src/domain/status-parser.js";

test("normalizeMode uppercases valid modes and rejects invalid ones", () => {
  assert.equal(normalizeMode(undefined), null);
  assert.equal(normalizeMode(null), null);
  assert.equal(normalizeMode("  "), "");
  assert.equal(normalizeMode("ssb"), "SSB");
  assert.equal(normalizeMode("ft8/cw-1"), "FT8/CW-1");
  assert.equal(normalizeMode("TOOLONGMODENAME"), null);
  assert.equal(normalizeMode("SSB!"), null);
});

test("normalizeFreq validates allowed frequency strings", () => {
  assert.equal(normalizeFreq(undefined), null);
  assert.equal(normalizeFreq(""), "");
  assert.equal(normalizeFreq(" 14.270 "), "14.270");
  assert.equal(normalizeFreq("439.460MHz"), "439.460MHz");
  assert.equal(normalizeFreq("14.270 MHz"), null);
  assert.equal(normalizeFreq("12345678901234567"), null);
});

test("parseStatusValue maps English and Chinese aliases", () => {
  assert.equal(parseStatusValue("onair"), "onair");
  assert.equal(parseStatusValue("野架中"), "onair");
  assert.equal(parseStatusValue("ON AIR"), "onair");
  assert.equal(parseStatusValue("qrt"), "close");
  assert.equal(parseStatusValue("收工"), "close");
  assert.equal(parseStatusValue("unknown"), null);
});

test("normalizeNote collapses whitespace and enforces length/control char limits", () => {
  assert.equal(normalizeNote(undefined), null);
  assert.equal(normalizeNote(null), null);
  assert.equal(normalizeNote("   "), "");
  assert.equal(normalizeNote("  CQWW   SSB  "), "CQWW SSB");
  assert.equal(normalizeNote("POTA CN-0001 比赛"), "POTA CN-0001 比赛");
  assert.equal(normalizeNote("a".repeat(33)), null);
  assert.equal(normalizeNote("bad\nline"), null);
});
