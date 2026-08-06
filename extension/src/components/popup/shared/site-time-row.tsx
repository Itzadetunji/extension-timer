import {
	InfoTooltip,
	TIME_SPENT_PER_APP_TOOLTIP,
} from "@/components/popup/shared/info-tooltip";
import { SiteIcon } from "@/components/popup/shared/site-icon";
import { Separator } from "@/components/ui/separator";
import { formatRemainingSeconds } from "@/lib/tracker/format-time";
import type { TrackedSite } from "@/types/tracker";

interface SiteTimeRowProps {
	site: TrackedSite;
	usedSecondsToday: number;
	highlight?: boolean;
}

export function SiteTimeRow({
	site,
	usedSecondsToday,
	highlight = false,
}: SiteTimeRowProps) {
	console.log(site)
	return (
		<div
			className={
				highlight
					? "flex items-center justify-between gap-3 rounded-none border border-border bg-muted/40 px-3 py-2.5"
					: "flex items-center justify-between gap-3 py-2.5"
			}
		>
			<div className="flex min-w-0 items-center gap-3">
				<SiteIcon siteId={site.id} size="sm" />
				<span className="truncate text-sm font-medium">{site.name}</span>
			</div>
			<span className="shrink-0 text-sm tabular-nums text-muted-foreground">
				{formatRemainingSeconds(usedSecondsToday)} / {formatRemainingSeconds(site.allowedSeconds)}
			</span>
		</div>
	);
}

interface SiteTimeListProps {
	sites: TrackedSite[];
	usedSecondsBySiteId: Record<string, number>;
	title?: string;
	showSeparator?: boolean;
}

export function SiteTimeList({
	sites,
	usedSecondsBySiteId,
	title = "Track Times",
	showSeparator = true,
}: SiteTimeListProps) {
	return (
		<section className="space-y-3">
			<div className="flex items-center gap-1.5">
				<h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					{title}
				</h2>
				<InfoTooltip
					label="Time spent today"
					content={TIME_SPENT_PER_APP_TOOLTIP}
				/>
			</div>
			<div>
				{sites.map((site, index) => (
					<div key={site.id}>
						<SiteTimeRow
							site={site}
							usedSecondsToday={usedSecondsBySiteId[site.id] ?? 0}
						/>
						{showSeparator && index < sites.length - 1 && <Separator />}
					</div>
				))}
			</div>
		</section>
	);
}
