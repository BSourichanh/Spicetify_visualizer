/**
 * Calcule le centre optique exact (cx, cy) de la visualisation
 * S'aligne parfaitement sur le centre de la zone active entre les barres latérales Spotify
 * ou sur le centre plein écran en mode plein écran.
 */
export function getVisualizerCenter(ctx: CanvasRenderingContext2D): { cx: number; cy: number } {
	const canvas = ctx.canvas;
	if (typeof document !== "undefined") {
		const main = document.querySelector("main");
		if (main && !document.fullscreenElement) {
			const mRect = main.getBoundingClientRect();
			const cRect = canvas.getBoundingClientRect();
			const scaleX = canvas.width / (cRect.width || 1);
			const scaleY = canvas.height / (cRect.height || 1);
			const cx = (mRect.left - cRect.left + mRect.width / 2) * scaleX;
			const cy = (mRect.top - cRect.top + mRect.height / 2) * scaleY;
			if (Number.isFinite(cx) && Number.isFinite(cy) && cx > 0 && cy > 0) {
				return { cx, cy };
			}
		}
	}
	return { cx: canvas.width / 2, cy: canvas.height / 2 };
}

export function drawBassBloom(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	radius: number,
	color: { r: number; g: number; b: number },
	bassEnergy: number
) {
	if (bassEnergy < 0.04) return;
	const alpha = Math.min(0.4, (bassEnergy - 0.04) * 0.5);
	const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(10, radius));
	grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
	grad.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.4})`);
	grad.addColorStop(1, "rgba(0,0,0,0)");
	ctx.save();
	ctx.fillStyle = grad;
	ctx.beginPath();
	ctx.arc(cx, cy, radius, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}

export function drawPolygon(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	radius: number,
	sides: number,
	rotation = 0
) {
	if (radius <= 0 || sides < 3) return;
	ctx.beginPath();
	for (let i = 0; i <= sides; i++) {
		const a = rotation + (i / sides) * Math.PI * 2;
		const px = cx + Math.cos(a) * radius;
		const py = cy + Math.sin(a) * radius;
		if (i === 0) ctx.moveTo(px, py);
		else ctx.lineTo(px, py);
	}
	ctx.closePath();
}
