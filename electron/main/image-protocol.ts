import { pathToFileURL } from "node:url";
import { net, protocol } from "electron";
import { IMAGE_URL_SCHEME } from "../preload/api";
import { resolveImageUrl } from "./images";
import { getImagesDir } from "./paths";

// 개발(localhost)과 배포(file://) 모두에서 같은 주소로 이미지를 보여 주려고 전용 프로토콜을 씁니다
// app 이 준비되기 전에 등록해야 합니다
export function registerImageScheme(): void {
	protocol.registerSchemesAsPrivileged([
		{
			scheme: IMAGE_URL_SCHEME,
			privileges: { standard: true, secure: true, supportFetchAPI: true },
		},
	]);
}

export function handleImageProtocol(): void {
	protocol.handle(IMAGE_URL_SCHEME, async (request) => {
		const filePath = resolveImageUrl(getImagesDir(), request.url);
		if (!filePath) return new Response(null, { status: 404 });
		try {
			return await net.fetch(pathToFileURL(filePath).toString());
		} catch {
			return new Response(null, { status: 404 });
		}
	});
}
