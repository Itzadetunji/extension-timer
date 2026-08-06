import { useMemo, useState } from "react";
import { DoneDialog } from "@/components/popup/done-dialog";
import { HomeScreen } from "@/components/popup/home-screen";
import { ReasonDialog } from "@/components/popup/reason-dialog";
import { UpdateLogsScreen } from "@/components/popup/update-logs-screen";
import { UpdateTimesScreen } from "@/components/popup/update-times-screen";
import {
	ACTIVE_SITE_ID,
	INITIAL_SITES,
	INITIAL_UPDATE_LOGS,
} from "@/lib/mock-data";
import type {
	Screen,
	SiteTimeChange,
	TrackedSite,
	UpdateLogEntry,
} from "@/types/tracker";

function buildDraftMinutes(sites: TrackedSite[]) {
	return Object.fromEntries(
		sites.map((site) => [site.id, site.minutesRemaining]),
	);
}

function formatToday() {
	const now = new Date();
	const day = String(now.getDate()).padStart(2, "0");
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const year = now.getFullYear();

	return `${day}/${month}/${year}`;
}

export function PopupApp() {
	const [screen, setScreen] = useState<Screen>("home");
	const [sites, setSites] = useState<TrackedSite[]>(INITIAL_SITES);
	const [updateLogs, setUpdateLogs] =
		useState<UpdateLogEntry[]>(INITIAL_UPDATE_LOGS);
	const [draftMinutes, setDraftMinutes] = useState<Record<string, number>>(
		() => buildDraftMinutes(INITIAL_SITES),
	);
	const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
	const [doneDialogOpen, setDoneDialogOpen] = useState(false);
	const [reason, setReason] = useState("");
	const [doneMessage, setDoneMessage] = useState("");

	const pendingChanges = useMemo(() => {
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
				} satisfies SiteTimeChange,
			];
		});
	}, [draftMinutes, sites]);

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
			setDoneMessage("No time was added. Increase at least one site limit to update.");
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

		setSites((current) =>
			current.map((site) => ({
				...site,
				minutesRemaining: draftMinutes[site.id] ?? site.minutesRemaining,
			})),
		);

		const totalAdded = pendingChanges.reduce(
			(sum, change) => sum + change.addedMinutes,
			0,
		);

		setUpdateLogs((current) => [
			{
				id: `log-${Date.now()}`,
				date: formatToday(),
				reason: trimmedReason,
				changes: pendingChanges,
			},
			...current,
		]);

		setReasonDialogOpen(false);
		setDoneMessage(
			`Your time limits were updated. ${totalAdded} minute${totalAdded === 1 ? "" : "s"} added across ${pendingChanges.length} site${pendingChanges.length === 1 ? "" : "s"}.`,
		);
		setDoneDialogOpen(true);
		setScreen("home");
		setReason("");
	};

	return (
		<>
			{screen === "home" && (
				<HomeScreen
					sites={sites}
					activeSiteId={ACTIVE_SITE_ID}
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
				<UpdateLogsScreen
					logs={updateLogs}
					onBack={() => setScreen("home")}
				/>
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
