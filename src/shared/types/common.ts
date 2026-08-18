/** Opaque-ish identifier. The backend decides the real format (uuid, int, etc.). */
export type Id = string;

/** ISO-8601 timestamp string as returned by the backend. */
export type IsoDateString = string;

/**
 * Allows a known string union while still accepting values the backend may add
 * later, without collapsing autocomplete to plain `string`.
 */
export type KnownOr<T extends string> = T | (string & {});

export type Nullable<T> = T | null;
