import type { SiteId, TrackedSite } from "@/types/tracker";

export function getLiveRemainingSeconds(
	site: TrackedSite,
	options: {
		now?: number;
		trackingSiteId?: SiteId | null;
	} = {},
) {
	const now = options.now ?? Date.now();
	const isActivelyTracking =
		options.trackingSiteId === site.id && site.limitConfigured;

	if (!isActivelyTracking) {
		return site.remainingSeconds;
	}

	const elapsedSeconds = Math.floor((now - site.lastUpdatedAt) / 1000);
	return Math.max(0, site.remainingSeconds - elapsedSeconds);
}

export function buildLiveRemainingMap(
	sites: TrackedSite[],
	options: {
		now?: number;
		trackingSiteId?: SiteId | null;
	} = {},
) {
	const now = options.now ?? Date.now();

	return Object.fromEntries(
		sites.map((site) => [
			site.id,
			getLiveRemainingSeconds(site, { ...options, now }),
		]),
	);
}
