import { cva, type VariantProps } from "class-variance-authority";
import icAlert from "@/assets/icons/icAlert.svg";
import Icon from "@/components/admin/Icon";
import { cn } from "@/utils/cn";

const fieldMessageVariants = cva("flex items-center gap-2 typo-admin-body whitespace-nowrap", {
	variants: {
		tone: {
			error: "text-state-error",
			warning: "text-brand-primary-strong",
		},
	},
	defaultVariants: {
		tone: "error",
	},
});

type FieldMessageProps = VariantProps<typeof fieldMessageVariants> & {
	id?: string;
	message: string;
	className?: string;
};

export default function FieldMessage({ id, tone, message, className }: FieldMessageProps) {
	return (
		<div id={id} role="status" className={cn(fieldMessageVariants({ tone }), className)}>
			<Icon src={icAlert} className="size-5" />
			<p>{message}</p>
		</div>
	);
}
