import type { SiteId } from "@/types/tracker";

export const TRACKER_MESSAGE = {
	GET_RUNTIME: "GET_RUNTIME",
	GET_TAB_BLOCK_STATE: "GET_TAB_BLOCK_STATE",
	BLOCK_SITE: "BLOCK_SITE",
	UNBLOCK_SITE: "UNBLOCK_SITE",
} as const;

export interface TrackerRuntimeResponse {
	trackingSiteId: SiteId | null;
	trackingStartedAt: number | null;
}

export interface TabBlockStateResponse {
	blocked: boolean;
	siteName?: string;
}

export interface BlockSiteMessage {
	type: typeof TRACKER_MESSAGE.BLOCK_SITE;
	siteName: string;
}

export interface UnblockSiteMessage {
	type: typeof TRACKER_MESSAGE.UNBLOCK_SITE;
}
