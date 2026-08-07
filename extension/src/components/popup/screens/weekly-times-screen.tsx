import { useState } from "react";
import { PopupHeader } from "@/components/popup/shared/popup-header";
import { SiteIcon } from "@/components/popup/shared/site-icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatRemainingSeconds } from "@/lib/tracker/format-time";
import { formatUsageDay, normalizeSiteForToday } from "@/lib/tracker/site-usage";
import { useWeeklyUsageState } from "@/lib/tracker/use-weekly-usage";
import {
	getWeekDayKeys,
	seedMockWeeklyUsage,
	WEEKDAY_LABELS,
} from "@/lib/tracker/weekly-usage";
import type { SiteId, TrackedSite } from "@/types/tracker";

interface WeeklyTimesScreenProps {
	sites: TrackedSite[];
	activeSiteId: SiteId;
	usedSecondsBySiteId: Record<string, number>;
	onBack: () => void;
}

function getLiveSessionExtra(
	site: TrackedSite,
	usedSecondsBySiteId: Record<string, number>,
) {
	const normalized = normalizeSiteForToday(site);
	const liveUsed = usedSecondsBySiteId[site.id] ?? 0;
	return Math.max(0, liveUsed - normalized.usedSecondsToday);
}

export function WeeklyTimesScreen({
	sites,
	activeSiteId,
	usedSecondsBySiteId,
	onBack,
}: WeeklyTimesScreenProps) {
	const { weeklyUsage, hasLoaded, refresh } = useWeeklyUsageState();
	const [isSeedingMock, setIsSeedingMock] = useState(false);
	const today = formatUsageDay();
	const dayKeys = getWeekDayKeys(weeklyUsage.weekStart);

	const handleFillMockData = () => {
		if (sites.length === 0 || isSeedingMock) {
			return;
		}

		setIsSeedingMock(true);
		void seedMockWeeklyUsage(
			sites.map((site) => ({ id: site.id, name: site.name })),
		)
			.then(() => refresh())
			.finally(() => setIsSeedingMock(false));
	};

	return (
		<div className="flex min-h-full flex-col gap-6">
			<PopupHeader
				subtitle="This Week"
				showBack
				onBack={onBack}
				action={
					<Button
						type="button"
						variant="outline"
						size="xs"
						onClick={handleFillMockData}
						disabled={sites.length === 0 || isSeedingMock}
					>
						{isSeedingMock ? "Filling..." : "Fill mock data"}
					</Button>
				}
			/>

			{!hasLoaded ? (
				<p className="py-8 text-center text-sm text-muted-foreground">
					Loading weekly times...
				</p>
			) : (
				<section className="flex flex-col items-center gap-6 text-center">
					{dayKeys.map((dayKey, dayIndex) => {
						const dayBucket = weeklyUsage.days[dayKey] ?? {};
						const isToday = dayKey === today;

						const rows = sites.map((site) => {
							const banked = dayBucket[site.id] ?? 0;
							const sessionExtra = isToday
								? getLiveSessionExtra(site, usedSecondsBySiteId)
								: 0;
							const seconds = banked + sessionExtra;
							const name =
								weeklyUsage.siteNames[site.id] ?? site.name;

							return {
								siteId: site.id,
								name,
								seconds,
								isActiveToday: isToday && site.id === activeSiteId,
							};
						});

						const hasAnyTime = rows.some((row) => row.seconds > 0);

						return (
							<div key={dayKey} className="w-full space-y-3">
								<div className="space-y-0.5">
									<p className="text-sm font-medium">
										{WEEKDAY_LABELS[dayIndex]}
									</p>
									<p className="text-xs text-muted-foreground">
										{dayKey}
										{isToday ? " · Today" : ""}
									</p>
								</div>

								{!hasAnyTime ? (
									<p className="text-sm text-muted-foreground">
										No time tracked
									</p>
								) : (
									<div className="w-full text-left">
										{rows.map((row, rowIndex) => (
											<div key={row.siteId}>
												<div
													className={
														row.isActiveToday
															? "flex items-center justify-between gap-3 rounded-none border border-border bg-muted/40 px-3 py-2.5"
															: "flex items-center justify-between gap-3 px-3 py-2.5"
													}
												>
													<div className="flex min-w-0 items-center gap-3">
														<SiteIcon siteId={row.siteId} size="sm" />
														<span className="truncate text-sm font-medium">
															{row.name}
														</span>
													</div>
													<span className="shrink-0 text-sm tabular-nums text-muted-foreground">
														{formatRemainingSeconds(row.seconds)}
													</span>
												</div>
												{rowIndex < rows.length - 1 && <Separator />}
											</div>
										))}
									</div>
								)}
							</div>
						);
					})}
				</section>
			)}
		</div>
	);
}
