import { injectBlockOverlay } from "@/lib/tracker/block-overlay";
import {
	TRACKER_ALARM_NAME,
	TRACKER_TICK_INTERVAL_MS,
} from "@/lib/tracker/constants";
import { buildLiveTrackerSnapshot } from "@/lib/tracker/live-tracker-state";
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
	ensurePersistedTrackerState,
	loadPersistedTrackerState,
	loadRuntimeState,
	patchPersistedSiteUsage,
	saveRuntimeState,
	updatePersistedActiveSiteId,
} from "@/lib/tracker/tracker-storage";
import type { SiteId, TrackedSite } from "@/types/tracker";

let runtimeState = {
	trackingSiteId: null as SiteId | null,
	trackingStartedAt: null as number | null,
	lastAlarmAt: Date.now(),
};

let tabChangeChain: Promise<void> = Promise.resolve();

function runtimeOptions(now = Date.now()) {
	return {
		now,
		trackingSiteId: runtimeState.trackingSiteId,
		trackingStartedAt: runtimeState.trackingStartedAt,
	};
}

function scheduleNextTick() {
	chrome.alarms.create(TRACKER_ALARM_NAME, {
		when: Date.now() + TRACKER_TICK_INTERVAL_MS,
	});
}

async function sendTabMessage(tabId: number, message: unknown) {
	try {
		await chrome.tabs.sendMessage(tabId, message);
	} catch {
		// Content script may not be ready yet.
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

async function clearTrackingSession(now = Date.now()) {
	runtimeState.trackingSiteId = null;
	runtimeState.trackingStartedAt = null;
	runtimeState.lastAlarmAt = now;
	await saveRuntimeState(runtimeState);
}

/**
 * Persist elapsed session time into usedSecondsToday for the site we were tracking.
 * Only patches usage fields so concurrent Update Times saves are not overwritten.
 */
async function flushActiveTracking(now = Date.now()) {
	if (!runtimeState.trackingSiteId || !runtimeState.trackingStartedAt) {
		return null;
	}

	const siteId = runtimeState.trackingSiteId;
	const persisted = await loadPersistedTrackerState();

	if (!persisted) {
		await clearTrackingSession(now);
		return null;
	}

	const site = persisted.sites.find((entry) => entry.id === siteId);

	if (!site) {
		await clearTrackingSession(now);
		return null;
	}

	const normalized = normalizeSiteForToday(site);
	const elapsedSeconds = Math.max(
		0,
		Math.floor((now - runtimeState.trackingStartedAt) / 1000),
	);

	if (elapsedSeconds <= 0) {
		return normalized;
	}

	const rawUsed = normalized.usedSecondsToday + elapsedSeconds;
	const usedSecondsToday = normalized.limitConfigured
		? Math.min(rawUsed, normalized.allowedSeconds)
		: rawUsed;

	await patchPersistedSiteUsage(siteId, {
		usedSecondsToday,
		usageDay: normalized.usageDay,
		lastUpdatedAt: now,
	});

	return {
		...normalized,
		usedSecondsToday,
		lastUpdatedAt: now,
	};
}

async function startTracking(site: TrackedSite, now = Date.now()) {
	runtimeState.trackingSiteId = site.id;
	runtimeState.trackingStartedAt = now;
	runtimeState.lastAlarmAt = now;
	await saveRuntimeState(runtimeState);
}

/**
 * Tab change / URL change:
 * 1. Flush time spent on the previous tracked site
 * 2. Decide whether the new tab should be tracked or blocked
 */
async function handleTabChange() {
	const [tab] = await chrome.tabs.query({
		active: true,
		currentWindow: true,
	});
	const now = Date.now();

	if (!tab?.id || !tab.url) {
		await flushActiveTracking(now);
		await clearTrackingSession(now);
		return;
	}

	const persisted = await loadPersistedTrackerState();

	if (!persisted) {
		return;
	}

	const matched = findTrackedSiteByUrl(persisted.sites, tab.url);

	if (!matched) {
		await flushActiveTracking(now);
		await clearTrackingSession(now);
		return;
	}

	const site = normalizeSiteForToday(matched);
	await updatePersistedActiveSiteId(site.id);

	// Leaving a different site — bank its time first.
	if (runtimeState.trackingSiteId && runtimeState.trackingSiteId !== site.id) {
		await flushActiveTracking(now);
		await clearTrackingSession(now);
	}

	if (shouldBlockSite(site, runtimeOptions(now))) {
		if (runtimeState.trackingSiteId === site.id) {
			await flushActiveTracking(now);
		}
		await clearTrackingSession(now);
		await notifyTabBlock(tab.id, site.name);
		return;
	}

	if (!shouldTrackSite(site, runtimeOptions(now))) {
		if (runtimeState.trackingSiteId === site.id) {
			await flushActiveTracking(now);
		}
		await clearTrackingSession(now);
		await notifyTabUnblock(tab.id);
		return;
	}

	if (runtimeState.trackingSiteId !== site.id) {
		await startTracking(site, now);
	}

	await notifyTabUnblock(tab.id);
}

function enqueueTabChange() {
	tabChangeChain = tabChangeChain
		.then(() => handleTabChange())
		.catch(() => undefined);
	return tabChangeChain;
}

/**
 * 1s alarm: only check whether the active tracked site has hit its limit.
 * Does not flush mid-session and does not rewrite allowedSeconds.
 */
async function handleTrackerTick() {
	const now = Date.now();
	runtimeState.lastAlarmAt = now;

	try {
		if (!runtimeState.trackingSiteId || !runtimeState.trackingStartedAt) {
			return;
		}

		const persisted = await loadPersistedTrackerState();

		if (!persisted) {
			return;
		}

		const site = persisted.sites.find(
			(entry) => entry.id === runtimeState.trackingSiteId,
		);

		if (!site) {
			await clearTrackingSession(now);
			return;
		}

		const normalized = normalizeSiteForToday(site);

		if (!shouldBlockSite(normalized, runtimeOptions(now))) {
			return;
		}

		await flushActiveTracking(now);
		await clearTrackingSession(now);

		const [tab] = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});

		if (tab?.id) {
			await notifyTabBlock(tab.id, normalized.name);
		}
	} finally {
		await saveRuntimeState(runtimeState);
		scheduleNextTick();
	}
}

