import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
	ACTIVE_SITE_ID,
	INITIAL_SITES,
	INITIAL_UPDATE_LOGS,
} from "@/lib/mock-data";
import { createExtensionStorage } from "@/lib/storage/create-extension-storage";
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
		draftMinutes: Record<string, number>,
		reason: string,
	) => SiteTimeChange[];
	setActiveSiteId: (siteId: SiteId) => void;
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
	draftMinutes: Record<string, number>,
): SiteTimeChange[] {
	return sites.flatMap((site) => {
		const nextMinutes = draftMinutes[site.id] ?? site.minutesRemaining;
		const addedMinutes = nextMinutes - site.minutesRemaining;

		if (addedMinutes <= 0) {
			return [];
		}

		return [
			{
				siteId: site.id,
				siteName: site.name,
				previousMinutes: site.minutesRemaining,
				newMinutes: nextMinutes,
				addedMinutes,
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

			applyTimeUpdate: (draftMinutes, reason) => {
				const { sites, updateLogs } = get();
				const changes = buildChanges(sites, draftMinutes);

				if (changes.length === 0) {
					return [];
				}

				const updatedSites = sites.map((site) => ({
					...site,
					minutesRemaining: draftMinutes[site.id] ?? site.minutesRemaining,
				}));

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

export function buildDraftMinutes(sites: TrackedSite[]) {
	return Object.fromEntries(
		sites.map((site) => [site.id, site.minutesRemaining]),
	);
}

export function selectPendingChanges(
	sites: TrackedSite[],
	draftMinutes: Record<string, number>,
) {
	return buildChanges(sites, draftMinutes);
}
