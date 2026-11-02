import { useState } from "react";
import ImagePreviewModal from "@/components/admin/ImagePreviewModal";
import { LANGUAGE_LABEL } from "@/components/admin/languageLabel";
import ModalOverlay from "@/components/admin/ModalOverlay";
import { formatOrientationBasis } from "@/components/admin/orientationLabel";
import VaccineModal from "@/components/admin/VaccineModal";
import type { AntigenLabel } from "@/components/vaccine/antigen";
import VaccineBottle from "@/components/vaccine/VaccineBottle";
import VaccineResultCard from "@/components/vaccine/VaccineResultCard";
import { toImageSrcs } from "@/features/admin/localizedDraft";
import { useSettingsDraft } from "@/features/admin/settingsDraft";
import { useImageSelect } from "@/features/admin/useImageSelect";
import {
	EMPTY_VACCINE_IMAGES,
	EMPTY_VACCINE_NAME,
	getBlankNameErrors,
	toVaccineInfo,
	VACCINE_IMAGE_KINDS,
	type VaccineImageDraft,
	type VaccineImageField,
	type VaccineImageKey,
	type VaccineName,
} from "@/features/admin/vaccineForm";
import { addVaccine, updateVaccineInfo } from "@/features/admin/vaccineList";
import { useOrientation } from "@/layout/OrientationContext";
import type { Orientation } from "@/layout/stage";
import VaccineDeleteOverlay from "@/pages/admin/VaccineDeleteOverlay";
import { ANTIGEN_COLOR_KEYS, type Antigen, type Language, type Vaccine } from "@/types/data";
import { cn } from "@/utils/cn";

const PREVIEW_PLACES = {
	bottleImage: { label: "백신 이미지", place: "결과 화면 카드" },
	logoImage: { label: "백신 로고", place: "게임 중 정보 레일" },
} satisfies Record<VaccineImageKey, { label: string; place: string }>;

/** Figma 미리보기의 병 채움 정도 */
const PREVIEW_BOTTLE_FILL = 60;

/** 게임 화면 정보 레일처럼 세로 화면에서는 로고와 병을 옆으로 놓고, 병도 게임 화면과 같은 크기로 줄입니다 */
const PREVIEW_LOGO_RAIL = {
	landscape: { rail: "flex-col gap-6 p-4", bottle: undefined },
	portrait: { rail: "flex-row gap-5 px-5 py-7", bottle: "h-56.75 w-33.5" },
} as const satisfies Record<Orientation, { rail: string; bottle?: string }>;

type ImagePreview = {
	image: VaccineImageKey;
	language: Language;
	orientation: Orientation;
};

type VaccineFormOverlayProps = {
	/** 없으면 추가, 있으면 그 백신의 수정으로 엽니다 */
	vaccine?: Vaccine;
	onCancel: () => void;
	/** 수정하거나 지운 뒤 */
	onDone: () => void;
	onAdded: (vaccineId: string) => void;
};

function toImageErrorMessages(messages: Partial<Record<VaccineImageField, string>>) {
	return {
		bottleImage: { ko: messages["bottleImage.ko"], en: messages["bottleImage.en"] },
		logoImage: { ko: messages["logoImage.ko"], en: messages["logoImage.en"] },
	};
}

function formatPreviewDescription({ image, language }: ImagePreview) {
	const { label, place } = PREVIEW_PLACES[image];
	return `${label} · ${LANGUAGE_LABEL[language]} — ${place}에 이렇게 보입니다.`;
}

function formatPreviewCaption({ image, orientation }: ImagePreview) {
	return `${PREVIEW_PLACES[image].place} (${formatOrientationBasis(orientation)})`;
}

/** 항원 색은 게임을 시작할 때마다 새로 정하므로, 미리보기는 차례대로 칠합니다 */
function toPreviewAntigens(antigens: Antigen[]): AntigenLabel[] {
	return antigens.map(({ abbr, subtype, pathogenType }, index) => ({
		abbr,
		subtype,
		pathogenType,
		color: ANTIGEN_COLOR_KEYS[index % ANTIGEN_COLOR_KEYS.length],
	}));
}

