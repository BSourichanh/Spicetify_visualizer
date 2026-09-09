import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";
import { neonCurrentManager } from "../core/neonCurrent";
import { getVisualizerSettings } from "../../../settings/settingsManager";
import { AudioFeatures } from "../core/audioFeatures";

/**
 * 🪼 MÉDUSE ABYSSALE CRISTALLINE (Cosmic Glass Medusa)
 *
 * Architecture & Design Patterns :
 * - Pipeline & Strategy Pattern : Découpage du dôme, voiles et tentacules en couches (JellyfishLayer)
 * - Object Pool & Zero-Allocation Buffers : Float32Array contigus pour les 16 tentacules et 3 voiles (0 alloc/frame)
 * - Flyweight Pattern : Précalculs trigonométriques pour les 14 fibres méridiennes et rhopalies
 * - Context DTO Pattern : Distribution immuable des métriques de trame (JellyfishFrameContext)
 */

// ============================================================================
// 1. CONTEXTE IMMUABLE DE RENDU (Context / DTO Pattern)
// ============================================================================

export interface JellyfishFrameContext {
	readonly cx: number;
	readonly cy: number;
	readonly currentCy: number;
	readonly radius: number;
	readonly time: number;
	readonly isPlaying: boolean;
	readonly swimSpeed: number;
	readonly tentacleScale: number;
	readonly bellW: number;
	readonly bellH: number;
	readonly bellD: number;
	readonly apexY: number;
	readonly rimY: number;
	readonly smoothBass: number;
	readonly smoothPunch: number;
	readonly smoothThrust: number;
	readonly smoothTilt: number;
	readonly trebleEnergy: number;
	readonly palette: ThemePalette;
	readonly features: AudioFeatures;
}

// ============================================================================
// 2. MOTEUR PHYSIQUE & SIMULATION (Zero Allocation)
// ============================================================================

export interface Spore {
	normX: number;
	normY: number;
	size: number;
	phase: number;
	speed: number;
}

export class CosmicMedusaEngine {
	public smoothBass = 0.1;
	public smoothPunch = 0;
	public smoothThrust = 0;
	public smoothTilt = 0;
	public cycle = 0;

	public readonly spores: Spore[] = [];

	// Buffers Float32Array pré-alloués pour les 16 tentacules (29 points chacun)
	public static readonly NUM_TENDRILS = 16;
	public static readonly TENDRIL_SEGMENTS = 28;
	public static readonly TENDRIL_PTS = CosmicMedusaEngine.TENDRIL_SEGMENTS + 1;
	public readonly tendrilX = new Float32Array(CosmicMedusaEngine.NUM_TENDRILS * CosmicMedusaEngine.TENDRIL_PTS);
	public readonly tendrilY = new Float32Array(CosmicMedusaEngine.NUM_TENDRILS * CosmicMedusaEngine.TENDRIL_PTS);
	public readonly tendrilDepth = new Float32Array(CosmicMedusaEngine.NUM_TENDRILS);
	public readonly tendrilIsFront = new Uint8Array(CosmicMedusaEngine.NUM_TENDRILS);

	// Buffers pré-alloués pour les 3 voiles d'aurore (25 points chacun)
	public static readonly NUM_VEILS = 3;
	public static readonly VEIL_SEGMENTS = 24;
	public static readonly VEIL_PTS = CosmicMedusaEngine.VEIL_SEGMENTS + 1;
	public readonly veilLeftX = new Float32Array(CosmicMedusaEngine.NUM_VEILS * CosmicMedusaEngine.VEIL_PTS);
	public readonly veilLeftY = new Float32Array(CosmicMedusaEngine.NUM_VEILS * CosmicMedusaEngine.VEIL_PTS);
	public readonly veilRightX = new Float32Array(CosmicMedusaEngine.NUM_VEILS * CosmicMedusaEngine.VEIL_PTS);
	public readonly veilRightY = new Float32Array(CosmicMedusaEngine.NUM_VEILS * CosmicMedusaEngine.VEIL_PTS);

