import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";
import { neonCurrentManager } from "../core/neonCurrent";
import { getVisualizerSettings, VisualizerSettings } from "../../../settings/settingsManager";
import { AudioFeatures } from "../core/audioFeatures";

/**
 * 💥 BIG BANG - L'Origine Cosmique & L'Inflation Universelle
 *
 * Architecture & Design Patterns :
 * - Pipeline & Strategy Pattern : Découpage en couches spécialisées (RenderLayer)
 * - Object Pool Pattern : Pool d'ondes d'inflation sans allocation dynamique
 * - Flyweight Pattern : Précalculs trigonométriques des jets et lobes primordiaux
 * - Context DTO Pattern : Distribution immuable des métriques de trame (BigBangFrameContext)
 */

// ============================================================================
// 1. CONTEXTE IMMUABLE DE RENDU (Context / DTO Pattern)
// ============================================================================

export interface BigBangFrameContext {
	readonly cx: number;
	readonly cy: number;
	readonly width: number;
	readonly height: number;
	readonly baseR: number;
	readonly maxDist: number;
	readonly isPlaying: boolean;
	readonly time: number;
	readonly rotation: number;
	readonly smoothBass: number;
	readonly smoothPunch: number;
	readonly trebleEnergy: number;
	readonly palette: ThemePalette;
	readonly features: AudioFeatures;
	readonly analysis?: SpotifyAudioAnalysis;
}

// ============================================================================
// 2. STRUCTURES DE DONNÉES & OBJECT POOLING
// ============================================================================

export class PooledInflationWave {
	public active = false;
	public radius = 0;
	public maxRadius = 0;
	public speed = 0;
	public alpha = 0;
	public width = 0;

	public spawn(maxRadius: number, speed: number, width: number): void {
		this.active = true;
		this.radius = 20;
		this.maxRadius = maxRadius;
		this.speed = speed;
		this.alpha = 0.95;
		this.width = width;
	}

	public update(): void {
		if (!this.active) return;
		this.radius += this.speed;
		const progress = this.radius / this.maxRadius;
		this.alpha = Math.max(0, 1 - Math.pow(progress, 0.85));
		if (progress >= 1.0 || this.alpha <= 0.02) {
			this.active = false;
		}
	}
}

export class StellarSeed {
	public angle: number;
	public dist: number;
	public speed: number;
	public size: number;
	public phase: number;
	public radialSpeed: number;

	constructor(angle: number, dist: number, speed: number, size: number, phase: number, radialSpeed: number) {
		this.angle = angle;
		this.dist = dist;
		this.speed = speed;
		this.size = size;
		this.phase = phase;
		this.radialSpeed = radialSpeed;
	}
}

// ============================================================================
// 3. MOTEUR PHYSIQUE & SIMULATION (Physics Engine)
// ============================================================================

export class BigBangPhysicsEngine {
	public smoothBass = 0.1;
	public smoothPunch = 0;
	public rotation = 0;
	public singularityPulse = 0;
	public cosmicTime = 0;
	public bassSpeedMult = 1.0;

	public readonly shockwaves: PooledInflationWave[] = [];
	public readonly stellarSeeds: StellarSeed[] = [];

	private lastPunchTime = 0;
	private static readonly SHOCKWAVE_POOL_SIZE = 6;
	private static readonly STELLAR_SEEDS_COUNT = 40;

	constructor() {
		// Pool d'ondes de choc d'inflation
		for (let i = 0; i < BigBangPhysicsEngine.SHOCKWAVE_POOL_SIZE; i++) {
			this.shockwaves.push(new PooledInflationWave());
		}

		// Graines stellaires primordiales
		for (let i = 0; i < BigBangPhysicsEngine.STELLAR_SEEDS_COUNT; i++) {
			this.stellarSeeds.push(
				new StellarSeed(
					Math.random() * Math.PI * 2,
					20 + Math.random() * 380,
					0.8 + Math.random() * 1.6,
					3.5 + Math.random() * 7.5,
					Math.random() * Math.PI * 2,
					1.2 + Math.random() * 2.4
				)
			);
		}
	}

