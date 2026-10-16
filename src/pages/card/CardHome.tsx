import { useLanguage } from "@/hooks/useLanguage";
import { CARD_HOME } from "@/pages/card/cardHomeContent";
import HomeTemplate, { type HomeScreenProps } from "@/pages/home/HomeTemplate";

export default function CardHome(props: HomeScreenProps) {
	const { language, toggleLanguage } = useLanguage();
	return (
		<HomeTemplate
			content={CARD_HOME}
			portraitAlign="start"
			language={language}
			onToggleLanguage={toggleLanguage}
			{...props}
		/>
	);
}