/**
 * After Update Times (or any store write): re-check the current tab only.
 * Never flush from a stale sites snapshot here — that was overwriting saves.
 */
async function handleStoreChanged() {
	await enqueueTabChange();
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

async function bootstrap() {
	await ensurePersistedTrackerState();
	runtimeState = await loadRuntimeState();
	scheduleNextTick();
	await enqueueTabChange();
}

chrome.runtime.onInstalled.addListener(() => {
	void bootstrap();
});

chrome.runtime.onStartup.addListener(() => {
	void bootstrap();
});

void bootstrap();

chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name !== TRACKER_ALARM_NAME) {
		return;
	}

	void handleTrackerTick();
});

chrome.tabs.onActivated.addListener(() => {
	void enqueueTabChange();
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
	if (changeInfo.status === "complete" || changeInfo.url) {
		void enqueueTabChange().then(() => {
			if (tab.id && tab.url) {
				void getTabBlockState(tab.url).then((state) => {
					if (state.blocked && state.siteName && tab.id) {
						void notifyTabBlock(tab.id, state.siteName);
					}
				});
			}
		});
	}
});

chrome.storage.onChanged.addListener((changes, areaName) => {
	if (areaName !== "local" || !changes["tracker-store"]) {
		return;
	}

	void handleStoreChanged();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message?.type === TRACKER_MESSAGE.GET_RUNTIME) {
		void (async () => {
			const persisted = await loadPersistedTrackerState();
			const snapshot = buildLiveTrackerSnapshot(
				persisted?.sites ?? [],
				runtimeState,
			);

			const response: TrackerRuntimeResponse = {
				trackingSiteId: snapshot.trackingSiteId,
				liveUsedSecondsBySiteId: snapshot.liveUsedSecondsBySiteId,
				computedAt: snapshot.computedAt,
			};
			sendResponse(response);
		})();

		return true;
	}

	if (message?.type === TRACKER_MESSAGE.GET_TAB_BLOCK_STATE) {
		const tabUrl = sender.tab?.url ?? message.url;
		void getTabBlockState(tabUrl).then(sendResponse);
		return true;
	}

	return undefined;
});
