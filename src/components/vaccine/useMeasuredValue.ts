import { useEffect, useEffectEvent, useLayoutEffect, useState } from "react";

function useFontsLoadCount() {
	const [fontsLoadCount, setFontsLoadCount] = useState(0);

	useEffect(() => {
		const fonts = document.fonts;
		if (!fonts) return;
		let isActive = true;
		const handleFontsLoaded = () => {
			if (isActive) setFontsLoadCount((count) => count + 1);
		};
		fonts.addEventListener("loadingdone", handleFontsLoaded);
		fonts.ready.then(handleFontsLoaded);
		return () => {
			isActive = false;
			fonts.removeEventListener("loadingdone", handleFontsLoaded);
		};
	}, []);

	return fontsLoadCount;
}

/**
 * DOM 을 재서 얻은 값을 렌더에 쓴다. 측정 전이거나 inputKey 가 바뀌면 initialValue 를 쓴다.
 * measure 가 DOM 스타일을 바꿔 가며 잰다면 끝나기 전에 원래대로 되돌려야 한다.
 */
export function useMeasuredValue<T>(
	inputKey: string,
	initialValue: T,
	measure: () => T | undefined,
) {
	// 글꼴이 늦게 로드되면 글자 폭이 바뀌므로 다시 잰다.
	const key = `${inputKey}|${useFontsLoadCount()}`;
	const [measured, setMeasured] = useState<{ key: string; value: T }>();

	const measureFor = useEffectEvent((measureKey: string) => {
		const value = measure();
		if (value !== undefined) setMeasured({ key: measureKey, value });
	});

	useLayoutEffect(() => {
		measureFor(key);
	}, [key]);

	return measured?.key === key ? measured.value : initialValue;
}
