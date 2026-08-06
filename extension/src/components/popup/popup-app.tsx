import { useMemo, useState } from "react";

import { AddSiteDialog } from "@/components/popup/add-site/add-site-dialog";
import { DoneDialog } from "@/components/popup/done/done-dialog";
import { ReasonDialog } from "@/components/popup/reason/reason-dialog";
import { HomeScreen } from "@/components/popup/screens/home-screen";
import { UpdateLogsScreen } from "@/components/popup/screens/update-logs-screen";
import { UpdateTimesScreen } from "@/components/popup/screens/update-times-screen";
import {
	useActiveSiteSync,
	useLiveUsedSecondsToday,
	useTrackerStorageSync,
} from "@/lib/tracker/use-live-remaining";
import {
	buildDraftAllowedSeconds,
	selectPendingChanges,
	useTrackerStore,
} from "@/stores/tracker-store";
import type { Screen } from "@/types/tracker";

export function PopupApp() {
	const [screen, setScreen] = useState<Screen>("home");
	const [draftAllowedSeconds, setDraftAllowedSeconds] = useState<
		Record<string, number>
	>({});
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

	const usedSecondsBySiteId = useLiveUsedSecondsToday(sites);
	useTrackerStorageSync();
	useActiveSiteSync(sites, setActiveSiteId);

	const pendingChanges = useMemo(
		() => selectPendingChanges(sites, draftAllowedSeconds),
		[draftAllowedSeconds, sites],
	);

	const handleDraftChange = (siteId: string, seconds: number) => {
		setDraftAllowedSeconds((current) => ({
			...current,
			[siteId]: Math.max(0, seconds),
		}));
	};

	const handleOpenUpdateFlow = () => {
		setDraftAllowedSeconds(buildDraftAllowedSeconds(sites));
		setScreen("update-times");
	};

	const handleAddSite = (url: string) => {
		const result = addSite(url);

		if (result.error) {
			return result.error;
		}

		if (result.site) {
			const addedSite = result.site;
			setDraftAllowedSeconds((current) => ({
				...current,
				[addedSite.id]: addedSite.allowedSeconds,
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
		const changes = applyTimeUpdate(draftAllowedSeconds, submittedReason);

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
					usedSecondsBySiteId={usedSecondsBySiteId}
					onUpdateTimes={handleOpenUpdateFlow}
					onViewLogs={() => setScreen("update-logs")}
				/>
			)}

			{screen === "update-times" && (
				<UpdateTimesScreen
					sites={sites}
					draftAllowedSeconds={draftAllowedSeconds}
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
