import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentTabHostUrl } from "@/lib/tabs/get-current-tab-url";
import { TRACKER_STORE_KEY } from "@/lib/tracker/constants";
import { findTrackedSiteByUrl } from "@/lib/tracker/match-tracked-site";
import { TRACKER_MESSAGE } from "@/lib/tracker/messages";
import type { SiteId, TrackedSite } from "@/types/tracker";

const EMPTY_LIVE_USAGE: Record<string, number> = {};

export function useLiveUsedSecondsToday(sites: TrackedSite[]) {
	const [liveUsedSecondsBySiteId, setLiveUsedSecondsBySiteId] =
		useState<Record<string, number>>(EMPTY_LIVE_USAGE);

	const syncRuntime = useCallback(() => {
		if (!chrome?.runtime?.sendMessage) {
			return;
		}

		chrome.runtime.sendMessage(
			{ type: TRACKER_MESSAGE.GET_RUNTIME },
			(response) => {
				if (chrome.runtime.lastError || !response?.liveUsedSecondsBySiteId) {
					return;
				}

				setLiveUsedSecondsBySiteId(response.liveUsedSecondsBySiteId);
			},
		);
	}, []);

	useEffect(() => {
		syncRuntime();
		const runtimeInterval = window.setInterval(syncRuntime, 1000);

		return () => window.clearInterval(runtimeInterval);
	}, [syncRuntime]);

	useEffect(() => {
		if (!chrome?.storage?.onChanged) {
			return;
		}

		const handleStorageChange = (
			changes: Record<string, chrome.storage.StorageChange>,
			areaName: chrome.storage.AreaName,
		) => {
			if (areaName !== "local" || !changes[TRACKER_STORE_KEY]) {
				return;
			}

			syncRuntime();
		};

		chrome.storage.onChanged.addListener(handleStorageChange);

		return () => {
			chrome.storage.onChanged.removeListener(handleStorageChange);
		};
	}, [syncRuntime]);

	return useMemo(
		() =>
			Object.fromEntries(
				sites.map((site) => [site.id, liveUsedSecondsBySiteId[site.id] ?? 0]),
			),
		[sites, liveUsedSecondsBySiteId],
	);
}

export function useActiveSiteSync(
	sites: TrackedSite[],
	setActiveSiteId: (siteId: SiteId) => void,
) {
	useEffect(() => {
		void getCurrentTabHostUrl().then((url) => {
			if (!url) {
				return;
			}

			const site = findTrackedSiteByUrl(sites, url);

			if (site) {
				setActiveSiteId(site.id);
			}
		});
	}, [setActiveSiteId, sites]);
}

export function useTrackerStorageSync() {
	useEffect(() => {
		if (!chrome?.storage?.onChanged) {
			return;
		}

		const handleStorageChange = (
			changes: Record<string, chrome.storage.StorageChange>,
			areaName: chrome.storage.AreaName,
		) => {
			if (areaName !== "local" || !changes[TRACKER_STORE_KEY]) {
				return;
			}

			void import("@/stores/tracker-store").then(({ useTrackerStore }) => {
				void useTrackerStore.persist.rehydrate();
			});
		};

		chrome.storage.onChanged.addListener(handleStorageChange);

		return () => {
			chrome.storage.onChanged.removeListener(handleStorageChange);
		};
	}, []);
}
