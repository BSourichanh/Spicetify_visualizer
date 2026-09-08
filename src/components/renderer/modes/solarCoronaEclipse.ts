import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";

/**
 * ☀️ L'ÉCLIPSE CÉLESTE & COURONNE DU PHÉNIX PLEIN ÉCRAN
 * - Silhouette obsidienne de l'éclipse totale avec chromosphère incandescente
 * - 8 grands casques coronaux aérodynamiques déployés comme les ailes d'un phénix
 * - Boucles de plasma et protubérances magnétiques jaillissant du limbe solaire
 * - Éclair diamanté (Baily's Beads / Anneau de Diamant) sur les percussions et le punch
 * - Filaments magnétiques dipolaires rayonnant sur 360 degrés
 */
export function drawSolarCoronaEclipse(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	radius: number,
	time: number,
	bassEnergy: number,
	midEnergy: number,
	palette: ThemePalette
) {
	ctx.save();
	ctx.translate(cx, cy);

	const punch = palette.punch;
	const lunarR = radius * (0.36 + bassEnergy * 0.08);
	const maxCoronaR = Math.max(radius * 3.2, ctx.canvas.width * 0.48);

	// 1. ONDES MAGNÉTOSPHÉRIQUES CONCENTRIQUES SUR LES BASSES
	if (bassEnergy > 0.12 || punch > 0.12) {
		const waveProg = (time * 1.4) % 1;
		const waveR = lunarR * (1.1 + waveProg * 3.0);
		ctx.beginPath();
		ctx.arc(0, 0, waveR, 0, Math.PI * 2);
		ctx.lineWidth = 1.6 + punch * 1.4;
		ctx.strokeStyle = palette.veil((1 - waveProg) * (bassEnergy * 0.4 + punch * 0.38));
		ctx.stroke();
	}

	// 2. HALO CORONAL VAPOREUX PROFOND
	const corGrad = palette.radialGrad(ctx, 0, 0, lunarR * 0.85, maxCoronaR, 0.42 + bassEnergy * 0.28 + punch * 0.2, 0);
	ctx.fillStyle = corGrad;
	ctx.beginPath();
	ctx.arc(0, 0, maxCoronaR, 0, Math.PI * 2);
	ctx.fill();

	// 3. 8 GRANDS CASQUES CORONAUX DU PHÉNIX (Streamers aérodynamiques majestueux)
	const numStreamers = 8;
	for (let s = 0; s < numStreamers; s++) {
		const baseAngle = (s / numStreamers) * Math.PI * 2 + time * 0.08;
		const streamLen = maxCoronaR * (0.65 + Math.sin(time * 2.2 + s * 1.5) * 0.2 + bassEnergy * 0.35);
		const spread = 0.22;

		const x0 = Math.cos(baseAngle - spread) * lunarR;
		const y0 = Math.sin(baseAngle - spread) * lunarR;
		const x1 = Math.cos(baseAngle + spread) * lunarR;
		const y1 = Math.sin(baseAngle + spread) * lunarR;

		const tipX = Math.cos(baseAngle) * streamLen;
		const tipY = Math.sin(baseAngle) * streamLen;

		const cpx1 = Math.cos(baseAngle - spread * 0.5) * (lunarR * 1.8);
		const cpy1 = Math.sin(baseAngle - spread * 0.5) * (lunarR * 1.8);
		const cpx2 = Math.cos(baseAngle + spread * 0.5) * (lunarR * 1.8);
		const cpy2 = Math.sin(baseAngle + spread * 0.5) * (lunarR * 1.8);

		ctx.beginPath();
		ctx.moveTo(x0, y0);
		ctx.quadraticCurveTo(cpx1, cpy1, tipX, tipY);
		ctx.quadraticCurveTo(cpx2, cpy2, x1, y1);
		ctx.closePath();

		const sGrad = ctx.createRadialGradient(0, 0, lunarR, 0, 0, streamLen);
		sGrad.addColorStop(0, palette.veil(0.28 + bassEnergy * 0.2));
		sGrad.addColorStop(0.6, palette.veil(0.1 + punch * 0.12));
		sGrad.addColorStop(1, palette.veil(0));
		ctx.fillStyle = sGrad;
		ctx.fill();

		ctx.lineWidth = 1.4 + punch * 0.8;
		ctx.strokeStyle = palette.veil(0.35 + bassEnergy * 0.25);
		ctx.stroke();
	}

	// 4. 28 BOUCLES MAGNÉTIQUES & PROTUBÉRANCES DU LIMBE SOLAIRE
	const numProminences = 28;
	for (let p = 0; p < numProminences; p++) {
		const angle = (p / numProminences) * Math.PI * 2 + time * 0.14;
		const loopH = lunarR * (1.18 + Math.sin(time * 3.5 + p * 1.8) * 0.2 + bassEnergy * 0.45);
		const loopWidth = 0.08;

		const px1 = Math.cos(angle - loopWidth) * lunarR;
		const py1 = Math.sin(angle - loopWidth) * lunarR;
		const px2 = Math.cos(angle + loopWidth) * lunarR;
		const py2 = Math.sin(angle + loopWidth) * lunarR;
		const cxLoop = Math.cos(angle) * loopH;
		const cyLoop = Math.sin(angle) * loopH;

		ctx.beginPath();
		ctx.moveTo(px1, py1);
		ctx.quadraticCurveTo(cxLoop, cyLoop, px2, py2);
		ctx.lineWidth = 1.4;
		ctx.strokeStyle = palette.veil(0.45 + bassEnergy * 0.35);
		ctx.shadowColor = palette.glow;
		ctx.shadowBlur = 10;
		ctx.stroke();
	}

	// 5. CHROMOSPHÈRE INCANDESCENTE ÉTINCELANTE
	ctx.beginPath();
	ctx.arc(0, 0, lunarR, 0, Math.PI * 2);
	ctx.lineWidth = 3.2 + punch * 2.0;
	ctx.strokeStyle = palette.highlight;
	ctx.shadowColor = palette.highlight;
	ctx.shadowBlur = 18;
	ctx.stroke();

	// 6. DISQUE OBSIDIEN DE L'ÉCLIPSE TOTALE (Translucide & aéré avec dégradé subtil)
	const moonGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, lunarR * 0.98);
	moonGrad.addColorStop(0, "rgba(4, 6, 12, 0.2)");
	moonGrad.addColorStop(0.8, "rgba(4, 6, 12, 0.55)");
	moonGrad.addColorStop(1, palette.veil(0.65));
	ctx.beginPath();
	ctx.arc(0, 0, lunarR * 0.98, 0, Math.PI * 2);
	ctx.fillStyle = moonGrad;
	ctx.fill();

	// 7. ANNEAU DE DIAMANT / GRAINS DE BAILY SUR LES KICKS
	if (punch > 0.15 || bassEnergy > 0.55) {
		const flashAngle = -0.65; // Position 2h sur le cadran
		const beadX = Math.cos(flashAngle) * lunarR;
		const beadY = Math.sin(flashAngle) * lunarR;
		const beadR = 5 + punch * 10;

		// Cœur du diamant
		ctx.beginPath();
		ctx.arc(beadX, beadY, beadR, 0, Math.PI * 2);
		ctx.fillStyle = "#ffffff";
		ctx.shadowColor = palette.highlight;
		ctx.shadowBlur = 24;
		ctx.fill();

		// Rayons de diffraction éclatants projetés vers l'extérieur
		const rayLen = lunarR * (1.2 + punch * 1.5);
		const rayAngles = [
			flashAngle,
			flashAngle - Math.PI * 0.35,
			flashAngle + Math.PI * 0.35,
			flashAngle - Math.PI * 0.5,
			flashAngle + Math.PI * 0.5
		];
		for (const da of rayAngles) {
			ctx.beginPath();
			ctx.moveTo(beadX, beadY);
			ctx.lineTo(beadX + Math.cos(da) * rayLen, beadY + Math.sin(da) * rayLen);
			ctx.lineWidth = 1.6 + punch * 1.2;
			ctx.strokeStyle = palette.highlight;
			ctx.stroke();
		}
	}

	ctx.restore();
}

export const modeConfig: ModeConfig = {
	id: "solar-flare",
	name: "☀️ Éclipse Stellaire & Couronne",
	render(ctx, width, height, features, palette) {
		const { cx, cy } = getVisualizerCenter(ctx);
		const radius = Math.min(width, height) * 0.3;
		drawSolarCoronaEclipse(
			ctx,
			cx,
			cy,
			radius,
			features.energyTime,
			features.bassEnergy,
			features.midEnergy,
			palette
		);
	}
};
