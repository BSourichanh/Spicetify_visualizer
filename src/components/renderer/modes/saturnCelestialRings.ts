import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";

/**
 * 🪐 PLANÈTE AUX ANNEAUX & ASTROLABE CÉLESTE PLEIN ÉCRAN
 * - Vrai rendu 3D avec occultation : les anneaux passent derrière puis devant le globe planétaire
 * - Globe 3D volumétrique avec bandes atmosphériques zonales, ombrage sphérique et ombre portée des anneaux
 * - Système d'anneaux multi-bandes haute résolution : Anneau de Crêpe (C), Anneau B dense, Division de Cassini, Anneau A et Anneau F
 * - Anneaux d'astrolabe / gyroscope céleste avec index cardinaux lumineux
 * - Couronnes aurorales polaires réagissant aux percussions
 */
export function drawSaturnCelestialRings(
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
	const R = radius * (1.0 + bassEnergy * 0.18 + punch * 0.16);
	const globeR = R * 0.44;
	const ringTilt = 0.32; // Perspective elliptique des anneaux
	const axialTilt = -0.42; // Inclinaison axiale noble (~24°)

	ctx.rotate(axialTilt);

	// 1. ONDES ORBITALES CONCENTRIQUES SUR LES BASSES
	if (bassEnergy > 0.12 || punch > 0.12) {
		const waveProg = (time * 1.3) % 1;
		const waveR = globeR * (2.8 + waveProg * 2.2);
		ctx.beginPath();
		ctx.ellipse(0, 0, waveR, waveR * ringTilt, 0, 0, Math.PI * 2);
		ctx.lineWidth = 1.6 + punch * 1.4;
		ctx.strokeStyle = palette.veil((1 - waveProg) * (bassEnergy * 0.38 + punch * 0.35));
		ctx.stroke();
	}

	// 2. HALO ATMOSPHÉRIQUE DIFFUS DE LA GÉANTE GAZEUSE
	const atmosGrad = palette.radialGrad(ctx, 0, 0, globeR * 0.7, globeR * 2.5, 0.35 + bassEnergy * 0.25, 0);
	ctx.fillStyle = atmosGrad;
	ctx.beginPath();
	ctx.arc(0, 0, globeR * 2.5, 0, Math.PI * 2);
	ctx.fill();

	// 3. ANNEAUX ARRIÈRE (Hémisphère supérieur y < 0, passent DERRIÈRE le globe)
	drawRingSystem(ctx, globeR, ringTilt, time, bassEnergy, punch, palette, Math.PI, Math.PI * 2);

	// 4. GLOBE PLANÉTAIRE VOLUMÉTRIQUE 3D
	ctx.save();
	ctx.beginPath();
	ctx.arc(0, 0, globeR, 0, Math.PI * 2);
	ctx.clip();

	// A. Éclairage sphérique volumétrique 3D (Source lumineuse en haut à gauche)
	const sphereGrad = ctx.createRadialGradient(-globeR * 0.35, -globeR * 0.35, globeR * 0.08, 0, 0, globeR);
	sphereGrad.addColorStop(0, palette.highlight);
	sphereGrad.addColorStop(0.35, palette.veil(0.9 + bassEnergy * 0.1));
	sphereGrad.addColorStop(0.7, palette.veil(0.5));
	sphereGrad.addColorStop(1, palette.veil(0.2));
	ctx.fillStyle = sphereGrad;
	ctx.beginPath();
	ctx.arc(0, 0, globeR, 0, Math.PI * 2);
	ctx.fill();

	// B. Bandes nuageuses zonales atmosphériques (Saturn cloud belts)
	const numBands = 9;
	for (let b = 0; b < numBands; b++) {
		const normB = (b / (numBands - 1) - 0.5) * 2;
		const bandY = normB * globeR * 0.88;
		const bandH = globeR * 0.12;
		const bandWave = Math.sin(time * 1.6 + b * 0.9) * (globeR * 0.03);

		ctx.beginPath();
		ctx.rect(-globeR, bandY - bandH * 0.5 + bandWave, globeR * 2, bandH);
		const bandAlpha = (b % 2 === 0 ? 0.16 : 0.08) + bassEnergy * 0.08;
		ctx.fillStyle = palette.veil(bandAlpha);
		ctx.fill();
	}

	// C. Lueur crépusculaire du limbe planétaire (Fresnel atmospheric rim)
	ctx.beginPath();
	ctx.arc(0, 0, globeR, 0, Math.PI * 2);
	ctx.lineWidth = 2.4;
	ctx.strokeStyle = palette.veil(0.7 + bassEnergy * 0.25 + punch * 0.2);
	ctx.stroke();

	ctx.restore();

	// 5. COURONNES AURORALES AUX PÔLES DE LA PLANÈTE
	for (const poleSign of [-1, 1]) {
		const poleY = poleSign * globeR * 0.92;
		const auroraR = globeR * (0.24 + punch * 0.12);
		ctx.beginPath();
		ctx.ellipse(0, poleY, auroraR, auroraR * 0.35, 0, 0, Math.PI * 2);
		ctx.lineWidth = 1.4 + punch * 1.2;
		ctx.strokeStyle = palette.highlight;
		ctx.shadowColor = palette.glow;
		ctx.shadowBlur = 12;
		ctx.stroke();
	}

	// 6. ANNEAUX AVANT (Hémisphère inférieur y >= 0, passent MAJESTUEUSEMENT DEVANT le globe)
	drawRingSystem(ctx, globeR, ringTilt, time, bassEnergy, punch, palette, 0, Math.PI);

	// 7. ASTROLABE CÉLESTE & ANNEAUX ARMILLAIRES GYROSCOPIQUES
	const numArmillaries = 3;
	for (let a = 0; a < numArmillaries; a++) {
		const aAngle = time * (0.2 + a * 0.12) + a * (Math.PI / 3);
		const aRad = globeR * (2.95 + a * 0.45);
		const aTilt = 0.55 + Math.sin(time * 0.4 + a) * 0.2;

		ctx.save();
		ctx.rotate(aAngle);
		ctx.beginPath();
		ctx.ellipse(0, 0, aRad, aRad * aTilt, 0, 0, Math.PI * 2);
		ctx.lineWidth = 1.2 + (a === 0 ? punch * 0.8 : 0);
		ctx.strokeStyle = palette.veil(0.22 + a * 0.08 + bassEnergy * 0.15);
		ctx.stroke();

		// Index cardinaux lumineux sur l'astrolabe
		const numNodes = 4;
		for (let n = 0; n < numNodes; n++) {
			const na = n * (Math.PI / 2);
			const nx = Math.cos(na) * aRad;
			const ny = Math.sin(na) * aRad * aTilt;
			ctx.beginPath();
			ctx.arc(nx, ny, 2.2 + punch * 1.5, 0, Math.PI * 2);
			ctx.fillStyle = palette.highlight;
			ctx.shadowColor = palette.highlight;
			ctx.shadowBlur = 8;
			ctx.fill();
		}
		ctx.restore();
	}

	ctx.restore();
}

