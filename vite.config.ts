import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";

export default defineConfig({
	base: "./",
	resolve: {
		alias: { "@": path.resolve(import.meta.dirname, "src") },
	},
	plugins: [
		react(),
		tailwindcss(),
		electron({
			main: {
				entry: "electron/main/main.ts",
				vite: { build: { outDir: "dist-electron/main" } },
			},
			preload: {
				input: "electron/preload/preload.ts",
				vite: { build: { outDir: "dist-electron/preload" } },
			},
		}),
	],
	build: {
		outDir: "dist",
	},
});
