import { useEffect, useState } from "react";
import { getDataOrDefault } from "@/data/load";
import KioskStage from "@/layout/KioskStage";
import AdminPinPage from "@/pages/admin/AdminPinPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import CardSettingsPanel from "@/pages/admin/CardSettingsPanel";
import CommonSettings from "@/pages/admin/CommonSettings";
import VaccineSettingsPanel from "@/pages/admin/VaccineSettingsPanel";
import CardGame from "@/pages/card/CardGame";
import CardHome from "@/pages/card/CardHome";
import VaccineGamePage from "@/pages/vaccine/VaccineGamePage";
import VaccineHome from "@/pages/vaccine/VaccineHome";
import type { GameType } from "@/types/data";

type Screen = "home" | "game" | "adminPin" | "adminSettings";

const ADMIN_CONTENTS = {
	common: <CommonSettings />,
	vaccine: <VaccineSettingsPanel />,
	card: <CardSettingsPanel />,
};

export default function App() {
	const [screen, setScreen] = useState<Screen>("home");
	const [activeGame, setActiveGame] = useState<GameType | null>(null);

	// 관리자 화면에서 운영 게임을 바꿀 수 있으므로 홈으로 돌아올 때마다 다시 읽습니다
	useEffect(() => {
		if (screen !== "home") return;
		let isCancelled = false;
		getDataOrDefault("common").then((common) => {
			if (!isCancelled) setActiveGame(common.activeGame);
		});
		return () => {
			isCancelled = true;
		};
	}, [screen]);

	function goHome() {
		setScreen("home");
	}

	function goAdminPin() {
		setScreen("adminPin");
	}

	function handleAdminExit() {
		setActiveGame(null);
		setScreen("home");
	}

	function renderScreen() {
		if (screen === "adminPin") {
			return <AdminPinPage onSuccess={() => setScreen("adminSettings")} onCancel={goHome} />;
		}
		if (screen === "adminSettings") {
			return <AdminSettingsPage contents={ADMIN_CONTENTS} onExit={handleAdminExit} />;
		}
		if (activeGame === null) return null;

		if (screen === "game") {
			return activeGame === "vaccine" ? (
				<VaccineGamePage onHome={goHome} onAdminActivate={goAdminPin} />
			) : (
				<CardGame onExit={goHome} onAdminActivate={goAdminPin} />
			);
		}
		const Home = activeGame === "vaccine" ? VaccineHome : CardHome;
		return <Home onStart={() => setScreen("game")} onAdminActivate={goAdminPin} />;
	}

	return <KioskStage>{renderScreen()}</KioskStage>;
}
