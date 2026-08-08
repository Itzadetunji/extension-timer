export const BLOCK_OVERLAY_ID = "extension-timer-block-overlay";
export const BLOCK_OVERLAY_Z_INDEX = 50000;

export const BLOCK_OVERLAY_MESSAGE = {
	GET_TAB_BLOCK_STATE: "GET_TAB_BLOCK_STATE",
	BLOCK_SITE: "BLOCK_SITE",
	UNBLOCK_SITE: "UNBLOCK_SITE",
} as const;

/**
 * Self-contained overlay injection for chrome.scripting.executeScript.
 * Must not reference module scope — only passed args and globals.
 */
export function injectBlockOverlay(siteName: string) {
	const overlayId = "extension-timer-block-overlay";
	const zIndex = 50000;

	if (document.getElementById(overlayId)) {
		return;
	}

	const mountTarget = document.body ?? document.documentElement;
	const overlay = document.createElement("div");
	overlay.id = overlayId;
	overlay.setAttribute("role", "dialog");
	overlay.setAttribute("aria-modal", "true");
	overlay.setAttribute("aria-label", "Time limit reached");

	overlay.style.setProperty("position", "fixed", "important");
	overlay.style.setProperty("inset", "0", "important");
	overlay.style.setProperty("z-index", String(zIndex), "important");
	overlay.style.setProperty("background", "#000000", "important");
	overlay.style.setProperty("color", "#ffffff", "important");
	overlay.style.setProperty("display", "flex", "important");
	overlay.style.setProperty("align-items", "center", "important");
	overlay.style.setProperty("justify-content", "center", "important");
	overlay.style.setProperty("flex-direction", "column", "important");
	overlay.style.setProperty("gap", "16px", "important");
	overlay.style.setProperty("padding", "24px", "important");
	overlay.style.setProperty("text-align", "center", "important");
	overlay.style.setProperty(
		"font-family",
		"system-ui, -apple-system, sans-serif",
		"important",
	);
	overlay.style.setProperty("pointer-events", "auto", "important");

	const title = document.createElement("h1");
	title.textContent = "Time's up";
	title.style.setProperty("margin", "0", "important");
	title.style.setProperty("font-size", "28px", "important");
	title.style.setProperty("font-weight", "600", "important");

	const description = document.createElement("p");
	description.textContent = `Your limit for ${siteName} has been reached. Update your time in the extension to continue.`;
	description.style.setProperty("margin", "0", "important");
	description.style.setProperty("max-width", "420px", "important");
	description.style.setProperty("opacity", "0.75", "important");
	description.style.setProperty("line-height", "1.5", "important");

	overlay.append(title, description);
	mountTarget.appendChild(overlay);
}

export function removeBlockOverlay() {
	document.getElementById("extension-timer-block-overlay")?.remove();
}
