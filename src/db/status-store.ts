import { DatabaseSync } from "node:sqlite";
import { DEFAULT_OP_STATUS_TTL_MS } from "../config.js";
import type { OpStatus, OpStatusValue, StatusStore } from "../types.js";

interface StatusRow {
  op_status: string;
  op_since: string;
  op_mode: string;
  op_freq: string;
  op_note: string;
}

export interface StatusStoreOptions {
  ttlMs?: number;
  now?: () => number;
}

/**
 * Create a SQLite-backed store for station operational status.
 */
export function createStatusStore(dbPath: string, options: StatusStoreOptions = {}): StatusStore {
  const ttlMs = options.ttlMs ?? DEFAULT_OP_STATUS_TTL_MS;
  const now = options.now ?? Date.now;

  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS status_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      op_status TEXT NOT NULL DEFAULT 'close',
      op_since TEXT NOT NULL DEFAULT '',
      op_mode TEXT NOT NULL DEFAULT '',
      op_freq TEXT NOT NULL DEFAULT '',
      op_note TEXT NOT NULL DEFAULT ''
    )
  `);

  // Backward-compatible schema migration for older status_state tables
  const cols = new Set(
    (db.prepare("PRAGMA table_info(status_state)").all() as { name: string }[]).map((c) => c.name)
  );
  if (!cols.has("op_mode")) {
    db.exec("ALTER TABLE status_state ADD COLUMN op_mode TEXT NOT NULL DEFAULT ''");
  }
  if (!cols.has("op_freq")) {
    db.exec("ALTER TABLE status_state ADD COLUMN op_freq TEXT NOT NULL DEFAULT ''");
  }
  if (!cols.has("op_note")) {
    db.exec("ALTER TABLE status_state ADD COLUMN op_note TEXT NOT NULL DEFAULT ''");
  }

  function getOpStatus(): OpStatus {
    const row = db
      .prepare("SELECT op_status, op_since, op_mode, op_freq, op_note FROM status_state WHERE id = 1")
      .get() as StatusRow | undefined;

    const status: OpStatusValue = row?.op_status === "onair" ? "onair" : "close";
    const since = row?.op_since ?? "";
    const mode = row?.op_mode ?? "";
    const freq = row?.op_freq ?? "";
    const note = row?.op_note ?? "";
    if (status === "close") return { status, since, mode: "", freq: "", note: "" };

    const t = Date.parse(since);
    if (!Number.isFinite(t) || now() - t > ttlMs) {
      return { status: "close", since, mode: "", freq: "", note: "" };
    }
    return { status, since, mode, freq, note };
  }

  function setOpStatus(status: OpStatusValue, mode = "", freq = "", note = ""): OpStatus {
    const since = new Date(now()).toISOString();
    const cleanMode = status === "onair" ? mode : "";
    const cleanFreq = status === "onair" ? freq : "";
    const cleanNote = status === "onair" ? note : "";
    db.prepare(`
      INSERT INTO status_state (id, op_status, op_since, op_mode, op_freq, op_note) VALUES (1, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        op_status = excluded.op_status,
        op_since = excluded.op_since,
        op_mode = excluded.op_mode,
        op_freq = excluded.op_freq,
        op_note = excluded.op_note
    `).run(status, since, cleanMode, cleanFreq, cleanNote);
    return { status, since, mode: cleanMode, freq: cleanFreq, note: cleanNote };
  }

  function updateOpDetails(mode: string | null, freq: string | null, note: string | null = null): OpStatus {
    if (mode !== null) db.prepare("UPDATE status_state SET op_mode = ? WHERE id = 1").run(mode);
    if (freq !== null) db.prepare("UPDATE status_state SET op_freq = ? WHERE id = 1").run(freq);
    if (note !== null) db.prepare("UPDATE status_state SET op_note = ? WHERE id = 1").run(note);
    return getOpStatus();
  }

  function close(): void {
    db.close();
  }

  return {
    getOpStatus,
    setOpStatus,
    updateOpDetails,
    close,
  };
}
