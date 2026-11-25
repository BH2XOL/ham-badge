/** Allowed station operational status values. */
export type OpStatusValue = "onair" | "close";

/** Persisted and API-facing station operational status. */
export interface OpStatus {
  status: OpStatusValue;
  since: string;
  mode: string;
  freq: string;
  note: string;
}

/** Application runtime configuration loaded from environment variables. */
export interface AppConfig {
  port: number;
  dbPath: string;
  authService: string;
  internalApiKey: string;
  opStatusTtlMs: number;
}

/** Persistence contract for reading and updating station status. */
export interface StatusStore {
  getOpStatus(): OpStatus;
  setOpStatus(status: OpStatusValue, mode?: string, freq?: string, note?: string): OpStatus;
  updateOpDetails(mode: string | null, freq: string | null, note?: string | null): OpStatus;
  close(): void;
}
