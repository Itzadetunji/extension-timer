export type KnownSiteId = "youtube" | "tiktok" | "instagram" | "x" | "linkedin";

export type SiteId = KnownSiteId | string;

export interface TrackedSite {
	id: SiteId;
	name: string;
	url?: string;
	allowedSeconds: number;
	usedSecondsToday: number;
	usageDay: string;
	lastUpdatedAt: number;
	limitConfigured: boolean;
}

export interface SiteTimeChange {
	siteId: SiteId;
	siteName: string;
	previousSeconds: number;
	newSeconds: number;
	deltaSeconds: number;
}

export interface UpdateLogEntry {
	id: string;
	date: string;
	reason: string;
	changes: SiteTimeChange[];
}

export type Screen = "home" | "update-times" | "update-logs";

export type UrlSource = "current" | "custom";
