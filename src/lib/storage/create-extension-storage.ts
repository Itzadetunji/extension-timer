import type { StateStorage } from "zustand/middleware";

const localStorageAdapter: StateStorage = {
	getItem: (name) => {
		const value = localStorage.getItem(name);
		return value ?? null;
	},
	setItem: (name, value) => {
		localStorage.setItem(name, value);
	},
	removeItem: (name) => {
		localStorage.removeItem(name);
	},
};

const chromeStorageAdapter: StateStorage = {
	getItem: (name) =>
		new Promise((resolve) => {
			chrome.storage.local.get(name, (result) => {
				resolve(result[name] ?? null);
			});
		}),
	setItem: (name, value) =>
		new Promise<void>((resolve) => {
			chrome.storage.local.set({ [name]: value }, () => resolve());
		}),
	removeItem: (name) =>
		new Promise<void>((resolve) => {
			chrome.storage.local.remove(name, () => resolve());
		}),
};

function isExtensionContext() {
	if (typeof window === "undefined") {
		return false;
	}

	if (window.location.protocol === "chrome-extension:") {
		return true;
	}

	return (
		typeof chrome !== "undefined" &&
		typeof chrome.storage?.local?.get === "function" &&
		Boolean(chrome.runtime?.id)
	);
}

export function createExtensionStorage(): StateStorage {
	return isExtensionContext() ? chromeStorageAdapter : localStorageAdapter;
}

export { chromeStorageAdapter, localStorageAdapter };
