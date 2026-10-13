import { useId } from "react";
import Button from "@/components/admin/Button";
import FieldMessage from "@/components/admin/FieldMessage";
import ImageField from "@/components/admin/ImageField";
import ModalFrame from "@/components/admin/ModalFrame";
import ModalHeader from "@/components/admin/ModalHeader";
import TextInput from "@/components/admin/TextInput";
import type { Localized, Vaccine } from "@/types/data";
import { cn } from "@/utils/cn";

const REQUIRED_NOTICE = "모든 항목이 필수입니다.";

const LANGUAGES = [
	{ key: "ko", label: "KR" },
	{ key: "en", label: "EN" },
] as const;

const NAME_FIELDS = [
	{
		key: "brandName",
		label: "브랜드명",
		width: "w-47.5",
		placeholder: { ko: "예: 포울샷", en: "영어 브랜드명" },
	},
	{
		key: "productName",
		label: "제품명",
		width: "w-0 min-w-0 flex-1",
		placeholder: { ko: "예: 5280 ABBNE", en: "영어 제품명" },
	},
] as const;

const IMAGE_FIELDS = [
	{
		key: "bottleImage",
		label: "백신 이미지 (결과 카드의 병 사진) *",
		shape: "square",
		layout: "flex gap-4",
	},
	{
		key: "logoImage",
		label: "백신 로고 (게임 중 정보 레일) *",
		shape: "wide",
		layout: "flex flex-col gap-3",
	},
] as const;

type Language = (typeof LANGUAGES)[number];
type LanguageKey = keyof Localized<string>;
type NameField = (typeof NAME_FIELDS)[number];
type ImageFieldConfig = (typeof IMAGE_FIELDS)[number];
type VaccineName = Pick<Vaccine, "brandName" | "productName">;
type NameKey = keyof VaccineName;
type ImageKey = ImageFieldConfig["key"];
type LocalizedText = Partial<Localized<string>>;

type AddModeProps = {
	mode: "add";
};

type EditModeProps = {
	mode: "edit";
	originalName: VaccineName;
	onDeleteClick?: () => void;
};

type VaccineModalProps = (AddModeProps | EditModeProps) & {
	name: VaccineName;
	imageSrcs?: Partial<Record<ImageKey, LocalizedText>>;
	nameErrorMessages?: Partial<Record<NameKey, LocalizedText>>;
	imageErrorMessages?: Partial<Record<ImageKey, LocalizedText>>;
	isConfirmDisabled?: boolean;
	onNameChange?: (name: VaccineName) => void;
	onImageSelectClick?: (image: ImageKey, language: LanguageKey) => void;
	onImagePreviewClick?: (image: ImageKey, language: LanguageKey) => void;
	onCancelClick?: () => void;
	onConfirmClick?: () => void;
	className?: string;
};

function formatOriginalName({ brandName, productName }: VaccineName) {
	return `${brandName.ko} ${productName.ko}`;
}

export default function VaccineModal(props: VaccineModalProps) {
	const {
		name,
		imageSrcs = {},
		nameErrorMessages = {},
		imageErrorMessages = {},
		isConfirmDisabled,
		onNameChange,
		onImageSelectClick,
		onImagePreviewClick,
		onCancelClick,
		onConfirmClick,
		className,
	} = props;
	const fieldIdPrefix = useId();
	const header =
		props.mode === "edit"
			? {
					title: "백신 수정",
					subtitle: `${formatOriginalName(props.originalName)} · ${REQUIRED_NOTICE}`,
				}
			: { title: "백신 추가", subtitle: `새 백신 정보를 입력하세요. ${REQUIRED_NOTICE}` };

	function nameMessageId(field: NameField, language: Language) {
		return `${fieldIdPrefix}-${field.key}-${language.key}-message`;
	}

	function nameErrorMessage(field: NameField, language: Language) {
		return nameErrorMessages[field.key]?.[language.key];
	}

	const nameErrors = LANGUAGES.flatMap((language) =>
		NAME_FIELDS.flatMap((field) => {
			const message = nameErrorMessage(field, language);
			return message ? [{ id: nameMessageId(field, language), message }] : [];
		}),
	);

	function renderNameInput(field: NameField, language: Language) {
		const errorMessage = nameErrorMessage(field, language);

		function handleChange(text: string) {
			onNameChange?.({ ...name, [field.key]: { ...name[field.key], [language.key]: text } });
		}

		return (
			<TextInput
				key={field.key}
				value={name[field.key][language.key]}
				placeholder={field.placeholder[language.key]}
				aria-label={`${language.label} ${field.label}`}
				isError={Boolean(errorMessage)}
				aria-describedby={errorMessage ? nameMessageId(field, language) : undefined}
				onChange={handleChange}
				className={field.width}
			/>
		);
	}

	function renderNameRow(language: Language) {
		return (
			<div key={language.key} className="flex items-center gap-3">
				<p className="w-10 shrink-0 typo-admin-caption text-text-secondary">{language.label}</p>
				{NAME_FIELDS.map((field) => renderNameInput(field, language))}
			</div>
		);
	}

	function renderImageVersion(field: ImageFieldConfig, language: Language) {
		return (
			<div key={language.key} className="flex flex-col gap-2">
				<p className="typo-admin-caption text-text-secondary">{language.label}</p>
				<ImageField
					shape={field.shape}
					imageSrc={imageSrcs[field.key]?.[language.key]}
					errorMessage={imageErrorMessages[field.key]?.[language.key]}
					onSelectClick={() => onImageSelectClick?.(field.key, language.key)}
					onPreviewClick={() => onImagePreviewClick?.(field.key, language.key)}
				/>
			</div>
		);
	}

	function renderImageField(field: ImageFieldConfig) {
		return (
			<div key={field.key} className="flex flex-col gap-2">
				<p className="typo-admin-body text-text-primary">{field.label}</p>
				<div className={field.layout}>
					{LANGUAGES.map((language) => renderImageVersion(field, language))}
				</div>
			</div>
		);
	}

	return (
		<ModalFrame className={cn("max-h-260 w-180", className)}>
			<ModalHeader tone="vaccine" title={header.title} subtitle={header.subtitle} />
			{/* 오류 문구가 쌓여 길어지면 본문만 스크롤합니다. 스크롤바는 숨깁니다. Windows 기본 스크롤바는 생길 때 폭을 차지해 입력칸 폭이 갑자기 바뀝니다 */}
			<div className="flex min-h-0 w-full flex-col gap-5 overflow-y-auto [scrollbar-width:none]">
				<div className="flex w-full flex-col gap-2">
					<p className="typo-admin-body text-text-primary">백신명 *</p>
					<div className="flex flex-col gap-2">
						<div className="flex gap-3 pl-13 typo-admin-caption text-text-secondary">
							{NAME_FIELDS.map((field) => (
								<p key={field.key} className={field.width}>
									{field.label}
								</p>
							))}
						</div>
						{LANGUAGES.map(renderNameRow)}
					</div>
					{nameErrors.map((error) => (
						<FieldMessage key={error.id} id={error.id} message={error.message} />
					))}
				</div>
				{IMAGE_FIELDS.map(renderImageField)}
			</div>
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
