import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";
import { neonCurrentManager } from "../core/neonCurrent";
import { extractFrequencyBands, ExtractedFrequencyBands } from "../core/frequencyBands";
import { AudioSyncManager } from "../../../audio-sync";
import { AudioFeatures } from "../core/audioFeatures";
import { getVisualizerSettings } from "../../../settings/settingsManager";

/**
 * 🌊 LIQUID SPECTRUM - Égaliseur / Spectre Multi-Bandes Haute Précision
 *
 * Architecture & Design Patterns :
 * - Pipeline & Strategy Pattern : Découpage en couches spécialisées (SpectrumLayer)
 * - Zero-Allocation Buffers : Float32Array pré-alloués pour les crêtes et l'onde continue (0 alloc / frame)
 * - Context DTO Pattern : Distribution immuable des métriques de trame (LiquidSpectrumFrameContext)
 */

// ============================================================================
// 1. CONTEXTE IMMUABLE DE RENDU (Context / DTO Pattern)
// ============================================================================

export interface LiquidSpectrumFrameContext {
	readonly cx: number;
	readonly cy: number;
	readonly width: number;
	readonly height: number;
	readonly baselineY: number;
	readonly maxBarHeight: number;
	readonly spectrumWidth: number;
	readonly startX: number;
	readonly barWidth: number;
	readonly isMirror: boolean;
	readonly showPeaks: boolean;
	readonly bands: ExtractedFrequencyBands;
	readonly palette: ThemePalette;
	readonly features: AudioFeatures;
}

// ============================================================================
// 2. TAMPONS PRÉ-ALLOUÉS (Zero Allocation)
// ============================================================================

export class LiquidSpectrumBuffers {
	public static readonly MAX_POINTS = 72; // 36 canaux x 2 côtés
	public readonly waveX = new Float32Array(LiquidSpectrumBuffers.MAX_POINTS);
	public readonly waveY = new Float32Array(LiquidSpectrumBuffers.MAX_POINTS);
	public waveCount = 0;

	public readonly peakX = new Float32Array(LiquidSpectrumBuffers.MAX_POINTS);
	public readonly peakY = new Float32Array(LiquidSpectrumBuffers.MAX_POINTS);
	public readonly peakVal = new Float32Array(LiquidSpectrumBuffers.MAX_POINTS);
	public peakCount = 0;

	public reset(): void {
		this.waveCount = 0;
		this.peakCount = 0;
	}

	public addWavePoint(x: number, y: number): void {
		if (this.waveCount < LiquidSpectrumBuffers.MAX_POINTS) {
			this.waveX[this.waveCount] = x;
			this.waveY[this.waveCount] = y;
			this.waveCount++;
		}
	}

	public addPeakPoint(x: number, y: number, val: number): void {
		if (this.peakCount < LiquidSpectrumBuffers.MAX_POINTS) {
			this.peakX[this.peakCount] = x;
			this.peakY[this.peakCount] = y;
			this.peakVal[this.peakCount] = val;
			this.peakCount++;
		}
	}
}

// ============================================================================
// 3. STRATÉGIES DE RENDU PAR COUCHE (RenderLayer Strategy Pattern)
// ============================================================================

export interface SpectrumLayer {
	render(ctx: CanvasRenderingContext2D, frame: LiquidSpectrumFrameContext, buffers: LiquidSpectrumBuffers): void;
}

/**
 * Couche 1 : Colonnes de lumière liquide diaphane
 */
