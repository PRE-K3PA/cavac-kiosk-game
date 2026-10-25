import { useOrientation } from "@/layout/OrientationContext";
import CommonSettingsPanel from "@/pages/admin/CommonSettingsPanel";
import HomeAnimalPanel from "@/pages/admin/HomeAnimalPanel";

// 가로는 왼쪽 공통 설정, 오른쪽 축종 설정. 세로는 축종 설정을 위에 둡니다
export default function CommonSettings() {
	if (useOrientation() === "portrait") {
		return (
			<div className="flex flex-col gap-6">
				<HomeAnimalPanel />
				<CommonSettingsPanel />
			</div>
		);
	}

	return (
		<div className="flex items-start gap-6">
			<CommonSettingsPanel />
			<HomeAnimalPanel />
		</div>
	);
}
