import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";
import { neonCurrentManager } from "../core/neonCurrent";

/**
 * 🌌 NÉBULEUSE COSMIQUE INTERSTELLAIRE PLEIN ÉCRAN
 * - 6 volumes géants de gaz interstellaire nébuleux (piliers de création)
 * - Propagation du courant néon depuis le cœur stellaire le long des piliers de gaz
 * - Cœur stellaire central hyper-lumineux avec radiance plasma
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
	const currentWave = neonCurrentManager.getMainWave();

	// 1. 6 VOLUMES GÉANTS DE GAZ INTERSTELLAIRE NÉBULEUX (Piliers de création)
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

		if (currentWave && currentWave.intensity > 0.05) {
			const wavePos = Math.max(0, Math.min(1, currentWave.wavePos));
			lGrad.addColorStop(wavePos, palette.highlight);
		}

		lGrad.addColorStop(0.6, palette.veil(0.08 + bassEnergy * 0.06));
		lGrad.addColorStop(1, palette.veil(0));
		ctx.fillStyle = lGrad;
		ctx.fill();

		const boost = currentWave ? currentWave.intensity : 0;
		ctx.lineWidth = (1.6 + punch * 0.8) * (1 + boost * 1.2);
		ctx.strokeStyle = boost > 0.3 ? palette.highlight : palette.rimLight;
		ctx.shadowColor = "transparent";
		ctx.shadowBlur = 0;
		ctx.stroke();

		ctx.restore();
	}

	ctx.restore();
}

export const modeConfig: ModeConfig = {
	id: "neon-waves",
	name: "🌌 Cosmic Nebula",
	render(ctx, width, height, features, palette) {
		drawCosmicNebula(ctx, width, height, features.energyTime, features.bassEnergy, features.midEnergy, palette);
	}
};
