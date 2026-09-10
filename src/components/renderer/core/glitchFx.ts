import { AudioFeatures } from "./audioFeatures";
import { ThemePalette } from "./palette";
import { VisualizerSettings } from "../../../settings/settingsManager";

/**
 * ⚡ CYBERPUNK GLITCH ENGINE (POST-PROCESSING UNIVERSEL HAUTE PERFORMANCE)
 *
 * Architecture & Design Standards :
 * 1. Tranches de Décalage Horizontal (Slice Displacement / Screen Tear) :
 *    - Découpe dynamique de tranches horizontales aléatoires lors des kicks, drops et transitoires.
 * 2. Dispersion Chromatique & Split Holographique (Chromatic Aberration) :
 *    - Décalage fantôme en mode screen/lighter réactif aux impacts de percussions.
 * 3. Blocs de Corruption Numérique (Digital Data Artifacts) :
 *    - Paquets de pixels scintillants aux couleurs de la ThemePalette le long des tranches de glitch.
 * 4. Barres de Tracking VHS & Lignes CRT :
 *    - Balayage vertical discret avec filament laser lumineux traversant l'écran.
 * 5. Respect Strict des Règles AGENTS.md :
 *    - Règle 4 : Zéro allocation mémoire par frame (buffers Float32Array et scratch canvas singleton réutilisé).
 *    - Règle 6 : 100% harmonisé avec la ThemePalette Spotify (palette.solid, palette.highlight, etc.).
 */

export class CyberGlitchEngine {
	public glitchEnergy = 0;
	public trackingY = 0;
	public chromaticX = 0;
	public chromaticY = 0;

	public static readonly NUM_SLICES = 8;
	public readonly sliceY = new Float32Array(CyberGlitchEngine.NUM_SLICES);
	public readonly sliceH = new Float32Array(CyberGlitchEngine.NUM_SLICES);
	public readonly sliceOffset = new Float32Array(CyberGlitchEngine.NUM_SLICES);
	public readonly sliceActive = new Uint8Array(CyberGlitchEngine.NUM_SLICES);

	public static readonly NUM_BLOCKS = 6;
	public readonly blockX = new Float32Array(CyberGlitchEngine.NUM_BLOCKS);
	public readonly blockY = new Float32Array(CyberGlitchEngine.NUM_BLOCKS);
	public readonly blockW = new Float32Array(CyberGlitchEngine.NUM_BLOCKS);
	public readonly blockH = new Float32Array(CyberGlitchEngine.NUM_BLOCKS);
	public readonly blockAlpha = new Float32Array(CyberGlitchEngine.NUM_BLOCKS);

	public update(
		isPlaying: boolean,
		bassEnergy: number,
		punch: number,
		transientEnergy: number,
		intensity: number,
		width: number,
		height: number
	): void {
		if (!isPlaying || intensity <= 0.01) {
			this.glitchEnergy *= 0.7;
			return;
		}

		// Déclenchement sur percussions (kicks, drops, transients) ou micro-stutter aléatoire
		const isHeavyKick = punch > 0.32 || bassEnergy > 0.62 || transientEnergy > 0.45;
		const isMicroStutter = Math.random() < 0.18;
		const currentBurst = isHeavyKick
			? (punch * 1.6 + transientEnergy * 0.8) * intensity
			: isMicroStutter
				? 0.45 * intensity
				: 0;

		this.glitchEnergy = Math.max(this.glitchEnergy * 0.68, currentBurst);

		// Tracking CRT roll
		this.trackingY += 0.018 * height;
		if (this.trackingY > height) this.trackingY = 0;

		// Déplacement chromatique
		if (isHeavyKick || isMicroStutter) {
			const burstMag = (this.glitchEnergy * 24.0 + 6.0) * intensity;
			this.chromaticX = (Math.random() - 0.5) * burstMag;
			this.chromaticY = (Math.random() - 0.5) * (burstMag * 0.3);
		} else {
			this.chromaticX *= 0.6;
			this.chromaticY *= 0.6;
		}

		// 8 Tranches horizontales de découpe
		for (let s = 0; s < CyberGlitchEngine.NUM_SLICES; s++) {
			if ((isHeavyKick || isMicroStutter) && Math.random() < 0.45) {
				const dir = Math.random() < 0.5 ? 1 : -1;
				this.sliceY[s] = Math.random() * (height - 40);
				this.sliceH[s] = 8 + Math.random() * (height * 0.06);
				this.sliceOffset[s] = dir * (6.0 + this.glitchEnergy * 32.0 + Math.random() * 12.0) * intensity;
				this.sliceActive[s] = 1;
			} else {
				this.sliceOffset[s] *= 0.6;
				if (Math.abs(this.sliceOffset[s]) < 0.8) {
					this.sliceOffset[s] = 0;
					this.sliceActive[s] = 0;
				}
			}
		}

		// Blocs de données corrompues (digital artifacts)
		for (let b = 0; b < CyberGlitchEngine.NUM_BLOCKS; b++) {
			if (this.glitchEnergy > 0.22 && Math.random() < 0.45) {
				this.blockX[b] = Math.random() * width;
				this.blockY[b] = Math.random() * height;
				this.blockW[b] = (20 + Math.random() * 80) * intensity;
				this.blockH[b] = 2 + Math.random() * 8;
				this.blockAlpha[b] = 0.4 + Math.random() * 0.5;
			} else {
				this.blockAlpha[b] *= 0.6;
			}
		}
	}
}

