import { formatUsageDay } from "@/lib/tracker/site-usage";
import type { TrackedSite, UpdateLogEntry } from "@/types/tracker";

const today = formatUsageDay();
const DEFAULT_ALLOWED_SECONDS = 15 * 60;

function createDefaultSite(
	id: TrackedSite["id"],
	name: string,
	url: string,
): TrackedSite {
	return {
		id,
		name,
		url,
		allowedSeconds: DEFAULT_ALLOWED_SECONDS,
		usedSecondsToday: 0,
		usageDay: today,
		lastUpdatedAt: Date.now(),
		limitConfigured: true,
	};
}

export const INITIAL_SITES: TrackedSite[] = [
	createDefaultSite("youtube", "Youtube", "https://www.youtube.com/"),
	createDefaultSite("tiktok", "TikTok", "https://www.tiktok.com/"),
	createDefaultSite("instagram", "Instagram", "https://www.instagram.com/"),
	createDefaultSite("linkedin", "LinkedIn", "https://www.linkedin.com/"),
	createDefaultSite("x", "X", "https://x.com/"),
];

export const ACTIVE_SITE_ID = "youtube";

export const INITIAL_UPDATE_LOGS: UpdateLogEntry[] = [];
