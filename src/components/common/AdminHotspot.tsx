import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";

type HotspotState = "default" | "holding" | "armed";

type AdminHotspotProps = Omit<
	ComponentProps<"div">,
	"children" | "onPointerDown" | "onPointerUp" | "onPointerLeave" | "onPointerCancel"
> & {
	/** 이 시간(ms) 이상 누른 뒤 손을 떼면 onActivate 를 부른다 */
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
	const isArmed = useRef(false);

	const reset = () => {
		if (timer.current !== null) {
			clearTimeout(timer.current);
			timer.current = null;
		}
		isArmed.current = false;
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
			isArmed.current = true;
			setState("armed");
		}, holdMs);
	};

	const handlePointerUp = () => {
		const wasArmed = isArmed.current;
		reset();
		if (wasArmed) onActivate();
	};

	return (
		<div
			data-state={state}
			className={cn("h-45 w-70 touch-none", className)}
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
			onPointerLeave={reset}
			onPointerCancel={reset}
			{...props}
		/>
	);
}
