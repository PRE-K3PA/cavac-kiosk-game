import { useState } from "react";
import ImagePreviewModal from "@/components/admin/ImagePreviewModal";
import { LANGUAGE_LABEL } from "@/components/admin/languageLabel";
import ModalOverlay from "@/components/admin/ModalOverlay";
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
import VaccineDeleteOverlay from "@/pages/admin/VaccineDeleteOverlay";
import { ANTIGEN_COLOR_KEYS, type Antigen, type Language, type Vaccine } from "@/types/data";
import { cn } from "@/utils/cn";

const PREVIEW_PLACES = {
	bottleImage: { label: "백신 이미지", place: "결과 화면 카드" },
	logoImage: { label: "백신 로고", place: "게임 중 정보 레일" },
} satisfies Record<VaccineImageKey, { label: string; place: string }>;

/** Figma 미리보기의 병 채움 정도 */
const PREVIEW_BOTTLE_FILL = 60;

type ImagePreview = {
	image: VaccineImageKey;
	language: Language;
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
		setPreview({ image, language });
	}

	function handleImagePreviewClose() {
		setPreview(undefined);
	}

	function renderPreviewContent({ image, language }: ImagePreview, src: string) {
		if (image === "logoImage") {
			return (
				<div
					className={cn(
						"flex flex-col items-center gap-6 rounded-[30px] border-3 border-border-default",
						"bg-background-surface p-4 shadow-md",
					)}>
					<div className="flex h-25 w-75 items-center justify-center">
						<img src={src} alt="" className="max-h-full max-w-full object-contain" />
					</div>
					<VaccineBottle fill={PREVIEW_BOTTLE_FILL} />
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
								caption: `${PREVIEW_PLACES[preview.image].place} (가로 화면 기준)`,
								content: renderPreviewContent(preview, previewSrc),
							},
						]}
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