class LiquidColumnsLayer implements SpectrumLayer {
	public render(
		ctx: CanvasRenderingContext2D,
		frame: LiquidSpectrumFrameContext,
		buffers: LiquidSpectrumBuffers
	): void {
		const {
			cx,
			baselineY,
			maxBarHeight,
			spectrumWidth,
			startX,
			barWidth,
			isMirror,
			showPeaks,
			bands,
			palette,
			features
		} = frame;

		buffers.reset();
		const numBands = bands.channels.length;

		if (isMirror) {
			const halfBands = numBands;

			// Côté gauche (indices décroissants sans allouer de tableau)
			for (let ch = halfBands - 1; ch >= 0; ch--) {
				this.renderBar(
					ctx,
					ch,
					-1,
					halfBands,
					cx,
					baselineY,
					maxBarHeight,
					spectrumWidth,
					barWidth,
					bands,
					showPeaks,
					features,
					palette,
					buffers
				);
			}

			// Côté droit (indices croissants)
			for (let ch = 0; ch < halfBands; ch++) {
				this.renderBar(
					ctx,
					ch,
					1,
					halfBands,
					cx,
					baselineY,
					maxBarHeight,
					spectrumWidth,
					barWidth,
					bands,
					showPeaks,
					features,
					palette,
					buffers
				);
			}
		} else {
			for (let ch = 0; ch < numBands; ch++) {
				const val = bands.channels[ch];
				const peakVal = bands.peaks[ch];
				const normDist = (ch + 0.5) / numBands;
				const posX = startX + normDist * spectrumWidth;

				const rawHeight = Math.max(8, val * maxBarHeight * (0.88 + features.punch * 0.18));
				const posY = baselineY - rawHeight;
				const neonWave = neonCurrentManager.getIntensityAt(normDist, 0, 0.22);

				this.drawColumn(ctx, posX, posY, baselineY, rawHeight, barWidth, val, ch, neonWave, bands, palette);

				buffers.addWavePoint(posX, posY);
				if (showPeaks && peakVal > val + 0.04) {
					buffers.addPeakPoint(posX, baselineY - Math.max(12, peakVal * maxBarHeight), peakVal);
				}
			}
		}
	}

	private renderBar(
		ctx: CanvasRenderingContext2D,
		ch: number,
		side: number,
		halfBands: number,
		cx: number,
		baselineY: number,
		maxBarHeight: number,
		spectrumWidth: number,
		barWidth: number,
		bands: ExtractedFrequencyBands,
		showPeaks: boolean,
		features: AudioFeatures,
		palette: ThemePalette,
		buffers: LiquidSpectrumBuffers
	): void {
		const val = bands.channels[ch];
		const peakVal = bands.peaks[ch];
		const normDist = (ch + 0.5) / halfBands;
		const posX = cx + side * normDist * (spectrumWidth * 0.5);

		const rawHeight = Math.max(8, val * maxBarHeight * (0.88 + features.punch * 0.18));
		const posY = baselineY - rawHeight;
		const neonWave = neonCurrentManager.getIntensityAt(normDist, 0, 0.22);

		this.drawColumn(ctx, posX, posY, baselineY, rawHeight, barWidth, val, ch, neonWave, bands, palette);

		buffers.addWavePoint(posX, posY);
		if (showPeaks && peakVal > val + 0.04) {
			buffers.addPeakPoint(posX, baselineY - Math.max(12, peakVal * maxBarHeight), peakVal);
		}
	}

	private drawColumn(
		ctx: CanvasRenderingContext2D,
		posX: number,
		posY: number,
		baselineY: number,
		rawHeight: number,
		barWidth: number,
		val: number,
		ch: number,
		neonWave: number,
		bands: ExtractedFrequencyBands,
		palette: ThemePalette
	): void {
		const colGrad = ctx.createLinearGradient(posX, baselineY, posX, posY);
		const baseAlpha = 0.12 + val * 0.45 + (ch < 6 ? bands.subBass * 0.25 : 0);
		const topAlpha = Math.min(0.92, 0.35 + val * 0.55 + neonWave * 0.3);

		colGrad.addColorStop(0, "transparent");
		colGrad.addColorStop(0.25, palette.veil(baseAlpha * 0.5));
		colGrad.addColorStop(0.7, palette.veil(baseAlpha));
		colGrad.addColorStop(1, neonWave > 0.15 ? palette.highlight : palette.rimVeil(topAlpha));

		ctx.fillStyle = colGrad;
		ctx.beginPath();
		const capR = Math.min(barWidth * 0.5, rawHeight * 0.35);
		ctx.roundRect(posX - barWidth * 0.5, posY, barWidth, rawHeight, [capR, capR, 0, 0]);
		ctx.fill();

		ctx.beginPath();
		ctx.moveTo(posX - barWidth * 0.45, posY + capR);
		ctx.quadraticCurveTo(posX, posY, posX + barWidth * 0.45, posY + capR);
		ctx.strokeStyle = neonWave > 0.15 ? palette.highlight : palette.rimLight;
		ctx.lineWidth = 1.6 + neonWave * 1.5;
		ctx.shadowBlur = 8 + val * 12;
		ctx.shadowColor = palette.solid;
		ctx.stroke();
		ctx.shadowBlur = 0;
	}
}

