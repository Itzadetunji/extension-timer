export type SiteId = "youtube" | "tiktok" | "facebook";

export interface TrackedSite {
	id: SiteId;
	name: string;
	minutesRemaining: number;
}

export interface SiteTimeChange {
	siteId: SiteId;
	siteName: string;
	previousMinutes: number;
	newMinutes: number;
	addedMinutes: number;
}

export interface UpdateLogEntry {
	id: string;
	date: string;
	reason: string;
	changes: SiteTimeChange[];
}

export type Screen = "home" | "update-times" | "update-logs";
