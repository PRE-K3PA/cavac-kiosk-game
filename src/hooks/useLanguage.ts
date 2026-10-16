import { useState } from "react";
import type { Localized } from "@/types/data";

export type Language = keyof Localized<unknown>;

export function useLanguage() {
	const [language, setLanguage] = useState<Language>("ko");

	function toggleLanguage() {
		setLanguage((current) => (current === "ko" ? "en" : "ko"));
	}

	return { language, toggleLanguage };
}
