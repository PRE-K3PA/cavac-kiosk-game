import { useEffect, useEffectEvent } from "react";

type IdleTimeoutOptions = {
	isEnabled: boolean;
	idleSeconds: number;
	onTimeout: () => void;
};

/**
 * 화면에 있는 동안 idleSeconds 초 동안 터치가 없으면 onTimeout 을 부릅니다. 터치하면 처음부터 다시 셉니다.
 * 자리를 떠난 관람객의 화면을 다음 관람객이 이어받지 않도록 대기 화면으로 돌려보내는 데 씁니다
 */
export function useIdleTimeout({ isEnabled, idleSeconds, onTimeout }: IdleTimeoutOptions) {
	const handleTimeout = useEffectEvent(onTimeout);

	useEffect(() => {
		if (!isEnabled) return;
		const delayMs = idleSeconds * 1000;
		let timer = setTimeout(handleTimeout, delayMs);
		function restart() {
			clearTimeout(timer);
			timer = setTimeout(handleTimeout, delayMs);
		}
		// 화면 안의 요소가 이벤트 전파를 막아도 다시 세도록 캡처 단계에서 받습니다
		window.addEventListener("pointerdown", restart, { capture: true });
		return () => {
			clearTimeout(timer);
			window.removeEventListener("pointerdown", restart, { capture: true });
		};
	}, [isEnabled, idleSeconds]);
}
