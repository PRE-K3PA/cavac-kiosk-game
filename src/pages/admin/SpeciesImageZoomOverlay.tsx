import Button from "@/components/admin/Button";
import ModalFrame from "@/components/admin/ModalFrame";
import ModalHeader from "@/components/admin/ModalHeader";
import ModalOverlay from "@/components/admin/ModalOverlay";
import { cn } from "@/utils/cn";

type SpeciesImageZoomOverlayProps = {
	imageSrc: string;
	name: string;
	onClose: () => void;
};

export default function SpeciesImageZoomOverlay({
	imageSrc,
	name,
	onClose,
}: SpeciesImageZoomOverlayProps) {
	return (
		<ModalOverlay>
			<ModalFrame>
				<ModalHeader title="캐릭터 이미지" subtitle={name.trim() || undefined} />
				<div
					className={cn(
						"aspect-square w-full overflow-hidden rounded-2xl border-2 border-border-default",
						"bg-background-canvas p-6",
					)}>
					<img src={imageSrc} alt="" className="size-full object-contain" />
				</div>
				<div className="flex w-full justify-end">
					<Button label="닫기" onClick={onClose} />
				</div>
			</ModalFrame>
		</ModalOverlay>
	);
}
