import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";
import { neonCurrentManager } from "../core/neonCurrent";
import { getVisualizerSettings } from "../../../settings/settingsManager";
import { AudioFeatures } from "../core/audioFeatures";

/**
 * 🌑 SOLEIL NOIR (Black Sun / Éclipse Céleste Totale)
 *
 * Architecture & Design Patterns :
 * - Pipeline & Strategy Pattern : Découpage modulaire du rendu en 8 couches spécialisées (RenderLayer)
 * - Object Pool & Ring Buffer Pattern : Élimination totale des allocations par trame (0 allocation / frame)
 * - Flyweight & Precomputation Pattern : Pré-calcul des angles et tables trigonométriques à l'initialisation
 * - Context DTO Pattern : Distribution immuable des métriques de trame (BlackSunFrameContext)
 */

// ============================================================================
// 1. CONTEXTE IMMUABLE DE RENDU (Context / DTO Pattern)
// ============================================================================

export interface BlackSunFrameContext {
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
	readonly diamondPulse: number;
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
 * Particule de poussière de vent solaire avec Ring Buffer Float32Array contigu.
 * Aucun objet `{x, y}` n'est alloué lors des déplacements.
 */
export class SolarEmber {
	public angle: number;
	public distNorm: number;
	public speed: number;
	public angularDrift: number;
	public size: number;
	public brightness: number;

	// Tampon circulaire à mémoire contiguë
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

/**
 * Onde de choc solaire (Tsunami solaire) pré-allouée dans un pool d'objets.
 */
export class SolarBlastWave {
	public active = false;
	public radius = 0;
	public maxR = 0;
	public speed = 0;
	public alpha = 0;
	public intensity = 0;
	public thickness = 0;
	public undulationFreq = 0;
	public phase = 0;

	public spawn(
		maxR: number,
		speed: number,
		intensity: number,
		thickness: number,
		undulationFreq: number,
		phase: number
	): void {
		this.active = true;
		this.radius = 5; // Émerge du cœur absolu
		this.maxR = maxR;
		this.speed = speed;
		this.alpha = 1.0;
		this.intensity = intensity;
		this.thickness = thickness;
		this.undulationFreq = undulationFreq;
		this.phase = phase;
	}

