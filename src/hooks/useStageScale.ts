import { useEffect, useState } from "react";
import { fitStage, type StageFit } from "@/layout/stage";

function readWindowFit(): StageFit {
	return fitStage({ width: window.innerWidth, height: window.innerHeight });
}

export default function useStageScale(): StageFit {
	const [fit, setFit] = useState(readWindowFit);

	useEffect(() => {
		function handleResize() {
			setFit(readWindowFit());
		}

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return fit;
}
