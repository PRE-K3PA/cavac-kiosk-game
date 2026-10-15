import { useLanguage } from "@/hooks/useLanguage";
import HomeTemplate, { type HomeScreenProps } from "@/pages/home/HomeTemplate";
import { VACCINE_HOME } from "@/pages/vaccine/vaccineHomeContent";

export default function VaccineHome(props: HomeScreenProps) {
	const { language, toggleLanguage } = useLanguage();
	return (
		<HomeTemplate
			content={VACCINE_HOME}
			language={language}
			onToggleLanguage={toggleLanguage}
			{...props}
		/>
	);
}
