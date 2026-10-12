import type { ComponentProps } from "react";
// TODO: icChevron.svg 가 브랜치 병합된 뒤 아래 import 를 되살린다
// import icChevron from "@/assets/icons/icChevron.svg";
import { cn } from "@/utils/cn";

type CarouselArrowProps = Omit<ComponentProps<"button">, "children" | "aria-label"> & {
	label: string;
	direction?: "prev" | "next";
};

export function CarouselArrow({
	label,
	direction = "prev",
	className,
	...props
}: CarouselArrowProps) {
	return (
		<button
			type="button"
			aria-label={label}
			className={cn(
				"flex size-[4rem] cursor-pointer items-center justify-center rounded-[2rem] border-3",
				"border-border-default bg-background-surface shadow-md",
				className,
			)}
			{...props}>
			{/* 아이콘은 모양(알파)만 쓰고 색은 토큰으로 칠한다.
			    원본은 아래를 향한다 */}
			<span
				aria-hidden="true"
				className={cn(
					"size-[2.25rem] shrink-0 bg-border-strong",
					direction === "next" ? "-rotate-90" : "rotate-90",
				)}
				// TODO: icChevron.svg 병합 후 아래 mask 스타일을 되살린다
				// style={{
				// 	maskImage: `url("${icChevron}")`,
				// 	maskSize: "contain",
				// 	maskRepeat: "no-repeat",
				// 	maskPosition: "center",
				// }}
			/>
		</button>
	);
}
