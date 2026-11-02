import Button from "@/components/admin/Button";
import ModalFrame from "@/components/admin/ModalFrame";
import ModalHeader from "@/components/admin/ModalHeader";

type SavedModalProps = {
	onConfirmClick?: () => void;
	className?: string;
};

export default function SavedModal({ onConfirmClick, className }: SavedModalProps) {
	return (
		<ModalFrame className={className}>
			<ModalHeader
				tone="success"
				title="설정이 저장되었습니다"
				subtitle="변경한 관리자 설정이 키오스크에 적용됩니다."
			/>
			<div className="flex w-full justify-end">
				<Button variant="primary" label="확인" onClick={onConfirmClick} />
			</div>
		</ModalFrame>
	);
}
