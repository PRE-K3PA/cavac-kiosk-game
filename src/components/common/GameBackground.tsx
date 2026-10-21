import imgGameBackground from "@/assets/images/common/imgGameBackground.png";

/** 게임 화면 공용 배경. ScreenLayout 의 background 로 넘깁니다 */
export default function GameBackground() {
	return (
		<>
			<img src={imgGameBackground} alt="" draggable={false} className="size-full object-cover" />
			<div className="absolute inset-0 bg-background-surface/35" />
		</>
	);
}