	public update(
		isPlaying: boolean,
		bass: number,
		punch: number,
		transient: number,
		speedScale: number,
		maxDist: number,
		settings?: VisualizerSettings
	): void {
		if (!isPlaying) {
			this.smoothPunch *= 0.88;
			this.smoothBass += (0.05 - this.smoothBass) * 0.1;
			this.singularityPulse *= 0.9;
			this.bassSpeedMult = 0.45;
			this.cosmicTime += 0.005 * speedScale;
			return;
		}

		// Suivi d'enveloppe asymétrique : Attaque ultra-réactive sur le kick, déclin musical fluide
		const bassDelta = bass - this.smoothBass;
		this.smoothBass += bassDelta * (bassDelta > 0 ? 0.42 : 0.16);

		const punchDelta = punch - this.smoothPunch;
		this.smoothPunch += punchDelta * (punchDelta > 0 ? 0.65 : 0.22);

		// Modulation dynamique de la vitesse selon l'intensité des basses
		const useDynamicSpeed = settings?.bigBangDynamicSpeed ?? true;
		this.bassSpeedMult = useDynamicSpeed
			? 0.5 + Math.pow(this.smoothBass, 1.2) * 2.2 + this.smoothPunch * 1.4
			: 1.0;

		const effectiveSpeed = speedScale * this.bassSpeedMult;

		this.cosmicTime += 0.024 * effectiveSpeed;
		this.rotation += (0.0035 + this.smoothPunch * 0.004) * effectiveSpeed;
		this.singularityPulse += (0.02 + this.smoothBass * 0.028 + this.smoothPunch * 0.035) * effectiveSpeed;

		const now = Date.now();
		const waveEnabled = settings?.bigBangWaveEnabled ?? true;
		const threshold = settings?.bigBangWaveThreshold ?? 0.68;

		// Détection musicale normalisée : impact combiné de basse et attaque transitoire
		const bassImpact = bass * 0.55 + punch * 0.6 + transient * 0.35;
		const isHighBassExplosion =
			punch > Math.min(0.85, threshold * 0.8) ||
			(bass >= threshold && (punch > 0.2 || transient > 0.1 || punchDelta > 0.04)) ||
			bassImpact >= threshold * 0.9;

		const cooldown = Math.max(200, Math.round(280 / speedScale));
		if (waveEnabled && isHighBassExplosion && now - this.lastPunchTime > cooldown) {
			this.lastPunchTime = now;
			this.spawnShockwave(
				maxDist * 1.35,
				(18 + punch * 26 + bass * 12) * speedScale,
				18 + punch * 24 + bass * 14
			);
		}

		// Mise à jour du pool d'ondes de choc
		for (let i = 0; i < this.shockwaves.length; i++) {
			this.shockwaves[i].update();
		}

		// Mise à jour des graines stellaires (propulsion réactive sur les basses)
		const kickBoost = isHighBassExplosion ? 3.8 : 1.0;
		for (let i = 0; i < this.stellarSeeds.length; i++) {
			const seed = this.stellarSeeds[i];
			seed.dist +=
				seed.radialSpeed * effectiveSpeed * kickBoost * (0.8 + this.smoothPunch * 2.2 + this.smoothBass * 0.8);
			seed.angle += seed.speed * 0.003 * effectiveSpeed;

			if (seed.dist > maxDist) {
				seed.dist = 15 + Math.random() * 35;
				seed.angle = Math.random() * Math.PI * 2;
				seed.radialSpeed = 1.2 + Math.random() * 2.4;
			}
		}
	}

	private spawnShockwave(maxRadius: number, speed: number, width: number): void {
		let target = this.shockwaves.find(w => !w.active);
		if (!target) {
			target = this.shockwaves.reduce((oldest, w) => (w.radius > oldest.radius ? w : oldest));
		}
		target.spawn(maxRadius, speed, width);
	}
}