/**
 * Couche 2 : Ruban fluide et aurore continue reliant les sommets
 */
class AuroraCrestLayer implements SpectrumLayer {
	public render(
		ctx: CanvasRenderingContext2D,
		frame: LiquidSpectrumFrameContext,
		buffers: LiquidSpectrumBuffers
	): void {
		const { cx, baselineY, maxBarHeight, features, palette } = frame;
		if (buffers.waveCount <= 2) return;

		ctx.save();
		ctx.beginPath();
		ctx.moveTo(buffers.waveX[0], baselineY);
		ctx.lineTo(buffers.waveX[0], buffers.waveY[0]);

		for (let i = 1; i < buffers.waveCount; i++) {
			const prevX = buffers.waveX[i - 1];
			const prevY = buffers.waveY[i - 1];
			const currX = buffers.waveX[i];
			const currY = buffers.waveY[i];
			const midX = (prevX + currX) / 2;
			const midY = (prevY + currY) / 2;
			ctx.quadraticCurveTo(prevX, prevY, midX, midY);
		}
		const lastIdx = buffers.waveCount - 1;
		ctx.lineTo(buffers.waveX[lastIdx], buffers.waveY[lastIdx]);
		ctx.lineTo(buffers.waveX[lastIdx], baselineY);
		ctx.closePath();

		const waveFill = ctx.createLinearGradient(cx, baselineY - maxBarHeight, cx, baselineY);
		waveFill.addColorStop(0, palette.rimVeil(0.18 + features.punch * 0.12));
		waveFill.addColorStop(0.5, palette.veil(0.08));
		waveFill.addColorStop(1, "transparent");
		ctx.fillStyle = waveFill;
		ctx.fill();

		// Tracé du ruban supérieur
		ctx.beginPath();
		ctx.moveTo(buffers.waveX[0], buffers.waveY[0]);
		for (let i = 1; i < buffers.waveCount; i++) {
			const prevX = buffers.waveX[i - 1];
			const prevY = buffers.waveY[i - 1];
			const currX = buffers.waveX[i];
			const currY = buffers.waveY[i];
			const midX = (prevX + currX) / 2;
			const midY = (prevY + currY) / 2;
			ctx.quadraticCurveTo(prevX, prevY, midX, midY);
		}
		ctx.strokeStyle = palette.rimLight;
		ctx.lineWidth = 2.2 + features.punch * 1.4;
		ctx.shadowBlur = 14 + features.bassEnergy * 16;
		ctx.shadowColor = palette.solid;
		ctx.stroke();

		ctx.restore();
	}
}

/**
 * Couche 3 : Crêtes de brume flottantes (vaporeuses)
 */
