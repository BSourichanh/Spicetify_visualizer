import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";

/**
 * 🎵 HARPE DE SOIE CÉLESTE PLEIN ÉCRAN
 * - 9 cordes harmoniques déployées en rubans de soie volumétriques
 * - Enveloppes d'ondes stationnaires fermées avec drapé diaphane
 * - Nœuds et ventres harmoniques marqués par des perles résonantes de lumière
 * - Interférences et moirés soyeux réagissant aux percussions
 */
export function drawHarmonicSilkWaves(
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

	const numRibbons = 9;
	for (let r = 0; r < numRibbons; r++) {
		const rProg = r / (numRibbons - 1);
		const yBase = cy + (rProg - 0.5) * (height * 0.58);
		const harmonic = r + 1;
		const amp = (28 + bassEnergy * 48 + punch * 32) * Math.sin(time * 2.4 + r * 0.6);

		const pts = 64;
		const topPts: { x: number; y: number }[] = [];
		const botPts: { x: number; y: number }[] = [];

		for (let i = 0; i <= pts; i++) {
			const normX = i / pts;
			const x = normX * width;
			const wave = Math.sin(normX * Math.PI * harmonic) * amp;
			const thickness = (4 + bassEnergy * 10 + punch * 8) * Math.sin(normX * Math.PI);

			topPts.push({ x, y: yBase + wave - thickness });
			botPts.push({ x, y: yBase + wave + thickness });
		}

		// Ruban fermé de soie diaphane
		ctx.beginPath();
		ctx.moveTo(topPts[0].x, topPts[0].y);
		for (let i = 1; i <= pts; i++) ctx.lineTo(topPts[i].x, topPts[i].y);
		for (let i = pts; i >= 0; i--) ctx.lineTo(botPts[i].x, botPts[i].y);
		ctx.closePath();

		const ribbonAlpha = 0.12 + (1 - Math.abs(rProg - 0.5) * 2) * 0.25 + bassEnergy * 0.15;
		ctx.fillStyle = palette.veil(ribbonAlpha);
		ctx.fill();

		// Ligne d'arête lumineuse de la corde
		ctx.beginPath();
		ctx.moveTo(topPts[0].x, topPts[0].y);
		for (let i = 1; i <= pts; i++) {
			const prev = topPts[i - 1];
			const curr = topPts[i];
			const mx = (prev.x + curr.x) / 2;
			const my = (prev.y + curr.y) / 2;
			ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
		}
		ctx.lineTo(topPts[pts].x, topPts[pts].y);

		ctx.lineWidth = 1.8 + punch * 1.2;
		ctx.strokeStyle = palette.veil(0.55 + (1 - Math.abs(rProg - 0.5) * 2) * 0.35 + punch * 0.2);
		ctx.shadowColor = palette.glow;
		ctx.shadowBlur = 12;
		ctx.stroke();

		// Perles nodales aux ventres de vibration
		for (let h = 1; h <= harmonic; h++) {
			const nodeNormX = (h - 0.5) / harmonic;
			const nx = nodeNormX * width;
			const ny = yBase + Math.sin(nodeNormX * Math.PI * harmonic) * amp;

			ctx.beginPath();
			ctx.arc(nx, ny, 2.4 + punch * 1.8, 0, Math.PI * 2);
			ctx.fillStyle = palette.highlight;
			ctx.shadowColor = palette.highlight;
			ctx.shadowBlur = 8;
			ctx.fill();
		}
	}

	ctx.restore();
}

export const modeConfig: ModeConfig = {
	id: "harmonic-strings",
	name: "🌊 Sound Waves",
	render(ctx, width, height, features, palette) {
		drawHarmonicSilkWaves(
			ctx,
			width,
			height,
			features.energyTime,
			features.bassEnergy,
			features.midEnergy,
			palette
		);
	}
};