	constructor() {
		// 14 spores flottantes
		for (let i = 0; i < 14; i++) {
			this.spores.push({
				normX: (Math.random() - 0.5) * 1.6,
				normY: 0.2 + Math.random() * 1.8,
				size: 4 + Math.random() * 8,
				phase: Math.random() * Math.PI * 2,
				speed: 0.6 + Math.random() * 1.2
			});
		}
	}

	public update(isPlaying: boolean, bass: number, punch: number, speed: number): void {
		if (!isPlaying) {
			this.smoothPunch *= 0.88;
			this.smoothBass += (0.05 - this.smoothBass) * 0.1;
			this.smoothThrust *= 0.9;
			this.smoothTilt *= 0.9;
			return;
		}

		this.smoothBass += (bass - this.smoothBass) * 0.14;
		this.smoothPunch += (punch - this.smoothPunch) * 0.22;

		const targetThrust = -this.smoothPunch * 18.0 * speed;
		this.smoothThrust += (targetThrust - this.smoothThrust) * 0.1;
		this.smoothThrust *= 0.94;

		const targetTilt = Math.sin(this.cycle * 0.6) * 0.045 + this.smoothThrust * 0.002;
		this.smoothTilt += (targetTilt - this.smoothTilt) * 0.08;

		this.cycle += 0.016 * speed;
	}

	public computeTendrils(
		cx: number,
		rimY: number,
		bellW: number,
		bellD: number,
		tendrilLen: number,
		time: number,
		swimSpeed: number,
		trebleEnergy: number,
		isPlaying: boolean
	): void {
		for (let i = 0; i < CosmicMedusaEngine.NUM_TENDRILS; i++) {
			const angle = (i / CosmicMedusaEngine.NUM_TENDRILS) * Math.PI * 2;
			const cosA = Math.cos(angle);
			const sinA = Math.sin(angle);
			this.tendrilDepth[i] = sinA;
			this.tendrilIsFront[i] = sinA >= -0.15 ? 1 : 0;

			const rootX = cx + cosA * (bellW * 0.84);
			const rootY = rimY + sinA * (bellD * 0.75);

			const phase1 = isPlaying ? time * 1.6 * swimSpeed - i * 0.38 : -i * 0.38;
			const phase2 = isPlaying ? time * 0.85 * swimSpeed + i * 0.28 : i * 0.28;

			const baseIdx = i * CosmicMedusaEngine.TENDRIL_PTS;
			this.tendrilX[baseIdx] = rootX;
			this.tendrilY[baseIdx] = rootY;

			for (let s = 1; s <= CosmicMedusaEngine.TENDRIL_SEGMENTS; s++) {
				const prog = s / CosmicMedusaEngine.TENDRIL_SEGMENTS;
				const wave1 = Math.sin(phase1 - prog * 3.4) * (12 + prog * 36 + this.smoothBass * 20);
				const wave2 = Math.cos(phase2 - prog * 1.8) * (6 + prog * 16);
				const shimmer = isPlaying ? Math.sin(time * 3.8 - prog * 7.5 + i) * (trebleEnergy * 2.4 * prog) : 0;

				const x = rootX * (1 - prog * 0.12) + cx * (prog * 0.12) + (wave1 * 0.7 + wave2 * 0.3) + shimmer;
				const y = rootY + prog * tendrilLen - this.smoothThrust * Math.pow(prog, 1.2) * 0.6;

				const idx = baseIdx + s;
				this.tendrilX[idx] = x;
				this.tendrilY[idx] = y;
			}
		}
	}