/**
 * Tracé haute précision des anneaux de Saturne (par demi-orbite pour occultation 3D)
 */
function drawRingSystem(
	ctx: CanvasRenderingContext2D,
	globeR: number,
	tilt: number,
	time: number,
	bassEnergy: number,
	punch: number,
	palette: ThemePalette,
	startAngle: number,
	endAngle: number
) {
	// A. Anneau C (Anneau de Crêpe - intérieur diaphane)
	ctx.beginPath();
	ctx.ellipse(0, 0, globeR * 1.36, globeR * 1.36 * tilt, 0, startAngle, endAngle);
	ctx.lineWidth = globeR * 0.16;
	ctx.strokeStyle = palette.veil(0.12 + bassEnergy * 0.1);
	ctx.stroke();

	// B. Anneau B (Anneau Majeur dense et resplendissant)
	const numSubBandsB = 5;
	for (let sb = 0; sb < numSubBandsB; sb++) {
		const subR = globeR * (1.52 + sb * 0.1);
		ctx.beginPath();
		ctx.ellipse(0, 0, subR, subR * tilt, 0, startAngle, endAngle);
		ctx.lineWidth = globeR * 0.085;
		const alpha = (sb % 2 === 0 ? 0.42 : 0.28) + bassEnergy * 0.22 + punch * 0.18;
		ctx.strokeStyle = palette.veil(alpha);
		ctx.stroke();
	}

	// C. Division de Cassini (Espace sombre non tracé entre 1.95*globeR et 2.08*globeR)

	// D. Anneau A (Anneau extérieur avec division d'Encke)
	const numSubBandsA = 4;
	for (let sa = 0; sa < numSubBandsA; sa++) {
		const subR = globeR * (2.12 + sa * 0.11);
		ctx.beginPath();
		ctx.ellipse(0, 0, subR, subR * tilt, 0, startAngle, endAngle);
		ctx.lineWidth = globeR * 0.07;
		const alpha = (sa === 1 ? 0.16 : 0.32) + bassEnergy * 0.18 + punch * 0.14;
		ctx.strokeStyle = palette.veil(alpha);
		ctx.stroke();
	}

	// E. Anneau F (Fin filament extérieur lumineux)
	ctx.beginPath();
	ctx.ellipse(0, 0, globeR * 2.68, globeR * 2.68 * tilt, 0, startAngle, endAngle);
	ctx.lineWidth = 1.8 + punch * 1.4;
	ctx.strokeStyle = palette.highlight;
	ctx.shadowColor = palette.glow;
	ctx.shadowBlur = 10;
	ctx.stroke();

	// F. Éclat sur les anses (pointes latérales des anneaux)
	if (startAngle === 0) {
		for (const ansaSign of [-1, 1]) {
			const ansaX = ansaSign * globeR * 2.1;
			ctx.beginPath();
			ctx.arc(ansaX, 0, 3.2 + punch * 2.5, 0, Math.PI * 2);
			ctx.fillStyle = palette.highlight;
			ctx.shadowColor = palette.highlight;
			ctx.shadowBlur = 14;
			ctx.fill();
		}
	}
}

export const modeConfig: ModeConfig = {
	id: "lissajous",
	name: "🪐 Anneaux Célestes de Saturne",
	render(ctx, width, height, features, palette) {
		const { cx, cy } = getVisualizerCenter(ctx);
		const radius = Math.min(width, height) * 0.32;
		drawSaturnCelestialRings(
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
