import AddButton from "@/components/admin/AddButton";
import Button from "@/components/admin/Button";
import EmptyState from "@/components/admin/EmptyState";
import ModalFrame from "@/components/admin/ModalFrame";
import ModalHeader from "@/components/admin/ModalHeader";
import SpeciesCard from "@/components/admin/SpeciesCard";
import type { Species } from "@/types/data";
import { cn } from "@/utils/cn";

const ORIENTATION = {
	landscape: { frame: "w-267", listHeight: "h-135", columns: "grid-cols-4", cardSize: "compact" },
	portrait: { frame: "w-180", listHeight: "h-300", columns: "grid-cols-2", cardSize: "large" },
} as const;

type SpeciesItem = Pick<Species, "id" | "name"> & {
	imageSrc: string;
};

type SpeciesManagerModalProps = {
	orientation: keyof typeof ORIENTATION;
	species: readonly SpeciesItem[];
	onAddClick?: () => void;
	onEditClick?: (speciesId: string) => void;
	onDeleteClick?: (speciesId: string) => void;
	onCloseClick?: () => void;
	className?: string;
};

export default function SpeciesManagerModal({
	orientation,
	species,
	onAddClick,
	onEditClick,
	onDeleteClick,
	onCloseClick,
	className,
}: SpeciesManagerModalProps) {
	const layout = ORIENTATION[orientation];

	function renderCard(item: SpeciesItem) {
		return (
			<SpeciesCard
				key={item.id}
				size={layout.cardSize}
				name={item.name}
				imageSrc={item.imageSrc}
				onEditClick={() => onEditClick?.(item.id)}
				onDeleteClick={() => onDeleteClick?.(item.id)}
			/>
		);
	}

	return (
		<ModalFrame className={cn(layout.frame, className)}>
			<ModalHeader title="축종 관리" subtitle="메인 화면 동물로 쓸 축종을 추가·수정·삭제합니다." />
			{species.length === 0 ? (
				<div className={cn("w-full p-4", layout.listHeight)}>
					<EmptyState
						title="등록된 축종이 없습니다"
						description="축종 추가로 메인 화면에 쓸 동물을 등록해 주세요."
					/>
				</div>
			) : (
				/* 다음 줄이 반쯤 보이는 것으로 스크롤을 알립니다. 스크롤바가 생기면 고정 폭 카드 열(가로 4열·세로 2열)이 넘칩니다 */
				<div
					className={cn(
						"grid w-full content-start gap-4 overflow-y-auto [scrollbar-width:none]",
						layout.listHeight,
						layout.columns,
					)}>
					{species.map(renderCard)}
				</div>
			)}
			<AddButton label="축종 추가" className="w-full" onClick={onAddClick} />
			<div className="flex w-full justify-end">
				<Button variant="secondary" label="닫기" onClick={onCloseClick} />
			</div>
		</ModalFrame>
	);
}
