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

interface HomeScreenProps {
	sites: TrackedSite[];
	activeSiteId: SiteId;
	usedSecondsBySiteId: Record<string, number>;
	onUpdateTimes: () => void;
	onViewLogs: () => void;
}

export function HomeScreen({
	sites,
	activeSiteId,
	usedSecondsBySiteId,
	onUpdateTimes,
	onViewLogs,
}: HomeScreenProps) {
	const activeSite = sites.find((site) => site.id === activeSiteId) ?? sites[0];
	const activeUsedSeconds = usedSecondsBySiteId[activeSite.id] ?? 0;

	return (
		<div className="flex min-h-full flex-col gap-6">
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
				<div className="flex items-center gap-2.5">
					<SiteIcon siteId={activeSite.id} size="lg" />
					<span className="text-sm font-medium">{activeSite.name}</span>
				</div>
				<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<span>Time spent today</span>
					<InfoTooltip
						label="Time spent today"
						content={TIME_SPENT_TODAY_TOOLTIP}
					/>
				</div>
			</section>

			<SiteTimeList sites={sites} usedSecondsBySiteId={usedSecondsBySiteId} />

			<div className="mt-auto pt-2">
				<Button type="button" className="w-full" onClick={onUpdateTimes}>
					Update Times
				</Button>
			</div>
		</div>
	);
}
