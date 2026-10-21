import HomeTemplate, { type HomeScreenProps } from "@/pages/home/HomeTemplate";
import { VACCINE_HOME } from "@/pages/vaccine/vaccineHomeContent";

export default function VaccineHome(props: HomeScreenProps) {
	return <HomeTemplate content={VACCINE_HOME} {...props} />;
}
