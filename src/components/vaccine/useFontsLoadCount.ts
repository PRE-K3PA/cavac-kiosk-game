import { useEffect, useState } from "react";

export function useFontsLoadCount() {
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
