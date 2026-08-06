import { PopupHeader } from "@/components/popup/shared/popup-header";
import { SiteIcon } from "@/components/popup/shared/site-icon";
import { SiteTimeList } from "@/components/popup/shared/site-time-row";
import { Button } from "@/components/ui/button";
import { formatRemainingSeconds } from "@/lib/tracker/format-time";
import type { SiteId, TrackedSite } from "@/types/tracker";

interface HomeScreenProps {
	sites: TrackedSite[];
	activeSiteId: SiteId;
	remainingBySiteId: Record<string, number>;
	onUpdateTimes: () => void;
	onViewLogs: () => void;
}

export function HomeScreen({
	sites,
	activeSiteId,
	remainingBySiteId,
	onUpdateTimes,
	onViewLogs,
}: HomeScreenProps) {
	const activeSite = sites.find((site) => site.id === activeSiteId) ?? sites[0];
	const activeRemaining = remainingBySiteId[activeSite.id] ?? 0;

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
					{formatRemainingSeconds(activeRemaining)}
				</p>
				<div className="flex items-center gap-2.5">
					<SiteIcon siteId={activeSite.id} size="lg" />
					<span className="text-sm font-medium">{activeSite.name}</span>
				</div>
				<p className="text-xs text-muted-foreground">
					Time remaining on this site
				</p>
			</section>

			<SiteTimeList sites={sites} remainingBySiteId={remainingBySiteId} />

			<div className="mt-auto pt-2">
				<Button type="button" className="w-full" onClick={onUpdateTimes}>
					Update Times
				</Button>
			</div>
		</div>
	);
}
