import { AudioFeatures } from "./audioFeatures";
import { ThemePalette } from "./palette";
import { VisualizerSettings } from "../../../settings/settingsManager";
import { getVisualizerCenter } from "./geometry";
import { getShockwaveIntensityAtRadius } from "./backgroundShockwave";

type Firefly = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	baseRadius: number;
	twinklePhase: number;
	twinkleSpeed: number;
	harmonicOffset: number;
	harmonicSpeed: number;
	shockExcitement: number;
};

const FIREFLY_COUNT = 36;
const fireflies: Firefly[] = [];
let lastTimestamp = 0;
let lastWidth = 0;
let lastHeight = 0;

function initFireflies(width: number, height: number, count = 36) {
	fireflies.length = 0;
	for (let i = 0; i < count; i++) {
		fireflies.push({
			x: Math.random() * width,
			y: Math.random() * height,
			vx: (Math.random() - 0.5) * 14,
			vy: (Math.random() - 0.5) * 12 - 4, // Légère tendance à flotter vers le haut
			baseRadius: 10 + Math.random() * 12,
			twinklePhase: Math.random() * Math.PI * 2,
			twinkleSpeed: 0.8 + Math.random() * 1.6,
			harmonicOffset: Math.random() * Math.PI * 2,
			harmonicSpeed: 0.6 + Math.random() * 1.2,
			shockExcitement: 0
		});
	}
	lastWidth = width;
	lastHeight = height;
}

/**
 * Rendu des lucioles bioluminescentes d'arrière-plan.
 * Flottement organique et sursaut d'intensité lumineuse au passage de l'onde de choc.
 * Respect strict de l'esthétique : 0 trait dur, 0 boule solide, gradients radiaux diffus.
 */
export function drawFireflies(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	features: AudioFeatures,
	palette: ThemePalette,
	settings: VisualizerSettings
) {
	if (!settings.firefliesEnabled) {
		return;
	}

	const isPlaying = features.isPlaying ?? true;
	const now = performance.now();
	const dt = lastTimestamp > 0 && isPlaying ? Math.min(0.1, (now - lastTimestamp) / 1000) : 0;
	lastTimestamp = now;

	const targetCount = settings.firefliesCount ?? 36;
	const speedMult = settings.firefliesSpeed ?? 1.0;

	// Initialisation ou redimensionnement dynamique
	if (fireflies.length !== targetCount || Math.abs(width - lastWidth) > 100 || Math.abs(height - lastHeight) > 100) {
		initFireflies(width, height, targetCount);
	}

	const { cx, cy } = getVisualizerCenter(ctx);
	const maxR = Math.hypot(width, height) * 0.58;
	const intensitySetting = settings.firefliesIntensity ?? 1.0;
	const sizeMult = settings.firefliesSize ?? 1.0;
	const margin = 50;

	ctx.save();
	// Rendu lumineux diaphane en mode fusion additive
	ctx.globalCompositeOperation = "screen";

	for (let i = 0; i < fireflies.length; i++) {
		const f = fireflies[i];

		// Dérive physique douce et organique avec oscillations harmoniques
		const wobbleX = Math.sin(now * 0.0012 * f.harmonicSpeed * speedMult + f.harmonicOffset) * 8 * speedMult;
		const wobbleY = Math.cos(now * 0.0009 * f.harmonicSpeed * speedMult + f.harmonicOffset) * 6 * speedMult;
		f.x += (f.vx * speedMult + wobbleX) * dt;
		f.y += (f.vy * speedMult + wobbleY) * dt;

		// Rebouclage torique fluide sur les bordures de l'écran
		if (f.x < -margin) f.x = width + margin;
		else if (f.x > width + margin) f.x = -margin;
		if (f.y < -margin) f.y = height + margin;
		else if (f.y > height + margin) f.y = -margin;

		// Détection de l'onde de choc traversante
		const distToCenter = Math.hypot(f.x - cx, f.y - cy);
		const shockBoost = getShockwaveIntensityAtRadius(distToCenter, maxR);

		if (shockBoost > f.shockExcitement) {
			f.shockExcitement = shockBoost;
		} else {
			// Décroissance douce et progressive de l'excitation lumineuse
			f.shockExcitement *= 0.935;
		}

		// Scintillement de base doux et réactif à la musique
		const baseTwinkle = 0.4 + 0.3 * Math.sin(f.twinklePhase + features.energyTime * f.twinkleSpeed);
		// L'onde de choc fait flamboyer la luciole de manière spectaculaire
		const totalBrightness = (baseTwinkle + f.shockExcitement * 3.8) * intensitySetting;

		if (totalBrightness <= 0.01) continue;

		// Épanouissement du rayon de la lueur au passage de l'onde et selon la taille configurée
		const currentRadius = f.baseRadius * sizeMult * (1.0 + f.shockExcitement * 2.4 + features.bassEnergy * 0.25);

		// Halo radial néon ultra-doux (zéro boule solide, fondu vers 0 alpha)
		const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, currentRadius);
		const centerAlpha = Math.min(0.85, 0.32 * totalBrightness);
		const midAlpha = Math.min(0.5, 0.16 * totalBrightness);

		grad.addColorStop(0, palette.rimVeil(centerAlpha));
		grad.addColorStop(0.28, palette.veil(midAlpha));
		grad.addColorStop(0.65, palette.veil(midAlpha * 0.25));
		grad.addColorStop(1, "transparent");

		ctx.fillStyle = grad;
		ctx.beginPath();
		ctx.arc(f.x, f.y, currentRadius, 0, Math.PI * 2);
		ctx.fill();

		// Cœur incandescent féerique si la luciole est vivement excitée par l'onde
		if (f.shockExcitement > 0.08) {
			const coreR = Math.max(3, currentRadius * 0.32);
			const coreGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, coreR);
			const coreAlpha = Math.min(0.95, f.shockExcitement * 0.85);

			coreGrad.addColorStop(0, palette.rimVeil(coreAlpha));
			coreGrad.addColorStop(0.4, palette.veil(coreAlpha * 0.75));
			coreGrad.addColorStop(1, "transparent");

			ctx.fillStyle = coreGrad;
			ctx.beginPath();
			ctx.arc(f.x, f.y, coreR, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	ctx.restore();
}
