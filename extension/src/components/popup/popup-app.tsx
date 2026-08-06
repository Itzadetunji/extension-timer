import { useMemo, useState } from "react";

import { AddSiteDialog } from "@/components/popup/add-site/add-site-dialog";
import { DoneDialog } from "@/components/popup/done/done-dialog";
import { ReasonDialog } from "@/components/popup/reason/reason-dialog";
import { HomeScreen } from "@/components/popup/screens/home-screen";
import { UpdateLogsScreen } from "@/components/popup/screens/update-logs-screen";
import { UpdateTimesScreen } from "@/components/popup/screens/update-times-screen";
import {
	buildDraftMinutes,
	selectPendingChanges,
	useTrackerStore,
} from "@/stores/tracker-store";
import type { Screen } from "@/types/tracker";

export function PopupApp() {
	const [screen, setScreen] = useState<Screen>("home");
	const [draftMinutes, setDraftMinutes] = useState<Record<string, number>>({});
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

	const handleAddSite = (url: string) => {
		const result = addSite(url);

		if (result.error) {
			return result.error;
		}

		if (result.site) {
			const addedSite = result.site;
			setDraftMinutes((current) => ({
				...current,
				[addedSite.id]: addedSite.minutesRemaining,
			}));
		}

		return null;
	};

	const handleSubmitUpdate = () => {
		if (pendingChanges.length === 0) {
			setDoneMessage(
				"No time was added. Increase at least one site limit to update.",
			);
			setDoneDialogOpen(true);
			return;
		}

		setReasonDialogOpen(true);
	};

	const handleConfirmUpdate = (submittedReason: string) => {
		const changes = applyTimeUpdate(draftMinutes, submittedReason);

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
