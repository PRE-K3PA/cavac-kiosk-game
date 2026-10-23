import { useBgm } from "@/hooks/useBgm";
import { CARD_HOME } from "@/pages/card/cardHomeContent";
import HomeTemplate, { type HomeScreenProps } from "@/pages/home/HomeTemplate";
import { BGM_NAMES } from "@/utils/soundEngine";

export default function CardHome(props: HomeScreenProps) {
	useBgm(BGM_NAMES.cardHome);
	return <HomeTemplate content={CARD_HOME} portraitAlign="start" {...props} />;
}
