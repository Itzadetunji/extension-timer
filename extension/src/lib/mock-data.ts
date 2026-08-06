import { formatUsageDay } from "@/lib/tracker/site-usage";
import type { TrackedSite, UpdateLogEntry } from "@/types/tracker";

const today = formatUsageDay();

export const INITIAL_SITES: TrackedSite[] = [
	{
		id: "youtube",
		name: "Youtube",
		allowedSeconds: 30 * 60,
		usedSecondsToday: 14 * 60,
		usageDay: today,
		lastUpdatedAt: Date.now(),
		limitConfigured: true,
	},
	{
		id: "tiktok",
		name: "TikTok",
		allowedSeconds: 25 * 60,
		usedSecondsToday: 10 * 60,
		usageDay: today,
		lastUpdatedAt: Date.now(),
		limitConfigured: true,
	},
	{
		id: "instagram",
		name: "Instagram",
		allowedSeconds: 20 * 60,
		usedSecondsToday: 5 * 60,
		usageDay: today,
		lastUpdatedAt: Date.now(),
		limitConfigured: true,
	},
];

export const ACTIVE_SITE_ID = "youtube";

export const INITIAL_UPDATE_LOGS: UpdateLogEntry[] = [
	{
		id: "log-1",
		date: "16/08/2026",
		reason: "I was tired",
		changes: [
			{
				siteId: "youtube",
				siteName: "Youtube",
				previousSeconds: 0,
				newSeconds: 30 * 60,
				deltaSeconds: 30 * 60,
			},
			{
				siteId: "tiktok",
				siteName: "TikTok",
				previousSeconds: 10 * 60,
				newSeconds: 25 * 60,
				deltaSeconds: 15 * 60,
			},
		],
	},
	{
		id: "log-2",
		date: "10/08/2026",
		reason: "Needed extra time for a project",
		changes: [
			{
				siteId: "instagram",
				siteName: "Instagram",
				previousSeconds: 5 * 60,
				newSeconds: 20 * 60,
				deltaSeconds: 15 * 60,
			},
		],
	},
];
