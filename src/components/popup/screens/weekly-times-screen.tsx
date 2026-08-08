import { useState } from "react";
import { PopupHeader } from "@/components/popup/shared/popup-header";
import { SiteIcon } from "@/components/popup/shared/site-icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	formatHoursAndMinutes,
	formatRemainingSeconds,
} from "@/lib/tracker/format-time";
import {
	formatUsageDay,
	normalizeSiteForToday,
} from "@/lib/tracker/site-usage";
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

function buildDaySections(
	dayKeys: string[],
	sites: TrackedSite[],
	weeklyUsage: {
		days: Record<string, Record<string, number>>;
		siteNames: Record<string, string>;
	},
	today: string,
	activeSiteId: SiteId,
	usedSecondsBySiteId: Record<string, number>,
) {
	return dayKeys.map((dayKey, dayIndex) => {
		const dayBucket = weeklyUsage.days[dayKey] ?? {};
		const isToday = dayKey === today;

		const rows = sites.map((site) => {
			const banked = dayBucket[site.id] ?? 0;
			const sessionExtra = isToday
				? getLiveSessionExtra(site, usedSecondsBySiteId)
				: 0;
			const seconds = banked + sessionExtra;

			return {
				siteId: site.id,
				name: weeklyUsage.siteNames[site.id] ?? site.name,
				seconds,
				isActiveToday: isToday && site.id === activeSiteId,
			};
		});

		const dayTotalSeconds = rows.reduce((sum, row) => sum + row.seconds, 0);

		return {
			dayKey,
			dayIndex,
			isToday,
			rows,
			dayTotalSeconds,
			hasAnyTime: dayTotalSeconds > 0,
		};
	});
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
	const daySections = buildDaySections(
		dayKeys,
		sites,
		weeklyUsage,
		today,
		activeSiteId,
		usedSecondsBySiteId,
	);
	const weekTotalSeconds = daySections.reduce(
		(sum, day) => sum + day.dayTotalSeconds,
		0,
	);

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
			/>

			{!hasLoaded ? (
				<p className="py-8 text-center text-sm text-muted-foreground">
					Loading weekly times...
				</p>
			) : (
				<section className="flex w-full flex-col items-center gap-6 text-center">
					{daySections.map((day) => (
						<div key={day.dayKey} className="w-full space-y-3">
							<div className="space-y-0.5">
								<p className="text-sm font-medium">
									{WEEKDAY_LABELS[day.dayIndex]}
								</p>
								<p className="text-xs text-muted-foreground">
									{day.dayKey}
									{day.isToday ? " · Today" : ""}
								</p>
							</div>

							{!day.hasAnyTime ? (
								<p className="text-sm text-muted-foreground">No time tracked</p>
							) : (
								<div className="w-full text-left">
									{day.rows.map((row, rowIndex) => (
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
											{rowIndex < day.rows.length - 1 && <Separator />}
										</div>
									))}
								</div>
							)}

							<div className="flex items-center justify-between gap-3 border-t border-border px-3 pt-3">
								<span className="text-sm font-medium">Day total</span>
								<span className="text-sm font-medium tabular-nums">
									{formatRemainingSeconds(day.dayTotalSeconds)}
								</span>
							</div>
						</div>
					))}

					<div className="w-full space-y-2 border-t border-border pt-6">
						<p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
							Week total
						</p>
						<p className="text-3xl font-semibold tabular-nums">
							{formatHoursAndMinutes(weekTotalSeconds)}
						</p>
					</div>
				</section>
			)}
		</div>
	);
}
