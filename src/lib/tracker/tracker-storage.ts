import {
	ACTIVE_SITE_ID,
	INITIAL_SITES,
	INITIAL_UPDATE_LOGS,
} from "@/lib/mock-data";
import {
	TRACKER_RUNTIME_KEY,
	TRACKER_STORE_KEY,
	TRACKER_STORE_VERSION,
} from "@/lib/tracker/constants";
import { formatUsageDay } from "@/lib/tracker/site-usage";
import {
	DEFAULT_RUNTIME_STATE,
	type PersistedTrackerState,
	type TrackerRuntimeState,
} from "@/lib/tracker/types";
import type {
	SiteId,
	SiteTimeChange,
	TrackedSite,
	UpdateLogEntry,
} from "@/types/tracker";

interface PersistedStoreEnvelope {
	state: PersistedTrackerState;
	version: number;
}

type SiteUsagePatch = {
	usedSecondsToday: number;
	usageDay?: string;
	lastUpdatedAt?: number;
};

/** Serialize read-modify-write updates so popup limit saves aren't overwritten. */
let trackerStoreWriteChain: Promise<unknown> = Promise.resolve();

function withTrackerStoreLock<T>(fn: () => Promise<T>): Promise<T> {
	const run = trackerStoreWriteChain.then(fn, fn);
	trackerStoreWriteChain = run.then(
		() => undefined,
		() => undefined,
	);
	return run;
}

function migrateSite(
	site: TrackedSite & {
		minutesRemaining?: number;
		remainingSeconds?: number;
	},
) {
	if (typeof site.allowedSeconds === "number") {
		return {
			...site,
			usedSecondsToday: site.usedSecondsToday ?? 0,
			usageDay: site.usageDay ?? formatUsageDay(),
			lastUpdatedAt: site.lastUpdatedAt ?? Date.now(),
			limitConfigured: site.limitConfigured ?? false,
		};
	}

	const legacyRemaining =
		site.remainingSeconds ??
		(site.minutesRemaining !== undefined ? site.minutesRemaining * 60 : 0);

	return {
		id: site.id,
		name: site.name,
		url: site.url,
		allowedSeconds: legacyRemaining,
		usedSecondsToday: 0,
		usageDay: formatUsageDay(),
		lastUpdatedAt: Date.now(),
		limitConfigured: site.limitConfigured ?? legacyRemaining > 0,
	};
}

type LegacySiteTimeChange = SiteTimeChange & {
	previousMinutes?: number;
	newMinutes?: number;
	addedMinutes?: number;
	addedSeconds?: number;
};

function migrateLogEntry(
	log: UpdateLogEntry & {
		changes: LegacySiteTimeChange[];
	},
): UpdateLogEntry {
	return {
		...log,
		changes: log.changes.map((change) => {
			if (typeof change.deltaSeconds === "number") {
				return change;
			}

			const legacyChange = change as LegacySiteTimeChange;

			if (typeof legacyChange.addedSeconds === "number") {
				return {
					siteId: legacyChange.siteId,
					siteName: legacyChange.siteName,
					previousSeconds: legacyChange.previousSeconds,
					newSeconds: legacyChange.newSeconds,
					deltaSeconds: legacyChange.addedSeconds,
				};
			}

			return {
				siteId: legacyChange.siteId,
				siteName: legacyChange.siteName,
				previousSeconds: (legacyChange.previousMinutes ?? 0) * 60,
				newSeconds: (legacyChange.newMinutes ?? 0) * 60,
				deltaSeconds: (legacyChange.addedMinutes ?? 0) * 60,
			};
		}),
	};
}

function migratePersistedState(
	state: PersistedTrackerState & {
		sites: Array<
			TrackedSite & {
				minutesRemaining?: number;
				remainingSeconds?: number;
			}
		>;
		updateLogs: Array<
			UpdateLogEntry & {
				changes: Array<
					SiteTimeChange & {
						previousMinutes?: number;
						newMinutes?: number;
						addedMinutes?: number;
					}
				>;
			}
		>;
	},
): PersistedTrackerState {
	return {
		...state,
		sites: state.sites.map((site) => migrateSite(site)),
		updateLogs: state.updateLogs.map((log) => migrateLogEntry(log)),
	};
}

