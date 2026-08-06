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

async function hydrateRuntimeState() {
	runtimeState = await loadRuntimeState();
}

function scheduleNextTick() {
	chrome.alarms.create(TRACKER_ALARM_NAME, {
		when: Date.now() + TRACKER_TICK_INTERVAL_MS,
	});
}

function shouldTrackSite(site: TrackedSite) {
	return site.limitConfigured && site.remainingSeconds > 0;
}

function shouldBlockSite(site: TrackedSite) {
	return site.limitConfigured && site.remainingSeconds <= 0;
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

async function notifyTabBlock(tabId: number, site: TrackedSite) {
	await sendTabMessage(tabId, {
		type: TRACKER_MESSAGE.BLOCK_SITE,
		siteName: site.name,
	});
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

	for (const tab of tabs) {
		if (!tab.id || !tab.url) {
			continue;
		}

		const site = findTrackedSiteByUrl(persisted.sites, tab.url);

		if (!site) {
			continue;
		}

		if (shouldBlockSite(site)) {
			await notifyTabBlock(tab.id, site);
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

	const site = persisted.sites[siteIndex];
	const elapsedSeconds = Math.floor(
		(now - runtimeState.trackingStartedAt) / 1000,
	);

	if (elapsedSeconds <= 0) {
		return site;
	}

	const nextRemaining = Math.max(0, site.remainingSeconds - elapsedSeconds);
	const updatedSite: TrackedSite = {
		...site,
		remainingSeconds: nextRemaining,
		lastUpdatedAt: now,
	};

	const nextSites = [...persisted.sites];
	nextSites[siteIndex] = updatedSite;

	await updatePersistedSites(nextSites);

	runtimeState.trackingStartedAt = now;
	runtimeState.lastAlarmAt = now;
	await saveRuntimeState(runtimeState);

	if (nextRemaining <= 0) {
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

	const site = findTrackedSiteByUrl(persisted.sites, tab.url);

	if (!site) {
		if (runtimeState.trackingSiteId) {
			await flushActiveTracking();
		}

		runtimeState.trackingSiteId = null;
		runtimeState.trackingStartedAt = null;
		await saveRuntimeState(runtimeState);
		return;
	}

	await updatePersistedActiveSiteId(site.id);

	if (shouldBlockSite(site)) {
		await flushActiveTracking();
		runtimeState.trackingSiteId = null;
		runtimeState.trackingStartedAt = null;
		await saveRuntimeState(runtimeState);
		await notifyTabBlock(tab.id, site);
		return;
	}

	if (!shouldTrackSite(site)) {
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

	const site = findTrackedSiteByUrl(persisted.sites, tabUrl);

	if (!site || !shouldBlockSite(site)) {
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
					void notifyTabBlock(tab.id, {
						id: "blocked",
						name: state.siteName,
						remainingSeconds: 0,
						lastUpdatedAt: Date.now(),
						limitConfigured: true,
					});
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
