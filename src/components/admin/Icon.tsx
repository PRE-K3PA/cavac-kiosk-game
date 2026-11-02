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
				maskImage: `url("${src}")`,
				maskSize: "100% 100%",
				maskRepeat: "no-repeat",
			}}
		/>
	);
}
