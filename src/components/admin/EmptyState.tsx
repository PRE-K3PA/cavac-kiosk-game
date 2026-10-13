import icEmpty from "@/assets/images/icEmpty.svg";
import Icon from "@/components/admin/Icon";
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
				"flex size-full flex-col items-center justify-center gap-3 rounded-xl px-8 py-10",
				"border-2 border-dashed border-border-placeholder bg-background-surface-subtle text-center",
				className,
			)}>
			<Icon src={icEmpty} className="size-12 bg-border-strong" />
			<p className="typo-admin-label whitespace-nowrap text-text-primary">{title}</p>
			{description && (
				<p className="typo-admin-caption whitespace-nowrap text-text-secondary">{description}</p>
			)}
		</div>
	);
}
