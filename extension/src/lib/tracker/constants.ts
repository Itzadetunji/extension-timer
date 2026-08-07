export const TRACKER_STORE_KEY = "tracker-store";
export const TRACKER_RUNTIME_KEY = "tracker-runtime";
export const TRACKER_ALARM_NAME = "tracker-tick";
/** Persist envelope version — must match zustand `persist({ version })`. */
export const TRACKER_STORE_VERSION = 2;
/** How often the background checks whether the active site has hit its limit. */
export const TRACKER_TICK_INTERVAL_MS = 1_000;
