import type { KnownSiteId, TrackedSite } from "@/types/tracker";

const HOSTNAME_MAP: Record<string, { id: KnownSiteId; name: string }> = {
	"youtube.com": { id: "youtube", name: "Youtube" },
	"youtu.be": { id: "youtube", name: "Youtube" },
	"tiktok.com": { id: "tiktok", name: "TikTok" },
	"instagram.com": { id: "instagram", name: "Instagram" },
	"x.com": { id: "x", name: "X" },
	"twitter.com": { id: "x", name: "X" },
	"linkedin.com": { id: "linkedin", name: "LinkedIn" },
};

export function normalizeUrlInput(input: string) {
	const trimmed = input.trim();

	if (!trimmed) {
		return "";
	}

	try {
		return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`)
			.href;
	} catch {
		return "";
	}
}

export function resolveSiteFromUrl(url: string): TrackedSite | null {
	const normalized = normalizeUrlInput(url);

	if (!normalized) {
		return null;
	}

	const { hostname } = new URL(normalized);
	const host = hostname.replace(/^www\./, "");
	const known = HOSTNAME_MAP[host];

	if (known) {
		return {
			id: known.id,
			name: known.name,
			url: normalized,
			remainingSeconds: 0,
			lastUpdatedAt: Date.now(),
			limitConfigured: false,
		};
	}

	return {
		id: `custom:${host}`,
		name: host,
		url: normalized,
		remainingSeconds: 0,
		lastUpdatedAt: Date.now(),
		limitConfigured: false,
	};
}

function getHostname(url: string) {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return null;
	}
}

export function isDuplicateSite(sites: TrackedSite[], site: TrackedSite) {
	const siteHost = site.url ? getHostname(site.url) : null;

	return sites.some((existing) => {
		if (existing.id === site.id) {
			return true;
		}

		if (!siteHost || !existing.url) {
			return false;
		}

		return getHostname(existing.url) === siteHost;
	});
}
