import type { AntigenLabel } from "@/components/vaccine/antigen";
import { antigenKey } from "@/data/rules";
import type { AntigenColors } from "@/features/vaccine-game/antigenColors";
import { ANTIGEN_COLOR_KEYS, type Antigen } from "@/types/data";

export function toAntigenLabel(antigen: Antigen, colors: AntigenColors): AntigenLabel {
	return {
		abbr: antigen.abbr,
		subtype: antigen.subtype,
		pathogenType: antigen.pathogenType,
		color: colors[antigenKey(antigen)] ?? ANTIGEN_COLOR_KEYS[0],
	};
}
