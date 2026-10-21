import { CARD_HOME } from "@/pages/card/cardHomeContent";
import HomeTemplate, { type HomeScreenProps } from "@/pages/home/HomeTemplate";

export default function CardHome(props: HomeScreenProps) {
	return <HomeTemplate content={CARD_HOME} portraitAlign="start" {...props} />;
}
