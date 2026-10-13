import { cn } from "@/utils/cn";

type TooltipProps = {
	id?: string;
	title: string;
	message: string;
	className?: string;
};

export default function Tooltip({ id, title, message, className }: TooltipProps) {
	return (
		<div id={id} role="tooltip" className={cn("flex w-max flex-col items-center", className)}>
			<div className="flex flex-col gap-1 rounded-xl bg-text-primary px-5 py-3.5 text-text-inverse">
				<p className="typo-admin-label whitespace-nowrap">{title}</p>
				<p className="typo-admin-caption whitespace-nowrap">{message}</p>
			</div>
			<span aria-hidden="true" className="h-2.5 w-5 bg-text-primary tip-tail-down" />
		</div>
	);
}
