import Button from "@/components/admin/Button";
import ImageField from "@/components/admin/ImageField";
import { LANGUAGE_OPTIONS, type LanguageOption } from "@/components/admin/languageLabel";
import ModalFrame from "@/components/admin/ModalFrame";
import ModalHeader from "@/components/admin/ModalHeader";
import MemoryCard from "@/components/card/MemoryCard";
import type { Language, Localized, ProductSlot } from "@/types/data";
import { cn } from "@/utils/cn";

const REQUIRED_NOTICE = "KR·EN 이미지가 모두 필요합니다.";

type LocalizedText = Partial<Localized<string>>;

type AddModeProps = {
	mode: "add";
};

type EditModeProps = {
	mode: "edit";
	onDeleteClick?: () => void;
};

type ProductModalProps = (AddModeProps | EditModeProps) &
	Pick<ProductSlot, "slot"> & {
		imageSrcs?: LocalizedText;
		imageErrorMessages?: LocalizedText;
		isConfirmDisabled?: boolean;
		onImageSelectClick?: (language: Language) => void;
		onImagePreviewClick?: (language: Language) => void;
		onCancelClick?: () => void;
		onConfirmClick?: () => void;
		className?: string;
	};

export default function ProductModal(props: ProductModalProps) {
	const {
		slot,
		imageSrcs = {},
		imageErrorMessages = {},
		isConfirmDisabled,
		onImageSelectClick,
		onImagePreviewClick,
		onCancelClick,
		onConfirmClick,
		className,
	} = props;
	const title = props.mode === "edit" ? "제품 수정" : "제품 등록";

	function renderLanguageRow(language: LanguageOption) {
		const imageSrc = imageSrcs[language.key];

		return (
			<div key={language.key} className="flex w-full gap-8">
				<div className="flex shrink-0 flex-col gap-2">
					<p className="typo-admin-body text-text-primary">카드 확인 ({language.label})</p>
					{/* 누를 수 없는 확인용 카드가 "눌린 버튼"으로 읽히지 않게 숨기고, 위 문구만 읽힙니다 */}
					<MemoryCard
						label={`카드 확인 (${language.label})`}
						state="front"
						productImage={imageSrc}
						aria-hidden
					/>
					<p className="typo-admin-caption text-text-secondary">관람객에게 보이는 카드 앞면</p>
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-2">
					<p className="typo-admin-body text-text-primary">제품 이미지 ({language.label}) *</p>
					<ImageField
						shape="square"
						imageSrc={imageSrc}
						errorMessage={imageErrorMessages[language.key]}
						onSelectClick={() => onImageSelectClick?.(language.key)}
						onPreviewClick={() => onImagePreviewClick?.(language.key)}
					/>
				</div>
			</div>
		);
	}

	return (
		<ModalFrame className={cn("w-180", className)}>
			<ModalHeader tone="card" title={title} subtitle={`${slot}번 칸 · ${REQUIRED_NOTICE}`} />
			{LANGUAGE_OPTIONS.map(renderLanguageRow)}
			<div className="flex w-full gap-3">
				{props.mode === "edit" && (
					<Button variant="danger" label="삭제" onClick={props.onDeleteClick} />
				)}
				<Button variant="secondary" label="취소" className="ml-auto" onClick={onCancelClick} />
				<Button label="확인" disabled={isConfirmDisabled} onClick={onConfirmClick} />
			</div>
		</ModalFrame>
	);
}
