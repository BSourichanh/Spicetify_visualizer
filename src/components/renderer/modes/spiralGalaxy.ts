import { ThemePalette } from "../core/palette";

/**
 * 🌌 GALAXIE SPIRALE LOGARITHMIQUE PLEIN ÉCRAN
 * - 4 grands bras spiraux volumétriques nébuleux
 * - Cœur stellaire profond & halo du bulbe galactique
 * - Amas stellaires et nébuleuses d'émission le long des bras
 * - Ondes de densité spirale sur les kicks
 */
export function drawSpiralGalaxy(
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
	const rot = time * (0.2 + bassEnergy * 0.12);
	ctx.rotate(rot);

	const maxGalR = Math.max(radius * 2.2, ctx.canvas.width * 0.65);
	const tilt = 0.68; // Inclinaison galactique 3D noble

	// 1. ONDES DE DENSITÉ SPIRALE (Shockwaves galactiques concentriques)
	if (bassEnergy > 0.14 || punch > 0.14) {
		for (let w = 0; w < 2; w++) {
			const waveProg = (time * 1.2 + w * 0.5) % 1;
			const waveR = radius * (0.6 + waveProg * 2.2);
			ctx.beginPath();
			ctx.ellipse(0, 0, waveR, waveR * tilt, 0, 0, Math.PI * 2);
			ctx.lineWidth = 1.6 + punch * 1.5;
			ctx.strokeStyle = palette.veil((1 - waveProg) * (bassEnergy * 0.38 + punch * 0.35));
			ctx.stroke();
		}
	}

	// 2. CŒUR STELLAIRE PROFOND & HALO DU BULBE GALACTIQUE
	const coreR = radius * (0.22 + bassEnergy * 0.16 + punch * 0.22);
	const haloGrad = palette.radialGrad(ctx, 0, 0, 0, coreR * 2.8, 0.65 + bassEnergy * 0.25 + punch * 0.25, 0);
	ctx.fillStyle = haloGrad;
	ctx.beginPath();
	ctx.arc(0, 0, coreR * 2.8, 0, Math.PI * 2);
	ctx.fill();

	// Rayons de diffraction stellaire du cœur
	for (let d = 0; d < 4; d++) {
		const da = rot * 0.5 + d * (Math.PI / 2);
		const dLen = coreR * (2.2 + punch * 1.2);
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(Math.cos(da) * dLen, Math.sin(da) * dLen * tilt);
		ctx.lineWidth = 1.4 + punch * 1.0;
		ctx.strokeStyle = palette.highlight;
		ctx.shadowColor = palette.highlight;
		ctx.shadowBlur = 16;
		ctx.stroke();
	}

	// 3. 4 GRANDS BRAS SPIRAUX VOLUMÉTRIQUES NÉBULEUX
	const numArms = 4;
	for (let arm = 0; arm < numArms; arm++) {
		const armOffset = arm * ((Math.PI * 2) / numArms);
		const armPoints: { x: number; y: number; r: number; theta: number }[] = [];

		const steps = 70;
		for (let s = 0; s <= steps; s++) {
			const normS = s / steps;
			const theta = normS * (Math.PI * 3.4) + armOffset;
			const r = radius * 0.11 * Math.exp(0.42 * (theta - armOffset));
			if (r > maxGalR) break;

			// Turbulence volumétrique fluide du gaz interstellaire
			const wave = Math.sin(theta * 3.5 - time * 2.4) * (6 + normS * 18 + bassEnergy * 16);
			const px = Math.cos(theta) * (r + wave);
			const py = Math.sin(theta) * (r + wave) * tilt;
			armPoints.push({ x: px, y: py, r, theta });
		}

		if (armPoints.length < 2) continue;

		// A. Nappe de gaz interstellaire volumétrique externe
		ctx.beginPath();
		ctx.moveTo(armPoints[0].x, armPoints[0].y);
		for (let i = 1; i < armPoints.length; i++) {
			const prev = armPoints[i - 1];
			const curr = armPoints[i];
			const mx = (prev.x + curr.x) / 2;
			const my = (prev.y + curr.y) / 2;
			ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
		}
		ctx.lineTo(armPoints[armPoints.length - 1].x, armPoints[armPoints.length - 1].y);

		ctx.lineWidth = 22 + bassEnergy * 22 + punch * 16;
		ctx.strokeStyle = palette.veil(0.12 + bassEnergy * 0.14 + punch * 0.12);
		ctx.shadowColor = palette.glow;
		ctx.shadowBlur = 20;
		ctx.stroke();

		// B. Ruban de gaz stellaire intermédiaire
		ctx.lineWidth = 8 + bassEnergy * 10 + punch * 6;
		ctx.strokeStyle = palette.veil(0.3 + bassEnergy * 0.25);
		ctx.stroke();

		// C. Crête stellaire fine et soyeuse
		ctx.lineWidth = 2.0 + punch * 1.4;
		ctx.strokeStyle = palette.veil(0.65 + bassEnergy * 0.25 + punch * 0.2);
		ctx.stroke();

		// D. Amas stellaires et nébuleuses d'émission (scintillements le long du bras)
		const numClusters = 7;
		for (let c = 1; c <= numClusters; c++) {
			const cIdx = Math.floor((c / (numClusters + 1)) * (armPoints.length - 1));
			const cp = armPoints[cIdx];
			if (cp) {
				const cR = (2.2 + punch * 2.0 + midEnergy * 1.5) * (1 - (cIdx / armPoints.length) * 0.3);
				ctx.beginPath();
				ctx.arc(cp.x, cp.y, cR, 0, Math.PI * 2);
				ctx.fillStyle = palette.highlight;
				ctx.shadowColor = palette.highlight;
				ctx.shadowBlur = 12;
				ctx.fill();
			}
		}
	}

	ctx.restore();
}
