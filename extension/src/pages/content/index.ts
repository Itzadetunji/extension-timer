import { TRACKER_MESSAGE } from "@/lib/tracker/messages";

const OVERLAY_ID = "extension-timer-block-overlay";

function showBlockOverlay(siteName: string) {
	if (document.getElementById(OVERLAY_ID)) {
		return;
	}

	const overlay = document.createElement("div");
	overlay.id = OVERLAY_ID;
	overlay.setAttribute("role", "dialog");
	overlay.setAttribute("aria-modal", "true");
	overlay.setAttribute("aria-label", "Time limit reached");
	overlay.style.cssText = [
		"position:fixed",
		"inset:0",
		"z-index:2147483647",
		"background:#0a0a0a",
		"color:#ffffff",
		"display:flex",
		"align-items:center",
		"justify-content:center",
		"flex-direction:column",
		"gap:16px",
		"padding:24px",
		"text-align:center",
		"font-family:system-ui,-apple-system,sans-serif",
	].join(";");

	const title = document.createElement("h1");
	title.textContent = "Time's up";
	title.style.cssText = "margin:0;font-size:28px;font-weight:600";

	const description = document.createElement("p");
	description.textContent = `Your limit for ${siteName} has been reached. Update your time in the extension to continue.`;
	description.style.cssText =
		"margin:0;max-width:420px;opacity:0.75;line-height:1.5";

	overlay.append(title, description);
	document.documentElement.appendChild(overlay);
}

function hideBlockOverlay() {
	document.getElementById(OVERLAY_ID)?.remove();
}

function requestInitialBlockState() {
	if (!chrome?.runtime?.sendMessage) {
		return;
	}

	chrome.runtime.sendMessage(
		{ type: TRACKER_MESSAGE.GET_TAB_BLOCK_STATE },
		(response) => {
			if (response?.blocked && response.siteName) {
				showBlockOverlay(response.siteName);
			}
		},
	);
}

chrome.runtime.onMessage.addListener((message) => {
	if (message?.type === TRACKER_MESSAGE.BLOCK_SITE && message.siteName) {
		showBlockOverlay(message.siteName);
		return;
	}

	if (message?.type === TRACKER_MESSAGE.UNBLOCK_SITE) {
		hideBlockOverlay();
	}
});

requestInitialBlockState();