	public update(): void {
		if (!this.active) return;
		this.radius += this.speed;
		const prog = this.radius / this.maxR;
		this.alpha = Math.max(0, 1 - Math.pow(prog, 0.85));
		if (prog >= 1.0 || this.alpha <= 0.02) {
			this.active = false;
		}
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

export interface PrecomputedLoop {
	readonly baseAngle: number;
	readonly widthAngle: number;
	readonly heightFactor: number;
	readonly speedFactor: number;
	readonly phase: number;
}

// ============================================================================
// 4. MOTEUR PHYSIQUE & SIMULATION (Physics Engine)
// ============================================================================

export class BlackSunPhysicsEngine {
	public smoothBass = 0.1;
	public smoothPunch = 0;
	public smoothTreble = 0.1;
	public timeFlow = 0;
	public solarFlare = 0;
	public diamondPulse = 0;
	public continuousWavePhase = 0;

	public readonly embers: SolarEmber[] = [];
	public readonly blastWaves: SolarBlastWave[] = [];
	public readonly plumes: PrecomputedPlume[] = [];
	public readonly loops: PrecomputedLoop[] = [];

	private lastKickTime = 0;
	private static readonly NUM_EMBERS = 90;
	private static readonly NUM_BLAST_WAVES = 6;
	private static readonly NUM_PLUMES = 12;
	private static readonly NUM_LOOPS = 18;

	constructor() {
		// 1. Initialisation des 90 braises de plasma du vent solaire
		for (let i = 0; i < BlackSunPhysicsEngine.NUM_EMBERS; i++) {
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

		// 2. Pool d'ondes de choc (Object Pool)
		for (let i = 0; i < BlackSunPhysicsEngine.NUM_BLAST_WAVES; i++) {
			this.blastWaves.push(new SolarBlastWave());
		}

		// 3. Pré-calculs trigonométriques des 12 panaches coronaux (Flyweight)
		const spread = ((Math.PI * 2) / BlackSunPhysicsEngine.NUM_PLUMES) * 0.46;
		for (let p = 0; p < BlackSunPhysicsEngine.NUM_PLUMES; p++) {
			const angle = (p / BlackSunPhysicsEngine.NUM_PLUMES) * Math.PI * 2;
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

		// 4. Initialisation des 18 boucles magnétiques
		for (let i = 0; i < BlackSunPhysicsEngine.NUM_LOOPS; i++) {
			this.loops.push({
				baseAngle: (i / BlackSunPhysicsEngine.NUM_LOOPS) * Math.PI * 2 + (Math.random() - 0.5) * 0.15,
				widthAngle: 0.08 + Math.random() * 0.09,
				heightFactor: 1.15 + Math.random() * 0.28,
				speedFactor: 0.8 + Math.random() * 0.5,
				phase: Math.random() * Math.PI * 2
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
		maxDist: number
	): void {
		if (!isPlaying) {
			this.smoothPunch *= 0.88;
			this.smoothBass += (0.05 - this.smoothBass) * 0.1;
			this.smoothTreble += (0.05 - this.smoothTreble) * 0.1;
			this.solarFlare *= 0.88;
			this.diamondPulse *= 0.88;
			return;
		}

		// Lissage passe-bas des dynamiques
		this.smoothBass += (bass - this.smoothBass) * 0.15;
		this.smoothPunch += (punch - this.smoothPunch) * 0.22;
		this.smoothTreble += (treble - this.smoothTreble) * 0.2;

		const isKick = punch > 0.35 || (bass > 0.6 && transient > 0.32);
		if (isKick) {
			this.solarFlare = Math.min(2.5, this.solarFlare + punch * 0.9 + transient * 0.5);
			this.diamondPulse = Math.min(2.0, this.diamondPulse + punch * 1.2 + transient * 0.4);
		}
		this.solarFlare *= 0.92;
		this.diamondPulse *= 0.9;

		const speed = (1.0 + this.solarFlare * 0.35 + this.smoothBass * 0.3) * speedScale;
		this.timeFlow += 0.016 * speed;

		// Train d'ondes solaires continues
		this.continuousWavePhase = (this.continuousWavePhase + (0.005 + this.smoothBass * 0.004) * speed) % 1.0;

		const now = Date.now();

		// Déclenchement d'un tsunami solaire éruptif (Object Pool reuse)
		if (isKick && now - this.lastKickTime > 240) {
			this.lastKickTime = now;
			this.spawnBlastWave(maxDist * 1.35, (13 + punch * 20) * speedScale, punch);
		}

		// Mise à jour du pool de vagues solaires
		for (const wave of this.blastWaves) {
			wave.update();
		}

		// Mise à jour des poussières et vent solaire
		for (const ember of this.embers) {
			ember.distNorm += ember.speed * speed * (1.0 + this.solarFlare * 0.6);
			ember.angle += ember.angularDrift * speed;

			if (ember.distNorm >= 1.0) {
				ember.reset(Math.random() * Math.PI * 2);
			}
		}
	}

	private spawnBlastWave(maxR: number, speed: number, punch: number): void {
		// Trouver une instance inactive ou réutiliser la plus avancée
		let targetWave = this.blastWaves.find(w => !w.active);
		if (!targetWave) {
			targetWave = this.blastWaves.reduce((oldest, current) =>
				current.radius > oldest.radius ? current : oldest
			);
		}

		targetWave.spawn(
			maxR,
			speed,
			0.75 + punch * 0.25,
			35 + punch * 30,
			5 + Math.floor(Math.random() * 4),
			Math.random() * Math.PI * 2
		);
	}
}

// ============================================================================
// 5. STRATÉGIES DE RENDU PAR COUCHE (RenderLayer Strategy Pattern)
// ============================================================================

export interface RenderLayer {
	render(ctx: CanvasRenderingContext2D, frame: BlackSunFrameContext, engine: BlackSunPhysicsEngine): void;
}

/**
 * Couche 1 : Halo volumétrique ambiant de la couronne
 */
class BackgroundHaloLayer implements RenderLayer {
	public render(ctx: CanvasRenderingContext2D, frame: BlackSunFrameContext, _engine: BlackSunPhysicsEngine): void {
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
 * Couche 2 : Les 12 panaches coronaux (Casques à 360°)
 */
class CoronalPlumesLayer implements RenderLayer {
	public render(ctx: CanvasRenderingContext2D, frame: BlackSunFrameContext, engine: BlackSunPhysicsEngine): void {
		const { cx, cy, sunR, maxCoronaR, timeFlow, smoothBass, solarFlare, smoothPunch, palette } = frame;

		for (let p = 0; p < engine.plumes.length; p++) {
			const plume = engine.plumes[p];
			const waveHarmonic = Math.sin(timeFlow * 1.8 + p * 1.4) * 0.14 + Math.sin(timeFlow * 3.2 + p * 2.1) * 0.08;
			const plumeLen = sunR + (maxCoronaR - sunR) * (0.48 + waveHarmonic + smoothBass * 0.28 + solarFlare * 0.22);
			const cpDist = sunR + (plumeLen - sunR) * 0.42;

			const x0 = cx + plume.cosLeft * sunR;
			const y0 = cy + plume.sinLeft * sunR;
			const x1 = cx + plume.cosRight * sunR;
			const y1 = cy + plume.sinRight * sunR;

			const tipX = cx + plume.cosBase * plumeLen;
			const tipY = cy + plume.sinBase * plumeLen;

			const cpx1 = cx + plume.cosCp1 * cpDist;
			const cpy1 = cy + plume.sinCp1 * cpDist;
			const cpx2 = cx + plume.cosCp2 * cpDist;
			const cpy2 = cy + plume.sinCp2 * cpDist;

			ctx.beginPath();
			ctx.moveTo(x0, y0);
			ctx.quadraticCurveTo(cpx1, cpy1, tipX, tipY);
			ctx.quadraticCurveTo(cpx2, cpy2, x1, y1);
			ctx.closePath();

			const plumeGrad = ctx.createRadialGradient(cx, cy, sunR, cx, cy, plumeLen);
			const pIntensity = 0.42 + smoothBass * 0.25 + solarFlare * 0.2;
			plumeGrad.addColorStop(0, palette.highlight);
			plumeGrad.addColorStop(0.2, palette.rimVeil(pIntensity * 0.8));
			plumeGrad.addColorStop(0.6, palette.veil(pIntensity * 0.35));
			plumeGrad.addColorStop(1, "transparent");

			ctx.fillStyle = plumeGrad;
			ctx.fill();

			// Arête médiane luminescente
			ctx.beginPath();
			ctx.moveTo(cx + plume.cosBase * sunR, cy + plume.sinBase * sunR);
			ctx.lineTo(tipX, tipY);
			ctx.lineWidth = 1.4 + smoothPunch * 1.0;
			ctx.strokeStyle = palette.rimVeil(pIntensity * 0.5);
			ctx.stroke();
		}
	}
}

/**
 * Couche 3 : Vagues solaires se propageant depuis le centre
 */
class SolarWavesLayer implements RenderLayer {
	public render(ctx: CanvasRenderingContext2D, frame: BlackSunFrameContext, engine: BlackSunPhysicsEngine): void {
		const { cx, cy, sunR, timeFlow, smoothBass, smoothPunch, palette } = frame;
		const maxScreenR = Math.sqrt(cx * cx + cy * cy);

		// A) Train de 3 vagues harmoniques continues depuis le centre
		const numWaves = 3;
		for (let w = 0; w < numWaves; w++) {
			const prog = (frame.continuousWavePhase + w / numWaves) % 1.0;
			const waveR = prog * maxScreenR * 1.15;

			if (waveR > sunR * 0.8) {
				const waveFade = Math.sin(prog * Math.PI);
				const waveAlpha = Math.min(0.6, waveFade * (0.32 + smoothBass * 0.35));

				if (waveAlpha > 0.02) {
					ctx.save();
					ctx.translate(cx, cy);

					const bandW = 35 + prog * 60;
					const cGrad = ctx.createRadialGradient(0, 0, Math.max(0, waveR - bandW), 0, 0, waveR + 12);
					cGrad.addColorStop(0, "transparent");
					cGrad.addColorStop(0.4, palette.veil(waveAlpha * 0.25));
					cGrad.addColorStop(0.85, palette.rimVeil(waveAlpha * 0.65));
					cGrad.addColorStop(0.96, palette.highlight);
					cGrad.addColorStop(1, "transparent");

					ctx.beginPath();
					const steps = 48;
					for (let s = 0; s <= steps; s++) {
						const theta = (s / steps) * Math.PI * 2;
						const undul = Math.sin(theta * 6 + timeFlow * 2.2 + w) * (2 + prog * 8);
						const r = waveR + undul;
						const x = Math.cos(theta) * r;
						const y = Math.sin(theta) * r;
						if (s === 0) ctx.moveTo(x, y);
						else ctx.lineTo(x, y);
					}
					ctx.closePath();

					ctx.fillStyle = cGrad;
					ctx.fill();

					ctx.lineWidth = 1.6 + smoothPunch * 1.0;
					ctx.strokeStyle = palette.rimVeil(waveAlpha * 0.7);
					ctx.stroke();

					ctx.restore();
				}
			}
		}

		// B) Tsunamis solaires éruptifs nés au centre
		for (const wave of engine.blastWaves) {
			if (!wave.active) continue;
			const curR = wave.radius;
			const prog = curR / wave.maxR;

			if (curR > sunR * 0.6) {
				ctx.save();
				ctx.translate(cx, cy);

				const bandWidth = wave.thickness * (0.8 + prog * 1.2);
				const bGrad = ctx.createRadialGradient(0, 0, Math.max(0, curR - bandWidth), 0, 0, curR + 16);
				bGrad.addColorStop(0, "transparent");
				bGrad.addColorStop(0.35, palette.veil(wave.alpha * 0.3));
				bGrad.addColorStop(0.82, palette.rimVeil(wave.alpha * 0.8));
				bGrad.addColorStop(0.95, "#ffffff");
				bGrad.addColorStop(1, "transparent");

				ctx.beginPath();
				const steps = 60;
				for (let s = 0; s <= steps; s++) {
					const theta = (s / steps) * Math.PI * 2;
					const undul =
						Math.sin(theta * wave.undulationFreq + wave.phase + timeFlow * 2.5) * (3.5 + prog * 14) +
						Math.cos(theta * 3 - timeFlow * 1.8) * 4;
					const r = curR + 16 + undul;
					const x = Math.cos(theta) * r;
					const y = Math.sin(theta) * r;
					if (s === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
				}
				ctx.closePath();

				ctx.fillStyle = bGrad;
				ctx.fill();

				ctx.lineWidth = 2.4 + smoothPunch * 1.6;
				ctx.strokeStyle = palette.highlight;
				ctx.shadowColor = palette.highlight;
				ctx.shadowBlur = 16 + smoothPunch * 12;
				ctx.stroke();
				ctx.shadowBlur = 0;

				ctx.restore();
			}
		}
	}
}

/**
 * Couche 4 : Boucles magnétiques et protubérances solaires
 */
class CoronalLoopsLayer implements RenderLayer {
	public render(ctx: CanvasRenderingContext2D, frame: BlackSunFrameContext, engine: BlackSunPhysicsEngine): void {
		const { cx, cy, sunR, timeFlow, smoothBass, solarFlare, smoothPunch, palette } = frame;

		for (const loop of engine.loops) {
			const angle = loop.baseAngle + timeFlow * 0.08 * loop.speedFactor;
			const wave = Math.sin(timeFlow * 2.5 + loop.phase);
			const loopH = sunR * (loop.heightFactor + wave * 0.15 + smoothBass * 0.22 + solarFlare * 0.2);

			const a1 = angle - loop.widthAngle * 0.5;
			const a2 = angle + loop.widthAngle * 0.5;

			const x1 = cx + Math.cos(a1) * sunR;
			const y1 = cy + Math.sin(a1) * sunR;
			const x2 = cx + Math.cos(a2) * sunR;
			const y2 = cy + Math.sin(a2) * sunR;

			const apexX = cx + Math.cos(angle) * loopH;
			const apexY = cy + Math.sin(angle) * loopH;

			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.quadraticCurveTo(apexX, apexY, x2, y2);

			const loopAlpha = 0.45 + smoothBass * 0.3 + solarFlare * 0.25;
			ctx.lineWidth = 1.6 + smoothPunch * 1.2;
			ctx.strokeStyle = palette.rimVeil(loopAlpha);
			ctx.shadowColor = palette.highlight;
			ctx.shadowBlur = 8 + smoothPunch * 8;
			ctx.stroke();
			ctx.shadowBlur = 0;
		}
	}
}

/**
 * Couche 5 : Poussières solaires & vent stellaire (Zero Allocation Trail)
 */
class SolarEmbersLayer implements RenderLayer {
	public render(ctx: CanvasRenderingContext2D, frame: BlackSunFrameContext, engine: BlackSunPhysicsEngine): void {
		const { cx, cy, sunR, maxCoronaR, isPlaying, smoothBass, solarFlare, smoothPunch, palette } = frame;

		for (const ember of engine.embers) {
			const curDist = sunR + ember.distNorm * (maxCoronaR - sunR);
			const px = cx + Math.cos(ember.angle) * curDist;
			const py = cy + Math.sin(ember.angle) * curDist;

			// Enregistrement zéro allocation dans le Ring Buffer Float32Array
			if (isPlaying) {
				ember.pushTrail(px, py);
			}

			const fadeOut = Math.max(0, 1.0 - Math.pow(ember.distNorm, 1.2));
			const eAlpha = Math.min(0.95, (0.35 + smoothBass * 0.35 + solarFlare * 0.3) * ember.brightness * fadeOut);

			// Rendu de la traînée via le Ring Buffer
			if (ember.trailCount >= 2) {
				ctx.beginPath();
				const headIdx = (ember.trailHead - 1 + EMBER_TRAIL_CAPACITY) % EMBER_TRAIL_CAPACITY;
				ctx.moveTo(ember.trailX[headIdx], ember.trailY[headIdx]);

				for (let i = 1; i < ember.trailCount; i++) {
					const idx = (ember.trailHead - 1 - i + EMBER_TRAIL_CAPACITY) % EMBER_TRAIL_CAPACITY;
					ctx.lineTo(ember.trailX[idx], ember.trailY[idx]);
				}
				ctx.lineWidth = ember.size * 0.8;
				ctx.strokeStyle = palette.rimVeil(eAlpha * 0.6);
				ctx.lineCap = "round";
				ctx.stroke();
			}

			// Tête de particule de plasma
			const eSize = ember.size * (1.0 + smoothPunch * 0.4);
			const eGrad = ctx.createRadialGradient(px, py, 0, px, py, eSize * 2.2);
			eGrad.addColorStop(0, "#ffffff");
			eGrad.addColorStop(0.35, palette.highlight);
			eGrad.addColorStop(0.8, palette.rimVeil(eAlpha * 0.7));
			eGrad.addColorStop(1, "transparent");

			ctx.fillStyle = eGrad;
			ctx.beginPath();
			ctx.arc(px, py, eSize * 2.2, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

/**
 * Couche 6 : Chromosphère & Disque Obsidien du Soleil Noir
 */
class ChromosphereCoreLayer implements RenderLayer {
	public render(ctx: CanvasRenderingContext2D, frame: BlackSunFrameContext, engine: BlackSunPhysicsEngine): void {
		const { cx, cy, sunR, smoothPunch, palette } = frame;

		ctx.save();
		ctx.translate(cx, cy);

		// 1. Lueur périphérique éthérée
		const chromoGrad = ctx.createRadialGradient(0, 0, sunR * 0.94, 0, 0, sunR * 1.16);
		chromoGrad.addColorStop(0, "transparent");
		chromoGrad.addColorStop(0.35, "#ffffff");
		chromoGrad.addColorStop(0.65, palette.highlight);
		chromoGrad.addColorStop(0.9, palette.rimVeil(0.6));
		chromoGrad.addColorStop(1, "transparent");

		ctx.fillStyle = chromoGrad;
		ctx.beginPath();
		ctx.arc(0, 0, sunR * 1.16, 0, Math.PI * 2);
		ctx.fill();

		// 2. Liseré ultra-brillant de la chromosphère
		ctx.beginPath();
		ctx.arc(0, 0, sunR, 0, Math.PI * 2);
		ctx.lineWidth = 2.8 + smoothPunch * 1.8;
		ctx.strokeStyle = "#ffffff";
		ctx.shadowBlur = 18 + smoothPunch * 16;
		ctx.shadowColor = palette.highlight;
		ctx.stroke();
		ctx.shadowBlur = 0;

		// 3. Disque obsidien impénétrable
		const sunBodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sunR * 0.99);
		sunBodyGrad.addColorStop(0, "#000000");
		sunBodyGrad.addColorStop(0.85, "#020409");
		sunBodyGrad.addColorStop(1, "rgba(8, 12, 22, 0.98)");

		ctx.beginPath();
		ctx.arc(0, 0, sunR * 0.99, 0, Math.PI * 2);
		ctx.fillStyle = sunBodyGrad;
		ctx.fill();

		// 4. Éclosion de l'onde au cœur sombre (propagation depuis le centre)
		for (const wave of engine.blastWaves) {
			if (!wave.active || wave.radius >= sunR * 1.1) continue;

			const coreProg = wave.radius / sunR;
			const coreAlpha = Math.sin(coreProg * Math.PI) * wave.alpha * 0.65;

			const corePulseGrad = ctx.createRadialGradient(0, 0, Math.max(0, wave.radius - 18), 0, 0, wave.radius + 6);
			corePulseGrad.addColorStop(0, "transparent");
			corePulseGrad.addColorStop(0.6, palette.rimVeil(coreAlpha * 0.8));
			corePulseGrad.addColorStop(0.95, palette.highlight);
			corePulseGrad.addColorStop(1, "transparent");

			ctx.beginPath();
			ctx.arc(0, 0, wave.radius + 6, 0, Math.PI * 2);
			ctx.fillStyle = corePulseGrad;
			ctx.fill();

			// Anneau d'éruption au limbe
			if (coreProg > 0.85 && coreProg < 1.15) {
				const burstAlpha = Math.max(0, 1 - Math.abs(coreProg - 1.0) * 3.3) * wave.alpha;
				ctx.beginPath();
				ctx.arc(0, 0, sunR, 0, Math.PI * 2);
				ctx.lineWidth = 3.5 * burstAlpha;
				ctx.strokeStyle = "#ffffff";
				ctx.stroke();
			}
		}

		ctx.restore();
	}
}

/**
 * Couche 7 : L'Effet Bague de Diamant (Diamond Ring & Grains de Baily)
 */
class DiamondRingLayer implements RenderLayer {
	public render(ctx: CanvasRenderingContext2D, frame: BlackSunFrameContext, _engine: BlackSunPhysicsEngine): void {
		const { cx, cy, sunR, timeFlow, diamondPulse, smoothTreble, smoothPunch, palette } = frame;

		ctx.save();
		ctx.translate(cx, cy);

		const diamondAngle = -0.72 + Math.sin(timeFlow * 0.15) * 0.05;
		const diamondX = Math.cos(diamondAngle) * sunR;
		const diamondY = Math.sin(diamondAngle) * sunR;
		const dSize = 6.0 + diamondPulse * 8.0 + smoothTreble * 5.0;

		// Cœur aveuglant du diamant
		const dGrad = ctx.createRadialGradient(diamondX, diamondY, 0, diamondX, diamondY, dSize * 3.2);
		dGrad.addColorStop(0, "#ffffff");
		dGrad.addColorStop(0.25, "#ffffff");
		dGrad.addColorStop(0.55, palette.highlight);
		dGrad.addColorStop(0.85, palette.rimVeil(0.7));
		dGrad.addColorStop(1, "transparent");

		ctx.fillStyle = dGrad;
		ctx.beginPath();
		ctx.arc(diamondX, diamondY, dSize * 3.2, 0, Math.PI * 2);
		ctx.fill();

		// Aigrettes de diffraction anamorphiques
		const rayLen = sunR * (0.8 + diamondPulse * 0.8 + smoothTreble * 0.6);
		const rayAngles = [
			diamondAngle,
			diamondAngle + Math.PI * 0.5,
			diamondAngle - Math.PI * 0.5,
			diamondAngle + Math.PI * 0.25,
			diamondAngle - Math.PI * 0.25
		];

		for (const ra of rayAngles) {
			ctx.beginPath();
			ctx.moveTo(diamondX, diamondY);
			ctx.lineTo(diamondX + Math.cos(ra) * rayLen, diamondY + Math.sin(ra) * rayLen);
			ctx.lineWidth = 1.8 + smoothPunch * 1.5;
			ctx.strokeStyle = "#ffffff";
			ctx.shadowColor = palette.highlight;
			ctx.shadowBlur = 12;
			ctx.stroke();
		}
		ctx.shadowBlur = 0;

		// Grains de Baily scintillants le long du limbe adjacent
		const numBeads = 8;
		for (let b = 1; b <= numBeads; b++) {
			const beadAngle = diamondAngle + b * 0.045 * (b % 2 === 0 ? 1 : -1);
			const beadShine = Math.sin(timeFlow * 5.0 + b * 1.6);
			if (beadShine > 0.3) {
				const bx = Math.cos(beadAngle) * sunR;
				const by = Math.sin(beadAngle) * sunR;
				const bSize = (1.5 + smoothTreble * 3.0) * (beadShine - 0.2);

				const beadGrad = ctx.createRadialGradient(bx, by, 0, bx, by, bSize * 2.5);
				beadGrad.addColorStop(0, "#ffffff");
				beadGrad.addColorStop(0.5, palette.highlight);
				beadGrad.addColorStop(1, "transparent");

				ctx.fillStyle = beadGrad;
				ctx.beginPath();
				ctx.arc(bx, by, bSize * 2.5, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		ctx.restore();
	}
}

/**
 * Couche 8 : Onde de courant néon dynamique dans la couronne
 */
class NeonCurrentLayer implements RenderLayer {
	public render(ctx: CanvasRenderingContext2D, frame: BlackSunFrameContext, _engine: BlackSunPhysicsEngine): void {
		const { cx, cy, sunR, maxCoronaR, palette } = frame;
		const activeWaves = neonCurrentManager.getActiveWaves(0);
		const mainNeon = activeWaves.length > 0 ? activeWaves[activeWaves.length - 1] : null;

		if (mainNeon && mainNeon.intensity > 0.05 && mainNeon.wavePos >= 0 && mainNeon.wavePos <= 1.0) {
			const neonRad = sunR + mainNeon.wavePos * (maxCoronaR * 0.75 - sunR);
			ctx.save();
			ctx.translate(cx, cy);

			const neonCoronaGrad = ctx.createRadialGradient(0, 0, Math.max(0, neonRad - 25), 0, 0, neonRad + 25);
			neonCoronaGrad.addColorStop(0, "transparent");
			neonCoronaGrad.addColorStop(0.45, palette.highlight);
			neonCoronaGrad.addColorStop(0.8, palette.rimVeil(mainNeon.intensity * 0.8));
			neonCoronaGrad.addColorStop(1, "transparent");

			ctx.beginPath();
			ctx.arc(0, 0, neonRad + 15, 0, Math.PI * 2);
			ctx.fillStyle = neonCoronaGrad;
			ctx.fill();

			ctx.restore();
		}
	}
}

// ============================================================================
// 6. PIPELINE D'ORCHESTRATION DU RENDU (Pipeline / Composite Pattern)
// ============================================================================

export class BlackSunRenderPipeline {
	private readonly layers: RenderLayer[];

	constructor() {
		this.layers = [
			new BackgroundHaloLayer(),
			new CoronalPlumesLayer(),
			new SolarWavesLayer(),
			new CoronalLoopsLayer(),
			new SolarEmbersLayer(),
			new ChromosphereCoreLayer(),
			new DiamondRingLayer(),
			new NeonCurrentLayer()
		];
	}

	public execute(ctx: CanvasRenderingContext2D, frame: BlackSunFrameContext, engine: BlackSunPhysicsEngine): void {
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

const engine = new BlackSunPhysicsEngine();
const pipeline = new BlackSunRenderPipeline();

export function drawBlackSun(
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

	// Création du DTO de contexte immuable
	const frameContext: BlackSunFrameContext = {
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
		diamondPulse: engine.diamondPulse,
		continuousWavePhase: engine.continuousWavePhase,
		palette,
		features,
		analysis
	};

	// Exécution du pipeline ordonné
	pipeline.execute(ctx, frameContext, engine);
}

export const modeConfig: ModeConfig = {
	id: "black-sun",
	name: "🌑 Black Sun",
	render(ctx, width, height, features, palette, analysis) {
		drawBlackSun(ctx, width, height, features, palette, analysis);
	}
};
