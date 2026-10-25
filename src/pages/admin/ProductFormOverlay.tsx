import { useState } from "react";
import ImagePreviewModal from "@/components/admin/ImagePreviewModal";
import { LANGUAGE_LABEL } from "@/components/admin/languageLabel";
import ModalOverlay from "@/components/admin/ModalOverlay";
import ProductModal from "@/components/admin/ProductModal";
import MemoryCard from "@/components/card/MemoryCard";
import ProductResultCard from "@/components/card/ProductResultCard";
import { getImageUrl } from "@/data/storage";
import {
	findRegisterSlot,
	type ProductImageDraft,
	registerProduct,
	replaceProductImage,
	toProductImage,
} from "@/features/admin/productSlots";
import { useSettingsDraft } from "@/features/admin/settingsDraft";
import { useImageSelect } from "@/features/admin/useImageSelect";
import ProductDeleteOverlay from "@/pages/admin/ProductDeleteOverlay";
import type { ImagePath, Language, ProductSlot } from "@/types/data";

const PREVIEW_DESCRIPTION = "카드 앞면과 결과 화면 카드에 이렇게 보입니다.";

type ProductFormOverlayProps = {
	/** 없으면 등록, 있으면 그 제품의 수정으로 엽니다 */
	product?: ProductSlot;
	onCancel: () => void;
	onDone: () => void;
};

function toImageSrc(path?: ImagePath): string | undefined {
	return path && getImageUrl(path);
}

export default function ProductFormOverlay({ product, onCancel, onDone }: ProductFormOverlayProps) {
	const [images, setImages] = useState<ProductImageDraft>(product?.image ?? {});
	const [previewLanguage, setPreviewLanguage] = useState<Language>();
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

	const card = useSettingsDraft((state) => state.draft["card-game"]);
	const setDraft = useSettingsDraft((state) => state.setDraft);
	const { isSelecting, errorMessages, selectImageFor } = useImageSelect<Language>();

	// 등록할 칸은 registerProduct 와 같은 함수로 구해, 보이는 칸 번호와 실제로 들어가는 칸을 맞춥니다
	const slot = product?.slot ?? findRegisterSlot(card.products);
	const completeImage = toProductImage(images);
	const imageSrcs = { ko: toImageSrc(images.ko), en: toImageSrc(images.en) };
	const previewSrc = previewLanguage && imageSrcs[previewLanguage];

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
		setPreviewLanguage(language);
	}

	function handleImagePreviewClose() {
		setPreviewLanguage(undefined);
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
			{previewLanguage && previewSrc && (
				<ModalOverlay>
					<ImagePreviewModal
						tone="card"
						description={`제품 이미지 · ${LANGUAGE_LABEL[previewLanguage]} — ${PREVIEW_DESCRIPTION}`}
						items={[
							{
								caption: "카드 앞면 (게임 중)",
								content: (
									<MemoryCard
										label="카드 앞면"
										state="front"
										productImage={previewSrc}
										aria-hidden
									/>
								),
							},
							{
								caption: "결과 화면 카드 (가로 화면 기준)",
								content: <ProductResultCard image={previewSrc} />,
							},
						]}
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
