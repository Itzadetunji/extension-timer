import type { SiteId, TrackedSite } from "@/types/tracker";

export function formatUsageDay(date = new Date()) {
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = date.getFullYear();

	return `${day}/${month}/${year}`;
}

export function normalizeSiteForToday(
	site: TrackedSite,
	today = formatUsageDay(),
): TrackedSite {
	if (site.usageDay === today) {
		return site;
	}

	return {
		...site,
		usedSecondsToday: 0,
		usageDay: today,
		lastUpdatedAt: Date.now(),
	};
}

export function getSessionElapsedSeconds(
	siteId: SiteId,
	options: {
		trackingSiteId?: SiteId | null;
		trackingStartedAt?: number | null;
		now?: number;
	} = {},
) {
	if (options.trackingSiteId !== siteId || !options.trackingStartedAt) {
		return 0;
	}

	const now = options.now ?? Date.now();
	return Math.max(0, Math.floor((now - options.trackingStartedAt) / 1000));
}

export function getLiveUsedSecondsToday(
	site: TrackedSite,
	options: {
		now?: number;
		today?: string;
		trackingSiteId?: SiteId | null;
		trackingStartedAt?: number | null;
	} = {},
) {
	const today = options.today ?? formatUsageDay();
	const normalized = normalizeSiteForToday(site, today);
	const sessionElapsed = getSessionElapsedSeconds(normalized.id, options);

	return normalized.usedSecondsToday + sessionElapsed;
}

export function buildLiveUsedSecondsMap(
	sites: TrackedSite[],
	options: {
		now?: number;
		today?: string;
		trackingSiteId?: SiteId | null;
		trackingStartedAt?: number | null;
	} = {},
) {
	return Object.fromEntries(
		sites.map((site) => [site.id, getLiveUsedSecondsToday(site, options)]),
	);
}

export function shouldBlockSite(
	site: TrackedSite,
	options: {
		now?: number;
		today?: string;
		trackingSiteId?: SiteId | null;
		trackingStartedAt?: number | null;
	} = {},
) {
	if (!site.limitConfigured) {
		return false;
	}

	const usedSeconds = getLiveUsedSecondsToday(site, options);
	return usedSeconds >= site.allowedSeconds;
}

export function shouldTrackSite(
	site: TrackedSite,
	options: {
		now?: number;
		today?: string;
		trackingSiteId?: SiteId | null;
		trackingStartedAt?: number | null;
	} = {},
) {
	if (!site.limitConfigured) {
		return false;
	}

	return !shouldBlockSite(site, options);
}
