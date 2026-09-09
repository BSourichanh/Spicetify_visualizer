import { AudioFeatures } from "./audioFeatures";
import { ThemePalette } from "./palette";
import { VisualizerSettings } from "../../../settings/settingsManager";
import { getVisualizerCenter } from "./geometry";

/**
 * 💥 BIG BANG COSMIC ORIGIN - AMBIENT & BACKGROUND ENGINE
 *
 * Ce moteur permet de projeter l'ambiance cosmique du Big Bang en arrière-plan
 * de N'IMPORTE QUEL modèle (Liquid Spectrum, Astral Lotus, Jellyfish, etc.) :
 * - Ondes d'inflation cosmologique sur basses très lourdes (Object Pool)
 * - Nébuleuse de matière primordiale en rotation lente (8 lobes)
 * - Graines stellaires relativistes & poussière cosmique en expansion
 *
 * Architecture :
 * - Object Pool Pattern (0 allocation par trame)
 * - Flyweight & Context DTO Pattern
 * - Rendu 60 FPS ultra-optimisé
 */

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

export class BigBangAmbientEngine {
	public smoothBass = 0.1;
	public smoothPunch = 0;
	public rotation = 0;

	public readonly shockwaves: PooledInflationWave[] = [];
	public readonly stellarSeeds: StellarSeed[] = [];

	private lastPunchTime = 0;
	private static readonly SHOCKWAVE_POOL_SIZE = 6;
	private static readonly STELLAR_SEEDS_COUNT = 45;

