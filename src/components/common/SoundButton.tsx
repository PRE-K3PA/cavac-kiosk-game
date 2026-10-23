import type { ComponentProps, MouseEvent } from "react";
import icSoundOff from "@/assets/icons/icSoundOff.svg";
import icSoundOn from "@/assets/icons/icSoundOn.svg";
import { cn } from "@/utils/cn";
import { playSound, SOUND_NAMES } from "@/utils/soundEngine";

type SoundButtonProps = Omit<ComponentProps<"button">, "children" | "aria-label"> & {
	/** 스크린 리더용 이름. 문구는 호출하는 쪽에서 언어에 맞게 넘긴다 */
	label: string;
	muted?: boolean;
};

export default function SoundButton({
	label,
	muted = false,
	className,
	onClick,
	...props
}: SoundButtonProps) {
	const icon = muted ? icSoundOff : icSoundOn;

	// 소리를 켜는 순간에만 울려 켜졌음을 알립니다. 끌 때는 조용히 끕니다
	function handleClick(event: MouseEvent<HTMLButtonElement>) {
		if (muted) playSound(SOUND_NAMES.button);
		onClick?.(event);
	}

	return (
		<button
			type="button"
			aria-label={label}
			aria-pressed={muted}
			className={cn(
				"flex size-22 cursor-pointer items-center justify-center overflow-clip",
				"rounded-full border-2 border-border-default bg-background-surface shadow-md",
				className,
			)}
			onClick={handleClick}
			{...props}>
			{/* 아이콘은 모양(알파)만 쓰고 색은 토큰으로 칠한다 */}
			<span
				aria-hidden="true"
				className="h-9 w-10 shrink-0 bg-text-primary"
				style={{
					maskImage: `url("${icon}")`,
					maskSize: "contain",
					maskRepeat: "no-repeat",
					maskPosition: "center",
				}}
			/>
		</button>
	);
}
