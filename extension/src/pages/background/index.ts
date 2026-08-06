import { injectBlockOverlay } from "@/lib/tracker/block-overlay";
import {
	TRACKER_ALARM_NAME,
	TRACKER_TICK_INTERVAL_MS,
} from "@/lib/tracker/constants";
import { findTrackedSiteByUrl } from "@/lib/tracker/match-tracked-site";
import {
	type TabBlockStateResponse,
	TRACKER_MESSAGE,
	type TrackerRuntimeResponse,
} from "@/lib/tracker/messages";
import {
	normalizeSiteForToday,
	shouldBlockSite,
	shouldTrackSite,
} from "@/lib/tracker/site-usage";
import {
	loadPersistedTrackerState,
	loadRuntimeState,
	saveRuntimeState,
	updatePersistedActiveSiteId,
	updatePersistedSites,
} from "@/lib/tracker/tracker-storage";
import type { SiteId, TrackedSite } from "@/types/tracker";

let runtimeState = {
	trackingSiteId: null as SiteId | null,
	trackingStartedAt: null as number | null,
	lastAlarmAt: Date.now(),
};

function runtimeOptions(now = Date.now()) {
	return {
		now,
		trackingSiteId: runtimeState.trackingSiteId,
		trackingStartedAt: runtimeState.trackingStartedAt,
	};
}

async function hydrateRuntimeState() {
	runtimeState = await loadRuntimeState();
}

function scheduleNextTick() {
	chrome.alarms.create(TRACKER_ALARM_NAME, {
		when: Date.now() + TRACKER_TICK_INTERVAL_MS,
	});
}

async function sendTabMessage<T>(
	tabId: number,
	message: unknown,
): Promise<T | null> {
	try {
		return await chrome.tabs.sendMessage(tabId, message);
	} catch {
		return null;
	}
}

async function notifyTabBlock(tabId: number, siteName: string) {
	await sendTabMessage(tabId, {
		type: TRACKER_MESSAGE.BLOCK_SITE,
		siteName,
	});

	try {
		await chrome.scripting.executeScript({
			target: { tabId },
			func: injectBlockOverlay,
			args: [siteName],
		});
	} catch {
		// Tab may not allow scripting (chrome://, Web Store, etc.)
	}
}

async function notifyTabUnblock(tabId: number) {
	await sendTabMessage(tabId, {
		type: TRACKER_MESSAGE.UNBLOCK_SITE,
	});
}

async function notifyAllTrackedTabs() {
	const persisted = await loadPersistedTrackerState();

	if (!persisted) {
		return;
	}

	const tabs = await chrome.tabs.query({});
	const options = runtimeOptions();

	for (const tab of tabs) {
		if (!tab.id || !tab.url) {
			continue;
		}

		const site = findTrackedSiteByUrl(persisted.sites, tab.url);

		if (!site) {
			continue;
		}

		const normalized = normalizeSiteForToday(site);

		if (shouldBlockSite(normalized, options)) {
			await notifyTabBlock(tab.id, normalized.name);
			continue;
		}

		await notifyTabUnblock(tab.id);
	}
}

async function flushActiveTracking(now = Date.now()) {
	if (!runtimeState.trackingSiteId || !runtimeState.trackingStartedAt) {
		return null;
	}

	const persisted = await loadPersistedTrackerState();

	if (!persisted) {
		return null;
	}

	const siteIndex = persisted.sites.findIndex(
		(site) => site.id === runtimeState.trackingSiteId,
	);

	if (siteIndex === -1) {
		runtimeState.trackingSiteId = null;
		runtimeState.trackingStartedAt = null;
		await saveRuntimeState(runtimeState);
		return null;
	}

	const site = normalizeSiteForToday(persisted.sites[siteIndex]);
	const elapsedSeconds = Math.floor(
		(now - runtimeState.trackingStartedAt) / 1000,
	);

	if (elapsedSeconds <= 0) {
		return site;
	}

	const updatedSite: TrackedSite = {
		...site,
		usedSecondsToday: site.usedSecondsToday + elapsedSeconds,
		lastUpdatedAt: now,
	};

	const nextSites = [...persisted.sites];
	nextSites[siteIndex] = updatedSite;

	await updatePersistedSites(nextSites);

	runtimeState.trackingStartedAt = now;
	runtimeState.lastAlarmAt = now;
	await saveRuntimeState(runtimeState);

	if (shouldBlockSite(updatedSite, runtimeOptions(now))) {
		runtimeState.trackingSiteId = null;
		runtimeState.trackingStartedAt = null;
		await saveRuntimeState(runtimeState);
		await notifyAllTrackedTabs();
	}

	return updatedSite;
}

