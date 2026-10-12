import { cn } from "@/utils/cn";

type IconProps = {
	src: string;
	className?: string;
};

export default function Icon({ src, className }: IconProps) {
	return (
		<span
			aria-hidden="true"
			className={cn("inline-block size-6 shrink-0 bg-current", className)}
			style={{
				// 빌드하면 작은 SVG 는 작은따옴표가 든 data URI 로 들어가서, 따옴표 없이는 값이 버려진다
				maskImage: `url("${src}")`,
				maskSize: "100% 100%",
				maskRepeat: "no-repeat",
			}}
		/>
	);
}