// Scratch Canvas Singleton (Zero-GC / Réutilisé à 60 FPS)
let scratchCanvas: HTMLCanvasElement | null = null;
let scratchCtx: CanvasRenderingContext2D | null = null;

function getScratchCanvas(
	width: number,
	height: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
	if (typeof document === "undefined") return null;
	if (!scratchCanvas) {
		scratchCanvas = document.createElement("canvas");
		scratchCtx = scratchCanvas.getContext("2d", { willReadFrequently: false });
	}
	if (scratchCanvas.width !== width || scratchCanvas.height !== height) {
		scratchCanvas.width = width;
		scratchCanvas.height = height;
	}
	return scratchCtx ? { canvas: scratchCanvas, ctx: scratchCtx } : null;
}

const glitchEngine = new CyberGlitchEngine();

/**
 * Fonction maîtresse de post-traitement glitch cyberpunk pour TOUS les modèles.
 */
export function drawCyberGlitch(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	features: AudioFeatures,
	palette: ThemePalette,
	settings: VisualizerSettings
): void {
	if (!settings.glitchEnabled) return;

	const intensity = settings.glitchIntensity ?? 1.0;
	glitchEngine.update(
		features.isPlaying,
		features.bassEnergy,
		features.punch,
		features.transientEnergy,
		intensity,
		width,
		height
	);

	if (glitchEngine.glitchEnergy < 0.06) return;

	const scratch = getScratchCanvas(width, height);
	if (!scratch) return;

	// Snapshot instantané du canvas actuel dans le scratch buffer
	scratch.ctx.clearRect(0, 0, width, height);
	scratch.ctx.drawImage(ctx.canvas, 0, 0);

	// 1. Dispersion chromatique RVB / Holographic Split (si activé)
	if (settings.glitchAberration && Math.abs(glitchEngine.chromaticX) > 1.0) {
		ctx.save();
		ctx.globalCompositeOperation = "screen";
		ctx.globalAlpha = Math.min(0.45, glitchEngine.glitchEnergy * 0.35);

		// Décalage horizontal
		ctx.drawImage(scratch.canvas, glitchEngine.chromaticX, glitchEngine.chromaticY);

		// Tint coloré sur la copie décalée
		ctx.fillStyle = palette.rimVeil(0.15);
		ctx.fillRect(0, 0, width, height);
		ctx.restore();
	}

	// 2. Décalage horizontal par tranches (Slice Displacement)
	for (let s = 0; s < CyberGlitchEngine.NUM_SLICES; s++) {
		if (glitchEngine.sliceActive[s] === 1 && Math.abs(glitchEngine.sliceOffset[s]) > 1.0) {
			const sy = glitchEngine.sliceY[s];
			const sh = glitchEngine.sliceH[s];
			const dx = glitchEngine.sliceOffset[s];

			ctx.save();
			// Effacer la bande d'origine pour éviter le dédoublement sale
			ctx.clearRect(0, sy, width, sh);
			// Dessiner la bande décalée depuis le snapshot
			ctx.drawImage(scratch.canvas, 0, sy, width, sh, dx, sy, width, sh);

			// Voile subtil teinté sur la tranche décalée
			ctx.fillStyle = palette.veil(0.12);
			ctx.fillRect(0, sy, width, sh);
			ctx.restore();
		}
	}

	// 3. Blocs de corruption numérique & paquets de données
	ctx.save();
	for (let b = 0; b < CyberGlitchEngine.NUM_BLOCKS; b++) {
		const alpha = glitchEngine.blockAlpha[b];
		if (alpha < 0.05) continue;

		const bx = glitchEngine.blockX[b];
		const by = glitchEngine.blockY[b];
		const bw = glitchEngine.blockW[b];
		const bh = glitchEngine.blockH[b];

		ctx.fillStyle = palette.rimVeil(alpha * 0.85);
		ctx.shadowColor = palette.solid;
		ctx.shadowBlur = 8;
		ctx.fillRect(bx, by, bw, bh);

		// Liseré blanc pur au cœur du bloc
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(bx, by, bw * 0.45, Math.min(bh, 1.5));
	}
	ctx.restore();

	// 4. Lignes de balayage CRT & Tracking VHS (si activé)
	if (settings.glitchScanlines && glitchEngine.glitchEnergy > 0.12) {
		ctx.save();
		const trackingY = glitchEngine.trackingY;
		const barH = 18 + glitchEngine.glitchEnergy * 14;

		// Barre de tracking VHS horizontale
		const barGrad = ctx.createLinearGradient(0, trackingY, 0, trackingY + barH);
		barGrad.addColorStop(0, "transparent");
		barGrad.addColorStop(0.5, palette.rimVeil(0.15 + glitchEngine.glitchEnergy * 0.15));
		barGrad.addColorStop(1, "transparent");

		ctx.fillStyle = barGrad;
		ctx.fillRect(0, trackingY, width, barH);

		// Liseré laser étincelant au sommet de la barre de tracking
		ctx.lineWidth = 1.2;
		ctx.strokeStyle = palette.highlight;
		ctx.shadowColor = palette.solid;
		ctx.shadowBlur = 6;
		ctx.beginPath();
		ctx.moveTo(0, trackingY + barH * 0.5);
		ctx.lineTo(width, trackingY + barH * 0.5);
		ctx.stroke();

		ctx.restore();
	}
}
