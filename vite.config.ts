import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import electron from "vite-plugin-electron/simple";
import { findMasterPinHashError } from "./electron/main/pin-hash.ts";

// 공개 저장소에 남지 않도록 마스터 PIN 해시는 빌드할 때 .env.local 이나 환경 변수로만 넣습니다
// 배포 패키징(bun run dist)은 release 모드로 빌드해서, 해시가 없으면 실패합니다
function readMasterPinHash(mode: string): string {
	const masterPinHash = loadEnv(mode, import.meta.dirname, "MASTER_").MASTER_PIN_HASH ?? "";
	const error = findMasterPinHashError(masterPinHash, mode);
	if (error) throw new Error(error);
	if (masterPinHash === "" && mode === "production") {
		console.warn(
			"\n[주의] MASTER_PIN_HASH 가 없어 마스터 PIN 이 꺼진 채로 빌드됩니다. 배포용이면 .env.local 을 확인하세요\n",
		);
	}
	return masterPinHash;
}

export default defineConfig(({ mode }) => ({
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
				vite: {
					define: { __MASTER_PIN_HASH__: JSON.stringify(readMasterPinHash(mode)) },
					build: { outDir: "dist-electron/main" },
				},
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
}));