export default function VaccineFormOverlay({
	vaccine,
	onCancel,
	onDone,
	onAdded,
}: VaccineFormOverlayProps) {
	const [name, setName] = useState<VaccineName>(
		vaccine
			? { brandName: vaccine.brandName, productName: vaccine.productName }
			: EMPTY_VACCINE_NAME,
	);
	const [images, setImages] = useState<VaccineImageDraft>(
		vaccine
			? { bottleImage: vaccine.bottleImage, logoImage: vaccine.logoImage }
			: EMPTY_VACCINE_IMAGES,
	);
	const [preview, setPreview] = useState<ImagePreview>();
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

	const stageOrientation = useOrientation();
	const vaccineGame = useSettingsDraft((state) => state.draft["vaccine-game"]);
	const setDraft = useSettingsDraft((state) => state.setDraft);
	const { isSelecting, errorMessages, selectImageFor } = useImageSelect<VaccineImageField>();

	const info = toVaccineInfo(name, images);
	const imageSrcs = {
		bottleImage: toImageSrcs(images.bottleImage),
		logoImage: toImageSrcs(images.logoImage),
	};
	const previewSrc = preview && imageSrcs[preview.image][preview.language];

	async function handleImageSelectClick(image: VaccineImageKey, language: Language) {
		const path = await selectImageFor(`${image}.${language}`, VACCINE_IMAGE_KINDS[image]);
		if (path) {
			setImages((current) => ({ ...current, [image]: { ...current[image], [language]: path } }));
		}
	}

	function handleConfirmClick() {
		if (!info) return;

		if (vaccine) {
			setDraft("vaccine-game", updateVaccineInfo(vaccineGame, vaccine.id, info));
			onDone();
			return;
		}
		const next = addVaccine(vaccineGame, info);
		setDraft("vaccine-game", next);
		// addVaccine 은 새 백신을 목록 끝에 넣습니다
		onAdded(next.vaccines[next.vaccines.length - 1].id);
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

	function handleImagePreviewClick(image: VaccineImageKey, language: Language) {
		if (isSelecting) return;
		// 열 때마다 지금 키오스크 화면 방향부터 보여 줍니다
		setPreview({ image, language, orientation: stageOrientation });
	}

	function handlePreviewOrientationChange(orientation: Orientation) {
		setPreview((current) => current && { ...current, orientation });
	}

	function handleImagePreviewClose() {
		setPreview(undefined);
	}

	function renderPreviewContent({ image, language, orientation }: ImagePreview, src: string) {
		if (image === "logoImage") {
			const layout = PREVIEW_LOGO_RAIL[orientation];

			return (
				<div
					className={cn(
						"flex items-center rounded-[30px] border-3 border-border-default",
						"bg-background-surface shadow-md",
						layout.rail,
					)}>
					<div className="flex h-25 w-75 items-center justify-center">
						<img src={src} alt="" className="max-h-full max-w-full object-contain" />
					</div>
					<VaccineBottle fill={PREVIEW_BOTTLE_FILL} className={layout.bottle} />
				</div>
			);
		}

		return (
			<VaccineResultCard
				imageSrc={src}
				brand={name.brandName[language].trim()}
				name={name.productName[language].trim()}
				antigens={toPreviewAntigens(vaccine?.antigens ?? [])}
			/>
		);
	}

	const modeProps = vaccine
		? { mode: "edit" as const, originalName: vaccine, onDeleteClick: handleDeleteClick }
		: { mode: "add" as const };

	return (
		<>
			<ModalOverlay>
				<VaccineModal
					{...modeProps}
					name={name}
					imageSrcs={imageSrcs}
					nameErrorMessages={getBlankNameErrors(name)}
					imageErrorMessages={toImageErrorMessages(errorMessages)}
					isConfirmDisabled={isSelecting || !info}
					onNameChange={setName}
					onImageSelectClick={handleImageSelectClick}
					onImagePreviewClick={handleImagePreviewClick}
					onCancelClick={handleCancelClick}
					onConfirmClick={handleConfirmClick}
				/>
			</ModalOverlay>
			{preview && previewSrc && (
				<ModalOverlay>
					<ImagePreviewModal
						tone="vaccine"
						description={formatPreviewDescription(preview)}
						items={[
							{
								caption: formatPreviewCaption(preview),
								content: renderPreviewContent(preview, previewSrc),
							},
						]}
						orientation={preview.orientation}
						onOrientationChange={handlePreviewOrientationChange}
						onCloseClick={handleImagePreviewClose}
					/>
				</ModalOverlay>
			)}
			{isDeleteConfirmOpen && vaccine && (
				<VaccineDeleteOverlay
					vaccineId={vaccine.id}
					onCancel={handleDeleteCancel}
					onDeleted={onDone}
				/>
			)}
		</>
	);
}
