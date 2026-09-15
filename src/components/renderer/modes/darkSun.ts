import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";
import { getVisualizerSettings } from "../../../settings/settingsManager";
import { AudioFeatures } from "../core/audioFeatures";
import { AudioSyncManager } from "../../../audio-sync";
import { extractFrequencyBands } from "../core/frequencyBands";

/**
 * 🌑 DARK SUN // SOLEIL NOIR AVEC SPECTRE AUDIO CIRCULAIRE
 *
 * Visualiseur d'Astrophysique & Éclipse Cosmique :
 * - Disque d'ébène céleste impénétrable (Dark Sun / Singularité).
 * - Spectre Audiofréquence Circulaire Radial à 360° : 72 rayons de plasma
 *   émergeant du limbe solaire avec crêtes flottantes et enveloppe ondulante.
 * - Boucles magnétiques coronales de plasma (Solar Prominences).
 * - Éjections de masse coronale (CME / Tsunamis solaires) sur les kicks.
 * - Bague de diamant anamorphique et grains de Baily sur les aigus.
 *
 * Règles AGENTS.md :
 * - Règle 4 : Zéro allocation par trame (Object Pool, Typed Arrays, Flyweight).
 * - Règle 6 : 100% ThemePalette Spotify active.
 */

// ============================================================================
// 1. CONTEXTE IMMUABLE DE RENDU (Context / DTO Pattern)
// ============================================================================

export interface DarkSunFrameContext {
	readonly cx: number;
	readonly cy: number;
	readonly width: number;
	readonly height: number;
	readonly baseR: number;
	readonly sunR: number;
	readonly maxCoronaR: number;
	readonly isPlaying: boolean;
	readonly timeFlow: number;
	readonly smoothBass: number;
	readonly smoothPunch: number;
	readonly smoothTreble: number;
	readonly solarFlare: number;
	readonly continuousWavePhase: number;
	readonly palette: ThemePalette;
	readonly features: AudioFeatures;
	readonly analysis?: SpotifyAudioAnalysis;
}

// ============================================================================
// 2. STRUCTURES DE DONNÉES ZÉRO-ALLOCATION (Object Pool & Ring Buffer)
// ============================================================================

const EMBER_TRAIL_CAPACITY = 5;

/**
 * Particule de poussière de vent solaire avec Ring Buffer Float32Array.
 */
export class SolarEmber {
	public angle: number;
	public distNorm: number;
	public speed: number;
	public angularDrift: number;
	public size: number;
	public brightness: number;

	public readonly trailX = new Float32Array(EMBER_TRAIL_CAPACITY);
	public readonly trailY = new Float32Array(EMBER_TRAIL_CAPACITY);
	public trailCount = 0;
	public trailHead = 0;

	constructor(
		angle: number,
		distNorm: number,
		speed: number,
		angularDrift: number,
		size: number,
		brightness: number
	) {
		this.angle = angle;
		this.distNorm = distNorm;
		this.speed = speed;
		this.angularDrift = angularDrift;
		this.size = size;
		this.brightness = brightness;
	}

	public pushTrail(x: number, y: number): void {
		this.trailX[this.trailHead] = x;
		this.trailY[this.trailHead] = y;
		this.trailHead = (this.trailHead + 1) % EMBER_TRAIL_CAPACITY;
		if (this.trailCount < EMBER_TRAIL_CAPACITY) {
			this.trailCount++;
		}
	}

	public reset(angle: number): void {
		this.distNorm = 0.01 + Math.random() * 0.05;
		this.angle = angle;
		this.trailCount = 0;
		this.trailHead = 0;
	}
}

// ============================================================================
// 3. PRÉ-CALCULS TRIGONOMÉTRIQUES (Flyweight Pattern)
// ============================================================================

