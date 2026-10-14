import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type ModalOverlayProps = {
	children: ReactNode;
	className?: string;
};

export default function ModalOverlay({ children, className }: ModalOverlayProps) {
	return (
		<div className={cn("fixed inset-0 z-50 flex items-center justify-center", className)}>
			<div aria-hidden="true" className="absolute inset-0 bg-background-overlay opacity-67" />
			<div className="relative flex max-h-260 flex-col">{children}</div>
		</div>
	);
}