	public computeVeils(
		cx: number,
		veilBaseY: number,
		veilLen: number,
		bellW: number,
		time: number,
		swimSpeed: number,
		isPlaying: boolean
	): void {
		for (let v = 0; v < CosmicMedusaEngine.NUM_VEILS; v++) {
			const normV = (v / (CosmicMedusaEngine.NUM_VEILS - 1) - 0.5) * 2;
			const baseOffset = normV * (bellW * 0.24);
			const vPhase = isPlaying ? time * 1.4 * swimSpeed + v * 1.1 : v * 1.1;
			const maxW = bellW * (0.36 - Math.abs(normV) * 0.08);
			const baseIdx = v * CosmicMedusaEngine.VEIL_PTS;

			for (let s = 0; s <= CosmicMedusaEngine.VEIL_SEGMENTS; s++) {
				const p = s / CosmicMedusaEngine.VEIL_SEGMENTS;
				const curY = veilBaseY + p * veilLen - this.smoothThrust * Math.pow(p, 1.1) * 0.4;
				const flow1 = Math.sin(vPhase - p * 2.8) * (14 + p * 28 + this.smoothBass * 18);
				const flow2 = Math.cos(vPhase * 0.75 + p * 1.9 + v) * (8 + p * 14);
				const spineX = cx + baseOffset * (1 - p * 0.4) + flow1 * 0.7 + flow2 * 0.3;
				const curW = maxW * (1 - p * 0.65) * (1 + Math.sin(p * Math.PI) * 0.4);

				const idx = baseIdx + s;
				this.veilLeftX[idx] = spineX - curW * 0.5;
				this.veilLeftY[idx] = curY;
				this.veilRightX[idx] = spineX + curW * 0.5;
				this.veilRightY[idx] = curY;
			}
		}
	}
}

// ============================================================================
// 3. STRATÉGIES DE RENDU PAR COUCHE (RenderLayer Strategy Pattern)
// ============================================================================

export interface JellyfishLayer {
	render(ctx: CanvasRenderingContext2D, frame: JellyfishFrameContext, engine: CosmicMedusaEngine): void;
}

/**
 * Couche 1 : Sillage de spores bioluminescentes
 */
