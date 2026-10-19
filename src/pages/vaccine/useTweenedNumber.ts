import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** target 이 바뀌면 지금 값에서 target 까지 duration 초 동안 부드럽게 바꾼 값을 돌려준다 */
export function useTweenedNumber(target: number, duration: number, initialValue = target): number {
	const shouldReduceMotion = useReducedMotion();
	const [value, setValue] = useState(initialValue);
	const valueRef = useRef(initialValue);

	useEffect(() => {
		if (shouldReduceMotion) {
			valueRef.current = target;
			setValue(target);
			return;
		}
		const controls = animate(valueRef.current, target, {
			duration,
			ease: "easeOut",
			onUpdate: (latest) => {
				valueRef.current = latest;
				setValue(latest);
			},
		});
		return () => controls.stop();
	}, [target, duration, shouldReduceMotion]);

	return value;
}
