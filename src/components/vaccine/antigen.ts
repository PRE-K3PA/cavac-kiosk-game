import type { Antigen, AntigenColorKey } from "@/types/data";

export const ANTIGEN_COLOR_CLASS: Record<AntigenColorKey, string> = {
	"01": "bg-antigen-01",
	"02": "bg-antigen-02",
	"03": "bg-antigen-03",
	"04": "bg-antigen-04",
	"05": "bg-antigen-05",
	"06": "bg-antigen-06",
	"07": "bg-antigen-07",
	"08": "bg-antigen-08",
	"09": "bg-antigen-09",
	"10": "bg-antigen-10",
	"11": "bg-antigen-11",
	"12": "bg-antigen-12",
	"13": "bg-antigen-13",
	"14": "bg-antigen-14",
	"15": "bg-antigen-15",
	"16": "bg-antigen-16",
	"17": "bg-antigen-17",
	"18": "bg-antigen-18",
	"19": "bg-antigen-19",
	"20": "bg-antigen-20",
	"21": "bg-antigen-21",
	"22": "bg-antigen-22",
	"23": "bg-antigen-23",
	"24": "bg-antigen-24",
	"25": "bg-antigen-25",
};

export type AntigenLabel = Pick<Antigen, "abbr" | "subtype" | "pathogenType"> & {
	color: AntigenColorKey;
};

// 한글 글꼴에는 이탤릭이 없어 브라우저 합성 대신 기울기를 직접 준다.
export const BACTERIA_ABBR_CLASS = "-skew-x-12";
// 기울인 글자 끝이 밀려나는 만큼의 여백이라 각도를 바꾸면 함께 맞춘다.
export const BACTERIA_ABBR_INSET_CLASS = "px-[0.12em]";

export function splitAntigenAbbr(abbr: string) {
	return abbr
		.split("/")
		.map((part) => part.trim())
		.filter(Boolean);
}
