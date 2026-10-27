import { useEffect, useState } from "react";

const LIMIT_NOTICE_MS = 3000;

/**
 * 한도만큼 켠 상태에서 더 켜려 할 때 3초 보여 주는 안내의 표시 여부입니다.
 * 카드 제품 목록과 백신 목록이 함께 씁니다 (Q21·22, 10차 회의).
 * 백신 목록은 마지막 고정 안 된 항원을 고정하려 할 때의 안내에도 씁니다
 */
export function useLimitNotice() {
	// 더 켜려 할 때마다 값을 바꿔 안내 줄의 표시 시간을 처음부터 다시 셉니다
	const [noticeId, setNoticeId] = useState<number | null>(null);

	function showLimitNotice() {
		setNoticeId((id) => (id ?? 0) + 1);
	}

	function hideLimitNotice() {
		setNoticeId(null);
	}

	function hideLimitNoticeLater() {
		if (noticeId === null) return;

		function clearNotice() {
			setNoticeId(null);
		}

		const timer = setTimeout(clearNotice, LIMIT_NOTICE_MS);
		return function cancelHide() {
			clearTimeout(timer);
		};
	}

	useEffect(hideLimitNoticeLater, [noticeId]);

	return { isLimitNoticeShown: noticeId !== null, showLimitNotice, hideLimitNotice };
}