function parsePersistedStore(raw: string | null): PersistedTrackerState | null {
	if (!raw) {
		return null;
	}

	try {
		const parsed = JSON.parse(raw) as PersistedStoreEnvelope;
		return migratePersistedState(
			parsed.state as PersistedTrackerState & {
				sites: Array<
					TrackedSite & {
						minutesRemaining?: number;
						remainingSeconds?: number;
					}
				>;
				updateLogs: Array<
					UpdateLogEntry & {
						changes: Array<
							SiteTimeChange & {
								previousMinutes?: number;
								newMinutes?: number;
								addedMinutes?: number;
							}
						>;
					}
				>;
			},
		);
	} catch {
		return null;
	}
}

function defaultPersistedTrackerState(): PersistedTrackerState {
	return {
		sites: INITIAL_SITES,
		updateLogs: INITIAL_UPDATE_LOGS,
		activeSiteId: ACTIVE_SITE_ID,
	};
}

export async function loadPersistedTrackerState(): Promise<PersistedTrackerState | null> {
	if (typeof chrome === "undefined" || !chrome.storage?.local?.get) {
		return null;
	}

	const result = await chrome.storage.local.get(TRACKER_STORE_KEY);
	return parsePersistedStore(result[TRACKER_STORE_KEY] ?? null);
}

export async function savePersistedTrackerState(
	state: PersistedTrackerState,
): Promise<void> {
	if (typeof chrome === "undefined" || !chrome.storage?.local?.set) {
		return;
	}

	const envelope: PersistedStoreEnvelope = {
		state,
		version: TRACKER_STORE_VERSION,
	};

	await chrome.storage.local.set({
		[TRACKER_STORE_KEY]: JSON.stringify(envelope),
	});
}

/** Load tracker-store, or create it when missing. */
export async function ensurePersistedTrackerState(): Promise<PersistedTrackerState> {
	return withTrackerStoreLock(async () => {
		const existing = await loadPersistedTrackerState();

		if (existing) {
			return existing;
		}

		const created = defaultPersistedTrackerState();
		await savePersistedTrackerState(created);
		return created;
	});
}

export async function updatePersistedActiveSiteId(
	activeSiteId: SiteId,
): Promise<void> {
	await withTrackerStoreLock(async () => {
		const current = await loadPersistedTrackerState();

		if (!current || current.activeSiteId === activeSiteId) {
			return;
		}

		await savePersistedTrackerState({
			...current,
			activeSiteId,
		});
	});
}

/**
 * Patch usage fields only — never rewrite allowedSeconds / logs from a stale snapshot.
 * This is what made Update Times appear to save (Done dialog) then get overwritten.
 */
export async function patchPersistedSiteUsage(
	siteId: SiteId,
	patch: SiteUsagePatch,
): Promise<PersistedTrackerState | null> {
	return withTrackerStoreLock(async () => {
		const current = await loadPersistedTrackerState();

		if (!current) {
			return null;
		}

		const siteIndex = current.sites.findIndex((site) => site.id === siteId);

		if (siteIndex === -1) {
			return current;
		}

		const site = current.sites[siteIndex];
		const nextSites = [...current.sites];
		nextSites[siteIndex] = {
			...site,
			usedSecondsToday: patch.usedSecondsToday,
			usageDay: patch.usageDay ?? site.usageDay,
			lastUpdatedAt: patch.lastUpdatedAt ?? Date.now(),
		};

		const nextState = {
			...current,
			sites: nextSites,
		};

		await savePersistedTrackerState(nextState);
		return nextState;
	});
}

export async function loadRuntimeState(): Promise<TrackerRuntimeState> {
	if (typeof chrome === "undefined" || !chrome.storage?.local?.get) {
		return DEFAULT_RUNTIME_STATE;
	}

	const result = await chrome.storage.local.get(TRACKER_RUNTIME_KEY);
	const raw = result[TRACKER_RUNTIME_KEY] as TrackerRuntimeState | undefined;

	if (!raw) {
		return DEFAULT_RUNTIME_STATE;
	}

	return {
		trackingSiteId: raw.trackingSiteId ?? null,
		trackingStartedAt: raw.trackingStartedAt ?? null,
		lastAlarmAt: raw.lastAlarmAt ?? Date.now(),
	};
}

export async function saveRuntimeState(
	runtime: TrackerRuntimeState,
): Promise<void> {
	if (typeof chrome === "undefined" || !chrome.storage?.local?.set) {
		return;
	}

	await chrome.storage.local.set({
		[TRACKER_RUNTIME_KEY]: runtime,
	});
}

export { migratePersistedState, migrateSite };
