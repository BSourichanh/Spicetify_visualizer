import { AudioFeatures } from "./audioFeatures";
import { ThemePalette } from "./palette";
import { VisualizerSettings } from "../../../settings/settingsManager";
import { getVisualizerCenter } from "./geometry";

type Shockwave = {
	startTime: number;
	intensity: number;
	duration: number;
};

const activeShockwaves: Shockwave[] = [];
let lastTriggerTime = 0;
let wasBassPeak = false;

/**
 * Onde de choc d'arrière-plan douce et diaphane (rendue derrière le modèle).
 * Se propage depuis le centre vers les bords sur les kicks et les basses sans opacité agressive.
 */
export function drawBackgroundShockwave(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	features: AudioFeatures,
	palette: ThemePalette,
	settings: VisualizerSettings
) {
	if (!settings.shockwaveEnabled) {
		activeShockwaves.length = 0;
		return;
	}

	const now = performance.now();
	const { cx, cy } = getVisualizerCenter(ctx);
	const maxR = Math.hypot(width, height) * 0.58;
	const intensityMult = settings.shockwaveIntensity ?? 1.0;

	// Détection des impacts de basse (punch et sub-bass)
	const bassHit = features.punch * 0.76 + features.bassEnergy * 0.44;
	const isPeak = (features.punch > 0.32 && features.bassEnergy > 0.25) || features.punch > 0.46;

	if (isPeak && !wasBassPeak && now - lastTriggerTime > 260) {
		const intensity = Math.min(1.0, bassHit) * intensityMult;
		if (intensity > 0.05) {
			// Limiter à 3 ondes actives simultanément pour éviter l'accumulation
			if (activeShockwaves.length >= 3) {
				activeShockwaves.shift();
			}
			activeShockwaves.push({
				startTime: now,
				intensity,
				duration: 1150
			});
			lastTriggerTime = now;
		}
	}
	wasBassPeak = isPeak;

	// Nettoyage des ondes terminées
	for (let i = activeShockwaves.length - 1; i >= 0; i--) {
		if (now - activeShockwaves[i].startTime > activeShockwaves[i].duration) {
			activeShockwaves.splice(i, 1);
		}
	}

	if (activeShockwaves.length === 0) return;

	ctx.save();

	// Rendu des ondes de choc en arrière-plan
	// Pure diffusion néon volumétrique diaphane et aérienne (zéro trait dur, zéro boule)
	for (const wave of activeShockwaves) {
		const progress = (now - wave.startTime) / wave.duration; // 0.0 au centre -> 1.0 aux bords
		const currentR = progress * maxR;

		// Bande volumétrique large et très estompée pour un fondu parfait
		const bandWidth = 100 + progress * 240;
		const innerR = Math.max(0, currentR - bandWidth);
		const outerR = currentR + bandWidth;

		// Évolution en cloche douce : opacité très légère et transparente
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
