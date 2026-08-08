import { WEEKLY_USAGE_KEY } from "@/lib/tracker/constants";
import { formatUsageDay } from "@/lib/tracker/site-usage";
import type { SiteId } from "@/types/tracker";

export interface WeeklyUsageState {
	weekStart: string;
	days: Record<string, Record<string, number>>;
	siteNames: Record<string, string>;
}

export const WEEKDAY_LABELS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
] as const;

let weeklyUsageWriteChain: Promise<unknown> = Promise.resolve();

function withWeeklyUsageLock<T>(fn: () => Promise<T>): Promise<T> {
	const run = weeklyUsageWriteChain.then(fn, fn);
	weeklyUsageWriteChain = run.then(
		() => undefined,
		() => undefined,
	);
	return run;
}

function startOfLocalDay(date: Date) {
	const next = new Date(date);
	next.setHours(0, 0, 0, 0);
	return next;
}

export function getWeekStartSunday(date = new Date()) {
	const dayStart = startOfLocalDay(date);
	dayStart.setDate(dayStart.getDate() - dayStart.getDay());
	return dayStart;
}

export function parseUsageDay(day: string): Date | null {
	const [dayPart, monthPart, yearPart] = day.split("/");
	const dayNum = Number(dayPart);
	const monthNum = Number(monthPart);
	const yearNum = Number(yearPart);

	if (
		!Number.isFinite(dayNum) ||
		!Number.isFinite(monthNum) ||
		!Number.isFinite(yearNum)
	) {
		return null;
	}

	return startOfLocalDay(new Date(yearNum, monthNum - 1, dayNum));
}

export function getWeekDayKeys(weekStart: string): string[] {
	const start = parseUsageDay(weekStart);

	if (!start) {
		return [];
	}

	return Array.from({ length: 7 }, (_, index) => {
		const day = new Date(start);
		day.setDate(start.getDate() + index);
		return formatUsageDay(day);
	});
}

export function createEmptyWeeklyUsage(date = new Date()): WeeklyUsageState {
	const weekStart = formatUsageDay(getWeekStartSunday(date));
	const days: Record<string, Record<string, number>> = {};

	for (const day of getWeekDayKeys(weekStart)) {
		days[day] = {};
	}

	return {
		weekStart,
		days,
		siteNames: {},
	};
}

export function ensureCurrentWeek(
	state: WeeklyUsageState | null,
	now = new Date(),
): WeeklyUsageState {
	const currentWeekStart = formatUsageDay(getWeekStartSunday(now));

	if (!state || state.weekStart !== currentWeekStart) {
		return createEmptyWeeklyUsage(now);
	}

	const days = { ...state.days };

	for (const day of getWeekDayKeys(currentWeekStart)) {
		days[day] ??= {};
	}

	return {
		weekStart: currentWeekStart,
		days,
		siteNames: { ...state.siteNames },
	};
}

export function addWeeklyUsage(
	state: WeeklyUsageState,
	options: {
		siteId: SiteId;
		siteName: string;
		day: string;
		seconds: number;
	},
): WeeklyUsageState {
	if (options.seconds <= 0) {
		return state;
	}

	const next = ensureCurrentWeek(state);
	const dayBucket = { ...(next.days[options.day] ?? {}) };
	dayBucket[options.siteId] =
		(dayBucket[options.siteId] ?? 0) + Math.floor(options.seconds);

	return {
		...next,
		days: {
			...next.days,
			[options.day]: dayBucket,
		},
		siteNames: {
			...next.siteNames,
			[options.siteId]: options.siteName,
		},
	};
}

export async function loadWeeklyUsageState(): Promise<WeeklyUsageState> {
	if (typeof chrome === "undefined" || !chrome.storage?.local?.get) {
		return createEmptyWeeklyUsage();
	}

	const result = await chrome.storage.local.get(WEEKLY_USAGE_KEY);
	const raw = result[WEEKLY_USAGE_KEY] as WeeklyUsageState | undefined;

	if (!raw || typeof raw !== "object") {
		return createEmptyWeeklyUsage();
	}

	return ensureCurrentWeek({
		weekStart: raw.weekStart,
		days: raw.days ?? {},
		siteNames: raw.siteNames ?? {},
	});
}

export async function saveWeeklyUsageState(
	state: WeeklyUsageState,
): Promise<void> {
	if (typeof chrome === "undefined" || !chrome.storage?.local?.set) {
		return;
	}

	await chrome.storage.local.set({
		[WEEKLY_USAGE_KEY]: state,
	});
}

export async function recordWeeklyUsage(options: {
	siteId: SiteId;
	siteName: string;
	seconds: number;
	day?: string;
	now?: Date;
}): Promise<WeeklyUsageState> {
	return withWeeklyUsageLock(async () => {
		const now = options.now ?? new Date();
		const day = options.day ?? formatUsageDay(now);
		const current = await loadWeeklyUsageState();
		const next = addWeeklyUsage(ensureCurrentWeek(current, now), {
			siteId: options.siteId,
			siteName: options.siteName,
			day,
			seconds: options.seconds,
		});
		await saveWeeklyUsageState(next);
		return next;
	});
}

export function getDayTotalSeconds(
	state: WeeklyUsageState,
	day: string,
	siteIds?: SiteId[],
) {
	const bucket = state.days[day] ?? {};

	if (!siteIds) {
		return Object.values(bucket).reduce((sum, seconds) => sum + seconds, 0);
	}

	return siteIds.reduce((sum, siteId) => sum + (bucket[siteId] ?? 0), 0);
}

/** Dev/preview helper: fill the current week with varied per-site usage. */
export function buildMockWeeklyUsage(
	sites: Array<{ id: SiteId; name: string }>,
	now = new Date(),
): WeeklyUsageState {
	const empty = createEmptyWeeklyUsage(now);
	const dayKeys = getWeekDayKeys(empty.weekStart);
	const days: Record<string, Record<string, number>> = {};
	const siteNames: Record<string, string> = {};

	for (const site of sites) {
		siteNames[site.id] = site.name;
	}

	for (const [dayIndex, dayKey] of dayKeys.entries()) {
		const dayBucket: Record<string, number> = {};

		for (const [siteIndex, site] of sites.entries()) {
			// Stable-looking variety across the week without randomness.
			const minutes =
				4 + ((dayIndex * 3 + siteIndex * 5) % 12) + (siteIndex % 3);
			dayBucket[site.id] = minutes * 60;
		}

		days[dayKey] = dayBucket;
	}

	return {
		weekStart: empty.weekStart,
		days,
		siteNames,
	};
}

export async function seedMockWeeklyUsage(
	sites: Array<{ id: SiteId; name: string }>,
): Promise<WeeklyUsageState> {
	return withWeeklyUsageLock(async () => {
		const next = buildMockWeeklyUsage(sites);
		await saveWeeklyUsageState(next);
		return next;
	});
}
