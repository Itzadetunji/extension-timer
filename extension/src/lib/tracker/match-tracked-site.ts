import { resolveSiteFromUrl } from "@/lib/sites/resolve-site-from-url";
import type { TrackedSite } from "@/types/tracker";

function getSiteHostname(url: string) {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return null;
	}
}

export function findTrackedSiteByUrl(
	sites: TrackedSite[],
	url: string,
): TrackedSite | null {
	if (!url.startsWith("http://") && !url.startsWith("https://")) {
		return null;
	}

	const resolved = resolveSiteFromUrl(url);

	if (!resolved) {
		return null;
	}

	const byId = sites.find((site) => site.id === resolved.id);

	if (byId) {
		return byId;
	}

	const resolvedHost = resolved.url ? getSiteHostname(resolved.url) : null;

	if (!resolvedHost) {
		return null;
	}

	return (
		sites.find((site) => {
			if (!site.url) {
				return false;
			}

			return getSiteHostname(site.url) === resolvedHost;
		}) ?? null
	);
}
