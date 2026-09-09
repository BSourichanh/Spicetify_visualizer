import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";
import { neonCurrentManager } from "../core/neonCurrent";

/**
 * 🪼 MÉDUSE NÉBULEUSE COSMIQUE INTERSTELLAIRE PLEIN ÉCRAN
 * Rendu ultra-smooth, céleste et voluptueux :
 * - Halo stellaire & poussière nébuleuse cosmique (aura nébulaire multicouche)
 * - Ombrelle astrale multicouche (manteau céleste translucide + nuages de gaz internes)
 * - Cœur pulsar / supernova central avec radiance plasma respirant au rythme des basses
 * - 10 filaments de plasma cosmique (tentacules) drapés avec gaine gazeuse et onde bi-harmonique
 * - 4 bras oraux en rubans galactiques ondulants (prominences solaires)
 * - Propagation du courant néon céleste voyageant du cœur pulsar jusqu'aux confins des filaments
 * - 100% organique et vaporeux : ZÉRO trait rigide, ZÉRO boule géométrique
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
	palette: ThemePalette,
	midEnergy = 0.5,
	punch = palette.punch
) {
	ctx.save();

	// 1. DYNAMIQUE DE NAGE ET FLOTTEMENT EN APESANTEUR COSMIQUE
	const floatY = Math.sin(time * 0.95) * 16 + Math.cos(time * 0.48) * 8;
	const floatTilt = Math.sin(time * 0.72) * 0.035; // Légère inclinaison gravitationnelle fluide
	const currentCy = cy - radius * 0.09 + floatY;

	// Impulsion progressive et souple sur les basses (lissage hydraulique)
	const kickSurge = punch * 0.2 + Math.pow(bassEnergy, 1.25) * 0.22;
	const swimCycle = Math.sin(time * 1.45);
	const pulse = (swimCycle > 0 ? Math.pow(swimCycle, 0.85) : -Math.pow(-swimCycle, 1.15)) * 0.065 + kickSurge;
	const bellR = radius * (1.0 + pulse * 0.24);
	const bellH = radius * 0.94 * (1.0 - pulse * 0.15);

	const centerCurrent = neonCurrentManager.getCenterIntensity();
	const currentWave = neonCurrentManager.getMainWave();

	ctx.translate(cx, currentCy);
	ctx.rotate(floatTilt);
	ctx.translate(-cx, -currentCy);

	// 2. 10 FILAMENTS DE PLASMA COSMIQUE (Tentacules stellaires)
	const numTentacles = 10;
	const tentacleLen = Math.max(radius * 4.2, ctx.canvas.height - currentCy + 80);

	for (let i = 0; i < numTentacles; i++) {
		const normIdx = (i / (numTentacles - 1) - 0.5) * 2;
		const startX = cx + normIdx * (bellR * 0.82);
		const startY = currentCy + bellH * 0.42;

		const segments = 38;
		const points: { x: number; y: number }[] = [{ x: startX, y: startY }];

		for (let s = 1; s <= segments; s++) {
			const progress = s / segments;
			const segY = startY + progress * tentacleLen;
			const wavePhase1 = time * 1.7 - progress * 3.5 + i * 0.65;
			const wavePhase2 = time * 0.85 - progress * 1.7 + i * 0.35;
			const shimmer = Math.sin(time * 3.2 - progress * 6.0 + i) * (trebleEnergy * 4);
			const waveAmp = (16 + progress * 42 + bassEnergy * 26) * (1 - Math.abs(normIdx) * 0.2);
			const segX = startX + (Math.sin(wavePhase1) * 0.72 + Math.sin(wavePhase2) * 0.28) * waveAmp + shimmer;
			points.push({ x: segX, y: segY });
		}

		// Préparation de la courbe lissée
		const buildPath = () => {
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
		};

		// 2. FILAMENT CONDUCTEUR DE COURANT NÉON (Halo transparent, étincelle nette)
		buildPath();
		const tentacleGrad = ctx.createLinearGradient(startX, startY, startX, startY + tentacleLen);
		const tentacleWidth = Math.max(0.8, (1.8 - Math.abs(normIdx) * 0.4) * (i % 2 === 0 ? 1 : 0.88));

		if (currentWave && currentWave.intensity > 0.04) {
			const wavePos = Math.max(0, Math.min(1, (currentWave.wavePos - 0.12) / 0.88));
			const p0 = Math.max(0, wavePos - 0.12);
			const p1 = Math.min(1, wavePos + 0.12);

			tentacleGrad.addColorStop(0, palette.rimLight);
			if (p0 > 0) tentacleGrad.addColorStop(p0, palette.rimVeil(0.35));
			tentacleGrad.addColorStop(wavePos, palette.highlight);
			if (p1 < 1) tentacleGrad.addColorStop(p1, palette.rimVeil(0.35));
			tentacleGrad.addColorStop(1, palette.veil(0.08));
		} else {
			tentacleGrad.addColorStop(0, palette.rimLight);
			tentacleGrad.addColorStop(0.5, palette.rimVeil(0.45));
			tentacleGrad.addColorStop(1, palette.veil(0.06));
		}

		ctx.lineWidth = tentacleWidth;
		ctx.strokeStyle = tentacleGrad;
		// Halo rendu 100% transparent
		ctx.shadowBlur = 0;
		ctx.shadowColor = "transparent";
		ctx.stroke();
	}

	// 3. 4 BRAS ORAUX CONDUCTEURS (Tracé net, halo transparent)
	const numOralArms = 4;
	for (let a = 0; a < numOralArms; a++) {
		const offset = (a - 1.5) * (bellR * 0.18);
		const armStartY = currentCy + bellH * 0.24;
		const armLen = radius * 3.0;
		const armSegs = 32;
		const armPoints: { x: number; y: number }[] = [{ x: cx + offset, y: armStartY }];

		for (let s = 1; s <= armSegs; s++) {
			const prog = s / armSegs;
			const y = armStartY + prog * armLen;
			const primaryWave = Math.sin(time * 1.5 - prog * 2.8 + a * 1.25) * (18 + prog * 26 + bassEnergy * 18);
			const harmonicWave = Math.cos(time * 0.8 - prog * 1.4 + a * 0.6) * (8 + prog * 12);
			armPoints.push({ x: cx + offset + primaryWave + harmonicWave, y });
		}

		const buildArmPath = () => {
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
		};

		// Tracé du bras oral avec propagation du courant (halo transparent)
		buildArmPath();
		const armGrad = ctx.createLinearGradient(cx + offset, armStartY, cx + offset, armStartY + armLen);
		const armWidth = 2.4;

		if (currentWave && currentWave.intensity > 0.04) {
			const wavePos = Math.max(0, Math.min(1, (currentWave.wavePos - 0.08) / 0.82));
			const p0 = Math.max(0, wavePos - 0.14);
			const p1 = Math.min(1, wavePos + 0.14);

			armGrad.addColorStop(0, palette.rimLight);
			if (p0 > 0) armGrad.addColorStop(p0, palette.rimVeil(0.4));
			armGrad.addColorStop(wavePos, palette.highlight);
			if (p1 < 1) armGrad.addColorStop(p1, palette.rimVeil(0.4));
			armGrad.addColorStop(1, palette.veil(0.08));
		} else {
			armGrad.addColorStop(0, palette.rimLight);
			armGrad.addColorStop(0.6, palette.rimVeil(0.45));
			armGrad.addColorStop(1, palette.veil(0.06));
		}

		ctx.lineWidth = armWidth;
		ctx.strokeStyle = armGrad;
		// Halo transparent
		ctx.shadowBlur = 0;
		ctx.shadowColor = "transparent";
		ctx.stroke();
	}

	// 4. OMBRELLE ASTRALE MULTICOUCHE (Manteau nébulaire céleste)
	// 4.A. Contour complet de l'ombrelle
	const traceBellContour = () => {
		ctx.beginPath();
		ctx.moveTo(cx, currentCy - bellH);
		ctx.bezierCurveTo(
			cx + bellR * 1.02,
			currentCy - bellH * 0.74,
			cx + bellR * 1.18,
			currentCy + bellH * 0.28,
			cx + bellR * 0.9,
			currentCy + bellH * 0.46
		);

		// Bord inférieur aux ondulations cosmiques voluptueuses (12 festons soyeux)
		const scallops = 12;
		for (let j = scallops; j >= 0; j--) {
			const p = j / scallops;
			const x = cx + (p * 2 - 1) * (bellR * 0.9);
			const flutter = Math.sin(time * 2.4 + j * 1.1) * (4 + bassEnergy * 7);
			const y = currentCy + bellH * 0.46 + flutter;
			if (j === scallops) ctx.lineTo(x, y);
			else ctx.quadraticCurveTo(x + bellR * 0.05, y - 6, x, y);
		}

		ctx.bezierCurveTo(
			cx - bellR * 1.18,
			currentCy + bellH * 0.28,
			cx - bellR * 1.02,
			currentCy - bellH * 0.74,
			cx,
			currentCy - bellH
		);
		ctx.closePath();
	};

	// 4.B. Remplissage du manteau nébulaire externe (intérieur sombre et translucide)
	traceBellContour();
	const bellGrad = ctx.createLinearGradient(cx, currentCy - bellH, cx, currentCy + bellH * 0.5);
	bellGrad.addColorStop(0, palette.veil(0.18 + bassEnergy * 0.08));
	bellGrad.addColorStop(0.4, palette.veil(0.09));
	bellGrad.addColorStop(1, palette.veil(0.03));
	ctx.fillStyle = bellGrad;
	ctx.fill();

	// Bordures nettement plus claires que l'intérieur (effet Fresnel / liseré néon lumineux)
	ctx.save();
	traceBellContour();
	ctx.clip();
	// Liseré interne diffus clair le long du contour
	ctx.lineWidth = 9.0 + punch * 2.0;
	ctx.strokeStyle = palette.rimVeil(0.55);
	ctx.shadowBlur = 14;
	ctx.shadowColor = palette.rimLight;
	ctx.stroke();
	ctx.restore();

	// Tracé de bordure éclatant et lumineux (plus clair que l'intérieur)
	traceBellContour();
	ctx.lineWidth = 2.4 + punch * 0.8;
	ctx.strokeStyle = palette.rimLight;
	ctx.shadowColor = palette.rimLight;
	ctx.shadowBlur = 16 + punch * 10;
	ctx.stroke();

	// 4.C. Voiles de gaz nébulaire intérieurs à l'ombrelle (profondeur cosmique)
	ctx.save();
	traceBellContour();
	ctx.clip(); // Limiter les voiles intérieurs à l'intérieur même de l'ombrelle

	// Voile supérieur de plasma céleste (doux et discret)
	const upperPlasma = ctx.createRadialGradient(
		cx,
		currentCy - bellH * 0.5,
		0,
		cx,
		currentCy - bellH * 0.4,
		bellR * 0.8
	);
	upperPlasma.addColorStop(0, palette.veil(0.1 + bassEnergy * 0.06));
	upperPlasma.addColorStop(0.5, palette.veil(0.04));
	upperPlasma.addColorStop(1, palette.veil(0));
	ctx.fillStyle = upperPlasma;
	ctx.fillRect(cx - bellR * 1.3, currentCy - bellH * 1.1, bellR * 2.6, bellH * 1.8);

	// Rideau d'aurore astrale ondulant dans la cavité
	for (let f = 0; f < 3; f++) {
		const fOffset = (f - 1) * (bellR * 0.35);
		const fAmp = Math.sin(time * 1.8 + f * 1.4) * (bellR * 0.12);
		ctx.beginPath();
		ctx.moveTo(cx + fOffset, currentCy - bellH * 0.7);
		ctx.quadraticCurveTo(
			cx + fOffset + fAmp,
			currentCy - bellH * 0.1,
			cx + fOffset * 1.2,
			currentCy + bellH * 0.45
		);
		ctx.lineWidth = 8.0 + bassEnergy * 4;
		ctx.strokeStyle = palette.veil(0.05);
		ctx.shadowBlur = 12;
		ctx.shadowColor = palette.glow;
		ctx.stroke();
	}
	ctx.restore();

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
			palette,
			features.midEnergy,
			features.punch
		);
	}
};
