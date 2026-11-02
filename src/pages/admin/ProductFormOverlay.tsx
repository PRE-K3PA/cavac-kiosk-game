import { useState } from "react";
import ImagePreviewModal from "@/components/admin/ImagePreviewModal";
import { LANGUAGE_LABEL } from "@/components/admin/languageLabel";
import ModalOverlay from "@/components/admin/ModalOverlay";
import { formatOrientationBasis } from "@/components/admin/orientationLabel";
import ProductModal from "@/components/admin/ProductModal";
import MemoryCard from "@/components/card/MemoryCard";
import ProductResultCard from "@/components/card/ProductResultCard";
import { toCompleteLocalized, toImageSrcs } from "@/features/admin/localizedDraft";
import {
	findRegisterSlot,
	type ProductImageDraft,
	registerProduct,
	replaceProductImage,
} from "@/features/admin/productSlots";
import { useSettingsDraft } from "@/features/admin/settingsDraft";
import { useImageSelect } from "@/features/admin/useImageSelect";
import { useOrientation } from "@/layout/OrientationContext";
import type { Orientation } from "@/layout/stage";
import ProductDeleteOverlay from "@/pages/admin/ProductDeleteOverlay";
import type { Language, ProductSlot } from "@/types/data";

const PREVIEW_DESCRIPTION = "카드 앞면과 결과 화면 카드에 이렇게 보입니다.";

// 가로는 MemoryCard 기본 크기(296x212), 세로는 게임 화면 세로 카드(236x313)와 같은 비율로 줄인 Figma 크기입니다
const PREVIEW_CARD_FRONT = {
	landscape: undefined,
	portrait: "h-56 w-42.25",
} as const satisfies Record<Orientation, string | undefined>;

type ImagePreview = {
	language: Language;
	orientation: Orientation;
};

type ProductFormOverlayProps = {
	/** 없으면 등록, 있으면 그 제품의 수정으로 엽니다 */
	product?: ProductSlot;
	onCancel: () => void;
	onDone: () => void;
};

export default function ProductFormOverlay({ product, onCancel, onDone }: ProductFormOverlayProps) {
	const [images, setImages] = useState<ProductImageDraft>(product?.image ?? {});
	const [preview, setPreview] = useState<ImagePreview>();
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

	const stageOrientation = useOrientation();
	const card = useSettingsDraft((state) => state.draft["card-game"]);
	const setDraft = useSettingsDraft((state) => state.setDraft);
	const { isSelecting, errorMessages, selectImageFor } = useImageSelect<Language>();

	// 등록할 칸은 registerProduct 와 같은 함수로 구해, 보이는 칸 번호와 실제로 들어가는 칸을 맞춥니다
	const slot = product?.slot ?? findRegisterSlot(card.products);
	// KR·EN 사진이 모두 있어야 제품 사진이 됩니다 (Figma Q48)
	const completeImage = toCompleteLocalized(images);
	const imageSrcs = toImageSrcs(images);
	const previewSrc = preview && imageSrcs[preview.language];

	async function handleImageSelectClick(language: Language) {
		const path = await selectImageFor(language, "product");
		if (path) setImages((current) => ({ ...current, [language]: path }));
	}

	function handleConfirmClick() {
		if (!completeImage) return;

		setDraft(
			"card-game",
			product
				? replaceProductImage(card, product.slot, completeImage)
				: registerProduct(card, completeImage),
		);
		onDone();
	}

	function handleCancelClick() {
		if (isSelecting) return;
		onCancel();
	}

	function handleDeleteClick() {
		if (isSelecting) return;
		setIsDeleteConfirmOpen(true);
	}

	function handleDeleteCancel() {
		setIsDeleteConfirmOpen(false);
	}

	function handleImagePreviewClick(language: Language) {
		if (isSelecting) return;
		// 열 때마다 지금 키오스크 화면 방향부터 보여 줍니다
		setPreview({ language, orientation: stageOrientation });
	}

	function handlePreviewOrientationChange(orientation: Orientation) {
		setPreview((current) => current && { ...current, orientation });
	}

	function handleImagePreviewClose() {
		setPreview(undefined);
	}

	// 빈 칸이 없으면 등록할 곳이 없습니다. 패널도 이때는 "등록" 버튼을 그리지 않습니다
	if (slot === undefined) return null;

	const modeProps = product
		? { mode: "edit" as const, onDeleteClick: handleDeleteClick }
		: { mode: "add" as const };

	return (
		<>
			<ModalOverlay>
				<ProductModal
					{...modeProps}
					slot={slot}
					imageSrcs={imageSrcs}
					imageErrorMessages={errorMessages}
					isConfirmDisabled={isSelecting || !completeImage}
					onImageSelectClick={handleImageSelectClick}
					onImagePreviewClick={handleImagePreviewClick}
					onCancelClick={handleCancelClick}
					onConfirmClick={handleConfirmClick}
				/>
			</ModalOverlay>
			{preview && previewSrc && (
				<ModalOverlay>
					<ImagePreviewModal
						tone="card"
						description={`제품 이미지 · ${LANGUAGE_LABEL[preview.language]} — ${PREVIEW_DESCRIPTION}`}
						items={[
							{
								caption: `카드 앞면 (게임 중 · ${formatOrientationBasis(preview.orientation)})`,
								content: (
									<MemoryCard
										label="카드 앞면"
										state="front"
										productImage={previewSrc}
										aria-hidden
										className={PREVIEW_CARD_FRONT[preview.orientation]}
									/>
								),
							},
							{
								caption: `결과 화면 카드 (${formatOrientationBasis(preview.orientation)})`,
								content: <ProductResultCard image={previewSrc} />,
							},
						]}
						orientation={preview.orientation}
						onOrientationChange={handlePreviewOrientationChange}
						onCloseClick={handleImagePreviewClose}
					/>
				</ModalOverlay>
			)}
			{isDeleteConfirmOpen && product && (
				<ProductDeleteOverlay
					slot={product.slot}
					onCancel={handleDeleteCancel}
					onDeleted={onDone}
				/>
			)}
		</>
	);
}
