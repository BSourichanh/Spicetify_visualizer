import { AudioFeatures } from "./audioFeatures";
import { ThemePalette } from "./palette";
import { VisualizerSettings } from "../../../settings/settingsManager";
import { getVisualizerCenter } from "./geometry";

/**
 * 🌊 BACKGROUND SHOCKWAVE SYSTEM (Object Pool Pattern)
 * Onde de choc d'arrière-plan douce et diaphane (rendue derrière le modèle).
 * Pool d'objets fermé sans aucune allocation / désallocation dynamique.
 */

class PooledShockwave {
	public active = false;
	public startTime = 0;
	public intensity = 0;
	public duration = 0;

	public spawn(startTime: number, intensity: number, duration: number): void {
		this.active = true;
		this.startTime = startTime;
		this.intensity = intensity;
		this.duration = duration;
	}

	public getProgress(now: number): number {
		if (!this.active) return 1.0;
		const elapsed = now - this.startTime;
		if (elapsed >= this.duration) {
			this.active = false;
			return 1.0;
		}
		return elapsed / this.duration;
	}
}

class BackgroundShockwaveEngine {
	private static readonly POOL_SIZE = 5;
	private readonly pool: PooledShockwave[] = [];
	private lastTriggerTime = 0;
	private prevPunch = 0;

	constructor() {
		for (let i = 0; i < BackgroundShockwaveEngine.POOL_SIZE; i++) {
			this.pool.push(new PooledShockwave());
		}
	}

	public clear(): void {
		for (let i = 0; i < this.pool.length; i++) {
			this.pool[i].active = false;
		}
		this.prevPunch = 0;
	}

	public updateAndTrigger(features: AudioFeatures, settings: VisualizerSettings, now: number): void {
		const intensityMult = settings.shockwaveIntensity ?? 1.0;
		const sensitivity = settings.shockwaveSensitivity ?? 1.0;

		// Modulation de la détection de crête par la sensibilité aux basses
		const effectivePunch = features.punch * sensitivity;
		const effectiveBass = features.bassEnergy * sensitivity;
		const bassHit = effectivePunch * 0.76 + effectiveBass * 0.44;

		// Détection d'un front d'attaque (kick / percussion) :
		// Dans les drops, le sub-bass est continu (>0.6), mais chaque kick crée une impulsion de punch
		const isKickAttack = effectivePunch > 0.26 && (effectivePunch > this.prevPunch + 0.04 || effectivePunch > 0.42);
		const isBassDropImpact = bassHit > 0.48 && effectivePunch > 0.22;

		const cooldown = Math.max(160, Math.round(250 / Math.min(1.6, Math.max(0.6, sensitivity))));

		if ((isKickAttack || isBassDropImpact) && now - this.lastTriggerTime > cooldown) {
			// En plein drop (sub-bass lourd), amplifier l'onde de choc pour un impact visuel colossal
			const dropBoost = features.bassEnergy > 0.55 ? 1.25 : 1.0;
			const intensity = Math.min(1.2, bassHit * dropBoost) * intensityMult;
			if (intensity > 0.04) {
				this.spawnWave(now, intensity, settings);
				this.lastTriggerTime = now;
			}
		}

		this.prevPunch = effectivePunch;
	}

	private spawnWave(now: number, intensity: number, settings: VisualizerSettings): void {
		// Trouver un slot inactif ou remplacer le plus ancien
		let target = this.pool.find(w => !w.active);
		if (!target) {
			target = this.pool.reduce((oldest, w) => (w.startTime < oldest.startTime ? w : oldest));
		}

		const shockDuration = Math.max(350, Math.round(1150 / (settings.shockwaveSpeed ?? 1.0)));
		target.spawn(now, intensity, shockDuration);
	}

	public render(
		ctx: CanvasRenderingContext2D,
		width: number,
		height: number,
		palette: ThemePalette,
		now: number
	): void {
		const { cx, cy } = getVisualizerCenter(ctx);
		const maxR = Math.hypot(width, height) * 0.58;

		let hasActive = false;
		for (let i = 0; i < this.pool.length; i++) {
			if (this.pool[i].active) {
				hasActive = true;
				break;
			}
		}
		if (!hasActive) return;

		ctx.save();

		for (let i = 0; i < this.pool.length; i++) {
			const wave = this.pool[i];
			if (!wave.active) continue;

			const progress = wave.getProgress(now);
			if (progress >= 1.0) continue;

			const currentR = progress * maxR;
			const bandWidth = 100 + progress * 240;
			const innerR = Math.max(0, currentR - bandWidth);
			const outerR = currentR + bandWidth;

			const envelope = Math.sin(progress * Math.PI);
			const waveAlpha = Math.min(0.16, envelope * wave.intensity * 0.08);

			if (waveAlpha > 0.002) {
				const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
				grad.addColorStop(0, "transparent");
				grad.addColorStop(0.25, palette.rimVeil(waveAlpha * 0.25));
				grad.addColorStop(0.5, palette.rimVeil(waveAlpha));
				grad.addColorStop(0.75, palette.rimVeil(waveAlpha * 0.25));
				grad.addColorStop(1, "transparent");

				ctx.fillStyle = grad;
				ctx.beginPath();
				ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		ctx.restore();
	}

	public getIntensityAtRadius(dist: number, maxR: number, now: number): number {
		let totalBoost = 0;

		for (let i = 0; i < this.pool.length; i++) {
			const wave = this.pool[i];
			if (!wave.active) continue;

			const progress = wave.getProgress(now);
			if (progress <= 0 || progress >= 1) continue;

			const currentR = progress * maxR;
			const bandWidth = 100 + progress * 240;
			const delta = Math.abs(dist - currentR);

			if (delta < bandWidth) {
				const proximity = Math.cos((delta / bandWidth) * (Math.PI * 0.5));
				const envelope = Math.sin(progress * Math.PI);
				totalBoost += proximity * envelope * wave.intensity;
			}
		}

		return totalBoost;
	}
}

const engine = new BackgroundShockwaveEngine();

export function drawBackgroundShockwave(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	features: AudioFeatures,
	palette: ThemePalette,
	settings: VisualizerSettings
): void {
	if (!settings.shockwaveEnabled || !features.isPlaying) {
		engine.clear();
		return;
	}

	const now = performance.now();
	engine.updateAndTrigger(features, settings, now);
	engine.render(ctx, width, height, palette, now);
}

export function getShockwaveIntensityAtRadius(dist: number, maxR: number): number {
	return engine.getIntensityAtRadius(dist, maxR, performance.now());
}
