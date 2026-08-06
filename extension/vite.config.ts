import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import hotReloadExtension from "hot-reload-extension-vite";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const isUiDev = process.env.UI_DEV === "true";

export default defineConfig(() => {
	return {
		base: "./",
		plugins: [
			react(),
			tailwindcss(),
			tsconfigPaths(),
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
					open: "/src/pages/popup/index.html",
				}
			: undefined,
		build: {
			rollupOptions: {
				input: {
					popup: resolve(__dirname, "src/pages/popup/index.html"),
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