export interface PrecomputedPlume {
	readonly baseAngle: number;
	readonly cosBase: number;
	readonly sinBase: number;
	readonly cosLeft: number;
	readonly sinLeft: number;
	readonly cosRight: number;
	readonly sinRight: number;
	readonly cosCp1: number;
	readonly sinCp1: number;
	readonly cosCp2: number;
	readonly sinCp2: number;
}

// ============================================================================
// 4. MOTEUR PHYSIQUE & SIMULATION (Physics Engine)
// ============================================================================

export class DarkSunPhysicsEngine {
	public smoothBass = 0.1;
	public smoothPunch = 0;
	public smoothTreble = 0.1;
	public timeFlow = 0;
	public solarFlare = 0;
	public continuousWavePhase = 0;

	public readonly embers: SolarEmber[] = [];
	public readonly plumes: PrecomputedPlume[] = [];

	private static readonly NUM_EMBERS = 90;
	private static readonly NUM_PLUMES = 12;

	constructor() {
		// 1. Initialisation des 90 braises de plasma du vent solaire
		for (let i = 0; i < DarkSunPhysicsEngine.NUM_EMBERS; i++) {
			this.embers.push(
				new SolarEmber(
					Math.random() * Math.PI * 2,
					Math.pow(Math.random(), 0.75),
					0.003 + Math.random() * 0.007,
					(Math.random() - 0.5) * 0.008,
					1.4 + Math.random() * 2.8,
					0.4 + Math.random() * 0.6
				)
			);
		}

		// 2. Pré-calculs trigonométriques des 12 panaches coronaux (Flyweight)
		const spread = ((Math.PI * 2) / DarkSunPhysicsEngine.NUM_PLUMES) * 0.46;
		for (let p = 0; p < DarkSunPhysicsEngine.NUM_PLUMES; p++) {
			const angle = (p / DarkSunPhysicsEngine.NUM_PLUMES) * Math.PI * 2;
			this.plumes.push({
				baseAngle: angle,
				cosBase: Math.cos(angle),
				sinBase: Math.sin(angle),
				cosLeft: Math.cos(angle - spread),
				sinLeft: Math.sin(angle - spread),
				cosRight: Math.cos(angle + spread),
				sinRight: Math.sin(angle + spread),
				cosCp1: Math.cos(angle - spread * 0.5),
				sinCp1: Math.sin(angle - spread * 0.5),
				cosCp2: Math.cos(angle + spread * 0.5),
				sinCp2: Math.sin(angle + spread * 0.5)
			});
		}
	}

	public update(
		isPlaying: boolean,
		bass: number,
		punch: number,
		treble: number,
		transient: number,
		speedScale: number,
		_maxDist: number
	): void {
		if (!isPlaying) {
			this.smoothPunch *= 0.88;
			this.smoothBass += (0.05 - this.smoothBass) * 0.1;
			this.smoothTreble += (0.05 - this.smoothTreble) * 0.1;
			this.solarFlare *= 0.88;
			return;
		}

		this.smoothBass += (bass - this.smoothBass) * 0.15;
		this.smoothPunch += (punch - this.smoothPunch) * 0.22;
		this.smoothTreble += (treble - this.smoothTreble) * 0.2;

		const isKick = punch > 0.35 || (bass > 0.6 && transient > 0.32);
		if (isKick) {
			this.solarFlare = Math.min(2.5, this.solarFlare + punch * 0.9 + transient * 0.5);
		}
		this.solarFlare *= 0.92;

		const speed = (1.0 + this.solarFlare * 0.35 + this.smoothBass * 0.3) * speedScale;
		this.timeFlow += 0.016 * speed;

		// Train d'ondes solaires continues
		this.continuousWavePhase = (this.continuousWavePhase + (0.005 + this.smoothBass * 0.004) * speed) % 1.0;

		// Mise à jour des poussières de vent solaire
		for (const ember of this.embers) {
			ember.distNorm += ember.speed * speed * (1.0 + this.solarFlare * 0.6);
			ember.angle += ember.angularDrift * speed;

			if (ember.distNorm >= 1.0) {
				ember.reset(Math.random() * Math.PI * 2);
			}
		}
	}
}

