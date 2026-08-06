import {
	TRACKER_RUNTIME_KEY,
	TRACKER_STORE_KEY,
} from "@/lib/tracker/constants";
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

function migrateSite(site: TrackedSite & { minutesRemaining?: number }) {
	if (typeof site.remainingSeconds === "number") {
		return {
			...site,
			lastUpdatedAt: site.lastUpdatedAt ?? Date.now(),
			limitConfigured: site.limitConfigured ?? false,
		};
	}

	const minutes = site.minutesRemaining ?? 0;

	return {
		id: site.id,
		name: site.name,
		url: site.url,
		remainingSeconds: minutes * 60,
		lastUpdatedAt: Date.now(),
		limitConfigured: minutes > 0,
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
		sites: Array<TrackedSite & { minutesRemaining?: number }>;
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
				sites: Array<TrackedSite & { minutesRemaining?: number }>;
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
		version: 0,
	};

	await chrome.storage.local.set({
		[TRACKER_STORE_KEY]: JSON.stringify(envelope),
	});
}

export async function updatePersistedActiveSiteId(
	activeSiteId: SiteId,
): Promise<void> {
	const current = await loadPersistedTrackerState();

	if (!current || current.activeSiteId === activeSiteId) {
		return;
	}

	await savePersistedTrackerState({
		...current,
		activeSiteId,
	});
}

export async function updatePersistedSites(
	sites: TrackedSite[],
): Promise<PersistedTrackerState | null> {
	const current = await loadPersistedTrackerState();

	if (!current) {
		return null;
	}

	const nextState = {
		...current,
		sites,
	};

	await savePersistedTrackerState(nextState);
	return nextState;
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