// ============================================================================
// 4. STRATÉGIES DE RENDU PAR COUCHE (RenderLayer Strategy Pattern)
// ============================================================================

export interface BigBangLayer {
	render(ctx: CanvasRenderingContext2D, frame: BigBangFrameContext, engine: BigBangPhysicsEngine): void;
}

/**
 * Couche 1 : Ondes de choc d'inflation cosmologique
 */
class InflationWavesLayer implements BigBangLayer {
	public render(ctx: CanvasRenderingContext2D, frame: BigBangFrameContext, engine: BigBangPhysicsEngine): void {
		const settings = getVisualizerSettings();
		if (!settings.bigBangWaveEnabled) return;

		const { cx, cy, palette } = frame;

		for (const wave of engine.shockwaves) {
			if (!wave.active) continue;
			const curR = wave.radius;
			if (curR <= 0) continue;

			const shockGrad = ctx.createRadialGradient(cx, cy, Math.max(0, curR - wave.width), cx, cy, curR + 12);
			shockGrad.addColorStop(0, "transparent");
			shockGrad.addColorStop(0.25, palette.veil(wave.alpha * 0.5));
			shockGrad.addColorStop(0.8, palette.rimVeil(wave.alpha * 0.95));
			shockGrad.addColorStop(0.95, palette.highlight);
			shockGrad.addColorStop(1, "transparent");

			ctx.beginPath();
			ctx.arc(cx, cy, curR + 12, 0, Math.PI * 2);
			ctx.fillStyle = shockGrad;
			ctx.fill();

			ctx.save();
			ctx.beginPath();
			ctx.arc(cx, cy, curR, 0, Math.PI * 2);
			ctx.lineWidth = 2.4 + wave.alpha * 2.0;
			ctx.strokeStyle = palette.highlight;
			ctx.shadowColor = palette.solid;
			ctx.shadowBlur = 14;
			ctx.stroke();
			ctx.restore();
		}
	}
}

/**
 * Couche 2 : Nuages de matière primordiale (8 lobes nébuleux)
 */
class PrimordialGasLayer implements BigBangLayer {
	private static readonly NUM_LOBES = 8;

	public render(ctx: CanvasRenderingContext2D, frame: BigBangFrameContext, engine: BigBangPhysicsEngine): void {
		const { cx, cy, baseR, time, palette } = frame;

		for (let l = 0; l < PrimordialGasLayer.NUM_LOBES; l++) {
			const lAngle = (l / PrimordialGasLayer.NUM_LOBES) * Math.PI * 2 + engine.rotation;
			const lReach =
				baseR *
				(0.95 + Math.sin(time * 1.8 + l * 1.3) * 0.2 + engine.smoothBass * 0.65 + engine.smoothPunch * 0.45);

			ctx.save();
			ctx.translate(cx, cy);
			ctx.rotate(lAngle);

			ctx.beginPath();
			ctx.moveTo(0, 0);

			const cp1x = -lReach * 0.36,
				cp1y = lReach * 0.42;
			const cp2x = -lReach * 0.18,
				cp2y = lReach * 0.88;
			const cp3x = lReach * 0.18,
				cp3y = lReach * 0.88;
			const cp4x = lReach * 0.36,
				cp4y = lReach * 0.42;

			ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, 0, lReach);
			ctx.bezierCurveTo(cp3x, cp3y, cp4x, cp4y, 0, 0);
			ctx.closePath();

			const lobeGrad = ctx.createLinearGradient(0, 0, 0, lReach);
			const lobeAlpha = 0.26 + engine.smoothBass * 0.38 + (l % 2 === 0 ? engine.smoothPunch * 0.32 : 0);

			lobeGrad.addColorStop(0, palette.rimVeil(lobeAlpha * 1.25));
			lobeGrad.addColorStop(0.3, palette.veil(lobeAlpha));
			lobeGrad.addColorStop(0.7, palette.veil(lobeAlpha * 0.45));
			lobeGrad.addColorStop(1, "transparent");

			ctx.fillStyle = lobeGrad;
			ctx.fill();

			ctx.lineWidth = 1.4;
			ctx.strokeStyle = palette.rimLight;
			ctx.shadowColor = palette.solid;
			ctx.shadowBlur = 8;
			ctx.stroke();
			ctx.shadowBlur = 0;

			ctx.restore();
		}
	}
}

