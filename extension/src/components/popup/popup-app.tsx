import { useMemo, useState } from "react";

import { DoneDialog } from "@/components/popup/done-dialog";
import { HomeScreen } from "@/components/popup/home-screen";
import { ReasonDialog } from "@/components/popup/reason-dialog";
import { UpdateLogsScreen } from "@/components/popup/update-logs-screen";
import { UpdateTimesScreen } from "@/components/popup/update-times-screen";
import {
	buildDraftMinutes,
	selectPendingChanges,
	useTrackerStore,
} from "@/stores/tracker-store";
import type { Screen } from "@/types/tracker";

export function PopupApp() {
	const [screen, setScreen] = useState<Screen>("home");
	const [draftMinutes, setDraftMinutes] = useState<Record<string, number>>({});
	const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
	const [doneDialogOpen, setDoneDialogOpen] = useState(false);
	const [reason, setReason] = useState("");
	const [doneMessage, setDoneMessage] = useState("");

	const sites = useTrackerStore((state) => state.sites);
	const updateLogs = useTrackerStore((state) => state.updateLogs);
	const activeSiteId = useTrackerStore((state) => state.activeSiteId);
	const hasHydrated = useTrackerStore((state) => state.hasHydrated);
	const applyTimeUpdate = useTrackerStore((state) => state.applyTimeUpdate);

	const pendingChanges = useMemo(
		() => selectPendingChanges(sites, draftMinutes),
		[draftMinutes, sites],
	);

	const handleDraftChange = (siteId: string, minutes: number) => {
		setDraftMinutes((current) => ({
			...current,
			[siteId]: Math.max(0, minutes),
		}));
	};

	const handleOpenUpdateFlow = () => {
		setDraftMinutes(buildDraftMinutes(sites));
		setScreen("update-times");
	};

	const handleSubmitUpdate = () => {
		if (pendingChanges.length === 0) {
			setDoneMessage(
				"No time was added. Increase at least one site limit to update.",
			);
			setDoneDialogOpen(true);
			return;
		}

		setReason("");
		setReasonDialogOpen(true);
	};

	const handleConfirmUpdate = () => {
		const trimmedReason = reason.trim();
		if (!trimmedReason) {
			return;
		}

		const changes = applyTimeUpdate(draftMinutes, trimmedReason);

		if (changes.length === 0) {
			return;
		}

		const totalAdded = changes.reduce(
			(sum, change) => sum + change.addedMinutes,
			0,
		);

		setReasonDialogOpen(false);
		setDoneMessage(
			`I'm gonna trust you are not a liar. Your time limits were updated. ${totalAdded} minute${totalAdded === 1 ? "" : "s"} added across ${changes.length} site${changes.length === 1 ? "" : "s"}.`,
		);
		setDoneDialogOpen(true);
		setScreen("home");
		setReason("");
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
					onUpdateTimes={handleOpenUpdateFlow}
					onViewLogs={() => setScreen("update-logs")}
				/>
			)}

			{screen === "update-times" && (
				<UpdateTimesScreen
					sites={sites}
					draftMinutes={draftMinutes}
					onDraftChange={handleDraftChange}
					onBack={() => setScreen("home")}
					onSubmit={handleSubmitUpdate}
				/>
			)}

			{screen === "update-logs" && (
				<UpdateLogsScreen logs={updateLogs} onBack={() => setScreen("home")} />
			)}

			<ReasonDialog
				open={reasonDialogOpen}
				reason={reason}
				onReasonChange={setReason}
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
