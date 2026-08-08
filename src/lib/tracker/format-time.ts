export function formatRemainingSeconds(totalSeconds: number) {
	const seconds = Math.max(0, Math.floor(totalSeconds));
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = seconds % 60;

	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
	}

	return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function formatAddedSeconds(totalSeconds: number) {
	const seconds = Math.max(0, Math.floor(totalSeconds));

	if (seconds < 60) {
		return seconds === 1 ? "1 sec" : `${seconds} secs`;
	}

	const minutes = Math.floor(seconds / 60);
	const remainder = seconds % 60;

	if (remainder === 0) {
		return minutes === 1 ? "1 min" : `${minutes} mins`;
	}

	return `${minutes}m ${remainder}s`;
}

export function formatDeltaSeconds(totalSeconds: number) {
	const prefix = totalSeconds >= 0 ? "+" : "-";
	return `${prefix}${formatAddedSeconds(Math.abs(totalSeconds))}`;
}

export function formatLogSummary(totalDelta: number) {
	if (totalDelta === 0) {
		return "no net change";
	}

	return formatDeltaSeconds(totalDelta);
}

/** e.g. "2h 15m", "45m", "0m" */
export function formatHoursAndMinutes(totalSeconds: number) {
	const seconds = Math.max(0, Math.floor(totalSeconds));
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);

	if (hours > 0 && minutes > 0) {
		return `${hours}h ${minutes}m`;
	}

	if (hours > 0) {
		return `${hours}h`;
	}

	return `${minutes}m`;
}
