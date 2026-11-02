import { useBgm } from "@/hooks/useBgm";
import HomeTemplate, { type HomeScreenProps } from "@/pages/home/HomeTemplate";
import { useCanStart } from "@/pages/home/useCanStart";
import { VACCINE_HOME } from "@/pages/vaccine/vaccineHomeContent";
import { BGM_NAMES } from "@/utils/soundEngine";

export default function VaccineHome(props: HomeScreenProps) {
	useBgm(BGM_NAMES.vaccineHome);
	const canStart = useCanStart("vaccine-game");
	return <HomeTemplate content={VACCINE_HOME} isStartDisabled={!canStart} {...props} />;
}
