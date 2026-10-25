import bgmVaccineHome from "@/assets/sounds/bgmVaccineHome.mp3";
import HomeTemplate, { type HomeScreenProps } from "@/pages/home/HomeTemplate";
import { useCanStart } from "@/pages/home/useCanStart";
import { useBgm } from "@/pages/vaccine/useBgm";
import { VACCINE_HOME } from "@/pages/vaccine/vaccineHomeContent";

export default function VaccineHome(props: HomeScreenProps) {
	useBgm(bgmVaccineHome);
	const canStart = useCanStart("vaccine-game");
	return <HomeTemplate content={VACCINE_HOME} isStartDisabled={!canStart} {...props} />;
}
