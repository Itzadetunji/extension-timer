import { useMemo, useState } from "react";

import { AddSiteDialog } from "@/components/popup/add-site/add-site-dialog";
import { DoneDialog } from "@/components/popup/done/done-dialog";
import { ReasonDialog } from "@/components/popup/reason/reason-dialog";
import { HomeScreen } from "@/components/popup/screens/home-screen";
import { UpdateLogsScreen } from "@/components/popup/screens/update-logs-screen";
import { UpdateTimesScreen } from "@/components/popup/screens/update-times-screen";
import {
	useActiveSiteSync,
	useLiveRemainingSeconds,
	useTrackerStorageSync,
} from "@/lib/tracker/use-live-remaining";
import {
	buildDraftSeconds,
	selectPendingChanges,
	useTrackerStore,
} from "@/stores/tracker-store";
import type { Screen } from "@/types/tracker";

export function PopupApp() {
	const [screen, setScreen] = useState<Screen>("home");
	const [draftSeconds, setDraftSeconds] = useState<Record<string, number>>({});
	const [addSiteDialogOpen, setAddSiteDialogOpen] = useState(false);
	const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
	const [doneDialogOpen, setDoneDialogOpen] = useState(false);
	const [doneMessage, setDoneMessage] = useState("");

	const sites = useTrackerStore((state) => state.sites);
	const updateLogs = useTrackerStore((state) => state.updateLogs);
	const activeSiteId = useTrackerStore((state) => state.activeSiteId);
	const hasHydrated = useTrackerStore((state) => state.hasHydrated);
	const applyTimeUpdate = useTrackerStore((state) => state.applyTimeUpdate);
	const addSite = useTrackerStore((state) => state.addSite);
	const setActiveSiteId = useTrackerStore((state) => state.setActiveSiteId);

	const remainingBySiteId = useLiveRemainingSeconds(sites);
	useTrackerStorageSync();
	useActiveSiteSync(sites, setActiveSiteId);

	const pendingChanges = useMemo(
		() => selectPendingChanges(sites, draftSeconds),
		[draftSeconds, sites],
	);

	const handleDraftChange = (siteId: string, seconds: number) => {
		setDraftSeconds((current) => ({
			...current,
			[siteId]: Math.max(0, seconds),
		}));
	};

	const handleOpenUpdateFlow = () => {
		setDraftSeconds(buildDraftSeconds(sites));
		setScreen("update-times");
	};

	const handleAddSite = (url: string) => {
		const result = addSite(url);

		if (result.error) {
			return result.error;
		}

		if (result.site) {
			const addedSite = result.site;
			setDraftSeconds((current) => ({
				...current,
				[addedSite.id]: addedSite.remainingSeconds,
			}));
		}

		return null;
	};

	const handleSubmitUpdate = () => {
		if (pendingChanges.length === 0) {
			setDoneMessage(
				"No time changes were made. Adjust at least one site limit.",
			);
			setDoneDialogOpen(true);
			return;
		}

		setReasonDialogOpen(true);
	};

	const handleConfirmUpdate = (submittedReason: string) => {
		const changes = applyTimeUpdate(draftSeconds, submittedReason);

		if (changes.length === 0) {
			return;
		}

		setReasonDialogOpen(false);
		setDoneMessage(
			`I'm gonna trust you are not a liar. Your time limits were updated for ${changes.length} site${changes.length === 1 ? "" : "s"}.`,
		);
		setDoneDialogOpen(true);
		setScreen("home");
	};

	if (!hasHydrated) {
		return (
			<div className="flex min-h-[520px] items-center justify-center text-sm text-muted-foreground">
				Loading tracker...
			</div>
		);
	}

	return (
		<>
			{screen === "home" && (
				<HomeScreen
					sites={sites}
					activeSiteId={activeSiteId}
					remainingBySiteId={remainingBySiteId}
					onUpdateTimes={handleOpenUpdateFlow}
					onViewLogs={() => setScreen("update-logs")}
				/>
			)}

			{screen === "update-times" && (
				<UpdateTimesScreen
					sites={sites}
					draftSeconds={draftSeconds}
					onDraftChange={handleDraftChange}
					onBack={() => setScreen("home")}
					onSubmit={handleSubmitUpdate}
					onAddSite={() => setAddSiteDialogOpen(true)}
				/>
			)}

			{screen === "update-logs" && (
				<UpdateLogsScreen logs={updateLogs} onBack={() => setScreen("home")} />
			)}

			<AddSiteDialog
				open={addSiteDialogOpen}
				onOpenChange={setAddSiteDialogOpen}
				onAdd={handleAddSite}
			/>

			<ReasonDialog
				open={reasonDialogOpen}
				onOpenChange={setReasonDialogOpen}
				onSubmit={handleConfirmUpdate}
			/>

			<DoneDialog
				open={doneDialogOpen}
				message={doneMessage}
				onOpenChange={setDoneDialogOpen}
			/>
		</>
	);
}
