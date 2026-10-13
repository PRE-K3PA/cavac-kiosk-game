import { cva, type VariantProps } from "class-variance-authority";
import Button from "@/components/admin/Button";
import { cn } from "@/utils/cn";

const speciesCardVariants = cva(
	[
		"flex shrink-0 flex-col gap-3 rounded-2xl border-2 border-border-default",
		"bg-background-surface-subtle p-4",
	],
	{
		variants: {
			size: {
				compact: "w-60",
				large: "w-80.5",
			},
		},
		defaultVariants: {
			size: "compact",
		},
	},
);

type SpeciesCardProps = VariantProps<typeof speciesCardVariants> & {
	name: string;
	imageSrc: string;
	onEditClick?: () => void;
	onDeleteClick?: () => void;
	className?: string;
};

export default function SpeciesCard({
	size,
	name,
	imageSrc,
	onEditClick,
	onDeleteClick,
	className,
}: SpeciesCardProps) {
	return (
		<div className={cn(speciesCardVariants({ size }), className)}>
			<div
				className={cn(
					"aspect-square w-full overflow-hidden rounded-xl",
					"border-2 border-border-default bg-background-surface",
				)}>
				<img src={imageSrc} alt="" className="size-full object-contain" />
			</div>
			<p className="truncate text-center typo-admin-title text-text-primary">{name}</p>
			<div className="flex gap-2">
				<Button
					variant="secondary"
					label="수정"
					className="h-14 flex-1 px-0"
					onClick={onEditClick}
				/>
				<Button
					variant="danger"
					label="삭제"
					className="h-14 flex-1 px-0"
					onClick={onDeleteClick}
				/>
			</div>
		</div>
	);
}
