import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";
import { neonCurrentManager } from "../core/neonCurrent";
import { getVisualizerSettings } from "../../../settings/settingsManager";
import { AudioFeatures } from "../core/audioFeatures";

/**
 * 🌸 LOTUS ASTRAL ÉPANOUI PLEIN ÉCRAN
 *
 * Architecture & Design Patterns :
 * - Pipeline & Strategy Pattern : Découpage modulaire du rendu (LotusLayer)
 * - Flyweight Pattern : Configuration statique précalculée des 4 étages de pétales
 * - Context DTO Pattern : Distribution immuable des métriques de trame (AstralLotusFrameContext)
 */

// ============================================================================
// 1. CONTEXTE IMMUABLE DE RENDU (Context / DTO Pattern)
// ============================================================================

export interface AstralLotusFrameContext {
	readonly cx: number;
	readonly cy: number;
	readonly radius: number;
	readonly time: number;
	readonly currentRotation: number;
	readonly counterAngle: number;
	readonly bassEnergy: number;
	readonly punch: number;
	readonly trebleEnergy: number;
	readonly palette: ThemePalette;
	readonly features: AudioFeatures;
}

// ============================================================================
// 2. CONFIGURATION STATIQUE DES ÉTAGES (Flyweight Pattern)
// ============================================================================

export interface PetalTierConfig {
	readonly count: number;
	readonly rRatio: number;
	readonly widthRatio: number;
	readonly alpha: number;
	readonly dist: number;
	readonly direction: number;
}

const LOTUS_TIERS: readonly PetalTierConfig[] = [
	{ count: 16, rRatio: 1.0, widthRatio: 0.26, alpha: 0.14, dist: 1.0, direction: 1 },
	{ count: 12, rRatio: 0.78, widthRatio: 0.32, alpha: 0.2, dist: 0.76, direction: -1 },
	{ count: 8, rRatio: 0.56, widthRatio: 0.42, alpha: 0.28, dist: 0.52, direction: 1 },
	{ count: 6, rRatio: 0.34, widthRatio: 0.52, alpha: 0.38, dist: 0.28, direction: -1 }
];

// ============================================================================
// 3. MOTEUR D'ANIMATION PHYSIQUE & ROTATION
// ============================================================================

export class AstralLotusEngine {
	public currentRotation = 0;
	public currentSpeed = 0.22;
	public counterAngle = 0;
	private lastTime = 0;

	public update(
		isPlaying: boolean,
		bassEnergy: number,
		punch: number,
		beatIntensity: number,
		tempo: number,
		now: number
	): void {
		if (!isPlaying) {
			this.lastTime = now;
			this.currentSpeed = 0;
			return;
		}

		const dt = this.lastTime > 0 ? Math.min(0.08, (now - this.lastTime) / 1000) : 0.016;
		this.lastTime = now;

		const bpm = tempo > 50 && tempo < 220 ? tempo : 120;
		const tempoFactor = Math.sqrt(bpm / 120);

		const activePunch = Math.max(0, (punch - 0.2) / 0.8);
		const activeBass = Math.max(0, (bassEnergy - 0.28) / 0.72);
		const activeBeat = Math.max(0, (beatIntensity - 0.3) / 0.7);

		const rhythmPower = Math.min(1.0, activePunch * 0.7 + activeBass * 0.4 + activeBeat * 0.3);

		const settings = getVisualizerSettings();
		const rotMultiplier = (settings.lotusRotationScale ?? 1.0) * (settings.lotusReverse ? -1 : 1);
		const dynamicBoost = Math.pow(rhythmPower, 2.2) * 0.52;
		const targetSpeed = (0.025 + dynamicBoost) * tempoFactor * rotMultiplier;

		const lerpRate = targetSpeed > this.currentSpeed ? 3.5 : 1.6;
		this.currentSpeed += (targetSpeed - this.currentSpeed) * Math.min(1.0, dt * lerpRate);
		this.currentRotation += this.currentSpeed * dt;

		const counterSpeed = (0.008 + Math.pow(rhythmPower, 2.2) * 0.16) * tempoFactor;
		this.counterAngle += counterSpeed * dt;
	}
}

// ============================================================================
// 4. STRATÉGIES DE RENDU PAR COUCHE (RenderLayer Strategy Pattern)
// ============================================================================

export interface LotusLayer {
	render(ctx: CanvasRenderingContext2D, frame: AstralLotusFrameContext): void;
}

/**
 * Couche 1 : Les 4 étages de pétales sacrés
 */
