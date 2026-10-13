import { cva, type VariantProps } from "class-variance-authority";
import Button from "@/components/admin/Button";
import { cn } from "@/utils/cn";

const DEFAULT_SHAPE = "square";

const EMPTY_LABEL = {
	square: "이미지\n없음",
	wide: "이미지 없음",
} as const;

const thumbnailVariants = cva(
	"relative flex h-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2",
	{
		variants: {
			shape: {
				square: "w-24",
				wide: "w-48",
			},
			isFilled: {
				true: "bg-background-surface",
				false: "border-dashed bg-background-canvas",
			},
			isError: {
				true: "border-dashed border-state-error",
				false: "",
			},
		},
		compoundVariants: [
			{ isFilled: true, isError: false, className: "border-border-default" },
			{ isFilled: false, isError: false, className: "border-border-placeholder" },
		],
		defaultVariants: {
			shape: DEFAULT_SHAPE,
		},
	},
);

type ImageFieldProps = Pick<VariantProps<typeof thumbnailVariants>, "shape"> & {
	imageSrc?: string;
	errorMessage?: string;
	onSelectClick?: () => void;
	onPreviewClick?: () => void;
	className?: string;
};

export default function ImageField({
	shape,
	imageSrc,
	errorMessage,
	onSelectClick,
	onPreviewClick,
	className,
}: ImageFieldProps) {
	const isFilled = Boolean(imageSrc);
	const isError = Boolean(errorMessage);

	return (
		<div className={cn("flex items-center gap-4", className)}>
			<div className={thumbnailVariants({ shape, isFilled, isError })}>
				{imageSrc ? (
					<>
						<img src={imageSrc} alt="" className="size-full object-contain" />
						<button
							type="button"
							onClick={onPreviewClick}
							className={cn(
								"absolute inset-x-0 bottom-0 h-7.5 bg-text-primary",
								"typo-admin-caption whitespace-nowrap text-text-inverse",
								"active:bg-text-secondary",
							)}>
							미리보기
						</button>
					</>
				) : (
					<span className="typo-admin-caption whitespace-pre-line text-center text-text-placeholder">
						{EMPTY_LABEL[shape ?? DEFAULT_SHAPE]}
					</span>
				)}
			</div>
			<div className="flex w-40 shrink-0 flex-col gap-2">
				<Button variant="secondary" label="파일 선택" className="h-14" onClick={onSelectClick} />
				<p
					className={cn(
						"typo-admin-caption",
						isError ? "break-keep text-state-error" : "whitespace-nowrap text-text-secondary",
					)}>
					{errorMessage || "PNG / JPG"}
				</p>
			</div>
		</div>
	);
}
