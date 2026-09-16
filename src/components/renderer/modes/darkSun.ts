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
		const punchAttack = punch > this.smoothPunch ? 0.65 : 0.18;
		this.smoothPunch += (punch - this.smoothPunch) * punchAttack;
		this.smoothTreble += (treble - this.smoothTreble) * 0.2;

		const isKick = punch > 0.28 || (bass > 0.55 && transient > 0.25);
		if (isKick) {
			this.solarFlare = Math.min(3.0, this.solarFlare + punch * 1.2 + transient * 0.6);
		}
		this.solarFlare *= 0.88;

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

		const settings = getVisualizerSettings();
		const punchScale = settings.punchScale ?? 1.0;
		const punchBoost = (frame.smoothPunch * 0.45 + frame.solarFlare * 0.28) * punchScale;
		const haloR = frame.maxCoronaR * (1.0 + punchBoost + frame.smoothBass * 0.18);
		const grad = ctx.createRadialGradient(0, 0, frame.sunR * 0.95, 0, 0, haloR);
		// Opacité ambiante constante (ne s'amplifie pas sur les kicks)
		const alpha = 0.38;
		grad.addColorStop(0, frame.palette.rimVeil(alpha * 0.75));
		grad.addColorStop(0.25, frame.palette.veil(alpha * 0.5));
		grad.addColorStop(0.62, frame.palette.veil(alpha * 0.18));
		grad.addColorStop(1, "transparent");

		ctx.fillStyle = grad;
		ctx.beginPath();
		ctx.arc(0, 0, haloR, 0, Math.PI * 2);
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
	private readonly pointsX = new Float32Array(RadialAudioSpectrumLayer.NUM_RAYS);
	private readonly pointsY = new Float32Array(RadialAudioSpectrumLayer.NUM_RAYS);

	constructor() {
		// Répartition symétrique bilatérale à 360° :
		// Pôle bas (6h) = basses/infrabasses
		// Flanc gauche (9h) & Flanc droit (3h) = médiums / voix / mélodies
		// Pôle haut (12h) = aigus / air cristallin
		const baseAngle = Math.PI / 2; // 90° (pôle bas)
		for (let i = 0; i < RadialAudioSpectrumLayer.NUM_RAYS; i++) {
			const angle = baseAngle + (i / RadialAudioSpectrumLayer.NUM_RAYS) * Math.PI * 2;
			this.cosAngles[i] = Math.cos(angle);
			this.sinAngles[i] = Math.sin(angle);

			// Hémisphère gauche (i: 0 -> 35) : basses (ch 0) vers aigus (ch 35)
			// Hémisphère droit (i: 36 -> 71) : aigus (ch 35) vers basses (ch 0)
			this.channelMap[i] = i < 36 ? i : 71 - i;
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
		const channelsLeft = freqBands.channelsLeft;
		const channelsRight = freqBands.channelsRight;

		const dspSens = settings.dspSensitivity ?? 1.0;
		// Distance maximale d'excursion calibrée
		const maxSpectrumH = baseR * 1.3 * (1.0 + frame.smoothBass * 0.25);

		ctx.save();
		ctx.translate(cx, cy);

		// 1. Calcul des sommets spectraux stéréo : minimum calé au soleil, sensibilité équilibrée
		const noiseFloor = 0.04;
		const trebleScale = settings.trebleScale ?? 1.0;
		for (let i = 0; i < RadialAudioSpectrumLayer.NUM_RAYS; i++) {
			const ch = this.channelMap[i];
			const isLeft = i < 36;
			const rawVal = isLeft ? channelsLeft[ch] || 0.0 : channelsRight[ch] || 0.0;
			// Compensation des hautes fréquences progressive et naturelle
			const trebleBoost = 1.0 + Math.pow(ch / 35, 1.2) * 0.55 * trebleScale;
			const boostedVal = rawVal * trebleBoost;
			// Soustraction du plancher de bruit pour une base stable
			const dynamicVal = Math.max(0, (boostedVal - noiseFloor) / (1.0 - noiseFloor));
			const val = Math.min(1.0, Math.pow(dynamicVal, 0.95) * 1.05 * dspSens);
			const r = sunR + 14 + val * maxSpectrumH;

			this.pointsX[i] = this.cosAngles[i] * r;
			this.pointsY[i] = this.sinAngles[i] * r;
		}

		// 2. Enveloppe de plasma fluide continue (Spline fermée C1 sans arrêtes dures)
		ctx.beginPath();
		const lastI = RadialAudioSpectrumLayer.NUM_RAYS - 1;
		const startMidX = (this.pointsX[lastI] + this.pointsX[0]) * 0.5;
		const startMidY = (this.pointsY[lastI] + this.pointsY[0]) * 0.5;
		ctx.moveTo(startMidX, startMidY);

		for (let i = 0; i < RadialAudioSpectrumLayer.NUM_RAYS; i++) {
			const nextI = (i + 1) % RadialAudioSpectrumLayer.NUM_RAYS;
			const midX = (this.pointsX[i] + this.pointsX[nextI]) * 0.5;
			const midY = (this.pointsY[i] + this.pointsY[nextI]) * 0.5;
			ctx.quadraticCurveTo(this.pointsX[i], this.pointsY[i], midX, midY);
		}
		ctx.closePath();

		// Halo néon extérieur
		ctx.lineWidth = 3.2 * glowScale;
		ctx.strokeStyle = palette.rimVeil(0.9 + frame.smoothPunch * 0.1);
		ctx.shadowColor = palette.highlight;
		ctx.shadowBlur = 18 * glowScale;
		ctx.stroke();

		// Liseré intérieur blanc incandescent
		ctx.lineWidth = 1.3 * glowScale;
		ctx.strokeStyle = "#ffffff";
		ctx.shadowColor = palette.highlight;
		ctx.shadowBlur = 6 * glowScale;
		ctx.stroke();
		ctx.shadowBlur = 0;

		// Remplissage tamisé et fluide de l'espace spectral
		ctx.fillStyle = palette.veil(0.18 + frame.smoothBass * 0.15);
		ctx.fill();

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

		// 1. Anneau de Chromosphère incandescente (Limb Glow) - S'épanouit et s'illumine sur le kick
		const limbOuterR = sunR * (1.08 + smoothPunch * 0.14 + smoothBass * 0.05);
		const limbGrad = ctx.createRadialGradient(0, 0, sunR * 0.97, 0, 0, limbOuterR);
		const limbAlpha = Math.min(1.0, 0.82 + smoothPunch * 0.35 + smoothBass * 0.15 + solarFlare * 0.25);
		limbGrad.addColorStop(0, palette.rimLight);
		limbGrad.addColorStop(0.35, palette.highlight);
		limbGrad.addColorStop(0.75, palette.rimVeil(limbAlpha * 0.7));
		limbGrad.addColorStop(1, "transparent");

		ctx.fillStyle = limbGrad;
		ctx.beginPath();
		ctx.arc(0, 0, limbOuterR, 0, Math.PI * 2);
		ctx.fill();

		// 2. Filament de bordure blanc pur (Limb Razor Line) - Claque et s'épaissit sur le kick
		ctx.beginPath();
		ctx.arc(0, 0, sunR, 0, Math.PI * 2);
		ctx.lineWidth = 1.4 + smoothPunch * 3.2;
		ctx.strokeStyle = "#ffffff";
		ctx.shadowColor = palette.highlight;
		ctx.shadowBlur = 8 + smoothPunch * 18;
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
	const punchScale = settings.punchScale ?? 1.0;
	const bassScale = settings.bassScale ?? 1.0;
	// Dilatation dynamique du Soleil Noir sur les kicks et impacts de basse
	const kickInflation =
		(engine.smoothPunch * 0.32 + engine.solarFlare * 0.12 + engine.smoothBass * 0.08 * bassScale) * punchScale;
	const sunR = baseR * 0.52 * (1.0 + kickInflation);
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