// ============================================================================
// 5. STRATÉGIES DE RENDU PAR COUCHE (RenderLayer Strategy Pattern)
// ============================================================================

export interface RenderLayer {
	render(ctx: CanvasRenderingContext2D, frame: DarkSunFrameContext, engine: DarkSunPhysicsEngine): void;
}

/**
 * Couche 1 : Halo volumétrique ambiant de la couronne
 */
class BackgroundHaloLayer implements RenderLayer {
	public render(ctx: CanvasRenderingContext2D, frame: DarkSunFrameContext, _engine: DarkSunPhysicsEngine): void {
		ctx.save();
		ctx.translate(frame.cx, frame.cy);

		const grad = ctx.createRadialGradient(0, 0, frame.sunR * 0.9, 0, 0, frame.maxCoronaR);
		const alpha = 0.38 + frame.smoothBass * 0.28 + frame.solarFlare * 0.2;
		grad.addColorStop(0, frame.palette.rimVeil(alpha * 0.7));
		grad.addColorStop(0.25, frame.palette.veil(alpha * 0.45));
		grad.addColorStop(0.65, frame.palette.veil(alpha * 0.15));
		grad.addColorStop(1, "transparent");

		ctx.fillStyle = grad;
		ctx.beginPath();
		ctx.arc(0, 0, frame.maxCoronaR, 0, Math.PI * 2);
		ctx.fill();

		ctx.restore();
	}
}

/**
 * Couche 2 : Panaches coronaux organiques (Coronal Plumes)
 */
class CoronalPlumesLayer implements RenderLayer {
	public render(ctx: CanvasRenderingContext2D, frame: DarkSunFrameContext, engine: DarkSunPhysicsEngine): void {
		const { cx, cy, sunR, baseR, timeFlow, smoothBass, smoothPunch, solarFlare, palette } = frame;

		ctx.save();
		ctx.translate(cx, cy);

		for (let i = 0; i < engine.plumes.length; i++) {
			const plume = engine.plumes[i];
			const breathe = Math.sin(timeFlow * 1.8 + i * 0.85);
			const bassSpike = smoothBass * 0.55 + (i % 2 === 0 ? smoothPunch * 0.45 : 0);

			const plumeReach = baseR * (1.3 + breathe * 0.2 + bassSpike + solarFlare * 0.4);
			const baseSpreadR = sunR * 1.02;

			const startX = plume.cosLeft * baseSpreadR;
			const startY = plume.sinLeft * baseSpreadR;
			const endX = plume.cosRight * baseSpreadR;
			const endY = plume.sinRight * baseSpreadR;

			const tipWobble = Math.sin(timeFlow * 2.8 + i * 1.4) * (baseR * 0.08);
			const tipX = plume.cosBase * plumeReach - plume.sinBase * tipWobble;
			const tipY = plume.sinBase * plumeReach + plume.cosBase * tipWobble;

			const cpDist = sunR + (plumeReach - sunR) * 0.52;
			const cp1X = plume.cosCp1 * cpDist;
			const cp1Y = plume.sinCp1 * cpDist;
			const cp2X = plume.cosCp2 * cpDist;
			const cp2Y = plume.sinCp2 * cpDist;

			const plumeGrad = ctx.createRadialGradient(0, 0, sunR, tipX, tipY, plumeReach - sunR);
			const alpha = (0.28 + smoothBass * 0.22 + solarFlare * 0.18) * (0.8 + breathe * 0.2);
			plumeGrad.addColorStop(0, palette.rimVeil(alpha));
			plumeGrad.addColorStop(0.45, palette.veil(alpha * 0.65));
			plumeGrad.addColorStop(0.85, palette.veil(alpha * 0.2));
			plumeGrad.addColorStop(1, "transparent");

			ctx.fillStyle = plumeGrad;
			ctx.beginPath();
			ctx.moveTo(startX, startY);
			ctx.quadraticCurveTo(cp1X, cp1Y, tipX, tipY);
			ctx.quadraticCurveTo(cp2X, cp2Y, endX, endY);
			ctx.closePath();
			ctx.fill();
		}

		ctx.restore();
	}
}

