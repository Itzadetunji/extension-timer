export async function getCurrentTabHostUrl(): Promise<string> {
	if (typeof chrome !== "undefined" && chrome.tabs?.query) {
		const [tab] = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});

		return tab?.url ?? "";
	}

	if (typeof window !== "undefined") {
		return window.location.host;
	}

	return "";
}

export function isTrackableUrl(url: string) {
	if (!url) {
		return false;
	}

	try {
		const normalized = url.includes("://") ? url : `https://${url}`;
		const { protocol } = new URL(normalized);
		return protocol === "http:" || protocol === "https:";
	} catch {
		return false;
	}
}
