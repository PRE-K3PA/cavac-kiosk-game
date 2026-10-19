import imgVaccineGameBackground from "@/assets/images/vaccine/imgVaccineGameBackground.png";

export default function VaccineBackground() {
	return (
		<>
			<img
				src={imgVaccineGameBackground}
				alt=""
				draggable={false}
				className="size-full object-cover"
			/>
			<div className="absolute inset-0 bg-background-surface/35" />
		</>
	);
}