class PetalTiersLayer implements LotusLayer {
	public render(ctx: CanvasRenderingContext2D, frame: AstralLotusFrameContext): void {
		const { radius, time, counterAngle, bassEnergy, punch, palette } = frame;
		const petalScale = 1.0 + bassEnergy * 0.26 + punch * 0.22;

		for (let tIdx = 0; tIdx < LOTUS_TIERS.length; tIdx++) {
			const tier = LOTUS_TIERS[tIdx];
			const tierRot = tIdx * (Math.PI / tier.count) + counterAngle * tier.direction;
			const tierCurrent = neonCurrentManager.getIntensityAt(tier.dist, 0, 0.2);

			const pLen = radius * tier.rRatio * (tIdx === 0 ? petalScale : 1 + bassEnergy * 0.2);
			const baseWidth = tier.widthRatio * (1 + punch * 0.14);

			for (let i = 0; i < tier.count; i++) {
				const a = tierRot + (i / tier.count) * Math.PI * 2;
				ctx.save();
				ctx.rotate(a);

				const pWid = pLen * baseWidth * (1 + Math.sin(time * 2.0 + i * 0.4) * 0.08);

				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.bezierCurveTo(-pWid, -pLen * 0.42, -pWid * 0.6, -pLen * 0.85, 0, -pLen);
				ctx.bezierCurveTo(pWid * 0.6, -pLen * 0.85, pWid, -pLen * 0.42, 0, 0);
				ctx.closePath();

				const grad = ctx.createLinearGradient(0, 0, 0, -pLen);
				grad.addColorStop(0, palette.veil(tier.alpha * 0.12));
				grad.addColorStop(0.65, palette.veil(tier.alpha * 0.4 + tierCurrent * 0.25));
				grad.addColorStop(1, tierCurrent > 0.15 ? palette.highlight : palette.rimVeil(0.65));

				ctx.fillStyle = grad;
				ctx.fill();

				ctx.lineWidth = 1.4 + tierCurrent * 2.2;
				ctx.strokeStyle = tierCurrent > 0.15 ? palette.highlight : palette.rimLight;
				ctx.shadowColor = tierCurrent > 0.25 ? palette.highlight : "transparent";
				ctx.shadowBlur = tierCurrent > 0.25 ? 8 * tierCurrent : 0;
				ctx.stroke();

				if (tierCurrent > 0.28) {
					const tipAlpha = tierCurrent;
					const tipGrad = ctx.createRadialGradient(0, -pLen, 0, 0, -pLen, 7 * tipAlpha + 3);
					tipGrad.addColorStop(0, palette.highlight);
					tipGrad.addColorStop(0.5, palette.rimVeil(tipAlpha * 0.5));
					tipGrad.addColorStop(1, "transparent");
					ctx.fillStyle = tipGrad;
					ctx.fillRect(-12, -pLen - 12, 24, 24);
				}

				ctx.restore();
			}
		}
	}
}

/**
 * Couche 2 : Cœur incandescent et pistil stellaire
 */
class PistilHeartLayer implements LotusLayer {
	public render(ctx: CanvasRenderingContext2D, frame: AstralLotusFrameContext): void {
		const { radius, bassEnergy, punch, palette } = frame;
		const coreR = radius * 0.18 * (1 + bassEnergy * 0.25 + punch * 0.2);

		const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
		coreGrad.addColorStop(0, "#ffffff");
		coreGrad.addColorStop(0.4, palette.highlight);
		coreGrad.addColorStop(0.8, palette.rimVeil(0.6));
		coreGrad.addColorStop(1, "transparent");

		ctx.fillStyle = coreGrad;
		ctx.beginPath();
		ctx.arc(0, 0, coreR, 0, Math.PI * 2);
		ctx.fill();
	}
}

// ============================================================================
// 5. PIPELINE D'ORCHESTRATION DU RENDU (Pipeline Pattern)
// ============================================================================

export class AstralLotusPipeline {
	private readonly layers: LotusLayer[];

	constructor() {
		this.layers = [new PetalTiersLayer(), new PistilHeartLayer()];
	}

	public execute(ctx: CanvasRenderingContext2D, frame: AstralLotusFrameContext): void {
		ctx.save();
		ctx.translate(frame.cx, frame.cy);
		ctx.rotate(frame.currentRotation);

		for (let i = 0; i < this.layers.length; i++) {
			this.layers[i].render(ctx, frame);
		}
		ctx.restore();
	}
}

// ============================================================================
// 6. INSTANCES GLOBALES & POINT D'ENTRÉE DU MODE
// ============================================================================

const engine = new AstralLotusEngine();
const pipeline = new AstralLotusPipeline();

export function drawAstralLotus(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	radius: number,
	time: number,
	beatProgress: number,
	bassEnergy: number,
	trebleEnergy: number,
	palette: ThemePalette,
	punch = palette.punch,
	beatIntensity = 0.5,
	tempo = 120,
	isPlaying = true,
	features?: AudioFeatures
): void {
	engine.update(isPlaying, bassEnergy, punch, beatIntensity, tempo, performance.now());

	const frameContext: AstralLotusFrameContext = {
		cx,
		cy,
		radius,
		time,
		currentRotation: engine.currentRotation,
		counterAngle: engine.counterAngle,
		bassEnergy,
		punch,
		trebleEnergy,
		palette,
		features: features!
	};

	pipeline.execute(ctx, frameContext);
}

export const modeConfig: ModeConfig = {
	id: "kaleido",
	name: "🌸 Lotus Flower",
	render(ctx, width, height, features, palette) {
		const { cx, cy } = getVisualizerCenter(ctx);
		const radius = Math.min(width, height) * 0.36;
		drawAstralLotus(
			ctx,
			cx,
			cy,
			radius,
			features.energyTime,
			features.beatIntensity,
			features.bassEnergy,
			features.trebleEnergy,
			palette,
			features.punch,
			features.beatIntensity,
			features.tempo,
			features.isPlaying ?? true,
			features
		);
	}
};
