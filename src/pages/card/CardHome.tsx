import { useBgm } from "@/hooks/useBgm";
import { CARD_HOME } from "@/pages/card/cardHomeContent";
import HomeTemplate, { type HomeScreenProps } from "@/pages/home/HomeTemplate";
import { useCanStart } from "@/pages/home/useCanStart";
import { BGM_NAMES } from "@/utils/soundEngine";

export default function CardHome(props: HomeScreenProps) {
	useBgm(BGM_NAMES.cardHome);
	const canStart = useCanStart("card-game");
	return (
		<HomeTemplate
			content={CARD_HOME}
			portraitAlign="start"
			isStartDisabled={!canStart}
			{...props}
		/>
	);
}
