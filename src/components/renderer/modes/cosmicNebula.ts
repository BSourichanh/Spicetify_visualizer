import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";
import { neonCurrentManager } from "../core/neonCurrent";
import { AudioFeatures } from "../core/audioFeatures";

/**
 * 🌌 NÉBULEUSE COSMIQUE INTERSTELLAIRE PLEIN ÉCRAN
 *
 * Architecture & Design Patterns :
 * - Pipeline & Strategy Pattern : Découpage en couches spécialisées (NebulaLayer)
 * - Flyweight Pattern : Géométrie précalculée des 6 piliers de création
 * - Context DTO Pattern : Distribution immuable des métriques de trame (CosmicNebulaFrameContext)
 */

// ============================================================================
// 1. CONTEXTE IMMUABLE DE RENDU (Context / DTO Pattern)
// ============================================================================

export interface CosmicNebulaFrameContext {
	readonly cx: number;
	readonly cy: number;
	readonly baseR: number;
	readonly time: number;
	readonly bassEnergy: number;
	readonly midEnergy: number;
	readonly punch: number;
	readonly palette: ThemePalette;
}

// ============================================================================
// 2. STRATÉGIES DE RENDU PAR COUCHE (RenderLayer Strategy Pattern)
// ============================================================================

export interface NebulaLayer {
	render(ctx: CanvasRenderingContext2D, frame: CosmicNebulaFrameContext): void;
}

/**
 * Couche 1 : Les 6 piliers de création gazeux
 */
class NebularPillarsLayer implements NebulaLayer {
	private static readonly NUM_LOBES = 6;

	public render(ctx: CanvasRenderingContext2D, frame: CosmicNebulaFrameContext): void {
		const { baseR, time, bassEnergy, punch, palette } = frame;
		const pillarPulse = bassEnergy * 0.32 + punch * 0.28;

		for (let l = 0; l < NebularPillarsLayer.NUM_LOBES; l++) {
			const lAngle = (l / NebularPillarsLayer.NUM_LOBES) * Math.PI * 2 + time * 0.08;
			const lLen = baseR * (0.82 + Math.sin(time * 2.0 + l * 1.2) * 0.16 + pillarPulse);

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

			const lGrad = ctx.createLinearGradient(0, 0, 0, lLen);
			const lobeWaves = neonCurrentManager.getActiveWaves(l * 0.04);
			const mainWave = lobeWaves.length > 0 ? lobeWaves[lobeWaves.length - 1] : null;

			if (mainWave && mainWave.intensity > 0.04 && mainWave.wavePos >= 0 && mainWave.wavePos <= 1.15) {
				const pos = Math.max(0.02, Math.min(0.98, mainWave.wavePos));
				const p0 = Math.max(0.01, pos - 0.12);
				const p1 = Math.min(0.99, pos + 0.12);

				lGrad.addColorStop(0, palette.veil(0.18 + bassEnergy * 0.1));
				if (p0 > 0.02) lGrad.addColorStop(p0, palette.rimVeil(0.3));
				lGrad.addColorStop(pos, palette.highlight);
				if (p1 < 0.98) lGrad.addColorStop(p1, palette.rimVeil(0.3));
				lGrad.addColorStop(1, palette.veil(0.02));
			} else {
				lGrad.addColorStop(0, palette.veil(0.18 + bassEnergy * 0.12 + punch * 0.1));
				lGrad.addColorStop(0.5, palette.veil(0.08));
				lGrad.addColorStop(1, palette.veil(0.02));
			}

			ctx.fillStyle = lGrad;
			ctx.fill();

			const lobeCurrent = neonCurrentManager.getIntensityAt(0.75, l * 0.04, 0.28);
			ctx.lineWidth = 1.6 + punch * 0.8 + lobeCurrent * 2.2;
			ctx.strokeStyle = lobeCurrent > 0.18 ? palette.highlight : palette.rimLight;
			ctx.shadowColor = lobeCurrent > 0.25 ? palette.highlight : "transparent";
			ctx.shadowBlur = lobeCurrent > 0.25 ? 8 * lobeCurrent : 0;
			ctx.stroke();

			if (mainWave && mainWave.wavePos >= 0.88 && mainWave.wavePos <= 1.18) {
				const tipAlpha = Math.max(0, 1 - Math.abs(mainWave.wavePos - 1.0) * 3.5) * mainWave.intensity;
				if (tipAlpha > 0.05) {
					const tipGrad = ctx.createRadialGradient(0, lLen, 0, 0, lLen, 9 * tipAlpha + 4);
					tipGrad.addColorStop(0, palette.highlight);
					tipGrad.addColorStop(0.5, palette.rimVeil(tipAlpha * 0.5));
					tipGrad.addColorStop(1, "transparent");
					ctx.fillStyle = tipGrad;
					ctx.fillRect(-16, lLen - 16, 32, 32);
				}
			}

			ctx.restore();
		}
	}
}

/**
 * Couche 2 : Cœur stellaire hyper-lumineux avec radiance plasma
 */
class StellarHeartLayer implements NebulaLayer {
	public render(ctx: CanvasRenderingContext2D, frame: CosmicNebulaFrameContext): void {
		const { baseR, bassEnergy, punch, palette } = frame;
		const heartR = baseR * 0.22 * (1.0 + bassEnergy * 0.32 + punch * 0.26);

		const heartGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, heartR);
		heartGrad.addColorStop(0, "#ffffff");
		heartGrad.addColorStop(0.3, palette.highlight);
		heartGrad.addColorStop(0.7, palette.rimVeil(0.6));
		heartGrad.addColorStop(1, "transparent");

		ctx.fillStyle = heartGrad;
		ctx.beginPath();
		ctx.arc(0, 0, heartR, 0, Math.PI * 2);
		ctx.fill();
	}
}

// ============================================================================
// 3. PIPELINE D'ORCHESTRATION DU RENDU (Pipeline Pattern)
// ============================================================================

export class CosmicNebulaPipeline {
	private readonly layers: NebulaLayer[];

	constructor() {
		this.layers = [new NebularPillarsLayer(), new StellarHeartLayer()];
	}

	public execute(ctx: CanvasRenderingContext2D, frame: CosmicNebulaFrameContext): void {
		ctx.save();
		ctx.translate(frame.cx, frame.cy);

		for (let i = 0; i < this.layers.length; i++) {
			this.layers[i].render(ctx, frame);
		}
		ctx.restore();
	}
}

// ============================================================================
// 4. INSTANCE GLOBALE & POINT D'ENTRÉE DU MODE
// ============================================================================

const pipeline = new CosmicNebulaPipeline();

export function drawCosmicNebula(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	time: number,
	bassEnergy: number,
	midEnergy: number,
	palette: ThemePalette
): void {
	const { cx, cy } = getVisualizerCenter(ctx);
	const punch = palette.punch;
	const baseR = Math.min(width, height) * 0.42 * (1.0 + bassEnergy * 0.2 + punch * 0.18);

	const frameContext: CosmicNebulaFrameContext = {
		cx,
		cy,
		baseR,
		time,
		bassEnergy,
		midEnergy,
		punch,
		palette
	};

	pipeline.execute(ctx, frameContext);
}

export const modeConfig: ModeConfig = {
	id: "neon-waves",
	name: "🌌 Cosmic Nebula",
	render(ctx, width, height, features, palette) {
		drawCosmicNebula(ctx, width, height, features.energyTime, features.bassEnergy, features.midEnergy, palette);
	}
};