/**
 * Couche 3 : Jets de plasma relativistes à 360°
 */
class CosmicJetsLayer implements BigBangLayer {
	private static readonly NUM_RAYS = 20;

	public render(ctx: CanvasRenderingContext2D, frame: BigBangFrameContext, engine: BigBangPhysicsEngine): void {
		const { cx, cy, baseR, time, isPlaying, trebleEnergy, palette } = frame;
		const activeWaves = neonCurrentManager.getActiveWaves(0);
		const mainNeonWave = activeWaves.length > 0 ? activeWaves[activeWaves.length - 1] : null;

		for (let r = 0; r < CosmicJetsLayer.NUM_RAYS; r++) {
			const baseAngle = (r / CosmicJetsLayer.NUM_RAYS) * Math.PI * 2 + engine.rotation * 0.5;
			const rayLen =
				baseR *
				(1.0 + Math.sin(time * 2.2 + r * 1.5) * 0.22 + engine.smoothBass * 0.75 + engine.smoothPunch * 0.65);

			ctx.save();
			ctx.translate(cx, cy);
			ctx.rotate(baseAngle);

			ctx.beginPath();
			ctx.moveTo(0, 0);

			const raySegments = 20;
			for (let s = 1; s <= raySegments; s++) {
				const p = s / raySegments;
				const curDist = p * rayLen;
				const waveSide = isPlaying
					? Math.sin(time * 4.0 - p * 6.0 + r) * (6.0 * p + trebleEnergy * 4.0 * p)
					: 0;
				ctx.lineTo(waveSide, curDist);
			}

			const rayGrad = ctx.createLinearGradient(0, 0, 0, rayLen);
			const rayAlpha = 0.35 + engine.smoothBass * 0.45 + (r % 3 === 0 ? engine.smoothPunch * 0.45 : 0);

			rayGrad.addColorStop(0, "#ffffff");
			rayGrad.addColorStop(0.12, palette.highlight);
			rayGrad.addColorStop(0.4, palette.rimLight);
			rayGrad.addColorStop(0.75, palette.veil(rayAlpha));
			rayGrad.addColorStop(1, "transparent");

			ctx.lineWidth = 1.8 + (r % 2 === 0 ? 1.4 : 0);
			ctx.strokeStyle = rayGrad;
			ctx.shadowColor = palette.solid;
			ctx.shadowBlur = 10;
			ctx.stroke();
			ctx.shadowBlur = 0;

			if (
				mainNeonWave &&
				mainNeonWave.intensity > 0.05 &&
				mainNeonWave.wavePos >= 0 &&
				mainNeonWave.wavePos <= 1.0
			) {
				const packetDist = mainNeonWave.wavePos * rayLen;
				const pR = 9.0 * mainNeonWave.intensity;
				const pGrad = ctx.createRadialGradient(0, packetDist, 0, 0, packetDist, pR);
				pGrad.addColorStop(0, "#ffffff");
				pGrad.addColorStop(0.35, palette.highlight);
				pGrad.addColorStop(0.7, palette.rimVeil(0.75));
				pGrad.addColorStop(1, "transparent");

				ctx.fillStyle = pGrad;
				ctx.beginPath();
				ctx.arc(0, packetDist, pR, 0, Math.PI * 2);
				ctx.fill();
			}

			ctx.restore();
		}
	}
}

/**
 * Couche 4 : Nucléosynthèse stellaire (Graines de lumière relativistes)
 */