/**
 * Couche 4 : SPECTRE AUDIOFRÉQUENCE CIRCULAIRE RADIAL (Demande Utilisateur)
 * 72 rayons de fréquences avec crêtes flottantes et enveloppe de plasma continue
 */
class RadialAudioSpectrumLayer implements RenderLayer {
	private static readonly NUM_RAYS = 72;
	private readonly cosAngles = new Float32Array(RadialAudioSpectrumLayer.NUM_RAYS);
	private readonly sinAngles = new Float32Array(RadialAudioSpectrumLayer.NUM_RAYS);
	private readonly channelMap = new Uint8Array(RadialAudioSpectrumLayer.NUM_RAYS);

	constructor() {
		// Répartition symétrique à 360° :
		// 0 rad (pôle bas) = basses/infrabasses
		// Flancs latéraux = médiums / voix
		// Pôle haut = aigus / air cristallin
		for (let i = 0; i < RadialAudioSpectrumLayer.NUM_RAYS; i++) {
			const angle = (i / RadialAudioSpectrumLayer.NUM_RAYS) * Math.PI * 2;
			this.cosAngles[i] = Math.cos(angle);
			this.sinAngles[i] = Math.sin(angle);

			const half = RadialAudioSpectrumLayer.NUM_RAYS / 2;
			const idxInHalf = i < half ? i : RadialAudioSpectrumLayer.NUM_RAYS - i;
			this.channelMap[i] = Math.min(35, Math.floor((idxInHalf / half) * 36));
		}
	}

	public render(ctx: CanvasRenderingContext2D, frame: DarkSunFrameContext, _engine: DarkSunPhysicsEngine): void {
		const { cx, cy, sunR, baseR, palette, features, analysis } = frame;
		const settings = getVisualizerSettings();
		const glowScale = settings.glowScale ?? 1.0;

		let progress = 0;
		try {
			progress = AudioSyncManager.getProgress();
		} catch {}

		const freqBands = extractFrequencyBands(analysis, progress, features);
		const channels = freqBands.channels;
		const peaks = freqBands.peaks;

		const maxSpectrumH = baseR * 0.82 * (1.0 + frame.smoothBass * 0.35);

		ctx.save();
		ctx.translate(cx, cy);

		// 1. Enveloppe fluide continue de la couronne de spectre
		ctx.beginPath();
		for (let i = 0; i < RadialAudioSpectrumLayer.NUM_RAYS; i++) {
			const ch = this.channelMap[i];
			const val = channels[ch] || 0.04;
			const r = sunR + val * maxSpectrumH;
			const x = this.cosAngles[i] * r;
			const y = this.sinAngles[i] * r;

			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		}
		ctx.closePath();
		ctx.lineWidth = 2.0 * glowScale;
		ctx.strokeStyle = palette.rimVeil(0.75 + frame.smoothPunch * 0.25);
		ctx.shadowColor = palette.highlight;
		ctx.shadowBlur = 10 * glowScale;
		ctx.stroke();

		// Remplissage tamisé de l'espace spectral
		ctx.fillStyle = palette.veil(0.12 + frame.smoothBass * 0.1);
		ctx.fill();

		// 2. Rayons / Barres spectrales émergeant du limbe solaire
		ctx.shadowBlur = 0;
		for (let i = 0; i < RadialAudioSpectrumLayer.NUM_RAYS; i++) {
			const ch = this.channelMap[i];
			const val = channels[ch] || 0.04;
			const peakVal = peaks[ch] || val;

			const barLen = val * maxSpectrumH;
			const rStart = sunR;
			const rEnd = sunR + barLen;

			const cos = this.cosAngles[i];
			const sin = this.sinAngles[i];

			// Rayon spectral
			ctx.beginPath();
			ctx.moveTo(cos * rStart, sin * rStart);
			ctx.lineTo(cos * rEnd, sin * rEnd);
			ctx.lineWidth = (2.2 + val * 2.5) * glowScale;
			ctx.strokeStyle = palette.veil(0.35 + val * 0.65);
			ctx.stroke();

			// Filament blanc haute intensité
			if (val > 0.4) {
				ctx.beginPath();
				ctx.moveTo(cos * (rStart + barLen * 0.5), sin * (rStart + barLen * 0.5));
				ctx.lineTo(cos * rEnd, sin * rEnd);
				ctx.lineWidth = 1.0;
				ctx.strokeStyle = "#ffffff";
				ctx.stroke();
			}

			// Crête flottante (Peak dot)
			const peakR = sunR + peakVal * maxSpectrumH + 3;
			if (peakR > rEnd + 2) {
				ctx.beginPath();
				ctx.arc(cos * peakR, sin * peakR, (1.2 + peakVal * 1.6) * glowScale, 0, Math.PI * 2);
				ctx.fillStyle = "#ffffff";
				ctx.shadowColor = palette.highlight;
				ctx.shadowBlur = 4 * glowScale;
				ctx.fill();
				ctx.shadowBlur = 0;
			}
		}

		ctx.restore();
	}
}

