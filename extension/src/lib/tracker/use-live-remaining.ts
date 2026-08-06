import { useEffect, useMemo, useState } from "react";
import { getCurrentTabHostUrl } from "@/lib/tabs/get-current-tab-url";
import { buildLiveRemainingMap } from "@/lib/tracker/compute-remaining";
import { findTrackedSiteByUrl } from "@/lib/tracker/match-tracked-site";
import { TRACKER_MESSAGE } from "@/lib/tracker/messages";
import type { SiteId, TrackedSite } from "@/types/tracker";

export function useLiveRemainingSeconds(sites: TrackedSite[]) {
	const [now, setNow] = useState(() => Date.now());
	const [trackingSiteId, setTrackingSiteId] = useState<SiteId | null>(null);

	useEffect(() => {
		const clock = window.setInterval(() => {
			setNow(Date.now());
		}, 1000);

		return () => window.clearInterval(clock);
	}, []);

	useEffect(() => {
		const syncRuntime = () => {
			if (!chrome?.runtime?.sendMessage) {
				return;
			}

			chrome.runtime.sendMessage(
				{ type: TRACKER_MESSAGE.GET_RUNTIME },
				(response) => {
					if (response?.trackingSiteId !== undefined) {
						setTrackingSiteId(response.trackingSiteId);
					}
				},
			);
		};

		syncRuntime();
		const runtimeInterval = window.setInterval(syncRuntime, 5000);

		return () => window.clearInterval(runtimeInterval);
	}, []);

	return useMemo(
		() => buildLiveRemainingMap(sites, { now, trackingSiteId }),
		[sites, now, trackingSiteId],
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
			if (areaName !== "local" || !changes["tracker-store"]) {
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
