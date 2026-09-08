import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";

/**
 * 🌌 NÉBULEUSE COSMIQUE INTERSTELLAIRE PLEIN ÉCRAN
 * - 6 volumes géants de gaz interstellaire nébuleux (piliers de création)
 * - Amas d'étoiles naissantes dans la nébuleuse
 * - Cœur stellaire central hyper-lumineux avec rayons de diffraction douce
 * - Ondes d'expansion de supernova sur les kicks
 */
export function drawCosmicNebula(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	time: number,
	bassEnergy: number,
	midEnergy: number,
	palette: ThemePalette
) {
	ctx.save();
	const { cx, cy } = getVisualizerCenter(ctx);
	ctx.translate(cx, cy);

	const punch = palette.punch;
	const baseR = Math.min(width, height) * 0.42 * (1.0 + bassEnergy * 0.2 + punch * 0.18);

	// 1. ONDE D'EXPANSION DE SUPERNOVA SUR LES KICKS
	if (bassEnergy > 0.12 || punch > 0.12) {
		const waveProg = (time * 1.3) % 1;
		const shockR = baseR * (0.6 + waveProg * 1.8);
		ctx.beginPath();
		ctx.arc(0, 0, shockR, 0, Math.PI * 2);
		ctx.lineWidth = 1.6 + punch * 1.5;
		ctx.strokeStyle = palette.veil((1 - waveProg) * (bassEnergy * 0.4 + punch * 0.38));
		ctx.stroke();
	}

	// 2. 6 VOLUMES GÉANTS DE GAZ INTERSTELLAIRE NÉBULEUX (Piliers de création)
	const numLobes = 6;
	for (let l = 0; l < numLobes; l++) {
		const lAngle = (l / numLobes) * Math.PI * 2 + time * 0.08;
		const lLen = baseR * (0.85 + Math.sin(time * 2.0 + l * 1.2) * 0.18 + bassEnergy * 0.25);

		ctx.save();
		ctx.rotate(lAngle);

		ctx.beginPath();
		ctx.moveTo(0, 0);
		const cpx1 = -lLen * 0.35,
			cpy1 = lLen * 0.45;
		const cpx2 = -lLen * 0.15,
			cpy2 = lLen * 0.85;
		const cpx3 = lLen * 0.15,
			cpy3 = lLen * 0.85;
		const cpx4 = lLen * 0.35,
			cpy4 = lLen * 0.45;

		ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, 0, lLen);
		ctx.bezierCurveTo(cpx3, cpy3, cpx4, cpy4, 0, 0);
		ctx.closePath();

		const lGrad = ctx.createRadialGradient(0, lLen * 0.4, 0, 0, lLen * 0.4, lLen * 0.7);
		lGrad.addColorStop(0, palette.veil(0.18 + bassEnergy * 0.14 + punch * 0.12));
		lGrad.addColorStop(0.6, palette.veil(0.08 + bassEnergy * 0.06));
		lGrad.addColorStop(1, palette.veil(0));
		ctx.fillStyle = lGrad;
		ctx.fill();

		ctx.lineWidth = 1.4 + punch * 0.8;
		ctx.strokeStyle = palette.veil(0.35 + bassEnergy * 0.2);
		ctx.stroke();

		// Amas d'étoiles naissantes dans la nébuleuse
		const starDist = lLen * 0.65;
		ctx.beginPath();
		ctx.arc(0, starDist, 2.2 + punch * 1.5, 0, Math.PI * 2);
		ctx.fillStyle = palette.highlight;
		ctx.shadowColor = palette.highlight;
		ctx.shadowBlur = 10;
		ctx.fill();

		ctx.restore();
	}

	// 3. CŒUR STELLAIRE CENTRAL HYPER-LUMINEUX
	const coreR = baseR * (0.24 + bassEnergy * 0.16 + punch * 0.18);
	const coreGrad = palette.radialGrad(ctx, 0, 0, 0, coreR * 1.8, 0.5 + bassEnergy * 0.25 + punch * 0.25, 0);
	ctx.fillStyle = coreGrad;
	ctx.beginPath();
	ctx.arc(0, 0, coreR * 1.8, 0, Math.PI * 2);
	ctx.fill();

	// 8 Rayons de diffraction douce dans le cœur
	for (let r = 0; r < 8; r++) {
		const ra = r * (Math.PI / 4) + time * 0.1;
		const rLen = coreR * (1.2 + punch * 0.5);
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(Math.cos(ra) * rLen, Math.sin(ra) * rLen);
		ctx.lineWidth = r % 2 === 0 ? 1.8 + punch * 1.2 : 1.0;
		ctx.strokeStyle = r % 2 === 0 ? palette.highlight : palette.veil(0.35);
		ctx.stroke();
	}

	ctx.restore();
}

export const modeConfig: ModeConfig = {
	id: "neon-waves",
	name: "🌌 Nébuleuse Cosmique (Nebula)",
	render(ctx, width, height, features, palette) {
		drawCosmicNebula(ctx, width, height, features.energyTime, features.bassEnergy, features.midEnergy, palette);
	}
};