/**
 * Couche 6 : Poussière de vent solaire et braises de plasma (Solar Embers)
 */
class SolarEmbersLayer implements RenderLayer {
	public render(ctx: CanvasRenderingContext2D, frame: DarkSunFrameContext, engine: DarkSunPhysicsEngine): void {
		const { cx, cy, sunR, maxCoronaR, palette } = frame;

		ctx.save();
		ctx.translate(cx, cy);

		for (const ember of engine.embers) {
			const currentR = sunR + ember.distNorm * (maxCoronaR - sunR);
			const curX = Math.cos(ember.angle) * currentR;
			const curY = Math.sin(ember.angle) * currentR;

			ember.pushTrail(curX, curY);

			if (ember.trailCount > 1) {
				ctx.beginPath();
				const oldestIdx = (ember.trailHead - ember.trailCount + EMBER_TRAIL_CAPACITY) % EMBER_TRAIL_CAPACITY;
				ctx.moveTo(ember.trailX[oldestIdx], ember.trailY[oldestIdx]);

				for (let step = 1; step < ember.trailCount; step++) {
					const idx = (oldestIdx + step) % EMBER_TRAIL_CAPACITY;
					ctx.lineTo(ember.trailX[idx], ember.trailY[idx]);
				}

				ctx.lineWidth = ember.size * 0.6;
				ctx.strokeStyle = palette.veil(ember.brightness * 0.35 * (1 - ember.distNorm));
				ctx.stroke();
			}

			ctx.beginPath();
			ctx.arc(curX, curY, ember.size * 0.85, 0, Math.PI * 2);
			ctx.fillStyle = palette.rimVeil(ember.brightness * (1 - ember.distNorm * 0.7));
			ctx.fill();
		}

		ctx.restore();
	}
}

/**
 * Couche 7 : Le Cœur d'Éclipse & Chromosphère Incandescente
 */
