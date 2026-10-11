import icEmpty from "@/assets/images/icEmpty.svg";
import { cn } from "@/utils/cn";

type EmptyStateProps = {
	title: string;
	description?: string;
	className?: string;
};

export default function EmptyState({ title, description, className }: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex h-70 w-150 flex-col items-center justify-center gap-3 rounded-xl px-8 py-10",
				"border-2 border-dashed border-border-placeholder bg-background-surface-subtle text-center",
				className,
			)}>
			<img src={icEmpty} alt="" width={48} height={48} />
			<p className="typo-admin-label text-text-primary">{title}</p>
			{description && <p className="typo-admin-caption text-text-secondary">{description}</p>}
		</div>
	);
}
