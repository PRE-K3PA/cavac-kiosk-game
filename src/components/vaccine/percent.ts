export function toPercent(value: number) {
	return Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0;
}
