import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type ModalFrameProps = {
	children: ReactNode;
	className?: string;
};

export default function ModalFrame({ children, className }: ModalFrameProps) {
	return (
		<div
			role="dialog"
			aria-modal="true"
			className={cn(
				"flex min-h-0 w-140 flex-col items-start gap-5 rounded-3xl border-2 border-border-default",
				"bg-background-surface p-7 shadow-modal",
				className,
			)}>
			{children}
		</div>
	);
}