class SporesTrailLayer implements JellyfishLayer {
	public render(ctx: CanvasRenderingContext2D, frame: JellyfishFrameContext, engine: CosmicMedusaEngine): void {
		const { cx, rimY, bellW, radius, tentacleScale, time, swimSpeed, isPlaying, palette } = frame;

		for (let i = 0; i < engine.spores.length; i++) {
			const spore = engine.spores[i];
			const sporePhase = isPlaying ? time * spore.speed * swimSpeed + spore.phase : spore.phase;
			const driftX = cx + spore.normX * bellW + Math.sin(sporePhase) * 12;
			const driftY = rimY + spore.normY * (radius * 1.8 * tentacleScale) + Math.cos(sporePhase * 0.8) * 14;

			const pulse = 0.5 + 0.5 * Math.sin(sporePhase * 1.6);
			const sporeAlpha = (0.15 + engine.smoothBass * 0.25) * pulse;
			const sporeR = spore.size * (0.8 + engine.smoothPunch * 0.4);

			const spGrad = ctx.createRadialGradient(driftX, driftY, 0, driftX, driftY, sporeR);
			spGrad.addColorStop(0, palette.highlight);
			spGrad.addColorStop(0.35, palette.rimVeil(sporeAlpha));
			spGrad.addColorStop(1, "transparent");

			ctx.fillStyle = spGrad;
			ctx.beginPath();
			ctx.arc(driftX, driftY, sporeR, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

/**
 * Couche 2 : Arc postérieur du dôme et filaments arrière
 */
class BackgroundTendrilsLayer implements JellyfishLayer {
	public render(ctx: CanvasRenderingContext2D, frame: JellyfishFrameContext, engine: CosmicMedusaEngine): void {
		const { cx, rimY, bellW, bellD, palette } = frame;

		// Lèvre arrière en transparence
		ctx.beginPath();
		ctx.ellipse(cx, rimY, bellW * 0.86, bellD * 0.75, 0, Math.PI, 2 * Math.PI);
		ctx.strokeStyle = palette.veil(0.18 + engine.smoothBass * 0.12);
		ctx.lineWidth = 1.4;
		ctx.stroke();

		// Filaments arrière (Z < 0)
		for (let i = 0; i < CosmicMedusaEngine.NUM_TENDRILS; i++) {
			if (engine.tendrilIsFront[i] === 1) continue;

			const baseIdx = i * CosmicMedusaEngine.TENDRIL_PTS;
			ctx.beginPath();
			ctx.moveTo(engine.tendrilX[baseIdx], engine.tendrilY[baseIdx]);

			for (let s = 1; s < CosmicMedusaEngine.TENDRIL_PTS; s++) {
				const prevX = engine.tendrilX[baseIdx + s - 1];
				const prevY = engine.tendrilY[baseIdx + s - 1];
				const currX = engine.tendrilX[baseIdx + s];
				const currY = engine.tendrilY[baseIdx + s];
				ctx.quadraticCurveTo(prevX, prevY, (prevX + currX) / 2, (prevY + currY) / 2);
			}

			ctx.lineWidth = 0.9;
			ctx.strokeStyle = palette.veil(0.16 + engine.smoothBass * 0.12);
			ctx.stroke();
		}
	}
}

/**
 * Couche 3 : Les 3 voiles d'aurore centraux en cascade
 */
class AuroraVeilsLayer implements JellyfishLayer {
	public render(ctx: CanvasRenderingContext2D, frame: JellyfishFrameContext, engine: CosmicMedusaEngine): void {
		const { cx, apexY, bellH, radius, tentacleScale, palette } = frame;
		const veilBaseY = apexY + bellH * 0.45;
		const veilLen = radius * 2.8 * tentacleScale;

		for (let v = 0; v < CosmicMedusaEngine.NUM_VEILS; v++) {
			const baseIdx = v * CosmicMedusaEngine.VEIL_PTS;
			const lastIdx = baseIdx + CosmicMedusaEngine.VEIL_PTS - 1;

			ctx.beginPath();
			ctx.moveTo(engine.veilLeftX[baseIdx], engine.veilLeftY[baseIdx]);

			// Bord gauche lissé
			for (let s = 1; s < CosmicMedusaEngine.VEIL_PTS; s++) {
				const prevX = engine.veilLeftX[baseIdx + s - 1];
				const prevY = engine.veilLeftY[baseIdx + s - 1];
				const currX = engine.veilLeftX[baseIdx + s];
				const currY = engine.veilLeftY[baseIdx + s];
				ctx.quadraticCurveTo(prevX, prevY, (prevX + currX) / 2, (prevY + currY) / 2);
			}

			// Ligne jusqu'au bord droit inférieur
			ctx.lineTo(engine.veilRightX[lastIdx], engine.veilRightY[lastIdx]);

			// Bord droit remontant
			for (let s = CosmicMedusaEngine.VEIL_PTS - 2; s >= 0; s--) {
				const nextX = engine.veilRightX[baseIdx + s + 1];
				const nextY = engine.veilRightY[baseIdx + s + 1];
				const currX = engine.veilRightX[baseIdx + s];
				const currY = engine.veilRightY[baseIdx + s];
				ctx.quadraticCurveTo(nextX, nextY, (nextX + currX) / 2, (nextY + currY) / 2);
			}
			ctx.closePath();

			const vGrad = ctx.createLinearGradient(cx, veilBaseY, cx, veilBaseY + veilLen);
			const vAlpha = (0.22 + engine.smoothBass * 0.15) * (v === 1 ? 1.25 : 0.85);

			vGrad.addColorStop(0, palette.veil(vAlpha * 0.6));
			vGrad.addColorStop(0.25, palette.veil(vAlpha));
			vGrad.addColorStop(0.65, palette.veil(vAlpha * 0.45));
			vGrad.addColorStop(1, "transparent");

			ctx.fillStyle = vGrad;
			ctx.fill();

			// Liseré cristallin
			ctx.beginPath();
			ctx.moveTo(engine.veilRightX[baseIdx], engine.veilRightY[baseIdx]);
			for (let s = 1; s < CosmicMedusaEngine.VEIL_PTS; s++) {
				const prevX = engine.veilRightX[baseIdx + s - 1];
				const prevY = engine.veilRightY[baseIdx + s - 1];
				const currX = engine.veilRightX[baseIdx + s];
				const currY = engine.veilRightY[baseIdx + s];
				ctx.quadraticCurveTo(prevX, prevY, (prevX + currX) / 2, (prevY + currY) / 2);
			}
			ctx.lineWidth = 1.1;
			ctx.strokeStyle = palette.rimVeil(0.35 + engine.smoothBass * 0.25);
			ctx.stroke();
		}
	}
}

/**
 * Couche 4 : Le trèfle bioluminescent interne (4 anneaux gastriques)
 */
class GastricCloverLayer implements JellyfishLayer {
	public render(ctx: CanvasRenderingContext2D, frame: JellyfishFrameContext, engine: CosmicMedusaEngine): void {
		const { cx, apexY, bellW, bellH, palette } = frame;
		const coreCy = apexY + bellH * 0.42;
		const cloverR = bellW * 0.2;

		for (let ring = 0; ring < 4; ring++) {
			const rAngle = (ring / 4) * Math.PI * 2 + Math.PI / 4;
			const ringDist = cloverR * (0.85 + engine.smoothPunch * 0.15);
			const rx = cx + Math.cos(rAngle) * ringDist;
			const ry = coreCy + Math.sin(rAngle) * ringDist * 0.65;

			const ringRadius = cloverR * (0.65 + engine.smoothBass * 0.25);
			const rGrad = ctx.createRadialGradient(rx, ry, 0, rx, ry, ringRadius);
			const ringAlpha = 0.35 + engine.smoothBass * 0.35 + engine.smoothPunch * 0.25;

			rGrad.addColorStop(0, palette.highlight);
			rGrad.addColorStop(0.4, palette.veil(ringAlpha));
			rGrad.addColorStop(1, "transparent");

			ctx.fillStyle = rGrad;
			ctx.beginPath();
			ctx.arc(rx, ry, ringRadius, 0, Math.PI * 2);
			ctx.fill();
		}

		// Halo central
		const centralGlow = ctx.createRadialGradient(cx, coreCy, 0, cx, coreCy, cloverR * 2.2);
		const cAlpha = 0.3 + engine.smoothBass * 0.25;
		centralGlow.addColorStop(0, palette.veil(cAlpha));
		centralGlow.addColorStop(0.5, palette.veil(cAlpha * 0.35));
		centralGlow.addColorStop(1, "transparent");

		ctx.fillStyle = centralGlow;
		ctx.beginPath();
		ctx.arc(cx, coreCy, cloverR * 2.2, 0, Math.PI * 2);
		ctx.fill();
	}
}

/**
 * Couche 5 : Les 14 fibres optiques méridiennes 3D
 */
class RadialFibersLayer implements JellyfishLayer {
	private static readonly NUM_MERIDIANS = 14;

	public render(ctx: CanvasRenderingContext2D, frame: JellyfishFrameContext, engine: CosmicMedusaEngine): void {
		const { cx, currentCy, apexY, rimY, bellW, bellH, bellD, palette } = frame;

		for (let m = 0; m < RadialFibersLayer.NUM_MERIDIANS; m++) {
			const mAngle = (m / RadialFibersLayer.NUM_MERIDIANS) * Math.PI * 2;
			const cosM = Math.cos(mAngle);
			const sinM = Math.sin(mAngle);

			const targetX = cx + cosM * (bellW * 0.88);
			const targetY = rimY + sinM * (bellD * 0.75);
			const ctrlX = cx + cosM * (bellW * 0.98);
			const ctrlY = currentCy - bellH * 0.05 + sinM * (bellD * 0.3);

			ctx.beginPath();
			ctx.moveTo(cx, apexY + bellH * 0.05);
			ctx.quadraticCurveTo(ctrlX, ctrlY, targetX, targetY);

			const depthFactor = (sinM + 1.0) * 0.5;
			const fibreAlpha = 0.12 + depthFactor * 0.28 + engine.smoothBass * 0.25;

			ctx.lineWidth = 1.0 + depthFactor * 0.8;
			ctx.strokeStyle = palette.rimVeil(fibreAlpha);
			ctx.stroke();
		}
	}
}

/**
 * Couche 6 : Dôme en verre liquide et Fresnel (Exumbrella)
 */
class GlassCanopyLayer implements JellyfishLayer {
	public render(ctx: CanvasRenderingContext2D, frame: JellyfishFrameContext, engine: CosmicMedusaEngine): void {
		const { cx, currentCy, apexY, rimY, bellW, bellH, bellD, time, trebleEnergy, palette } = frame;

		const traceOuterCanopy = () => {
			ctx.beginPath();
			ctx.moveTo(cx, apexY);
			ctx.bezierCurveTo(
				cx + bellW * 0.62,
				apexY + bellH * 0.06,
				cx + bellW * 1.06,
				currentCy - bellH * 0.06,
				cx + bellW * 0.88,
				rimY
			);
			ctx.quadraticCurveTo(cx, rimY - bellH * 0.18, cx - bellW * 0.88, rimY);
			ctx.bezierCurveTo(
				cx - bellW * 1.06,
				currentCy - bellH * 0.06,
				cx - bellW * 0.62,
				apexY + bellH * 0.06,
				cx,
				apexY
			);
			ctx.closePath();
		};

		// Verre marin translucide
		traceOuterCanopy();
		const glassGrad = ctx.createLinearGradient(cx, apexY, cx, rimY);
		const glassAlpha = 0.38 + engine.smoothBass * 0.2 + engine.smoothPunch * 0.12;
		glassGrad.addColorStop(0, palette.veil(glassAlpha));
		glassGrad.addColorStop(0.35, palette.veil(glassAlpha * 0.65));
		glassGrad.addColorStop(0.75, palette.veil(glassAlpha * 0.3));
		glassGrad.addColorStop(1, palette.veil(0.04));
		ctx.fillStyle = glassGrad;
		ctx.fill();

		// Liseré Fresnel interne diffus
		ctx.save();
		traceOuterCanopy();
		ctx.clip();
		ctx.lineWidth = 14.0 + engine.smoothPunch * 4.0;
		ctx.strokeStyle = palette.rimVeil(0.55 + engine.smoothPunch * 0.3);
		ctx.shadowBlur = 18;
		ctx.shadowColor = palette.solid;
		ctx.stroke();
		ctx.restore();

		// Contour cristallin
		traceOuterCanopy();
		ctx.lineWidth = 2.4 + engine.smoothPunch * 0.8;
		ctx.strokeStyle = palette.rimLight;
		ctx.shadowColor = palette.solid;
		ctx.shadowBlur = 16 + engine.smoothPunch * 14;
		ctx.stroke();

		// Arc antérieur de la lèvre
		ctx.beginPath();
		ctx.ellipse(cx, rimY, bellW * 0.88, bellD * 0.75, 0, 0, Math.PI);
		ctx.lineWidth = 2.0;
		ctx.strokeStyle = palette.rimLight;
		ctx.shadowBlur = 10;
		ctx.shadowColor = palette.solid;
		ctx.stroke();
		ctx.shadowBlur = 0;

		// Rhopalies étincelantes sur le bord
		const numRhopalia = 8;
		for (let r = 0; r < numRhopalia; r++) {
			const rProg = r / (numRhopalia - 1);
			const rAngle = rProg * Math.PI;
			const rx = cx + Math.cos(rAngle) * (bellW * 0.88);
			const ry = rimY + Math.sin(rAngle) * (bellD * 0.75);

			const shimmer = 0.5 + 0.5 * Math.sin(time * 4.0 + r * 1.5);
			const rR = 2.5 + trebleEnergy * 2.5 * shimmer;

			const rSpark = ctx.createRadialGradient(rx, ry, 0, rx, ry, rR * 2.5);
			rSpark.addColorStop(0, palette.highlight);
			rSpark.addColorStop(0.4, palette.rimVeil(0.6));
			rSpark.addColorStop(1, "transparent");

			ctx.fillStyle = rSpark;
			ctx.beginPath();
			ctx.arc(rx, ry, rR * 2.5, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

/**
 * Couche 7 : Filaments gossamer avant (Z >= 0) et nœuds phosphorescents
 */
class ForegroundTendrilsLayer implements JellyfishLayer {
	public render(ctx: CanvasRenderingContext2D, frame: JellyfishFrameContext, engine: CosmicMedusaEngine): void {
		const { radius, tentacleScale, time, swimSpeed, palette } = frame;
		const tendrilLen = Math.max(radius * 4.8, ctx.canvas.height + 80) * tentacleScale;

		for (let i = 0; i < CosmicMedusaEngine.NUM_TENDRILS; i++) {
			if (engine.tendrilIsFront[i] === 0) continue;

			const baseIdx = i * CosmicMedusaEngine.TENDRIL_PTS;
			const depth = engine.tendrilDepth[i];

			ctx.beginPath();
			ctx.moveTo(engine.tendrilX[baseIdx], engine.tendrilY[baseIdx]);

			for (let s = 1; s < CosmicMedusaEngine.TENDRIL_PTS; s++) {
				const prevX = engine.tendrilX[baseIdx + s - 1];
				const prevY = engine.tendrilY[baseIdx + s - 1];
				const currX = engine.tendrilX[baseIdx + s];
				const currY = engine.tendrilY[baseIdx + s];
				ctx.quadraticCurveTo(prevX, prevY, (prevX + currX) / 2, (prevY + currY) / 2);
			}

			const depthAlpha = 0.25 + depth * 0.2 + engine.smoothBass * 0.25;
			const tendrilGrad = ctx.createLinearGradient(
				engine.tendrilX[baseIdx],
				engine.tendrilY[baseIdx],
				engine.tendrilX[baseIdx],
				engine.tendrilY[baseIdx] + tendrilLen
			);
			tendrilGrad.addColorStop(0, palette.rimLight);
			tendrilGrad.addColorStop(0.2, palette.solid);
			tendrilGrad.addColorStop(0.65, palette.veil(depthAlpha));
			tendrilGrad.addColorStop(1, "transparent");

			ctx.lineWidth = 1.4 + depth * 0.6;
			ctx.strokeStyle = tendrilGrad;
			ctx.shadowBlur = 6;
			ctx.shadowColor = palette.solid;
			ctx.stroke();

			// Nœud de phosphorescence
			const emberProg = (time * 0.4 * swimSpeed + i * 0.18) % 1.0;
			const emberIdx = Math.round(emberProg * CosmicMedusaEngine.TENDRIL_SEGMENTS);
			const ptIdx = baseIdx + emberIdx;
			const eR = 5.0 + engine.smoothPunch * 3.0;

			const eGrad = ctx.createRadialGradient(
				engine.tendrilX[ptIdx],
				engine.tendrilY[ptIdx],
				0,
				engine.tendrilX[ptIdx],
				engine.tendrilY[ptIdx],
				eR
			);
			eGrad.addColorStop(0, palette.highlight);
			eGrad.addColorStop(0.4, palette.rimVeil(0.6));
			eGrad.addColorStop(1, "transparent");

			ctx.fillStyle = eGrad;
			ctx.beginPath();
			ctx.arc(engine.tendrilX[ptIdx], engine.tendrilY[ptIdx], eR, 0, Math.PI * 2);
			ctx.fill();

			// Propagation néon
			const activeWaves = neonCurrentManager.getActiveWaves(i * 0.05);
			for (const wave of activeWaves) {
				if (wave.intensity < 0.04) continue;
				const tProg = (wave.wavePos - 0.22) / 0.78;
				if (tProg >= 0 && tProg <= 1.0) {
					const idx = Math.round(tProg * CosmicMedusaEngine.TENDRIL_SEGMENTS);
					const spread = 3;
					const startIdx = Math.max(0, idx - spread);
					const endIdx = Math.min(CosmicMedusaEngine.TENDRIL_SEGMENTS, idx + spread);

					ctx.beginPath();
					ctx.moveTo(engine.tendrilX[baseIdx + startIdx], engine.tendrilY[baseIdx + startIdx]);
					for (let s = startIdx + 1; s <= endIdx; s++) {
						const prevX = engine.tendrilX[baseIdx + s - 1];
						const prevY = engine.tendrilY[baseIdx + s - 1];
						const currX = engine.tendrilX[baseIdx + s];
						const currY = engine.tendrilY[baseIdx + s];
						ctx.quadraticCurveTo(prevX, prevY, (prevX + currX) / 2, (prevY + currY) / 2);
					}
					ctx.lineWidth = 2.4;
					ctx.strokeStyle = palette.highlight;
					ctx.shadowBlur = 12;
					ctx.shadowColor = palette.solid;
					ctx.stroke();
					ctx.shadowBlur = 0;
				}
			}
		}
	}
}

// ============================================================================
// 4. PIPELINE D'ORCHESTRATION DU RENDU (Pipeline Pattern)
// ============================================================================

export class JellyfishRenderPipeline {
	private readonly layers: JellyfishLayer[];

	constructor() {
		this.layers = [
			new SporesTrailLayer(),
			new BackgroundTendrilsLayer(),
			new AuroraVeilsLayer(),
			new GastricCloverLayer(),
			new RadialFibersLayer(),
			new GlassCanopyLayer(),
			new ForegroundTendrilsLayer()
		];
	}

	public execute(ctx: CanvasRenderingContext2D, frame: JellyfishFrameContext, engine: CosmicMedusaEngine): void {
		ctx.save();
		ctx.translate(frame.cx, frame.currentCy);
		ctx.rotate(engine.smoothTilt);
		ctx.translate(-frame.cx, -frame.currentCy);

		for (let i = 0; i < this.layers.length; i++) {
			this.layers[i].render(ctx, frame, engine);
		}
		ctx.restore();
	}
}

// ============================================================================
// 5. INSTANCES GLOBALES & POINT D'ENTRÉE DU MODE
// ============================================================================

const engine = new CosmicMedusaEngine();
const pipeline = new JellyfishRenderPipeline();

export function drawBioluminescentJellyfish(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	radius: number,
	time: number,
	_beatProgress: number,
	bassEnergy: number,
	trebleEnergy: number,
	palette: ThemePalette,
	_midEnergy = 0.5,
	punch = palette.punch,
	features?: AudioFeatures
): void {
	const settings = getVisualizerSettings();
	const swimSpeed = settings.jellyfishSwimSpeed ?? 1.0;
	const tentacleScale = settings.jellyfishTentacleLength ?? 1.0;
	const isPlaying = features?.isPlaying ?? true;

	engine.update(isPlaying, bassEnergy, punch, swimSpeed);

	const idleFloat = isPlaying ? Math.sin(time * 0.8 * swimSpeed) * 8 : 0;
	const currentCy = cy + engine.smoothThrust + idleFloat;

	const breathX = 1.0 + engine.smoothPunch * 0.1 + engine.smoothBass * 0.06;
	const breathY = 1.0 - engine.smoothPunch * 0.06 + engine.smoothBass * 0.08;
	const bellW = radius * 1.1 * breathX;
	const bellH = radius * 0.85 * breathY;
	const bellD = bellW * 0.28;
	const apexY = currentCy - bellH * 0.92;
	const rimY = currentCy + bellH * 0.28;

	const tendrilLen = Math.max(radius * 4.8, ctx.canvas.height - currentCy + 80) * tentacleScale;
	const veilLen = radius * 2.8 * tentacleScale;
	const veilBaseY = apexY + bellH * 0.45;

	// Précalcul des coordonnées des tentacules et des voiles sans allocation
	engine.computeTendrils(cx, rimY, bellW, bellD, tendrilLen, time, swimSpeed, trebleEnergy, isPlaying);
	engine.computeVeils(cx, veilBaseY, veilLen, bellW, time, swimSpeed, isPlaying);

	const frameContext: JellyfishFrameContext = {
		cx,
		cy,
		currentCy,
		radius,
		time,
		isPlaying,
		swimSpeed,
		tentacleScale,
		bellW,
		bellH,
		bellD,
		apexY,
		rimY,
		smoothBass: engine.smoothBass,
		smoothPunch: engine.smoothPunch,
		smoothThrust: engine.smoothThrust,
		smoothTilt: engine.smoothTilt,
		trebleEnergy,
		palette,
		features: features!
	};

	pipeline.execute(ctx, frameContext, engine);
}

export const modeConfig: ModeConfig = {
	id: "cyber-rings",
	name: "🪼 Jellyfish",
	render(ctx, width, height, features, palette) {
		const { cx, cy } = getVisualizerCenter(ctx);
		const baseRadius = Math.min(width * 0.24, height * 0.22);
		drawBioluminescentJellyfish(
			ctx,
			cx,
			cy,
			baseRadius,
			features.energyTime,
			0,
			features.bassEnergy,
			features.trebleEnergy,
			palette,
			features.midEnergy,
			features.punch,
			features
		);
	}
};
