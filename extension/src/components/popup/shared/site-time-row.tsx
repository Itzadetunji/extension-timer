import { SiteIcon } from "@/components/popup/shared/site-icon";
import { Separator } from "@/components/ui/separator";
import { formatRemainingSeconds } from "@/lib/tracker/format-time";
import type { TrackedSite } from "@/types/tracker";

interface SiteTimeRowProps {
	site: TrackedSite;
	remainingSeconds: number;
	highlight?: boolean;
}

export function SiteTimeRow({
	site,
	remainingSeconds,
	highlight = false,
}: SiteTimeRowProps) {
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
				{formatRemainingSeconds(remainingSeconds)}
			</span>
		</div>
	);
}

interface SiteTimeListProps {
	sites: TrackedSite[];
	remainingBySiteId: Record<string, number>;
	title?: string;
	showSeparator?: boolean;
}

export function SiteTimeList({
	sites,
	remainingBySiteId,
	title = "Track Times",
	showSeparator = true,
}: SiteTimeListProps) {
	return (
		<section className="space-y-3">
			<h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
				{title}
			</h2>
			<div>
				{sites.map((site, index) => (
					<div key={site.id}>
						<SiteTimeRow
							site={site}
							remainingSeconds={remainingBySiteId[site.id] ?? 0}
						/>
						{showSeparator && index < sites.length - 1 && <Separator />}
					</div>
				))}
			</div>
		</section>
	);
}
