import {
	InfoTooltip,
	TIME_SPENT_TODAY_TOOLTIP,
} from "@/components/popup/shared/info-tooltip";
import { PopupHeader } from "@/components/popup/shared/popup-header";
import { SiteIcon } from "@/components/popup/shared/site-icon";
import { SiteTimeList } from "@/components/popup/shared/site-time-row";
import { Button } from "@/components/ui/button";
import { formatRemainingSeconds } from "@/lib/tracker/format-time";
import type { SiteId, TrackedSite } from "@/types/tracker";
import { MadeWith } from "../shared/made-with";

interface HomeScreenProps {
	sites: TrackedSite[];
	activeSiteId: SiteId;
	usedSecondsBySiteId: Record<string, number>;
	onUpdateTimes: () => void;
	onSeeAllTimes: () => void;
	onViewLogs: () => void;
}

export function HomeScreen({
	sites,
	activeSiteId,
	usedSecondsBySiteId,
	onUpdateTimes,
	onSeeAllTimes,
	onViewLogs,
}: HomeScreenProps) {
	const activeSite = sites.find((site) => site.id === activeSiteId) ?? sites[0];
	const activeUsedSeconds = activeSite
		? (usedSecondsBySiteId[activeSite.id] ?? 0)
		: 0;

	return (
		<div className="flex min-h-full flex-col gap-6 justify-between flex-1">
			<PopupHeader
				action={
					<Button
						type="button"
						variant="outline"
						size="xs"
						onClick={onViewLogs}
					>
						View Logs
					</Button>
				}
			/>

			<section className="flex flex-col items-center gap-3 py-2 text-center">
				<p className="text-5xl leading-none font-semibold tabular-nums">
					{formatRemainingSeconds(activeUsedSeconds)}
				</p>
				{activeSite ? (
					<div className="flex items-center gap-2.5">
						<SiteIcon
							siteId={activeSite.id}
							size="lg"
						/>
						<span className="text-sm font-medium">{activeSite.name}</span>
					</div>
				) : (
					<p className="text-sm font-medium text-muted-foreground">
						No websites are being tracked yet.
					</p>
				)}
				<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<span>Time spent today</span>
					<InfoTooltip
						label="Time spent today"
						content={TIME_SPENT_TODAY_TOOLTIP}
					/>
				</div>
			</section>

			<div className="flex flex-col flex-1 gap-1 justify-between">
				<SiteTimeList
					sites={sites}
					usedSecondsBySiteId={usedSecondsBySiteId}
				/>

				<div className="flex gap-2 pt-2">
					<Button
						type="button"
						variant="outline"
						className="flex-1"
						onClick={onSeeAllTimes}
					>
						See All Times
					</Button>
					<Button
						type="button"
						className="flex-1"
						onClick={onUpdateTimes}
					>
						Update Times
					</Button>
				</div>

				<MadeWith />
			</div>
		</div>
	);
}
