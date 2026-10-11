import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import type { AdminTone } from "@/components/admin/adminToneLabel";
import Button from "@/components/admin/Button";
import ModalFrame from "@/components/admin/ModalFrame";
import ModalHeader from "@/components/admin/ModalHeader";
import { cn } from "@/utils/cn";

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
	onCloseClick?: () => void;
	className?: string;
};

export default function ImagePreviewModal({
	tone,
	description,
	items,
	captionStyle,
	onCloseClick,
	className,
}: ImagePreviewModalProps) {
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
			<ModalHeader tone={tone} title="이미지 미리보기" subtitle={description} />
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
