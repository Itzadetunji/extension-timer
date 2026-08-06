import type { TrackedSite, UpdateLogEntry } from "@/types/tracker";

export const INITIAL_SITES: TrackedSite[] = [
	{ id: "youtube", name: "Youtube", minutesRemaining: 16 },
	{ id: "tiktok", name: "TikTok", minutesRemaining: 15 },
	{ id: "instagram", name: "Instagram", minutesRemaining: 15 },
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
				previousMinutes: 0,
				newMinutes: 30,
				addedMinutes: 30,
			},
			{
				siteId: "tiktok",
				siteName: "TikTok",
				previousMinutes: 10,
				newMinutes: 25,
				addedMinutes: 15,
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
				previousMinutes: 5,
				newMinutes: 20,
				addedMinutes: 15,
			},
		],
	},
];
