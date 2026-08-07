import { useCallback, useEffect, useState } from "react";
import { WEEKLY_USAGE_KEY } from "@/lib/tracker/constants";
import {
	createEmptyWeeklyUsage,
	ensureCurrentWeek,
	loadWeeklyUsageState,
	type WeeklyUsageState,
} from "@/lib/tracker/weekly-usage";

export function useWeeklyUsageState() {
	const [weeklyUsage, setWeeklyUsage] = useState<WeeklyUsageState>(() =>
		createEmptyWeeklyUsage(),
	);
	const [hasLoaded, setHasLoaded] = useState(false);

	const refresh = useCallback(() => {
		void loadWeeklyUsageState().then((state) => {
			setWeeklyUsage(ensureCurrentWeek(state));
			setHasLoaded(true);
		});
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	useEffect(() => {
		if (!chrome?.storage?.onChanged) {
			return;
		}

		const handleStorageChange = (
			changes: Record<string, chrome.storage.StorageChange>,
			areaName: chrome.storage.AreaName,
		) => {
			if (areaName !== "local" || !changes[WEEKLY_USAGE_KEY]) {
				return;
			}

			const next = changes[WEEKLY_USAGE_KEY].newValue as
				| WeeklyUsageState
				| undefined;

			if (next && typeof next === "object") {
				setWeeklyUsage(
					ensureCurrentWeek({
						weekStart: next.weekStart,
						days: next.days ?? {},
						siteNames: next.siteNames ?? {},
					}),
				);
				setHasLoaded(true);
				return;
			}

			refresh();
		};

		chrome.storage.onChanged.addListener(handleStorageChange);

		return () => {
			chrome.storage.onChanged.removeListener(handleStorageChange);
		};
	}, [refresh]);

	return { weeklyUsage, hasLoaded, refresh };
}
