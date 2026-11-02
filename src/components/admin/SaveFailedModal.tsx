import Button from "@/components/admin/Button";
import ModalFrame from "@/components/admin/ModalFrame";
import ModalHeader from "@/components/admin/ModalHeader";

const FAILURE_TEXT = {
	save: {
		title: "저장하지 못했습니다",
		subtitle:
			"설정 파일을 쓰는 중 문제가 생겼습니다. 바꾼 내용은 그대로 남아 있으니 다시 시도해 주세요.",
	},
	quit: {
		title: "프로그램을 종료하지 못했습니다",
		subtitle:
			"프로그램을 닫는 중 문제가 생겼습니다. 관리자 화면은 그대로 열려 있으니 다시 시도해 주세요.",
	},
} as const;

type SaveFailedModalProps = {
	type?: keyof typeof FAILURE_TEXT;
	onCloseClick?: () => void;
	onRetryClick?: () => void;
	className?: string;
};

export default function SaveFailedModal({
	type = "save",
	onCloseClick,
	onRetryClick,
	className,
}: SaveFailedModalProps) {
	const { title, subtitle } = FAILURE_TEXT[type];

	return (
		<ModalFrame className={className}>
			<ModalHeader tone="danger" title={title} subtitle={subtitle} />
			<div className="flex w-full justify-end gap-3">
				<Button variant="secondary" label="닫기" onClick={onCloseClick} />
				<Button variant="primary" label="다시 시도" onClick={onRetryClick} />
			</div>
		</ModalFrame>
	);
}
