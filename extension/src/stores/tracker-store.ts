import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
	ACTIVE_SITE_ID,
	INITIAL_SITES,
	INITIAL_UPDATE_LOGS,
} from "@/lib/mock-data";
import {
	isDuplicateSite,
	resolveSiteFromUrl,
} from "@/lib/sites/resolve-site-from-url";
import { createExtensionStorage } from "@/lib/storage/create-extension-storage";
import { formatUsageDay } from "@/lib/tracker/site-usage";
import { migratePersistedState } from "@/lib/tracker/tracker-storage";
import type {
	SiteId,
	SiteTimeChange,
	TrackedSite,
	UpdateLogEntry,
} from "@/types/tracker";

const STORAGE_KEY = "tracker-store";

interface PersistedTrackerState {
	sites: TrackedSite[];
	updateLogs: UpdateLogEntry[];
	activeSiteId: SiteId;
}

interface TrackerStore extends PersistedTrackerState {
	hasHydrated: boolean;
	applyTimeUpdate: (
		draftAllowedSeconds: Record<string, number>,
		reason: string,
	) => SiteTimeChange[];
	setActiveSiteId: (siteId: SiteId) => void;
	addSite: (url: string) => { error: string | null; site: TrackedSite | null };
	resetTrackerData: () => void;
}

function formatToday() {
	return formatUsageDay();
}

function buildChanges(
	sites: TrackedSite[],
	draftAllowedSeconds: Record<string, number>,
): SiteTimeChange[] {
	return sites.flatMap((site) => {
		const nextAllowed = draftAllowedSeconds[site.id] ?? site.allowedSeconds;
		const deltaSeconds = nextAllowed - site.allowedSeconds;

		if (deltaSeconds === 0) {
			return [];
		}

		return [
			{
				siteId: site.id,
				siteName: site.name,
				previousSeconds: site.allowedSeconds,
				newSeconds: nextAllowed,
				deltaSeconds,
			},
		];
	});
}

export const useTrackerStore = create<TrackerStore>()(
	persist(
		(set, get) => ({
			sites: INITIAL_SITES,
			updateLogs: INITIAL_UPDATE_LOGS,
			activeSiteId: ACTIVE_SITE_ID,
			hasHydrated: false,

			setActiveSiteId: (activeSiteId) => set({ activeSiteId }),

			addSite: (url) => {
				const site = resolveSiteFromUrl(url);

				if (!site) {
					return {
						error: "Enter a valid website URL.",
						site: null,
					};
				}

				const { sites } = get();

				if (isDuplicateSite(sites, site)) {
					return {
						error: "This site is already in your list.",
						site: null,
					};
				}

				set({ sites: [...sites, site] });

				return { error: null, site };
			},

			applyTimeUpdate: (draftAllowedSeconds, reason) => {
				const { sites, updateLogs } = get();
				const changes = buildChanges(sites, draftAllowedSeconds);

				if (changes.length === 0) {
					return [];
				}

				const now = Date.now();
				const today = formatUsageDay();
				const updatedSites = sites.map((site) => {
					const nextAllowed =
						draftAllowedSeconds[site.id] ?? site.allowedSeconds;

					if (nextAllowed === site.allowedSeconds) {
						return site;
					}

					return {
						...site,
						allowedSeconds: nextAllowed,
						lastUpdatedAt: now,
						usageDay: site.usageDay || today,
						limitConfigured: true,
					};
				});

				const newLog: UpdateLogEntry = {
					id: `log-${Date.now()}`,
					date: formatToday(),
					reason: reason.trim(),
					changes,
				};

				set({
					sites: updatedSites,
					updateLogs: [newLog, ...updateLogs],
				});

				return changes;
			},

			resetTrackerData: () =>
				set({
					sites: INITIAL_SITES,
					updateLogs: INITIAL_UPDATE_LOGS,
					activeSiteId: ACTIVE_SITE_ID,
				}),
		}),
		{
			name: STORAGE_KEY,
			storage: createJSONStorage(() => createExtensionStorage()),
			partialize: (state) => ({
				sites: state.sites,
				updateLogs: state.updateLogs,
				activeSiteId: state.activeSiteId,
			}),
			migrate: (persistedState) =>
				migratePersistedState(
					persistedState as PersistedTrackerState & {
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
										addedSeconds?: number;
									}
								>;
							}
						>;
					},
				),
			version: 2,
		},
	),
);

useTrackerStore.persist.onFinishHydration(() => {
	useTrackerStore.setState({ hasHydrated: true });
});

useTrackerStore.persist.onHydrate(() => {
	useTrackerStore.setState({ hasHydrated: false });
});

if (useTrackerStore.persist.hasHydrated()) {
	useTrackerStore.setState({ hasHydrated: true });
}

export function buildDraftAllowedSeconds(sites: TrackedSite[]) {
	return Object.fromEntries(
		sites.map((site) => [site.id, site.allowedSeconds]),
	);
}

export function selectPendingChanges(
	sites: TrackedSite[],
	draftAllowedSeconds: Record<string, number>,
) {
	return buildChanges(sites, draftAllowedSeconds);
}

/** @deprecated Use buildDraftAllowedSeconds */
export const buildDraftSeconds = buildDraftAllowedSeconds;
