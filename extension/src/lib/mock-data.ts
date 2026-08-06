import type { TrackedSite, UpdateLogEntry } from "@/types/tracker";

export const INITIAL_SITES: TrackedSite[] = [
	{
		id: "youtube",
		name: "Youtube",
		remainingSeconds: 16 * 60,
		lastUpdatedAt: Date.now(),
		limitConfigured: true,
	},
	{
		id: "tiktok",
		name: "TikTok",
		remainingSeconds: 15 * 60,
		lastUpdatedAt: Date.now(),
		limitConfigured: true,
	},
	{
		id: "instagram",
		name: "Instagram",
		remainingSeconds: 15 * 60,
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
