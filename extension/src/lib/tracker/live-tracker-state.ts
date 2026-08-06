import { buildLiveUsedSecondsMap } from "@/lib/tracker/site-usage";
import type { SiteId, TrackedSite } from "@/types/tracker";

export interface TrackerRuntimeState {
	trackingSiteId: SiteId | null;
	trackingStartedAt: number | null;
}

export interface LiveTrackerSnapshot {
	trackingSiteId: SiteId | null;
	liveUsedSecondsBySiteId: Record<string, number>;
	computedAt: number;
}

export function buildLiveTrackerSnapshot(
	sites: TrackedSite[],
	runtime: TrackerRuntimeState,
	now = Date.now(),
): LiveTrackerSnapshot {
	return {
		trackingSiteId: runtime.trackingSiteId,
		liveUsedSecondsBySiteId: buildLiveUsedSecondsMap(sites, {
			now,
			trackingSiteId: runtime.trackingSiteId,
			trackingStartedAt: runtime.trackingStartedAt,
		}),
		computedAt: now,
	};
}
