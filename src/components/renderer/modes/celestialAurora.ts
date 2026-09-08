import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";

/**
 * 🌌 AURORE BORÉALE VIVANTE PLEIN ÉCRAN
 * - 5 rideaux de soie lumineuse volumétriques drapés à travers tout le ciel
 * - Ondulation sinusoïdale multi-fréquence soyeuse de l'ourlet inférieur
 * - Translucidité stratifiée atmosphérique avec incandescence sur les percussions
 */
export function drawCelestialAurora(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	time: number,
	bassEnergy: number,
	midEnergy: number,
	palette: ThemePalette
) {
	ctx.save();
	const { cy } = getVisualizerCenter(ctx);
	const punch = palette.punch;

	const numCurtains = 5;
	for (let c = 0; c < numCurtains; c++) {
		const cNorm = c / (numCurtains - 1);
		const cTime = time * (0.6 + c * 0.15);
		const baseY = cy - height * 0.12 + cNorm * (height * 0.28);
		const curtainH = height * (0.38 + cNorm * 0.12 + bassEnergy * 0.15);

		// A. Voile volumétrique du rideau d'aurore
		ctx.beginPath();
		ctx.moveTo(0, baseY - curtainH);

		const pts = 64;
		const bottomPoints: { x: number; y: number }[] = [];

		for (let i = 0; i <= pts; i++) {
			const x = (i / pts) * width;
			const normX = (i / pts - 0.5) * 2;
			const wave1 = Math.sin(normX * 2.8 + cTime + c * 1.4) * (45 + bassEnergy * 50);
			const wave2 = Math.cos(normX * 5.2 - cTime * 0.8) * (24 + midEnergy * 30);
			const wave3 = Math.sin(normX * 8.5 + cTime * 1.2) * 12;
			const y = baseY + wave1 + wave2 + wave3;
			bottomPoints.push({ x, y });
		}

		// Remplissage du voile céleste du haut vers le bas
		ctx.lineTo(width, baseY - curtainH);
		for (let i = pts; i >= 0; i--) {
			ctx.lineTo(bottomPoints[i].x, bottomPoints[i].y);
		}
		ctx.closePath();

		const aGrad = ctx.createLinearGradient(0, baseY - curtainH, 0, baseY + 60);
		aGrad.addColorStop(0, palette.veil(0));
		aGrad.addColorStop(0.4, palette.veil(0.08 + bassEnergy * 0.1));
		aGrad.addColorStop(0.85, palette.veil(0.24 + bassEnergy * 0.2 + punch * 0.15));
		aGrad.addColorStop(1, palette.veil(0.42 + bassEnergy * 0.25 + punch * 0.22));
		ctx.fillStyle = aGrad;
		ctx.fill();

		// B. Ourlet inférieur lumineux du rideau d'aurore
		ctx.beginPath();
		ctx.moveTo(bottomPoints[0].x, bottomPoints[0].y);
		for (let i = 1; i <= pts; i++) {
			const prev = bottomPoints[i - 1];
			const curr = bottomPoints[i];
			const mx = (prev.x + curr.x) / 2;
			const my = (prev.y + curr.y) / 2;
			ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
		}
		ctx.lineTo(bottomPoints[pts].x, bottomPoints[pts].y);

		ctx.lineWidth = 2.2 + punch * 1.5;
		ctx.strokeStyle = palette.veil(0.7 + bassEnergy * 0.25 + punch * 0.2);
		ctx.shadowColor = palette.glow;
		ctx.shadowBlur = 14;
		ctx.stroke();
	}

	ctx.restore();
}

export const modeConfig: ModeConfig = {
	id: "cyber-rain",
	name: "✨ Aurora Borealis",
	render(ctx, width, height, features, palette) {
		drawCelestialAurora(ctx, width, height, features.energyTime, features.bassEnergy, features.midEnergy, palette);
	}
};