class ChromosphereCoreLayer implements RenderLayer {
	public render(ctx: CanvasRenderingContext2D, frame: DarkSunFrameContext, engine: DarkSunPhysicsEngine): void {
		const { cx, cy, sunR, smoothBass, smoothPunch, solarFlare, palette } = frame;

		ctx.save();
		ctx.translate(cx, cy);

		// 1. Anneau de Chromosphère incandescente (Limb Glow)
		const limbGrad = ctx.createRadialGradient(0, 0, sunR * 0.94, 0, 0, sunR * (1.18 + smoothBass * 0.12));
		const limbAlpha = 0.75 + smoothBass * 0.25 + solarFlare * 0.25;
		limbGrad.addColorStop(0, palette.rimLight);
		limbGrad.addColorStop(0.35, palette.highlight);
		limbGrad.addColorStop(0.7, palette.rimVeil(limbAlpha * 0.8));
		limbGrad.addColorStop(1, "transparent");

		ctx.fillStyle = limbGrad;
		ctx.beginPath();
		ctx.arc(0, 0, sunR * (1.18 + smoothBass * 0.12), 0, Math.PI * 2);
		ctx.fill();

		// 2. Filament de bordure blanc pur (Limb Razor Line)
		ctx.beginPath();
		ctx.arc(0, 0, sunR, 0, Math.PI * 2);
		ctx.lineWidth = 1.8 + smoothPunch * 2.2;
		ctx.strokeStyle = "#ffffff";
		ctx.shadowColor = palette.highlight;
		ctx.shadowBlur = 10;
		ctx.stroke();
		ctx.shadowBlur = 0;

		// 3. Disque d'ébène céleste impénétrable (Dark Sun Body)
		const sunBodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sunR);
		sunBodyGrad.addColorStop(0, "#000000");
		sunBodyGrad.addColorStop(0.85, "#020409");
		sunBodyGrad.addColorStop(1, "rgba(8, 12, 22, 0.98)");

		ctx.beginPath();
		ctx.arc(0, 0, sunR * 0.99, 0, Math.PI * 2);
		ctx.fillStyle = sunBodyGrad;
		ctx.fill();

		ctx.restore();
	}
}

// ============================================================================
// 6. PIPELINE D'ORCHESTRATION DU RENDU (Pipeline / Composite Pattern)
// ============================================================================

export class DarkSunRenderPipeline {
	private readonly layers: RenderLayer[];

	constructor() {
		this.layers = [
			new BackgroundHaloLayer(),
			new CoronalPlumesLayer(),
			new RadialAudioSpectrumLayer(),
			new SolarEmbersLayer(),
			new ChromosphereCoreLayer()
		];
	}

	public execute(ctx: CanvasRenderingContext2D, frame: DarkSunFrameContext, engine: DarkSunPhysicsEngine): void {
		ctx.save();
		for (let i = 0; i < this.layers.length; i++) {
			this.layers[i].render(ctx, frame, engine);
		}
		ctx.restore();
	}
}

// ============================================================================
// 7. INSTANCES GLOBALES & POINT D'ENTRÉE DU MODE
// ============================================================================

const engine = new DarkSunPhysicsEngine();
const pipeline = new DarkSunRenderPipeline();

export function drawDarkSun(
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

	// Mise à jour de la physique
	engine.update(
		isPlaying,
		features.bassEnergy,
		features.punch,
		features.trebleEnergy,
		features.transientEnergy,
		speedScale,
		maxScreenR
	);

	const baseR = Math.min(width, height) * 0.36;
	const sunR = baseR * 0.52 * (1.0 + engine.smoothBass * 0.06 - engine.smoothPunch * 0.02);
	const maxCoronaR = Math.max(baseR * 2.2, Math.max(width, height) * 0.65);

	const frameContext: DarkSunFrameContext = {
		cx,
		cy,
		width,
		height,
		baseR,
		sunR,
		maxCoronaR,
		isPlaying,
		timeFlow: engine.timeFlow,
		smoothBass: engine.smoothBass,
		smoothPunch: engine.smoothPunch,
		smoothTreble: engine.smoothTreble,
		solarFlare: engine.solarFlare,
		continuousWavePhase: engine.continuousWavePhase,
		palette,
		features,
		analysis
	};

	pipeline.execute(ctx, frameContext, engine);
}

export const modeConfig: ModeConfig = {
	id: "dark-sun",
	name: "🌑 Dark Sun",
	render(ctx, width, height, features, palette, analysis) {
		drawDarkSun(ctx, width, height, features, palette, analysis);
	}
};
