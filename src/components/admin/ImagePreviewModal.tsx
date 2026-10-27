import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import icRotate from "@/assets/icons/icRotate.svg";
import type { AdminTone } from "@/components/admin/adminToneLabel";
import Button from "@/components/admin/Button";
import Icon from "@/components/admin/Icon";
import ModalFrame from "@/components/admin/ModalFrame";
import ModalHeader from "@/components/admin/ModalHeader";
import { ORIENTATION_LABEL } from "@/components/admin/orientationLabel";
import type { Orientation } from "@/layout/stage";
import { cn } from "@/utils/cn";

const NEXT_ORIENTATION = {
	landscape: "portrait",
	portrait: "landscape",
} as const satisfies Record<Orientation, Orientation>;

const captionVariants = cva("typo-admin-caption whitespace-nowrap text-text-secondary", {
	variants: {
		captionStyle: {
			text: "",
			chip: "rounded-xl bg-background-surface px-3 py-1",
		},
	},
	defaultVariants: {
		captionStyle: "text",
	},
});

type PreviewItem = {
	caption: string;
	content: ReactNode;
};

type ImagePreviewModalProps = VariantProps<typeof captionVariants> & {
	tone: AdminTone;
	description: string;
	items: readonly PreviewItem[];
	/** 둘 다 넘기면 헤더 오른쪽에 가로·세로 전환 버튼이 보입니다. items 는 이 방향의 모습으로 넘깁니다 */
	orientation?: Orientation;
	onOrientationChange?: (orientation: Orientation) => void;
	onCloseClick?: () => void;
	className?: string;
};

export default function ImagePreviewModal({
	tone,
	description,
	items,
	captionStyle,
	orientation,
	onOrientationChange,
	onCloseClick,
	className,
}: ImagePreviewModalProps) {
	function handleRotateClick() {
		if (orientation) onOrientationChange?.(NEXT_ORIENTATION[orientation]);
	}

	function renderItem(item: PreviewItem) {
		return (
			<div key={item.caption} className="flex flex-col items-center gap-3">
				{item.content}
				<p className={captionVariants({ captionStyle })}>{item.caption}</p>
			</div>
		);
	}

	return (
		<ModalFrame className={cn("w-180", className)}>
			<div className="flex w-full items-start gap-4">
				<ModalHeader
					tone={tone}
					title="이미지 미리보기"
					subtitle={description}
					className="min-w-0 flex-1"
				/>
				{orientation && onOrientationChange && (
					<button
						type="button"
						aria-label={`${ORIENTATION_LABEL[NEXT_ORIENTATION[orientation]]} 화면으로 보기`}
						onClick={handleRotateClick}
						className={cn(
							"flex size-14 shrink-0 items-center justify-center rounded-xl border-2",
							"border-border-default bg-background-surface text-text-primary",
							"active:bg-background-canvas",
						)}>
						<Icon src={icRotate} className="size-7" />
					</button>
				)}
			</div>
			<div
				className={cn(
					"flex w-full flex-col items-center gap-3 overflow-hidden rounded-2xl",
					"bg-background-canvas p-6",
				)}>
				{items.map(renderItem)}
			</div>
			<div className="flex w-full justify-end">
				<Button label="닫기" onClick={onCloseClick} />
			</div>
		</ModalFrame>
	);
}
