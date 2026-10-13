export const ANTIGEN_COLOR_CLASS = {
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
} as const;

export type AntigenColor = keyof typeof ANTIGEN_COLOR_CLASS;

export type AntigenLabel = {
	abbr: string;
	subtype?: string;
	color: AntigenColor;
};

export function getAntigenKey({ abbr, subtype }: Pick<AntigenLabel, "abbr" | "subtype">) {
	return `${abbr}-${subtype ?? ""}`;
}

export function splitAntigenAbbr(abbr: string) {
	return abbr
		.split("/")
		.map((part) => part.trim())
		.filter(Boolean);
}
