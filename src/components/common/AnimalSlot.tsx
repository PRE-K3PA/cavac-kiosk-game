import { type ComponentProps, useState } from "react";
import { cn } from "@/utils/cn";

type AnimalSlotProps = Omit<ComponentProps<"div">, "children"> & {
	side?: "left" | "right";
	state?: "filled" | "empty";
	src?: string;
	name?: string;
};

export default function AnimalSlot({
	side = "left",
	state = "filled",
	src,
	name = "",
	className,
	...props
}: AnimalSlotProps) {
	// 이미지 파일이 없으면 깨진 아이콘과 alt 글자 대신 아무것도 그리지 않습니다
	const [failedSrc, setFailedSrc] = useState<string>();
	const isImageFailed = src !== undefined && src === failedSrc;

	function handleImageError() {
		setFailedSrc(src);
	}

	return (
		<div className={cn("relative size-50", className)} {...props}>
			{state === "empty" ? (
				<div
					className={cn(
						"absolute inset-0 rounded-3xl border-3",
						"border-border-placeholder border-dashed",
					)}
				/>
			) : (
				!isImageFailed && (
					<>
						<div
							aria-hidden="true"
							className={cn(
								"absolute inset-[84%_20%_8%_20%] rounded-full bg-(--black)/60",
								"opacity-35 blur-xs",
							)}
						/>
						{src && (
							<img
								src={src}
								alt={name}
								draggable={false}
								onError={handleImageError}
								className={cn(
									"absolute inset-0 size-full object-cover",
									side === "left" && "-scale-x-100",
								)}
							/>
						)}
					</>
				)
			)}
		</div>
	);
}