	constructor() {
		for (let i = 0; i < BigBangAmbientEngine.SHOCKWAVE_POOL_SIZE; i++) {
			this.shockwaves.push(new PooledInflationWave());
		}

		for (let i = 0; i < BigBangAmbientEngine.STELLAR_SEEDS_COUNT; i++) {
			this.stellarSeeds.push(
				new StellarSeed(
					Math.random() * Math.PI * 2,
					20 + Math.random() * 420,
					0.8 + Math.random() * 1.6,
					3.0 + Math.random() * 6.5,
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
		speedScale: number,
		maxDist: number,
		settings: VisualizerSettings
	): void {
		if (!isPlaying) {
			this.smoothPunch *= 0.88;
			this.smoothBass += (0.05 - this.smoothBass) * 0.1;
			return;
		}

		this.smoothBass += (bass - this.smoothBass) * 0.15;
		this.smoothPunch += (punch - this.smoothPunch) * 0.22;
		this.rotation += 0.0035 * speedScale;

		const now = Date.now();
		const waveEnabled = settings.bigBangWaveEnabled ?? true;
		const threshold = settings.bigBangWaveThreshold ?? 0.82;

		// Déclenchement exclusif sur basses très élevées
		const isHighBassExplosion =
			(bass >= threshold && punch > 0.42) ||
			bass >= Math.min(1.0, threshold * 1.1) ||
			punch >= Math.min(1.0, threshold * 0.95);

		if (waveEnabled && isHighBassExplosion && now - this.lastPunchTime > 320) {
			this.lastPunchTime = now;
			this.spawnShockwave(maxDist * 1.3, (14 + punch * 22) * speedScale, 12 + punch * 18);
		}

		// Mise à jour des ondes d'inflation
		for (let i = 0; i < this.shockwaves.length; i++) {
			this.shockwaves[i].update();
		}

		// Mise à jour des graines stellaires
		const kickBoost = isHighBassExplosion ? 3.5 : 1.0;
		for (let i = 0; i < this.stellarSeeds.length; i++) {
			const seed = this.stellarSeeds[i];
			seed.dist += seed.radialSpeed * speedScale * kickBoost * (0.75 + this.smoothPunch * 1.1);
			seed.angle += seed.speed * 0.0025 * speedScale;

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

const ambientEngine = new BigBangAmbientEngine();

/**
 * Fonction de rendu d'arrière-plan de Big Bang Cosmic Origin.
 * Appliquée derrière n'importe quel modèle actif.
 */
export function drawBigBangAmbient(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	features: AudioFeatures,
	palette: ThemePalette,
	settings: VisualizerSettings
): void {
	if (!settings.bigBangAmbientEnabled) return;

	const { cx, cy } = getVisualizerCenter(ctx);
	const speedScale = settings.speedScale ?? 1.0;
	const isPlaying = features.isPlaying ?? true;
	const maxScreenR = Math.hypot(cx, cy);
	const baseR = Math.min(width, height) * 0.44;
	const intensity = settings.bigBangAmbientIntensity ?? 1.0;

	ambientEngine.update(isPlaying, features.bassEnergy, features.punch, speedScale, maxScreenR, settings);

	ctx.save();

	// 1. NÉBULEUSE DE MATIÈRE PRIMORDIALE (Nuages de gaz cosmique en rotation)
	if (settings.bigBangNebulaEnabled !== false) {
		const numLobes = 8;
		for (let l = 0; l < numLobes; l++) {
			const lAngle = (l / numLobes) * Math.PI * 2 + ambientEngine.rotation;
			const lReach =
				baseR * (0.95 + Math.sin(features.energyTime * 1.6 + l * 1.3) * 0.2 + ambientEngine.smoothBass * 0.35);

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
			const lobeAlpha =
				(0.14 + ambientEngine.smoothBass * 0.12 + (l % 2 === 0 ? ambientEngine.smoothPunch * 0.1 : 0)) *
				intensity;

			lobeGrad.addColorStop(0, palette.veil(lobeAlpha * 1.1));
			lobeGrad.addColorStop(0.35, palette.veil(lobeAlpha * 0.85));
			lobeGrad.addColorStop(0.75, palette.veil(lobeAlpha * 0.3));
			lobeGrad.addColorStop(1, "transparent");

			ctx.fillStyle = lobeGrad;
			ctx.fill();

			ctx.lineWidth = 0.8;
			ctx.strokeStyle = palette.rimVeil(lobeAlpha * 0.45);
			ctx.stroke();

			ctx.restore();
		}
	}

	// 2. GRAINES STELLAIRES PRIMORDIALES & POUSSIÈRE COSMIQUE
	if (settings.bigBangStarsEnabled !== false) {
		for (let i = 0; i < ambientEngine.stellarSeeds.length; i++) {
			const seed = ambientEngine.stellarSeeds[i];
			const curX = cx + Math.cos(seed.angle) * seed.dist;
			const curY = cy + Math.sin(seed.angle) * seed.dist;

			const pulse = 0.5 + 0.5 * Math.sin(features.energyTime * 2.8 + seed.phase);
			const seedAlpha = (0.28 + ambientEngine.smoothBass * 0.28) * pulse * intensity;
			const seedR = seed.size * (0.8 + ambientEngine.smoothPunch * 0.45);

			const sGrad = ctx.createRadialGradient(curX, curY, 0, curX, curY, seedR * 2.2);
			sGrad.addColorStop(0, palette.highlight);
			sGrad.addColorStop(0.35, palette.rimVeil(seedAlpha));
			sGrad.addColorStop(1, "transparent");

			ctx.fillStyle = sGrad;
			ctx.beginPath();
			ctx.arc(curX, curY, seedR * 2.2, 0, Math.PI * 2);
			ctx.fill();

			if (ambientEngine.smoothPunch > 0.28) {
				const tailLen = seed.radialSpeed * 7.0 * ambientEngine.smoothPunch;
				const tailX = curX - Math.cos(seed.angle) * tailLen;
				const tailY = curY - Math.sin(seed.angle) * tailLen;

				ctx.beginPath();
				ctx.moveTo(curX, curY);
				ctx.lineTo(tailX, tailY);
				ctx.lineWidth = 0.9;
				ctx.strokeStyle = palette.rimVeil(seedAlpha * 0.5);
				ctx.stroke();
			}
		}
	}

	// 3. ONDES D'INFLATION COSMOLOGIQUE (Expansion sur les drops lourds)
	if (settings.bigBangWaveEnabled !== false) {
		for (let i = 0; i < ambientEngine.shockwaves.length; i++) {
			const wave = ambientEngine.shockwaves[i];
			if (!wave.active) continue;
			const curR = wave.radius;
			if (curR <= 0) continue;

			const shockGrad = ctx.createRadialGradient(cx, cy, Math.max(0, curR - wave.width), cx, cy, curR + 8);
			shockGrad.addColorStop(0, "transparent");
			shockGrad.addColorStop(0.3, palette.veil(wave.alpha * 0.35 * intensity));
			shockGrad.addColorStop(0.85, palette.rimVeil(wave.alpha * 0.8 * intensity));
			shockGrad.addColorStop(0.95, palette.highlight);
			shockGrad.addColorStop(1, "transparent");

			ctx.beginPath();
			ctx.arc(cx, cy, curR + 8, 0, Math.PI * 2);
			ctx.fillStyle = shockGrad;
			ctx.fill();

			ctx.beginPath();
			ctx.arc(cx, cy, curR, 0, Math.PI * 2);
			ctx.lineWidth = 1.8 + wave.alpha * 1.5;
			ctx.strokeStyle = palette.rimLight;
			ctx.stroke();
		}
	}

	ctx.restore();
}
