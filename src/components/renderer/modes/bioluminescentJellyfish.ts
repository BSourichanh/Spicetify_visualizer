import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";

/**
 * 🪼 MÉDUSE BIOLUMINESCENTE CÉLESTE PLEIN ÉCRAN
 * Rendu ultra-smooth, aquatique et soyeux :
 * - Double ombrelle organique (voile externe + cloche viscérale)
 * - Nage fluide avec inertie hydraulique (cycle de pulsation doux et naturel)
 * - 8 canaux musculaires radiaux incandescents
 * - 10 tentacules majeurs drapant toute la hauteur avec ondulation bi-harmonique continue
 * - Interpolation sub-pixel fluide des impulsions bioluminescentes voyageuses
 * - 16 cils vibratiles fins et soyeux (fréquences calmes)
 * - 4 bras oraux voluptueux avec lissage quadratique complet
 * - Flottement en apesanteur sous-marine non périodique
 */
export function drawBioluminescentJellyfish(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	radius: number,
	time: number,
	beatProgress: number,
	bassEnergy: number,
	trebleEnergy: number,
	palette: ThemePalette
) {
	ctx.save();

	// Flottement calme et majestueux en apesanteur liquide
	const floatY = Math.sin(time * 1.2) * 14 + Math.cos(time * 0.6) * 6;
	const currentCy = cy - radius * 0.08 + floatY;

	const punch = palette.punch;
	// Lissage hydraulique : impulsion progressive plutôt que saccadée
	const kickSurge = punch * 0.18 + Math.pow(bassEnergy, 1.2) * 0.18;
	// Cycle natatoire fluide (contraction tonique puis détente progressive)
	const swimCycle = Math.sin(time * 1.5);
	const pulse = (swimCycle > 0 ? Math.pow(swimCycle, 0.85) : -Math.pow(-swimCycle, 1.15)) * 0.06 + kickSurge;
	const bellR = radius * (1 + pulse * 0.22);
	const bellH = radius * 0.88 * (1 - pulse * 0.14);

	// 1. ONDES HYDRODYNAMIQUES DOUCES SUR LES BASSES
	if (bassEnergy > 0.18 || punch > 0.18) {
		const waveProgress = (time * 1.1) % 1;
		const waveRadius = bellR * (1.05 + waveProgress * 1.6);
		const waveAlpha = (1 - waveProgress) * (bassEnergy * 0.35 + punch * 0.3);
		ctx.beginPath();
		ctx.arc(cx, currentCy, waveRadius, 0, Math.PI * 2);
		ctx.lineWidth = 1.4 + punch * 1.0;
		ctx.strokeStyle = palette.veil(waveAlpha);
		ctx.stroke();
	}

	// 2. AURA DE RADIANCE RADIALE DOUCE ET ÉPURÉE
	const auraR = bellR * 1.9;
	const auraGrad = palette.radialGrad(ctx, cx, currentCy, 0, auraR, 0.22 + bassEnergy * 0.18 + punch * 0.14, 0);
	ctx.fillStyle = auraGrad;
	ctx.beginPath();
	ctx.arc(cx, currentCy, auraR, 0, Math.PI * 2);
	ctx.fill();

	// 3. 16 CILS VIBRATILES SOYEUX (Sensibles aux aigus / Shimmer doux)
	const numCilia = 16;
	for (let c = 0; c < numCilia; c++) {
		const normIdx = (c / (numCilia - 1) - 0.5) * 2;
		const startX = cx + normIdx * (bellR * 0.78);
		const startY = currentCy + bellH * 0.42;

		ctx.beginPath();
		ctx.moveTo(startX, startY);
		const cilLen = radius * (1.6 + trebleEnergy * 0.6);
		const cilSegs = 14;

		for (let s = 1; s <= cilSegs; s++) {
			const prog = s / cilSegs;
			const y = startY + prog * cilLen;
			const wave = Math.sin(time * 2.2 - prog * 3.6 + c * 0.85) * (5 + prog * 11 + trebleEnergy * 12);
			ctx.lineTo(startX + wave, y);
		}

		ctx.lineWidth = 0.8;
		ctx.strokeStyle = palette.veil(0.18 + trebleEnergy * 0.22);
		ctx.stroke();
	}

	// 4. 10 TENTACULES MAJEURS DRAPANT AVEC ONDULATION BI-HARMONIQUE SOYEUSE
	const numTentacles = 10;
	const tentacleLen = Math.max(radius * 4.0, ctx.canvas.height - currentCy + 60);

	for (let i = 0; i < numTentacles; i++) {
		const normIdx = (i / (numTentacles - 1) - 0.5) * 2;
		const startX = cx + normIdx * (bellR * 0.82);
		const startY = currentCy + bellH * 0.4;

		const segments = 36;
		const points: { x: number; y: number }[] = [{ x: startX, y: startY }];

		for (let s = 1; s <= segments; s++) {
			const progress = s / segments;
			const segY = startY + progress * tentacleLen;
			const wavePhase1 = time * 1.8 - progress * 3.6 + i * 0.65;
			const wavePhase2 = time * 0.9 - progress * 1.8 + i * 0.35;
			const waveAmp = (14 + progress * 38 + bassEnergy * 24) * (1 - Math.abs(normIdx) * 0.22);
			const segX = startX + (Math.sin(wavePhase1) * 0.72 + Math.sin(wavePhase2) * 0.28) * waveAmp;
			points.push({ x: segX, y: segY });
		}

		// Tracé lissé par courbes quadratiques continues
		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);
		for (let s = 1; s < points.length; s++) {
			const prev = points[s - 1];
			const curr = points[s];
			const midX = (prev.x + curr.x) / 2;
			const midY = (prev.y + curr.y) / 2;
			ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
		}
		ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

		ctx.lineWidth = Math.max(0.6, (2.0 - Math.abs(normIdx) * 0.5) * (i % 2 === 0 ? 1 : 0.85));
		ctx.strokeStyle = palette.veil(0.4 - Math.abs(normIdx) * 0.1 + bassEnergy * 0.24);
		ctx.shadowColor = palette.glow;
		ctx.shadowBlur = 10;
		ctx.stroke();

		// IMPULSIONS BIOLUMINESCENTES VOYAGEUSES FLUIDES (Interpolation sub-pixel)
		const pulseProgress = (time * 1.1 + i * 0.24) % 1;
		const exactIdx = pulseProgress * (points.length - 1);
		const idx0 = Math.floor(exactIdx);
		const idx1 = Math.min(points.length - 1, idx0 + 1);
		const frac = exactIdx - idx0;
		const p0 = points[idx0];
		const p1 = points[idx1];
		if (p0 && p1) {
			const px = p0.x + (p1.x - p0.x) * frac;
			const py = p0.y + (p1.y - p0.y) * frac;
			const pRad = (2.2 + bassEnergy * 1.8) * (1 - pulseProgress * 0.4);
			ctx.beginPath();
			ctx.arc(px, py, pRad, 0, Math.PI * 2);
			ctx.fillStyle = palette.highlight;
			ctx.shadowColor = palette.highlight;
			ctx.shadowBlur = 12;
			ctx.fill();
		}
	}

	// 5. 4 BRAS ORAUX VOLUPTUEUX EN DENTELLE DE SOIE LISSÉE
	const numOralArms = 4;
	for (let a = 0; a < numOralArms; a++) {
		const offset = (a - 1.5) * (bellR * 0.16);
		const armStartY = currentCy + bellH * 0.22;
		const armLen = radius * 2.8;
		const armSegs = 28;
		const armPoints: { x: number; y: number }[] = [{ x: cx + offset, y: armStartY }];

		for (let s = 1; s <= armSegs; s++) {
			const prog = s / armSegs;
			const y = armStartY + prog * armLen;
			const wave = Math.sin(time * 1.6 - prog * 3.0 + a * 1.2) * (16 + prog * 24 + bassEnergy * 16);
			armPoints.push({ x: cx + offset + wave, y });
		}

		ctx.beginPath();
		ctx.moveTo(armPoints[0].x, armPoints[0].y);
		for (let s = 1; s < armPoints.length; s++) {
			const prev = armPoints[s - 1];
			const curr = armPoints[s];
			const midX = (prev.x + curr.x) / 2;
			const midY = (prev.y + curr.y) / 2;
			ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
		}
		ctx.lineTo(armPoints[armPoints.length - 1].x, armPoints[armPoints.length - 1].y);

		ctx.lineWidth = 2.8;
		ctx.strokeStyle = palette.veil(0.55 + bassEnergy * 0.24);
		ctx.shadowBlur = 12;
		ctx.stroke();
	}

	// 6. OMBRELLE EXTÉRIEURE TRANSPARENTE ET SOYEUSE
	ctx.beginPath();
	ctx.moveTo(cx, currentCy - bellH);
	ctx.bezierCurveTo(
		cx + bellR * 0.98,
		currentCy - bellH * 0.72,
		cx + bellR * 1.15,
		currentCy + bellH * 0.28,
		cx + bellR * 0.88,
		currentCy + bellH * 0.46
	);

	// Bord inférieur avec festons ondulants doux (10 lobes)
	const scallops = 10;
	for (let j = scallops; j >= 0; j--) {
		const p = j / scallops;
		const x = cx + (p * 2 - 1) * (bellR * 0.88);
		const flutter = Math.sin(time * 2.2 + j * 1.2) * (3 + bassEnergy * 6);
		const y = currentCy + bellH * 0.46 + flutter;
		if (j === scallops) ctx.lineTo(x, y);
		else ctx.quadraticCurveTo(x + bellR * 0.06, y - 6, x, y);
	}

	ctx.bezierCurveTo(
		cx - bellR * 1.15,
		currentCy + bellH * 0.28,
		cx - bellR * 0.98,
		currentCy - bellH * 0.72,
		cx,
		currentCy - bellH
	);
	ctx.closePath();

	const bellGrad = ctx.createLinearGradient(cx, currentCy - bellH, cx, currentCy + bellH * 0.5);
	bellGrad.addColorStop(0, palette.veil(0.34 + bassEnergy * 0.2));
	bellGrad.addColorStop(0.55, palette.veil(0.15));
	bellGrad.addColorStop(1, palette.veil(0.04));
	ctx.fillStyle = bellGrad;
	ctx.fill();

	ctx.lineWidth = 1.8;
	ctx.strokeStyle = palette.solid;
	ctx.shadowColor = palette.glow;
	ctx.shadowBlur = 16;
	ctx.stroke();

	// 7. 8 CANAUX MUSCULAIRES RADIAUX DE L'OMBRELLE
	for (let r = 0; r < 8; r++) {
		const normR = (r / 7 - 0.5) * 2;
		const ribEndX = cx + normR * (bellR * 0.82);
		const ribEndY = currentCy + bellH * 0.44;

		ctx.beginPath();
		ctx.moveTo(cx, currentCy - bellH * 0.88);
		ctx.quadraticCurveTo(cx + normR * (bellR * 0.95), currentCy - bellH * 0.1, ribEndX, ribEndY);
		ctx.lineWidth = 1.2;
		ctx.strokeStyle = palette.veil(0.22 + bassEnergy * 0.18);
		ctx.stroke();

		// Nœuds sensoriels marginaux (Rhopalia)
		ctx.beginPath();
		ctx.arc(ribEndX, ribEndY, 2.0 + bassEnergy * 2.0 + punch * 1.6, 0, Math.PI * 2);
		ctx.fillStyle = palette.highlight;
		ctx.fill();
	}

	// 8. CLOCHE VISCÉRALE INTÉRIEURE & CŒUR BIOLUMINESCENT
	ctx.beginPath();
	ctx.ellipse(cx, currentCy - bellH * 0.08, bellR * 0.48, bellH * 0.42, 0, 0, Math.PI * 2);
	ctx.fillStyle = palette.veil(0.24 + bassEnergy * 0.22);
	ctx.fill();

	const heartR = Math.max(6, radius * 0.14 * (1 + bassEnergy * 0.38 + punch * 0.22));
	const heartGrad = ctx.createRadialGradient(
		cx,
		currentCy - bellH * 0.08,
		0,
		cx,
		currentCy - bellH * 0.08,
		heartR * 2.2
	);
	heartGrad.addColorStop(0, palette.highlight);
	heartGrad.addColorStop(0.35, palette.veil(0.75));
	heartGrad.addColorStop(1, palette.veil(0));
	ctx.fillStyle = heartGrad;
	ctx.beginPath();
	ctx.arc(cx, currentCy - bellH * 0.08, heartR * 2.2, 0, Math.PI * 2);
	ctx.fill();

	ctx.restore();
}

export const modeConfig: ModeConfig = {
	id: "cyber-rings",
	name: "🪼 Jellyfish",
	render(ctx, width, height, features, palette) {
		const { cx, cy } = getVisualizerCenter(ctx);
		const baseRadius = Math.min(width * 0.24, height * 0.22);
		drawBioluminescentJellyfish(
			ctx,
			cx,
			cy,
			baseRadius,
			features.energyTime,
			0,
			features.bassEnergy,
			features.trebleEnergy,
			palette
		);
	}
};