class StellarNucleosynthesisLayer implements BigBangLayer {
	public render(ctx: CanvasRenderingContext2D, frame: BigBangFrameContext, engine: BigBangPhysicsEngine): void {
		const { cx, cy, time, palette } = frame;

		for (const seed of engine.stellarSeeds) {
			const curX = cx + Math.cos(seed.angle) * seed.dist;
			const curY = cy + Math.sin(seed.angle) * seed.dist;

			const pulse = 0.55 + 0.45 * Math.sin(time * 3.0 + seed.phase);
			const seedAlpha = (0.45 + engine.smoothBass * 0.55) * pulse;
			const seedR = seed.size * (0.95 + engine.smoothPunch * 0.9 + engine.smoothBass * 0.45);

			const sGrad = ctx.createRadialGradient(curX, curY, 0, curX, curY, seedR * 2.4);
			sGrad.addColorStop(0, "#ffffff");
			sGrad.addColorStop(0.3, palette.highlight);
			sGrad.addColorStop(0.65, palette.rimVeil(seedAlpha));
			sGrad.addColorStop(1, "transparent");

			ctx.fillStyle = sGrad;
			ctx.beginPath();
			ctx.arc(curX, curY, seedR * 2.4, 0, Math.PI * 2);
			ctx.fill();

			if (engine.smoothPunch > 0.15) {
				const tailLen = seed.radialSpeed * 11.0 * (engine.smoothPunch + engine.smoothBass * 0.4);
				const tailX = curX - Math.cos(seed.angle) * tailLen;
				const tailY = curY - Math.sin(seed.angle) * tailLen;

				ctx.beginPath();
				ctx.moveTo(curX, curY);
				ctx.lineTo(tailX, tailY);
				ctx.lineWidth = 1.6;
				ctx.strokeStyle = palette.highlight;
				ctx.stroke();
			}
		}
	}
}

/**
 * Couche 5 : Singularité primordiale centrale
 */
class SingularityCoreLayer implements BigBangLayer {
	public render(ctx: CanvasRenderingContext2D, frame: BigBangFrameContext, engine: BigBangPhysicsEngine): void {
		const { cx, cy, baseR, time, palette } = frame;

		const horizonR = baseR * (0.38 + engine.smoothBass * 0.52 + engine.smoothPunch * 0.45);
		const horizonGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, horizonR * 1.25);
		const hAlpha = 0.55 + engine.smoothBass * 0.45 + engine.smoothPunch * 0.35;

		horizonGrad.addColorStop(0, "#ffffff");
		horizonGrad.addColorStop(0.15, palette.highlight);
		horizonGrad.addColorStop(0.35, palette.rimVeil(hAlpha));
		horizonGrad.addColorStop(0.7, palette.veil(hAlpha * 0.5));
		horizonGrad.addColorStop(1, "transparent");

		ctx.fillStyle = horizonGrad;
		ctx.beginPath();
		ctx.arc(cx, cy, horizonR * 1.25, 0, Math.PI * 2);
		ctx.fill();

		const numRings = 3;
		for (let k = 1; k <= numRings; k++) {
			const ringR = horizonR * (0.28 * k + Math.sin(time * 2.5 + k) * 0.04);
			ctx.beginPath();
			ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
			ctx.lineWidth = 2.4 - k * 0.3 + engine.smoothPunch * 2.8 + engine.smoothBass * 1.4;
			ctx.strokeStyle = k === 1 ? "#ffffff" : palette.highlight;
			ctx.shadowBlur = 14;
			ctx.shadowColor = palette.solid;
			ctx.stroke();
			ctx.shadowBlur = 0;
		}

		const coreR = 18 + engine.smoothPunch * 42 + engine.smoothBass * 28;
		const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
		coreGrad.addColorStop(0, "#ffffff");
		coreGrad.addColorStop(0.3, "#ffffff");
		coreGrad.addColorStop(0.55, palette.highlight);
		coreGrad.addColorStop(0.85, palette.solid);
		coreGrad.addColorStop(1, "transparent");