async function syncActiveTab() {
	const [tab] = await chrome.tabs.query({
		active: true,
		currentWindow: true,
	});

	if (!tab?.id || !tab.url) {
		await flushActiveTracking();
		runtimeState.trackingSiteId = null;
		runtimeState.trackingStartedAt = null;
		await saveRuntimeState(runtimeState);
		return;
	}

	const persisted = await loadPersistedTrackerState();

	if (!persisted) {
		return;
	}

	const matched = findTrackedSiteByUrl(persisted.sites, tab.url);

	if (!matched) {
		if (runtimeState.trackingSiteId) {
			await flushActiveTracking();
		}

		runtimeState.trackingSiteId = null;
		runtimeState.trackingStartedAt = null;
		await saveRuntimeState(runtimeState);
		return;
	}

	const site = normalizeSiteForToday(matched);
	const options = runtimeOptions();

	await updatePersistedActiveSiteId(site.id);

	if (shouldBlockSite(site, options)) {
		await flushActiveTracking();
		runtimeState.trackingSiteId = null;
		runtimeState.trackingStartedAt = null;
		await saveRuntimeState(runtimeState);
		await notifyTabBlock(tab.id, site.name);
		return;
	}

	if (!shouldTrackSite(site, options)) {
		runtimeState.trackingSiteId = null;
		runtimeState.trackingStartedAt = null;
		await saveRuntimeState(runtimeState);
		await notifyTabUnblock(tab.id);
		return;
	}

	if (runtimeState.trackingSiteId !== site.id) {
		await flushActiveTracking();
		runtimeState.trackingSiteId = site.id;
		runtimeState.trackingStartedAt = Date.now();
		await saveRuntimeState(runtimeState);
	}

	await notifyTabUnblock(tab.id);
}

async function handleTrackerTick() {
	await flushActiveTracking();
	await syncActiveTab();
	scheduleNextTick();
}

async function getTabBlockState(
	tabUrl?: string,
): Promise<TabBlockStateResponse> {
	if (!tabUrl) {
		return { blocked: false };
	}

	const persisted = await loadPersistedTrackerState();

	if (!persisted) {
		return { blocked: false };
	}

	const matched = findTrackedSiteByUrl(persisted.sites, tabUrl);

	if (!matched) {
		return { blocked: false };
	}

	const site = normalizeSiteForToday(matched);

	if (!shouldBlockSite(site, runtimeOptions())) {
		return { blocked: false };
	}

	return {
		blocked: true,
		siteName: site.name,
	};
}

chrome.runtime.onInstalled.addListener(() => {
	void hydrateRuntimeState().then(() => {
		scheduleNextTick();
		void syncActiveTab();
	});
});

chrome.runtime.onStartup.addListener(() => {
	void hydrateRuntimeState().then(() => {
		scheduleNextTick();
		void syncActiveTab();
	});
});

void hydrateRuntimeState().then(() => {
	scheduleNextTick();
	void syncActiveTab();
});

chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name !== TRACKER_ALARM_NAME) {
		return;
	}

	void handleTrackerTick();
});

chrome.tabs.onActivated.addListener(() => {
	void syncActiveTab();
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
	if (changeInfo.status === "complete" || changeInfo.url) {
		void syncActiveTab();

		if (tab.id && tab.url) {
			void getTabBlockState(tab.url).then((state) => {
				if (state.blocked && state.siteName && tab.id) {
					void notifyTabBlock(tab.id, state.siteName);
				}
			});
		}
	}
});

chrome.storage.onChanged.addListener((changes, areaName) => {
	if (areaName !== "local" || !changes["tracker-store"]) {
		return;
	}

	void syncActiveTab().then(() => notifyAllTrackedTabs());
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message?.type === TRACKER_MESSAGE.GET_RUNTIME) {
		const response: TrackerRuntimeResponse = {
			trackingSiteId: runtimeState.trackingSiteId,
			trackingStartedAt: runtimeState.trackingStartedAt,
		};
		sendResponse(response);
		return true;
	}

	if (message?.type === TRACKER_MESSAGE.GET_TAB_BLOCK_STATE) {
		const tabUrl = sender.tab?.url ?? message.url;
		void getTabBlockState(tabUrl).then(sendResponse);
		return true;
	}

	return undefined;
});
