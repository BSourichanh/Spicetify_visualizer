import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";

/**
 * 🪼 MÉDUSE BIOLUMINESCENTE CÉLESTE PLEIN ÉCRAN
 * - Double ombrelle organique (voile externe + cloche viscérale)
 * - 8 canaux musculaires radiaux incandescents
 * - 10 tentacules majeurs drapant toute la hauteur de l'écran avec impulsions voyageuses
 * - 16 filaments de soie fins sensibles aux aigus
 * - 4 bras oraux voluptueux ondulant au centre
 * - Organes sensoriels marginaux (rhopalia) et ondes hydrodynamiques expansives
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

	const floatY = Math.sin(time * 1.8) * 16;
	const currentCy = cy - radius * 0.08 + floatY;

	const punch = palette.punch;
	const kickSurge = punch * 0.35 + bassEnergy * 0.28;
	const pulse = Math.sin(time * 2.2) * 0.08 + kickSurge;
	const bellR = radius * (1 + pulse * 0.28);
	const bellH = radius * 0.88 * (1 - pulse * 0.18);

	// 1. ONDES HYDRODYNAMIQUES EXPANSIVES SUR LES BASSES ET LE PUNCH
	if (bassEnergy > 0.14 || punch > 0.14) {
		const waveProgress = (time * 1.5) % 1;
		const waveRadius = bellR * (1.05 + waveProgress * 1.8);
		const waveAlpha = (1 - waveProgress) * (bassEnergy * 0.45 + punch * 0.4);
		ctx.beginPath();
		ctx.arc(cx, currentCy, waveRadius, 0, Math.PI * 2);
		ctx.lineWidth = 1.6 + punch * 1.4;
		ctx.strokeStyle = palette.veil(waveAlpha);
		ctx.stroke();
	}

	// 2. AURA DE RADIANCE RADIALE DOUCE ET ÉPURÉE (SANS SPIRALES AU CENTRE)
	const auraR = bellR * 2.0;
	const auraGrad = palette.radialGrad(ctx, cx, currentCy, 0, auraR, 0.24 + bassEnergy * 0.22 + punch * 0.18, 0);
	ctx.fillStyle = auraGrad;
	ctx.beginPath();
	ctx.arc(cx, currentCy, auraR, 0, Math.PI * 2);
	ctx.fill();

	// 3. 16 CILS VIBRATILES FINS (Sensibles aux aigus / Shimmer)
	const numCilia = 16;
	for (let c = 0; c < numCilia; c++) {
		const normIdx = (c / (numCilia - 1) - 0.5) * 2;
		const startX = cx + normIdx * (bellR * 0.78);
		const startY = currentCy + bellH * 0.42;

		ctx.beginPath();
		ctx.moveTo(startX, startY);
		const cilLen = radius * (1.8 + trebleEnergy * 0.8);
		const cilSegs = 14;

		for (let s = 1; s <= cilSegs; s++) {
			const prog = s / cilSegs;
			const y = startY + prog * cilLen;
			const wave = Math.sin(time * 5.2 - prog * 6.0 + c * 0.9) * (8 + prog * 16 + trebleEnergy * 20);
			ctx.lineTo(startX + wave, y);
		}

		ctx.lineWidth = 0.8;
		ctx.strokeStyle = palette.veil(0.18 + trebleEnergy * 0.25);
		ctx.stroke();
	}

	// 4. 10 TENTACULES MAJEURS DRAPANT TOUTE LA HAUTEUR AVEC IMPULSIONS VOYAGEUSES
	const numTentacles = 10;
	// Drapent largement vers le bas
	const tentacleLen = Math.max(radius * 4.2, ctx.canvas.height - currentCy + 80);

	for (let i = 0; i < numTentacles; i++) {
		const normIdx = (i / (numTentacles - 1) - 0.5) * 2;
		const startX = cx + normIdx * (bellR * 0.82);
		const startY = currentCy + bellH * 0.4;

		const segments = 36;
		const points: { x: number; y: number }[] = [{ x: startX, y: startY }];

		for (let s = 1; s <= segments; s++) {
			const progress = s / segments;
			const segY = startY + progress * tentacleLen;
			const wavePhase = time * 3.4 - progress * 5.0 + i * 0.75;
			const waveAmp = (18 + progress * 48 + bassEnergy * 40) * (1 - Math.abs(normIdx) * 0.25);
			const segX = startX + Math.sin(wavePhase) * waveAmp;
			points.push({ x: segX, y: segY });
		}

		// Tracé du tentacule
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

		ctx.lineWidth = Math.max(0.6, (2.2 - Math.abs(normIdx) * 0.6) * (i % 2 === 0 ? 1 : 0.8));
		ctx.strokeStyle = palette.veil(0.42 - Math.abs(normIdx) * 0.12 + bassEnergy * 0.28);
		ctx.shadowColor = palette.glow;
		ctx.shadowBlur = 10;
		ctx.stroke();

		// IMPULSIONS BIOLUMINESCENTES VOYAGEUSES (Action potential / perles de lumière)
		const pulseProgress = (time * 1.6 + i * 0.28) % 1;
		const pulseIdx = Math.floor(pulseProgress * (points.length - 1));
		const pPoint = points[pulseIdx];
		if (pPoint) {
			const pRad = (2.4 + bassEnergy * 2.8) * (1 - pulseProgress * 0.5);
			ctx.beginPath();
			ctx.arc(pPoint.x, pPoint.y, pRad, 0, Math.PI * 2);
			ctx.fillStyle = palette.highlight;
			ctx.shadowColor = palette.highlight;
			ctx.shadowBlur = 14;
			ctx.fill();
		}
	}

	// 5. 4 BRAS ORAUX VOLUPTUEUX EN DENTELLE DE SOIE
	const numOralArms = 4;
	for (let a = 0; a < numOralArms; a++) {
		const offset = (a - 1.5) * (bellR * 0.16);
		ctx.beginPath();
		ctx.moveTo(cx + offset, currentCy + bellH * 0.22);

		const armLen = radius * 2.8;
		const armSegs = 24;
		for (let s = 1; s <= armSegs; s++) {
			const prog = s / armSegs;
			const y = currentCy + bellH * 0.22 + prog * armLen;
			const wave = Math.sin(time * 3.0 - prog * 4.2 + a * 1.4) * (22 + prog * 32 + bassEnergy * 24);
			ctx.lineTo(cx + offset + wave, y);
		}

		ctx.lineWidth = 3.2;
		ctx.strokeStyle = palette.veil(0.62 + bassEnergy * 0.32);
		ctx.shadowBlur = 14;
		ctx.stroke();
	}

	// 6. OMBRELLE EXTÉRIEURE TRANSPARENTE
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

	// Bord inférieur avec festons ondulants (12 lobes)
	const scallops = 10;
	for (let j = scallops; j >= 0; j--) {
		const p = j / scallops;
		const x = cx + (p * 2 - 1) * (bellR * 0.88);
		const flutter = Math.sin(time * 5.0 + j * 1.4) * (5 + bassEnergy * 10);
		const y = currentCy + bellH * 0.46 + flutter;
		if (j === scallops) ctx.lineTo(x, y);
		else ctx.quadraticCurveTo(x + bellR * 0.07, y - 10, x, y);
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
	bellGrad.addColorStop(0, palette.veil(0.36 + bassEnergy * 0.22));
	bellGrad.addColorStop(0.55, palette.veil(0.16));
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
		ctx.strokeStyle = palette.veil(0.24 + bassEnergy * 0.2);
		ctx.stroke();

		// Nœuds sensoriels marginaux (Rhopalia)
		ctx.beginPath();
		ctx.arc(ribEndX, ribEndY, 2.2 + bassEnergy * 2.5 + punch * 2.0, 0, Math.PI * 2);
		ctx.fillStyle = palette.highlight;
		ctx.fill();
	}

	// 8. CLOCHE VISCÉRALE INTÉRIEURE & CŒUR BIOLUMINESCENT
	ctx.beginPath();
	ctx.ellipse(cx, currentCy - bellH * 0.08, bellR * 0.48, bellH * 0.42, 0, 0, Math.PI * 2);
	ctx.fillStyle = palette.veil(0.26 + bassEnergy * 0.28);
	ctx.fill();

	const heartR = Math.max(6, radius * 0.14 * (1 + bassEnergy * 0.65 + punch * 0.45));
	const heartGrad = ctx.createRadialGradient(
		cx,
		currentCy - bellH * 0.08,
		0,
		cx,
		currentCy - bellH * 0.08,
		heartR * 2.4
	);
	heartGrad.addColorStop(0, palette.highlight);
	heartGrad.addColorStop(0.35, palette.veil(0.8));
	heartGrad.addColorStop(1, palette.veil(0));
	ctx.fillStyle = heartGrad;
	ctx.beginPath();
	ctx.arc(cx, currentCy - bellH * 0.08, heartR * 2.4, 0, Math.PI * 2);
	ctx.fill();

	ctx.restore();
}

export const modeConfig: ModeConfig = {
	id: "cyber-rings",
	name: "🪼 Méduse Céleste (Jellyfish)",
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