		ctx.fillStyle = coreGrad;
		ctx.beginPath();
		ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
		ctx.fill();
	}
}

/**
 * Couche 6 : Aigrettes de diffraction cosmiques (Supernova Spikes)
 */
class DiffractionSpikesLayer implements BigBangLayer {
	public render(ctx: CanvasRenderingContext2D, frame: BigBangFrameContext, engine: BigBangPhysicsEngine): void {
		const { cx, cy, baseR, palette } = frame;
		const spikeLen = baseR * (1.1 + engine.smoothPunch * 1.4 + engine.smoothBass * 0.7);
		const spikeWidth = 8 + engine.smoothPunch * 16 + engine.smoothBass * 8;

		for (let sp = 0; sp < 4; sp++) {
			const spAngle = (sp * Math.PI) / 2 + engine.rotation * 0.2;
			ctx.save();
			ctx.translate(cx, cy);
			ctx.rotate(spAngle);

			ctx.beginPath();
			ctx.moveTo(-spikeWidth * 0.5, 0);
			ctx.lineTo(0, spikeLen);
			ctx.lineTo(spikeWidth * 0.5, 0);
			ctx.closePath();

			const spGrad = ctx.createLinearGradient(0, 0, 0, spikeLen);
			spGrad.addColorStop(0, "#ffffff");
			spGrad.addColorStop(0.2, palette.highlight);
			spGrad.addColorStop(0.55, palette.rimVeil(0.75));
			spGrad.addColorStop(1, "transparent");

			ctx.fillStyle = spGrad;
			ctx.fill();

			ctx.restore();
		}
	}
}

// ============================================================================
// 5. PIPELINE D'ORCHESTRATION DU RENDU (Pipeline Pattern)
// ============================================================================

export class BigBangRenderPipeline {
	private readonly layers: BigBangLayer[];

	constructor() {
		this.layers = [
			new InflationWavesLayer(),
			new PrimordialGasLayer(),
			new CosmicJetsLayer(),
			new StellarNucleosynthesisLayer(),
			new SingularityCoreLayer(),
			new DiffractionSpikesLayer()
		];
	}

	public execute(ctx: CanvasRenderingContext2D, frame: BigBangFrameContext, engine: BigBangPhysicsEngine): void {
		ctx.save();
		for (let i = 0; i < this.layers.length; i++) {
			this.layers[i].render(ctx, frame, engine);
		}
		ctx.restore();
	}
}

// ============================================================================
// 6. INSTANCES GLOBALES & POINT D'ENTRÉE DU MODE
// ============================================================================

const engine = new BigBangPhysicsEngine();
const pipeline = new BigBangRenderPipeline();

export function drawBigBang(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	features: AudioFeatures,
	palette: ThemePalette,
	analysis?: SpotifyAudioAnalysis
): void {
	const { cx, cy } = getVisualizerCenter(ctx);
	const settings = getVisualizerSettings();
	const speedScale = settings.speedScale ?? 1.0;
	const isPlaying = features.isPlaying ?? true;
	const maxScreenR = Math.sqrt(cx * cx + cy * cy);

	engine.update(
		isPlaying,
		features.bassEnergy,
		features.punch,
		features.transientEnergy,
		speedScale,
		maxScreenR,
		settings
	);

	const frameContext: BigBangFrameContext = {
		cx,
		cy,
		width,
		height,
		baseR: Math.min(width, height) * 0.4,
		maxDist: maxScreenR,
		isPlaying,
		time: engine.cosmicTime,
		rotation: engine.rotation,
		smoothBass: engine.smoothBass,
		smoothPunch: engine.smoothPunch,
		trebleEnergy: features.trebleEnergy,
		palette,
		features,
		analysis
	};

	pipeline.execute(ctx, frameContext, engine);
}

export const modeConfig: ModeConfig = {
	id: "big-bang",
	name: "💥 Big Bang",
	render(ctx, width, height, features, palette, analysis) {
		drawBigBang(ctx, width, height, features, palette, analysis);
	}
};
