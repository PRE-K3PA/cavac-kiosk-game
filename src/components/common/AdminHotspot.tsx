import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";

type HotspotState = "default" | "holding";

type AdminHotspotProps = Omit<
	ComponentProps<"div">,
	"children" | "onPointerDown" | "onPointerUp" | "onPointerLeave" | "onPointerCancel"
> & {
	/** 이 시간(ms) 동안 누르고 있으면 손을 떼지 않아도 onActivate 를 부른다 */
	holdMs?: number;
	onActivate: () => void;
};

export default function AdminHotspot({
	holdMs = 1500,
	onActivate,
	className,
	...props
}: AdminHotspotProps) {
	const [state, setState] = useState<HotspotState>("default");
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const reset = () => {
		if (timer.current !== null) {
			clearTimeout(timer.current);
			timer.current = null;
		}
		setState("default");
	};

	useEffect(
		() => () => {
			if (timer.current !== null) clearTimeout(timer.current);
		},
		[],
	);

	const handlePointerDown = () => {
		reset();
		setState("holding");
		timer.current = setTimeout(() => {
			timer.current = null;
			setState("default");
			onActivate();
		}, holdMs);
	};

	return (
		<div
			data-state={state}
			className={cn("h-45 w-70 touch-none", className)}
			onPointerDown={handlePointerDown}
			onPointerUp={reset}
			onPointerLeave={reset}
			onPointerCancel={reset}
			{...props}
		/>
	);
}
