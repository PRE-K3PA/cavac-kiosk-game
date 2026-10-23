import HomeTemplate, { type HomeScreenProps } from "@/pages/home/HomeTemplate";
import { useCanStart } from "@/pages/home/useCanStart";
import { VACCINE_HOME } from "@/pages/vaccine/vaccineHomeContent";

export default function VaccineHome(props: HomeScreenProps) {
	const canStart = useCanStart("vaccine-game");
	return <HomeTemplate content={VACCINE_HOME} isStartDisabled={!canStart} {...props} />;
}
