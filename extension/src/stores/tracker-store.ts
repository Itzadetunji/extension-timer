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
		draftSeconds: Record<string, number>,
		reason: string,
	) => SiteTimeChange[];
	setActiveSiteId: (siteId: SiteId) => void;
	addSite: (url: string) => { error: string | null; site: TrackedSite | null };
	resetTrackerData: () => void;
}

function formatToday() {
	const now = new Date();
	const day = String(now.getDate()).padStart(2, "0");
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const year = now.getFullYear();

	return `${day}/${month}/${year}`;
}

function buildChanges(
	sites: TrackedSite[],
	draftSeconds: Record<string, number>,
): SiteTimeChange[] {
	return sites.flatMap((site) => {
		const nextSeconds = draftSeconds[site.id] ?? site.remainingSeconds;
		const deltaSeconds = nextSeconds - site.remainingSeconds;

		if (deltaSeconds === 0) {
			return [];
		}

		return [
			{
				siteId: site.id,
				siteName: site.name,
				previousSeconds: site.remainingSeconds,
				newSeconds: nextSeconds,
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

			applyTimeUpdate: (draftSeconds, reason) => {
				const { sites, updateLogs } = get();
				const changes = buildChanges(sites, draftSeconds);

				if (changes.length === 0) {
					return [];
				}

				const now = Date.now();
				const updatedSites = sites.map((site) => {
					const nextSeconds = draftSeconds[site.id] ?? site.remainingSeconds;

					if (nextSeconds === site.remainingSeconds) {
						return site;
					}

					return {
						...site,
						remainingSeconds: nextSeconds,
						lastUpdatedAt: now,
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
						sites: Array<TrackedSite & { minutesRemaining?: number }>;
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
			version: 1,
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

export function buildDraftSeconds(sites: TrackedSite[]) {
	return Object.fromEntries(
		sites.map((site) => [site.id, site.remainingSeconds]),
	);
}

export function selectPendingChanges(
	sites: TrackedSite[],
	draftSeconds: Record<string, number>,
) {
	return buildChanges(sites, draftSeconds);
}
