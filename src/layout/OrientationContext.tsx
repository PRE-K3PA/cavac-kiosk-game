import { createContext, type ReactNode, useContext } from "react";
import type { Orientation } from "@/layout/stage";

const OrientationContext = createContext<Orientation>("landscape");

export function OrientationProvider({
	orientation,
	children,
}: {
	orientation: Orientation;
	children: ReactNode;
}) {
	return <OrientationContext value={orientation}>{children}</OrientationContext>;
}

export function useOrientation(): Orientation {
	return useContext(OrientationContext);
}
