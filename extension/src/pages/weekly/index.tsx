import ReactDOM from "react-dom/client";
import { WeeklyTimesScreen } from "@/components/popup/screens/weekly-times-screen";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
	useActiveSiteSync,
	useLiveUsedSecondsToday,
	useTrackerStorageSync,
} from "@/lib/tracker/use-live-remaining";
import { useTrackerStore } from "@/stores/tracker-store";
import "@/style.css";

function WeeklyApp() {
	const sites = useTrackerStore((state) => state.sites);
	const activeSiteId = useTrackerStore((state) => state.activeSiteId);
	const hasHydrated = useTrackerStore((state) => state.hasHydrated);
	const setActiveSiteId = useTrackerStore((state) => state.setActiveSiteId);
	const usedSecondsBySiteId = useLiveUsedSecondsToday(sites);

	useTrackerStorageSync();
	useActiveSiteSync(sites, setActiveSiteId);

	if (!hasHydrated) {
		return (
			<div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
				Loading weekly times...
			</div>
		);
	}

	return (
		<WeeklyTimesScreen
			sites={sites}
			activeSiteId={activeSiteId}
			usedSecondsBySiteId={usedSecondsBySiteId}
			onBack={() => window.close()}
		/>
	);
}

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

root.render(
	<TooltipProvider>
		<WeeklyApp />
	</TooltipProvider>,
);
