import { useLanguage } from "@/hooks/useLanguage";
import HomeTemplate, { type HomeTemplateProps } from "@/pages/home/HomeTemplate";
import { VACCINE_HOME } from "@/pages/vaccine/01_vaccineHomeContent";

export default function VaccineHome(props: HomeTemplateProps) {
	const { language, toggleLanguage } = useLanguage();
	return (
		<HomeTemplate
			content={VACCINE_HOME}
			portraitAlign="center"
			language={language}
			onToggleLanguage={toggleLanguage}
			{...props}
		/>
	);
}