class FloatingMistLayer implements SpectrumLayer {
	public render(
		ctx: CanvasRenderingContext2D,
		frame: LiquidSpectrumFrameContext,
		buffers: LiquidSpectrumBuffers
	): void {
		if (!frame.showPeaks || buffers.peakCount === 0) return;
		const { barWidth, palette } = frame;

		for (let i = 0; i < buffers.peakCount; i++) {
			const px = buffers.peakX[i];
			const py = buffers.peakY[i];
			const val = buffers.peakVal[i];

			const mistR = Math.max(4, barWidth * (0.6 + val * 0.6));
			const mistGrad = ctx.createRadialGradient(px, py, 0, px, py, mistR);
			const mistAlpha = Math.min(0.85, 0.35 + val * 0.45);

			mistGrad.addColorStop(0, palette.rimVeil(mistAlpha));
			mistGrad.addColorStop(0.4, palette.veil(mistAlpha * 0.4));
			mistGrad.addColorStop(1, "transparent");

			ctx.fillStyle = mistGrad;
			ctx.beginPath();
			ctx.arc(px, py, mistR, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

/**
 * Couche 4 : Ligne d'horizon de réflexion aquatique
 */
class AquaticHorizonLayer implements SpectrumLayer {
	public render(
		ctx: CanvasRenderingContext2D,
		frame: LiquidSpectrumFrameContext,
		_buffers: LiquidSpectrumBuffers
	): void {
		const { startX, baselineY, spectrumWidth, features, palette } = frame;

		const horizonGrad = ctx.createLinearGradient(startX, baselineY, startX + spectrumWidth, baselineY);
		horizonGrad.addColorStop(0, "transparent");
		horizonGrad.addColorStop(0.2, palette.veil(0.25));
		horizonGrad.addColorStop(0.5, palette.rimVeil(0.55 + features.bassEnergy * 0.3));
		horizonGrad.addColorStop(0.8, palette.veil(0.25));
		horizonGrad.addColorStop(1, "transparent");

		ctx.lineWidth = 1.8;
		ctx.strokeStyle = horizonGrad;
		ctx.shadowBlur = 10;
		ctx.shadowColor = palette.solid;
		ctx.beginPath();
		ctx.moveTo(startX - 20, baselineY);
		ctx.lineTo(startX + spectrumWidth + 20, baselineY);
		ctx.stroke();
	}
}

// ============================================================================
// 4. PIPELINE D'ORCHESTRATION DU RENDU (Pipeline Pattern)
// ============================================================================

export class LiquidSpectrumPipeline {
	private readonly layers: SpectrumLayer[];
	private readonly buffers = new LiquidSpectrumBuffers();

	constructor() {
		this.layers = [
			new LiquidColumnsLayer(),
			new AuroraCrestLayer(),
			new FloatingMistLayer(),
			new AquaticHorizonLayer()
		];
	}

	public execute(ctx: CanvasRenderingContext2D, frame: LiquidSpectrumFrameContext): void {
		ctx.save();
		for (let i = 0; i < this.layers.length; i++) {
			this.layers[i].render(ctx, frame, this.buffers);
		}
		ctx.restore();
	}
}

// ============================================================================
// 5. INSTANCE GLOBALE & POINT D'ENTRÉE DU MODE
// ============================================================================

const pipeline = new LiquidSpectrumPipeline();

export function drawLiquidSpectrum(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	features: AudioFeatures,
	palette: ThemePalette,
	analysis?: SpotifyAudioAnalysis
): void {
	const settings = getVisualizerSettings();
	const progress = AudioSyncManager.getProgress();
	const bands = extractFrequencyBands(analysis, progress, features);
	const { cx, cy } = getVisualizerCenter(ctx);

	const isMirror = (settings.spectrumLayout ?? "mirror") === "mirror";
	const heightMultiplier = settings.spectrumHeightScale ?? 1.0;
	const showPeaks = settings.spectrumShowPeaks ?? true;

	const maxBarHeight = Math.min(height * 0.42, 380) * heightMultiplier;
	const baselineY = cy + maxBarHeight * 0.48;
	const spectrumWidth = Math.min(width * 0.92, 1200);
	const startX = cx - spectrumWidth * 0.5;

	const slotWidth = spectrumWidth / (isMirror ? bands.channels.length * 2 : bands.channels.length);
	const barWidth = slotWidth * 0.72;

	const frameContext: LiquidSpectrumFrameContext = {
		cx,
		cy,
		width,
		height,
		baselineY,
		maxBarHeight,
		spectrumWidth,
		startX,
		barWidth,
		isMirror,
		showPeaks,
		bands,
		palette,
		features
	};

	pipeline.execute(ctx, frameContext);
}

export const modeConfig: ModeConfig = {
	id: "spectrum",
	name: "🌊 Liquid Spectrum",
	render(ctx, width, height, features, palette, analysis) {
		drawLiquidSpectrum(ctx, width, height, features, palette, analysis);
	}
};
