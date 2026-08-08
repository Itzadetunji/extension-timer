import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import hotReloadExtension from "hot-reload-extension-vite";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tsconfigPaths from "vite-tsconfig-paths";

const isUiDev = process.env.UI_DEV === "true";
const isStoreLanding = process.env.STORE_LANDING === "true";

export default defineConfig(({ mode }) => {
	return {
		base: "./",
		plugins: [
			react(),
			tailwindcss(),
			tsconfigPaths(),
			mode === "development" &&
				!isUiDev &&
				hotReloadExtension({
					log: true,
					backgroundPath: "src/pages/background/index.ts",
				}),
			!isUiDev &&
				viteStaticCopy({
					targets: [
						{
							src: "manifest.json",
							dest: ".",
						},
						{
							src: "src/style.css",
							dest: "./",
						},
					],
				}),
		].filter(Boolean),
		server: isUiDev
			? {
					open: isStoreLanding
						? "/src/pages/store-landing/index.html"
						: "/src/pages/popup/index.html",
				}
			: undefined,
		build: {
			rollupOptions: {
				input: {
					popup: resolve(__dirname, "src/pages/popup/index.html"),
					weekly: resolve(__dirname, "src/pages/weekly/index.html"),
					content: resolve(__dirname, "src/pages/content/index.ts"),
					background: resolve(__dirname, "src/pages/background/index.ts"),
				},
				output: {
					dir: "dist",
					entryFileNames: "src/[name]/index.js",
					chunkFileNames: "assets/js/[name].js",
				},
			},
		},
	};
});
