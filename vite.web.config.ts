import { resolve } from "node:path";
import type { Connect, Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const rootDir = import.meta.dirname;

function privacyRoute(): Plugin {
	const rewrite: Connect.NextHandleFunction = (req, _res, next) => {
		if (req.url === "/privacy" || req.url?.startsWith("/privacy?")) {
			req.url = req.url.replace("/privacy", "/privacy/");
		}
		next();
	};

	return {
		name: "privacy-route",
		configureServer(server) {
			server.middlewares.use(rewrite);
		},
		configurePreviewServer(server) {
			server.middlewares.use(rewrite);
		},
	};
}

export default defineConfig({
	root: resolve(rootDir, "web"),
	base: "/",
	appType: "mpa",
	publicDir: resolve(rootDir, "public"),
	plugins: [privacyRoute(), react(), tailwindcss(), tsconfigPaths()],
	resolve: {
		alias: {
			"@": resolve(rootDir, "src"),
		},
	},
	build: {
		outDir: resolve(rootDir, "web-dist"),
		emptyOutDir: true,
		rollupOptions: {
			input: {
				main: resolve(rootDir, "web/index.html"),
				privacy: resolve(rootDir, "web/privacy/index.html"),
			},
		},
	},
});
