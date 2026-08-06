const OVERLAY_ID = "extension-timer-block-overlay";
const OVERLAY_Z_INDEX = 50000;
const POLL_INTERVAL_MS = 1000;

const MESSAGE = {
	GET_TAB_BLOCK_STATE: "GET_TAB_BLOCK_STATE",
	BLOCK_SITE: "BLOCK_SITE",
	UNBLOCK_SITE: "UNBLOCK_SITE",
} as const;

function isExtensionContextValid() {
	try {
		return Boolean(chrome?.runtime?.id);
	} catch {
		return false;
	}
}

function showBlockOverlay(siteName: string) {
	if (document.getElementById(OVERLAY_ID)) {
		return;
	}

	const mountTarget = document.body ?? document.documentElement;

	if (!mountTarget) {
		return;
	}

	const overlay = document.createElement("div");
	overlay.id = OVERLAY_ID;
	overlay.setAttribute("role", "dialog");
	overlay.setAttribute("aria-modal", "true");
	overlay.setAttribute("aria-label", "Time limit reached");

	overlay.style.setProperty("position", "fixed", "important");
	overlay.style.setProperty("inset", "0", "important");
	overlay.style.setProperty("z-index", String(OVERLAY_Z_INDEX), "important");
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

function hideBlockOverlay() {
	document.getElementById(OVERLAY_ID)?.remove();
}

function requestBlockState() {
	if (!isExtensionContextValid()) {
		hideBlockOverlay();
		return;
	}

	try {
		chrome.runtime.sendMessage(
			{ type: MESSAGE.GET_TAB_BLOCK_STATE },
			(response) => {
				if (chrome.runtime.lastError) {
					return;
				}

				if (response?.blocked && response.siteName) {
					showBlockOverlay(response.siteName);
					return;
				}

				hideBlockOverlay();
			},
		);
	} catch {
		hideBlockOverlay();
	}
}

function initBlockOverlay() {
	if (!isExtensionContextValid()) {
		return;
	}

	requestBlockState();
	window.setInterval(requestBlockState, POLL_INTERVAL_MS);
}

if (isExtensionContextValid()) {
	chrome.runtime.onMessage.addListener((message) => {
		if (message?.type === MESSAGE.BLOCK_SITE && message.siteName) {
			showBlockOverlay(message.siteName);
			return;
		}

		if (message?.type === MESSAGE.UNBLOCK_SITE) {
			hideBlockOverlay();
		}
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initBlockOverlay, {
		once: true,
	});
} else {
	initBlockOverlay();
}
