import type { SiteId, TrackedSite, UpdateLogEntry } from "@/types/tracker";

export interface PersistedTrackerState {
	sites: TrackedSite[];
	updateLogs: UpdateLogEntry[];
	activeSiteId: SiteId;
}

export interface TrackerRuntimeState {
	trackingSiteId: SiteId | null;
	trackingStartedAt: number | null;
	lastAlarmAt: number;
}

export const DEFAULT_RUNTIME_STATE: TrackerRuntimeState = {
	trackingSiteId: null,
	trackingStartedAt: null,
	lastAlarmAt: Date.now(),
};
