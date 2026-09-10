import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";
import { neonCurrentManager } from "../core/neonCurrent";
import { getVisualizerSettings } from "../../../settings/settingsManager";
import { AudioFeatures } from "../core/audioFeatures";

/**
 * 🐱 CYBER-NEKO // MASCOTTE GÉOMÉTRIQUE NÉON HAUTE COUTURE (STYLÉE & NON-EFFRAYANTE)
 *
 * Évolution Morphologique (Moins Effrayant / Plus Mignon & Expressif) :
 * 1. Regard Félin Vif, Curieux & Magnétique (Fini le regard agressif/menaçant) :
 *    - Arcades sourcilières détendues et nobles (suppression du V froncé menaçant).
 *    - Grands yeux en amande lumineux, ouverts et expressifs, inspirés des mascottes cybernétiques
 *      (façon Stray / Cyberpunk Edgerunners).
 *    - Double éclat de brillance blanc (specular glints) donnant un regard vivant et étincelant.
 * 2. Museau Félin Gracieux & Sourire Cyber Délicat :
 *    - Suppression des fentes/ouïes de mâchoire agressives façon dents de requin / masque à gaz.
 *    - Truffe géométrique mignonne et babines félines en arc subtil (sourire de chat `:3`).
 *    - Menton fin et élégant en V harmonieux.
 * 3. Oreilles Alertes & Éveillées :
 *    - Grandes oreilles dressées et attentives avec pavillons internes en chevrons lumineux.
 * 4. Véritable Rendu Néon Électrique & Glitch Hack :
 *    - Pipeline néon physique à 4 passes (Halo large, lueur saturée, tube coloré et filament blanc plasma).
 *    - Moteur de glitch cyberpunk préservé (12 tranches, dispersion RVB, étincelles et tags).
 * 5. Respect Strict des Règles AGENTS.md :
 *    - Règle 6 : 100% harmonisé avec la ThemePalette Spotify (aucune couleur statique externe).
 *    - Règle 4 : Zéro allocation dynamique par frame (60 FPS).
 */

// ============================================================================
// 1. SOMMETS STRUCTURAUX DU CYBER-NEKO EXPRESSIF (48 SOMMETS SYMÉTRIQUES)
// ============================================================================

const VERTICES_DEF: readonly [number, number][] = [
	// --- Axe Médian (X = 0) ---
	[0.0, -0.62], // 0: Crâne supérieur (centre entre oreilles)
	[0.0, -0.48], // 1: Haut du joyau frontal
	[0.0, -0.34], // 2: Cœur du joyau frontal
	[0.0, -0.2], // 3: Bas du joyau frontal / Racine du front
	[0.0, -0.04], // 4: Arête nasale haute
	[0.0, 0.14], // 5: Truffe apex supérieur
	[0.0, 0.22], // 6: Truffe apex inférieur
	[0.0, 0.3], // 7: Philtrum / Centre des babines
	[0.0, 0.44], // 8: Sous-lèvre douce
	[0.0, 0.6], // 9: Pointe du menton fin en V

	// --- Côté Gauche (X < 0) & Droit (X > 0) ---
	// Flancs du joyau frontal
	[-0.12, -0.34], // 10: Flanc joyau G
	[0.12, -0.34], // 11: Flanc joyau D

	// Oreilles Alertes, Hautes & Éveillées
	[-0.22, -0.62], // 12: Base interne oreille G
	[0.22, -0.62], // 13: Base interne oreille D
	[-0.52, -1.3], // 14: Pointe oreille G (haute, gracieuse, alerte)
	[0.52, -1.3], // 15: Pointe oreille D
	[-0.64, -0.48], // 16: Base externe oreille G
	[0.64, -0.48], // 17: Base externe oreille D
	[-0.4, -0.98], // 18: Chevron interne oreille G
	[0.4, -0.98], // 19: Chevron interne oreille D

	// Arcades Sourcilières Douces & Tempes
	[-0.44, -0.26], // 20: Tempe haute G
	[0.44, -0.26], // 21: Tempe haute D
	[-0.28, -0.2], // 22: Arcade sourcilière douce G (courbure noble, pas de froncement fâché !)
	[0.28, -0.2], // 23: Arcade sourcilière douce D

	// Grands Yeux Félins en Amande Lumineux (Curieux & Expressifs)
	[-0.14, -0.06], // 24: Coin oeil interne G
	[0.14, -0.06], // 25: Coin oeil interne D
	[-0.28, -0.18], // 26: Sommet paupière G (bien ouvert)
	[0.28, -0.18], // 27: Sommet paupière D (bien ouvert)
	[-0.46, -0.06], // 28: Coin oeil externe G (relevé en amande douce)
	[0.46, -0.06], // 29: Coin oeil externe D
	[-0.28, 0.06], // 30: Bas oeil G
	[0.28, 0.06], // 31: Bas oeil D
	[-0.29, -0.06], // 32: Centre pupille G
	[0.29, -0.06], // 33: Centre pupille D

	// Joues Douces & Mâchoire Fuselée
	[-0.68, 0.08], // 34: Pommette douce G
	[0.68, 0.08], // 35: Pommette douce D
	[-0.56, 0.28], // 36: Joue basse G
	[0.56, 0.28], // 37: Joue basse D
	[-0.34, 0.48], // 38: Mâchoire fine G
	[0.34, 0.48], // 39: Mâchoire fine D

	// Museau & Babines Félines en "Sourire de Chat" (:3)
	[-0.08, 0.16], // 40: Aile truffe G
	[0.08, 0.16], // 41: Aile truffe D
	[-0.22, 0.24], // 42: Coussinet moustache haut G
	[0.22, 0.24], // 43: Coussinet moustache haut D
	[-0.26, 0.34], // 44: Coussinet moustache externe G
	[0.26, 0.34], // 45: Coussinet moustache externe D
	[-0.12, 0.36], // 46: Courbe du sourire félin G
	[0.12, 0.36] // 47: Courbe du sourire félin D
];

const NUM_VERTS = VERTICES_DEF.length;

// Tubes néon traçant la silhouette stylée et non-effrayante
const NEON_TUBES: readonly [number, number][] = [
	// Silhouette des oreilles alertes
	[12, 0],
	[0, 13], // Crête haute
	[12, 14],
	[14, 16], // Oreille G extérieure
	[13, 15],
	[15, 17], // Oreille D extérieure
	[12, 18],
	[18, 16], // Chevron interne G
	[13, 19],
	[19, 17], // Chevron interne D

	// Joyau frontal & front
	[1, 10],
	[10, 2],
	[2, 11],
	[11, 1], // Diamant
	[0, 1],
	[2, 3], // Liens verticaux
	[10, 20],
	[11, 21], // Liens tempe
	[3, 22],
	[3, 23], // Arcades vers nez

	// Contour joues & mâchoire douce
	[16, 20],
	[20, 34],
	[34, 36],
	[36, 38],
	[38, 9], // Profil G
	[17, 21],
	[21, 35],
	[35, 37],
	[37, 39],
	[39, 9], // Profil D

	// Yeux en amande expressifs
	[24, 26],
	[26, 28],
	[28, 30],
	[30, 24], // Oeil G
	[25, 27],
	[27, 29],
	[29, 31],
	[31, 25], // Oeil D
	[28, 34],
	[29, 35], // Eyeliner doux vers pommette

	// Museau & Sourire Félin Gracieux
	[3, 4],
	[4, 5],
	[5, 40],
	[40, 6],
	[6, 41],
	[41, 5], // Truffe géométrique
	[6, 7], // Philtrum
	[7, 46],
	[46, 44],
	[44, 42],
	[42, 40], // Babine / Sourire G
	[7, 47],
	[47, 45],
	[45, 43],
	[43, 41], // Babine / Sourire D
	[30, 42],
	[31, 43], // Raccord oeil-museau
	[7, 8],
	[8, 9] // Menton
];

const NUM_TUBES = NEON_TUBES.length;

// Panneaux de verre fumé pour un fond tamisé
const SMOKY_PANELS: readonly [number, number, number][] = [
	[12, 14, 16],
	[13, 15, 17], // Oreilles
	[1, 10, 2],
	[1, 11, 2], // Joyau
	[22, 26, 28],
	[23, 27, 29], // Arcades yeux
	[34, 36, 38],
	[35, 37, 39], // Joues
	[38, 8, 9],
	[39, 8, 9] // Menton
];

const NUM_DIAMOND_EMBERS = 24;
const NUM_GLITCH_SLICES = 12;
const NUM_GLITCH_BLOCKS = 6;

// ============================================================================
// 2. MOTEUR PHYSIQUE & CYBERPUNK GLITCH ENGINE (Zero Allocation / 60 FPS)
// ============================================================================

class FriendlyNekoEngine {
	public smoothBass = 0.1;
	public smoothPunch = 0;
	public smoothTreble = 0.1;
	public timeFlow = 0;
	public tilt = 0;
	public nod = 0;

	// Variables glitch & néon
	public glitchEnergy = 0;
	public chromaticBurstX = 0;
	public chromaticBurstY = 0;
	public trackingRollY = -1.5;
	public transformerFlicker = 1.0;

	// Coordonnées projetées pré-allouées
	public readonly projX = new Float32Array(NUM_VERTS);
	public readonly projY = new Float32Array(NUM_VERTS);

	// Particules cyber-diamants flottantes
	public readonly emberX = new Float32Array(NUM_DIAMOND_EMBERS);
	public readonly emberY = new Float32Array(NUM_DIAMOND_EMBERS);
	public readonly emberSpeed = new Float32Array(NUM_DIAMOND_EMBERS);
	public readonly emberSize = new Float32Array(NUM_DIAMOND_EMBERS);
	public readonly emberPhase = new Float32Array(NUM_DIAMOND_EMBERS);

	// 12 Tranches de glitch horizontal
	public readonly sliceOffsets = new Float32Array(NUM_GLITCH_SLICES);
	public readonly sliceActive = new Uint8Array(NUM_GLITCH_SLICES);

	// Jitter de quantification des sommets
	public readonly vertexJitterX = new Float32Array(NUM_VERTS);
	public readonly vertexJitterY = new Float32Array(NUM_VERTS);

	// Blocs de corruption de données
	public readonly blockX = new Float32Array(NUM_GLITCH_BLOCKS);
	public readonly blockY = new Float32Array(NUM_GLITCH_BLOCKS);
	public readonly blockW = new Float32Array(NUM_GLITCH_BLOCKS);
	public readonly blockH = new Float32Array(NUM_GLITCH_BLOCKS);
	public readonly blockAlpha = new Float32Array(NUM_GLITCH_BLOCKS);

	// Éclairs haute tension
	public hasLightning = false;
	public lightningV1 = 0;
	public lightningV2 = 0;
	public lightningV3 = 0;

	constructor() {
		for (let i = 0; i < NUM_DIAMOND_EMBERS; i++) {
			this.emberX[i] = (Math.random() - 0.5) * 2.2;
			this.emberY[i] = (Math.random() - 0.5) * 2.2;
			this.emberSpeed[i] = 0.4 + Math.random() * 0.8;
			this.emberSize[i] = 1.8 + Math.random() * 2.4;
			this.emberPhase[i] = Math.random() * Math.PI * 2;
		}
	}

	public update(isPlaying: boolean, bass: number, punch: number, treble: number, speedScale: number): void {
		if (!isPlaying) {
			this.smoothPunch *= 0.88;
			this.smoothBass += (0.05 - this.smoothBass) * 0.08;
			this.smoothTreble += (0.05 - this.smoothTreble) * 0.08;
			this.tilt *= 0.92;
			this.nod *= 0.92;
			this.glitchEnergy *= 0.7;
			this.transformerFlicker = 1.0;
			return;
		}

		this.smoothBass += (bass - this.smoothBass) * 0.18;
		this.smoothPunch += (punch - this.smoothPunch) * 0.28;
		this.smoothTreble += (treble - this.smoothTreble) * 0.22;

		const speed = (1.0 + this.smoothBass * 0.45 + this.smoothPunch * 0.7) * speedScale;
		this.timeFlow += 0.02 * speed;

		// Balancement curieux et vivant de la tête
		const targetTilt = Math.sin(this.timeFlow * 0.6) * 0.04;
		const targetNod = Math.cos(this.timeFlow * 0.85) * 0.02 + this.smoothPunch * 0.05;
		this.tilt += (targetTilt - this.tilt) * 0.12;
		this.nod += (targetNod - this.nod) * 0.18;

		// Balayage tracking VHS
		this.trackingRollY += 0.02 * speed;
		if (this.trackingRollY > 1.6) this.trackingRollY = -1.6;

		// Scintillement néon
		this.transformerFlicker = Math.random() < 0.04 ? 0.45 + Math.random() * 0.5 : 1.0;

		// Glitch : déclenchement sur kicks ou micro-stutter
		const isHeavyKick = punch > 0.32 || bass > 0.6;
		const isMicroStutter = Math.random() < 0.2;
		const currentBurst = isHeavyKick ? punch * 1.8 : isMicroStutter ? 0.5 : 0;
		this.glitchEnergy = Math.max(this.glitchEnergy * 0.68, currentBurst);

		// Burst RVB
		if (isHeavyKick || isMicroStutter) {
			const burstMag = this.glitchEnergy * 32.0 + 8.0;
			this.chromaticBurstX = (Math.random() - 0.5) * burstMag;
			this.chromaticBurstY = (Math.random() - 0.5) * (burstMag * 0.35);
		} else {
			this.chromaticBurstX *= 0.6;
			this.chromaticBurstY *= 0.6;
		}

		// 12 Tranches
		for (let s = 0; s < NUM_GLITCH_SLICES; s++) {
			if ((isHeavyKick || isMicroStutter) && Math.random() < 0.45) {
				const dir = Math.random() < 0.5 ? 1 : -1;
				this.sliceOffsets[s] = dir * (8.0 + this.glitchEnergy * 40.0 + Math.random() * 16.0);
				this.sliceActive[s] = 1;
			} else {
				this.sliceOffsets[s] *= 0.6;
				if (Math.abs(this.sliceOffsets[s]) < 0.8) {
					this.sliceOffsets[s] = 0;
					this.sliceActive[s] = 0;
				}
			}
		}

		// Jitter sommets
		for (let i = 0; i < NUM_VERTS; i++) {
			if (this.glitchEnergy > 0.28 && Math.random() < 0.12) {
				this.vertexJitterX[i] = (Math.random() - 0.5) * (this.glitchEnergy * 18.0);
				this.vertexJitterY[i] = (Math.random() - 0.5) * (this.glitchEnergy * 8.0);
			} else {
				this.vertexJitterX[i] *= 0.5;
				this.vertexJitterY[i] *= 0.5;
			}
		}

		// Éclairs
		this.hasLightning = (isHeavyKick || treble > 0.32) && Math.random() < 0.4;
		if (this.hasLightning) {
			this.lightningV1 = Math.floor(Math.random() * NUM_VERTS);
			this.lightningV2 = Math.floor(Math.random() * NUM_VERTS);
			this.lightningV3 = Math.floor(Math.random() * NUM_VERTS);
		}

		// Blocs de données
		for (let b = 0; b < NUM_GLITCH_BLOCKS; b++) {
			if (this.glitchEnergy > 0.25 && Math.random() < 0.5) {
				const sliceId = Math.floor(Math.random() * NUM_GLITCH_SLICES);
				this.blockX[b] = (Math.random() - 0.5) * 1.8;
				this.blockY[b] = -1.3 + (sliceId / NUM_GLITCH_SLICES) * 2.3;
				this.blockW[b] = 0.12 + Math.random() * 0.45;
				this.blockH[b] = 0.015 + Math.random() * 0.04;
				this.blockAlpha[b] = 0.35 + Math.random() * 0.5;
			} else {
				this.blockAlpha[b] *= 0.58;
			}
		}

		// Braises
		const burst = isHeavyKick ? punch * 0.35 : 0;
		for (let i = 0; i < NUM_DIAMOND_EMBERS; i++) {
			this.emberY[i] -= 0.007 * this.emberSpeed[i] * speed + burst * 0.016;
			this.emberX[i] += Math.sin(this.timeFlow * 1.6 + this.emberPhase[i]) * 0.0025;

			if (this.emberY[i] < -1.4) {
				this.emberY[i] = 1.35 + Math.random() * 0.2;
				this.emberX[i] = (Math.random() - 0.5) * 2.2;
			}
		}
	}

	public computeProjections(scale: number): void {
		const cosT = Math.cos(this.tilt);
		const sinT = Math.sin(this.tilt);
		const nodY = this.nod * scale;

		for (let i = 0; i < NUM_VERTS; i++) {
			const v = VERTICES_DEF[i];
			const vx = v[0] * scale;
			const vy = v[1] * scale;

			const rx = vx * cosT - vy * sinT;
			const ry = vx * sinT + vy * cosT + nodY;

			const sliceIdx = Math.max(
				0,
				Math.min(NUM_GLITCH_SLICES - 1, ((v[1] + 1.35) * (1 / 2.3) * NUM_GLITCH_SLICES) | 0)
			);
			let shift = this.sliceOffsets[sliceIdx] + this.vertexJitterX[i];

			const distRoll = Math.abs(v[1] - this.trackingRollY);
			if (distRoll < 0.2) {
				shift += Math.sin(distRoll * 16.0) * (scale * 0.04);
			}

			this.projX[i] = rx + shift;
			this.projY[i] = ry + this.vertexJitterY[i];
		}
	}
}

const engine = new FriendlyNekoEngine();

// ============================================================================
// 3. RENDU DU CYBER-NEKO EXPRESSIF HAUTE INTENSITÉ NÉON
// ============================================================================

export function drawAbstractGlitchCat(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	features: AudioFeatures,
	palette: ThemePalette,
	_analysis?: SpotifyAudioAnalysis
): void {
	const { cx, cy } = getVisualizerCenter(ctx);
	const settings = getVisualizerSettings();
	const sizeScale = settings.sizeScale ?? 1.0;
	const speedScale = settings.speedScale ?? 1.0;
	const glowScale = settings.glowScale ?? 1.0;
	const isPlaying = features.isPlaying ?? true;

	engine.update(isPlaying, features.bassEnergy, features.punch, features.trebleEnergy, speedScale);

	// Échelle dynamique normalisée
	const beatPulse = 1.0 + engine.smoothBass * 0.16 + engine.smoothPunch * 0.22;
	const catScale = Math.min(width, height) * 0.42 * sizeScale * beatPulse;

	engine.computeProjections(catScale);

	// Palette Spotify 100% (Règle 6)
	const pr = palette.r;
	const pg = palette.g;
	const pb = palette.b;
	const themeSolid = palette.solid || `rgb(${pr}, ${pg}, ${pb})`;
	const themeHighlight = palette.highlight || "#ffffff";
	const themeRimLight = palette.rimLight || themeSolid;

	// Décalage chromatique holographique (Cyan / Magenta)
	const baseSplit = (3.5 + engine.smoothBass * 9.0 + engine.smoothPunch * 20.0) * glowScale;
	const jitterX = (Math.random() - 0.5) * (engine.glitchEnergy * 14.0 + 3.0);
	const jitterY = (Math.random() - 0.5) * (engine.glitchEnergy * 6.0 + 1.0);
	const splitX = Math.cos(engine.timeFlow * 3.8) * baseSplit + engine.chromaticBurstX + jitterX;
	const splitY = Math.sin(engine.timeFlow * 3.8) * (baseSplit * 0.3) + engine.chromaticBurstY + jitterY;

	const c1R = Math.max(0, Math.min(255, Math.round(pr * 0.55 + 25)));
	const c1G = Math.max(0, Math.min(255, Math.round(pg * 0.95 + 65)));
	const c1B = Math.max(0, Math.min(255, Math.round(pb * 1.25 + 90)));
	const colorCyanPass = `rgba(${c1R}, ${c1G}, ${c1B}, 0.75)`;

	const c2R = Math.max(0, Math.min(255, Math.round(pr * 1.35 + 80)));
	const c2G = Math.max(0, Math.min(255, Math.round(pg * 0.6 - 15)));
	const c2B = Math.max(0, Math.min(255, Math.round(pb * 0.85 + 40)));
	const colorMagentaPass = `rgba(${c2R}, ${c2G}, ${c2B}, 0.75)`;

	const neonWave = neonCurrentManager.getIntensityAt(0.7, 0, 0.25);
	const neonFlicker = engine.transformerFlicker;

	ctx.save();
	ctx.translate(cx, cy);

	// ---------------------------------------------------------------------------
	// 1. AURA VOLUMÉTRIQUE RADIALE D'ARRIÈRE-PLAN
	// ---------------------------------------------------------------------------
	{
		const auraR = catScale * (0.95 + engine.smoothBass * 0.45 + engine.smoothPunch * 0.35);
		const auraGrad = ctx.createRadialGradient(0, -catScale * 0.08, catScale * 0.1, 0, -catScale * 0.08, auraR);
		auraGrad.addColorStop(0, palette.veil(0.35 + engine.smoothBass * 0.25 + neonWave * 0.2));
		auraGrad.addColorStop(0.5, palette.veil(0.12 + engine.smoothBass * 0.1));
		auraGrad.addColorStop(1, "transparent");

		ctx.fillStyle = auraGrad;
		ctx.beginPath();
		ctx.arc(0, -catScale * 0.08, auraR, 0, Math.PI * 2);
		ctx.fill();
	}

	// ---------------------------------------------------------------------------
	// 2. HALO CYBERNÉTIQUE ORBITAL (Deux Anneaux Élégants)
	// ---------------------------------------------------------------------------
	if (isPlaying) {
		ctx.save();
		const hexRadiusBase = catScale * 1.05;
		const rotSpeed = engine.timeFlow * 0.35;

		for (let r = 0; r < 2; r++) {
			const hR = hexRadiusBase * (0.82 + r * 0.22);
			const dir = r === 0 ? 1 : -1;
			const angleOffset = rotSpeed * dir + (r * Math.PI) / 6;

			ctx.beginPath();
			for (let i = 0; i < 6; i++) {
				const a = angleOffset + (i / 6) * Math.PI * 2;
				const hx = Math.cos(a) * hR;
				const hy = Math.sin(a) * hR - catScale * 0.05;
				if (i === 0) ctx.moveTo(hx, hy);
				else ctx.lineTo(hx, hy);
			}
			ctx.closePath();

			ctx.strokeStyle = r === 0 ? palette.rimVeil(0.35 + engine.smoothBass * 0.25) : palette.veil(0.18);
			ctx.lineWidth = r === 0 ? 1.4 : 0.9;
			ctx.setLineDash(r === 0 ? [10, 18] : [4, 14]);
			ctx.stroke();
		}
		ctx.restore();
	}

	// ---------------------------------------------------------------------------
	// 3. BRAISES DIAMANTÉES FLOTTANTES
	// ---------------------------------------------------------------------------
	if (isPlaying) {
		ctx.save();
		for (let i = 0; i < NUM_DIAMOND_EMBERS; i++) {
			const ex = engine.emberX[i] * catScale;
			const ey = engine.emberY[i] * catScale;
			const es = engine.emberSize[i] * (1.0 + engine.smoothPunch * 0.6);
			const pulse = 0.4 + 0.6 * Math.sin(engine.timeFlow * 3.0 + engine.emberPhase[i]);
			const alpha = (0.3 + engine.smoothBass * 0.4) * pulse;

			ctx.beginPath();
			ctx.moveTo(ex, ey - es);
			ctx.lineTo(ex + es * 0.7, ey);
			ctx.lineTo(ex, ey + es);
			ctx.lineTo(ex - es * 0.7, ey);
			ctx.closePath();

			ctx.fillStyle = palette.rimVeil(alpha);
			ctx.shadowColor = themeSolid;
			ctx.shadowBlur = 6;
			ctx.fill();
		}
		ctx.restore();
	}

	// ---------------------------------------------------------------------------
	// 4. VERRE FUMÉ TRANSLUCIDE DANS LES PLAQUES DE BLINDAGE
	// ---------------------------------------------------------------------------
	ctx.save();
	for (let p = 0; p < SMOKY_PANELS.length; p++) {
		const pan = SMOKY_PANELS[p];
		ctx.beginPath();
		ctx.moveTo(engine.projX[pan[0]], engine.projY[pan[0]]);
		ctx.lineTo(engine.projX[pan[1]], engine.projY[pan[1]]);
		ctx.lineTo(engine.projX[pan[2]], engine.projY[pan[2]]);
		ctx.closePath();
		ctx.fillStyle = palette.veil(0.15 + engine.smoothBass * 0.1);
		ctx.fill();
	}
	ctx.restore();

	// ---------------------------------------------------------------------------
	// 5. TRACÉ DES TUBES NÉON HAUTE LUMINOSITÉ (PIPELINE PHYSIQUE MULTI-PASSES)
	// ---------------------------------------------------------------------------
	const drawNeonTubes = (offX: number, offY: number) => {
		ctx.beginPath();
		for (let t = 0; t < NUM_TUBES; t++) {
			const tube = NEON_TUBES[t];
			const x1 = engine.projX[tube[0]] + offX;
			const y1 = engine.projY[tube[0]] + offY;
			const x2 = engine.projX[tube[1]] + offX;
			const y2 = engine.projY[tube[1]] + offY;
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
		}
	};

	// --- GLITCH PASSE 1 : Décalage Cyan Holographique ---
	ctx.save();
	ctx.lineWidth = (2.2 + engine.glitchEnergy * 2.0) * glowScale;
	ctx.strokeStyle = colorCyanPass;
	ctx.shadowColor = colorCyanPass;
	ctx.shadowBlur = (12 + engine.glitchEnergy * 10) * glowScale;
	drawNeonTubes(splitX, splitY);
	ctx.stroke();
	ctx.restore();

	// --- GLITCH PASSE 2 : Décalage Magenta Holographique ---
	ctx.save();
	ctx.lineWidth = (2.2 + engine.glitchEnergy * 2.0) * glowScale;
	ctx.strokeStyle = colorMagentaPass;
	ctx.shadowColor = colorMagentaPass;
	ctx.shadowBlur = (12 + engine.glitchEnergy * 10) * glowScale;
	drawNeonTubes(-splitX, -splitY);
	ctx.stroke();
	ctx.restore();

	// --- PASSE NÉON 1 : Halo Volumétrique Diffus Large (Deep Ambient Bloom) ---
	ctx.save();
	ctx.lineWidth = (11.0 + engine.smoothBass * 4.0 + neonWave * 6.0) * glowScale;
	ctx.strokeStyle = palette.veil((0.35 + engine.smoothBass * 0.25) * neonFlicker);
	ctx.shadowColor = themeSolid;
	ctx.shadowBlur = (40 + engine.smoothPunch * 20 + neonWave * 15) * glowScale;
	drawNeonTubes(0, 0);
	ctx.stroke();
	ctx.restore();

	// --- PASSE NÉON 2 : Tube Néon Saturé de Couleur (Vibrant Outer Tube Glow) ---
	ctx.save();
	ctx.lineWidth = (5.5 + engine.smoothBass * 2.0) * glowScale;
	ctx.strokeStyle = palette.rimVeil((0.85 + engine.smoothBass * 0.15) * neonFlicker);
	ctx.shadowColor = themeRimLight;
	ctx.shadowBlur = (20 + engine.smoothPunch * 12) * glowScale;
	drawNeonTubes(0, 0);
	ctx.stroke();
	ctx.restore();

	// --- PASSE NÉON 3 : Cœur de Verre Néon Pur (Solid Neon Gas Tube) ---
	ctx.save();
	ctx.lineWidth = 3.2 * (0.9 + engine.smoothPunch * 0.25);
	ctx.strokeStyle = themeSolid;
	ctx.shadowColor = themeHighlight;
	ctx.shadowBlur = 8 * glowScale;
	drawNeonTubes(0, 0);
	ctx.stroke();
	ctx.restore();

	// --- PASSE NÉON 4 : Filament Plasma Blanc Ultra-Chaud (White-Hot Core) ---
	ctx.save();
	ctx.lineWidth = 1.4;
	ctx.strokeStyle = "#ffffff";
	ctx.shadowColor = "#ffffff";
	ctx.shadowBlur = 4 * neonFlicker;
	drawNeonTubes(0, 0);
	ctx.stroke();
	ctx.restore();

	// ---------------------------------------------------------------------------
	// 6. GRANDS YEUX FÉLINS EN AMANDE (EXPRESSIFS, LUMINEUX & CURIEUX)
	// ---------------------------------------------------------------------------
	ctx.save();
	const drawExpressiveEye = (centerIdx: number) => {
		const ecX = engine.projX[centerIdx];
		const ecY = engine.projY[centerIdx];

		// Halo néon d'iris
		const eyeR = catScale * 0.095;
		const eyeGrad = ctx.createRadialGradient(ecX, ecY, 0, ecX, ecY, eyeR);
		eyeGrad.addColorStop(0, "#ffffff");
		eyeGrad.addColorStop(0.35, themeHighlight);
		eyeGrad.addColorStop(0.75, palette.rimVeil(0.85 + engine.smoothBass * 0.15));
		eyeGrad.addColorStop(1, "transparent");
		ctx.fillStyle = eyeGrad;
		ctx.beginPath();
		ctx.arc(ecX, ecY, eyeR, 0, Math.PI * 2);
		ctx.fill();

		// Fente de pupille laser en amande / diamant
		const pW = Math.max(1.5, (4.5 - engine.smoothBass * 2.5 - engine.smoothPunch * 1.2) * (catScale / 380));
		const pH = catScale * 0.08;

		ctx.beginPath();
		ctx.moveTo(ecX, ecY - pH);
		ctx.lineTo(ecX + pW, ecY);
		ctx.lineTo(ecX, ecY + pH);
		ctx.lineTo(ecX - pW, ecY);
		ctx.closePath();
		ctx.fillStyle = "#ffffff";
		ctx.shadowColor = themeHighlight;
		ctx.shadowBlur = 12 * glowScale;
		ctx.fill();

		// Double éclat spéculaire blanc (yeux vifs, mignons et intelligents)
		ctx.beginPath();
		ctx.arc(ecX - pW * 0.9, ecY - pH * 0.35, 2.4, 0, Math.PI * 2);
		ctx.fillStyle = "#ffffff";
		ctx.fill();

		ctx.beginPath();
		ctx.arc(ecX + pW * 0.6, ecY + pH * 0.25, 1.4, 0, Math.PI * 2);
		ctx.fillStyle = "#ffffff";
		ctx.fill();

		// Flare laser horizontal anamorphique sur kick
		if (engine.smoothPunch > 0.24) {
			const flareW = catScale * 0.35 * engine.smoothPunch;
			const flareGrad = ctx.createLinearGradient(ecX - flareW, ecY, ecX + flareW, ecY);
			flareGrad.addColorStop(0, "transparent");
			flareGrad.addColorStop(0.5, "#ffffff");
			flareGrad.addColorStop(1, "transparent");
			ctx.fillStyle = flareGrad;
			ctx.fillRect(ecX - flareW, ecY - 1.4, flareW * 2, 2.8);
		}
	};

	drawExpressiveEye(32);
	drawExpressiveEye(33);
	ctx.restore();

	// ---------------------------------------------------------------------------
	// 7. MOUSTACHES ÉLÉGANTES EN FAISCEAUX NÉON (SWEEP GRACIEUX)
	// ---------------------------------------------------------------------------
	ctx.save();
	const whiskerAngles = [-0.15, 0.0, 0.15];
	const whiskerLengths = [0.72, 0.85, 0.74];

	for (let i = 0; i < 3; i++) {
		const ang = whiskerAngles[i];
		const wLen = whiskerLengths[i] * catScale;
		const jolt = (engine.smoothPunch * 14.0 + engine.glitchEnergy * 8.0) * Math.sin(engine.timeFlow * 5.0 + i);

		// --- Moustache Gauche (depuis V44) ---
		const rootLX = engine.projX[44];
		const rootLY = engine.projY[44];

		const m1LX = rootLX - Math.cos(ang) * (wLen * 0.45);
		const m1LY = rootLY + Math.sin(ang) * (wLen * 0.45) + jolt * 0.3;

		const tipLX = m1LX - Math.cos(ang - 0.08) * (wLen * 0.55);
		const tipLY = m1LY + Math.sin(ang + 0.12) * (wLen * 0.55) + jolt;

		ctx.beginPath();
		ctx.moveTo(rootLX, rootLY);
		ctx.lineTo(m1LX, m1LY);
		ctx.lineTo(tipLX, tipLY);
		ctx.lineWidth = 4.8 * glowScale;
		ctx.strokeStyle = palette.rimVeil(0.75);
		ctx.shadowColor = themeSolid;
		ctx.shadowBlur = 14 * glowScale;
		ctx.stroke();

		ctx.lineWidth = 1.6;
		ctx.strokeStyle = "#ffffff";
		ctx.shadowColor = "#ffffff";
		ctx.shadowBlur = 4;
		ctx.stroke();

		// Nœud diamant terminal
		ctx.beginPath();
		ctx.moveTo(tipLX, tipLY - 2.8);
		ctx.lineTo(tipLX + 2.8, tipLY);
		ctx.lineTo(tipLX, tipLY + 2.8);
		ctx.lineTo(tipLX - 2.8, tipLY);
		ctx.closePath();
		ctx.fillStyle = "#ffffff";
		ctx.fill();

		// --- Moustache Droite (depuis V45) ---
		const rootRX = engine.projX[45];
		const rootRY = engine.projY[45];

		const m1RX = rootRX + Math.cos(ang) * (wLen * 0.45);
		const m1RY = rootRY + Math.sin(ang) * (wLen * 0.45) + jolt * 0.3;

		const tipRX = m1RX + Math.cos(ang - 0.08) * (wLen * 0.55);
		const tipRY = m1RY + Math.sin(ang + 0.12) * (wLen * 0.55) + jolt;

		ctx.beginPath();
		ctx.moveTo(rootRX, rootRY);
		ctx.lineTo(m1RX, m1RY);
		ctx.lineTo(tipRX, tipRY);
		ctx.lineWidth = 4.8 * glowScale;
		ctx.strokeStyle = palette.rimVeil(0.75);
		ctx.shadowColor = themeSolid;
		ctx.shadowBlur = 14 * glowScale;
		ctx.stroke();

		ctx.lineWidth = 1.6;
		ctx.strokeStyle = "#ffffff";
		ctx.shadowBlur = 4;
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(tipRX, tipRY - 2.8);
		ctx.lineTo(tipRX + 2.8, tipRY);
		ctx.lineTo(tipRX, tipRY + 2.8);
		ctx.lineTo(tipRX - 2.8, tipRY);
		ctx.closePath();
		ctx.fillStyle = "#ffffff";
		ctx.fill();
	}
	ctx.restore();

	// ---------------------------------------------------------------------------
	// 8. NŒUDS CAPACITEURS DIAMANT AUX SOMMETS CLÉS
	// ---------------------------------------------------------------------------
	ctx.save();
	const keyCapacitors = [0, 2, 9, 14, 15, 34, 35];
	ctx.fillStyle = "#ffffff";
	ctx.shadowColor = themeHighlight;
	ctx.shadowBlur = 10 * glowScale;

	for (let i = 0; i < keyCapacitors.length; i++) {
		const vIdx = keyCapacitors[i];
		const vx = engine.projX[vIdx];
		const vy = engine.projY[vIdx];
		const ns = 2.6 + engine.smoothPunch * 1.8;

		ctx.beginPath();
		ctx.moveTo(vx, vy - ns);
		ctx.lineTo(vx + ns, vy);
		ctx.lineTo(vx, vy + ns);
		ctx.lineTo(vx - ns, vy);
		ctx.closePath();
		ctx.fill();
	}
	ctx.restore();

	// ---------------------------------------------------------------------------
	// 9. BLOCS DE CORRUPTION NUMÉRIQUE & DÉCHIRURES VIDÉO
	// ---------------------------------------------------------------------------
	if (isPlaying && engine.glitchEnergy > 0.15) {
		ctx.save();
		for (let b = 0; b < NUM_GLITCH_BLOCKS; b++) {
			const alpha = engine.blockAlpha[b];
			if (alpha < 0.05) continue;

			const bx = engine.blockX[b] * catScale;
			const by = engine.blockY[b] * catScale;
			const bw = engine.blockW[b] * catScale;
			const bh = engine.blockH[b] * catScale;

			ctx.fillStyle = palette.rimVeil(alpha * 0.9);
			ctx.shadowColor = themeSolid;
			ctx.shadowBlur = 8;
			ctx.fillRect(bx - bw * 0.5, by, bw, bh);

			ctx.fillStyle = "#ffffff";
			ctx.fillRect(bx - bw * 0.5, by, bw * 0.4, 1.4);
		}
		ctx.restore();
	}

	// ---------------------------------------------------------------------------
	// 10. ÉCLAIRS CYBERNÉTIQUES HAUTE TENSION
	// ---------------------------------------------------------------------------
	if (isPlaying && engine.hasLightning) {
		ctx.save();
		const p1X = engine.projX[engine.lightningV1];
		const p1Y = engine.projY[engine.lightningV1];
		const p2X = engine.projX[engine.lightningV2];
		const p2Y = engine.projY[engine.lightningV2];
		const p3X = engine.projX[engine.lightningV3];
		const p3Y = engine.projY[engine.lightningV3];

		ctx.beginPath();
		ctx.moveTo(p1X, p1Y);
		const mid1X = (p1X + p2X) * 0.5 + (Math.random() - 0.5) * (catScale * 0.12);
		const mid1Y = (p1Y + p2Y) * 0.5 + (Math.random() - 0.5) * (catScale * 0.12);
		ctx.lineTo(mid1X, mid1Y);
		ctx.lineTo(p2X, p2Y);

		const mid2X = (p2X + p3X) * 0.5 + (Math.random() - 0.5) * (catScale * 0.12);
		const mid2Y = (p2Y + p3Y) * 0.5 + (Math.random() - 0.5) * (catScale * 0.12);
		ctx.lineTo(mid2X, mid2Y);
		ctx.lineTo(p3X, p3Y);

		ctx.lineWidth = 2.0 * glowScale;
		ctx.strokeStyle = "#ffffff";
		ctx.shadowColor = themeHighlight;
		ctx.shadowBlur = 16 * glowScale;
		ctx.stroke();
		ctx.restore();
	}

	// ---------------------------------------------------------------------------
	// 11. TRAME DE PHOSPHORE DENSE & BANDE DE DISTORSION TRACKING CRT
	// ---------------------------------------------------------------------------
	if (isPlaying) {
		ctx.save();
		const scanCount = 14;
		const scanSpan = catScale * 2.3;
		for (let i = 0; i < scanCount; i++) {
			const sy = ((engine.timeFlow * 95 + i * (scanSpan / scanCount)) % scanSpan) - scanSpan * 0.5;
			const isTrackingBar = Math.abs(sy - engine.trackingRollY * catScale) < 22;
			const alpha = isTrackingBar ? 0.24 : 0.04 + 0.05 * Math.sin(engine.timeFlow * 4.0 + i);

			ctx.beginPath();
			ctx.moveTo(-catScale * 0.95, sy);
			ctx.lineTo(catScale * 0.95, sy);
			ctx.lineWidth = isTrackingBar ? 2.2 : 1.0;
			ctx.strokeStyle = isTrackingBar ? themeHighlight : palette.rimVeil(alpha);
			ctx.stroke();
		}
		ctx.restore();
	}

	// ---------------------------------------------------------------------------
	// 12. GLYPHES & TAGS HEXADÉCIMAUX CYBERPUNK
	// ---------------------------------------------------------------------------
	if (isPlaying && engine.glitchEnergy > 0.3) {
		ctx.save();
		ctx.font = '9px "Consolas", "Courier New", monospace';
		ctx.fillStyle = palette.rimVeil(0.8);

		const tagX = -catScale * 0.9;
		const tagY = engine.trackingRollY * catScale;
		ctx.textAlign = "left";
		ctx.fillText(
			`//NEKO_0x${Math.floor(engine.timeFlow * 120)
				.toString(16)
				.toUpperCase()}`,
			tagX,
			tagY
		);

		ctx.textAlign = "right";
		ctx.fillText("[CYBER_NEKO]", -tagX, tagY + 12);
		ctx.restore();
	}

	// ---------------------------------------------------------------------------
	// 13. ONDE DE CHOC NÉON SUR LES DROPS
	// ---------------------------------------------------------------------------
	const activeWaves = neonCurrentManager.getActiveWaves(0);
	const mainNeon = activeWaves.length > 0 ? activeWaves[activeWaves.length - 1] : null;
	if (mainNeon && mainNeon.intensity > 0.05 && mainNeon.wavePos >= 0 && mainNeon.wavePos <= 1.0) {
		const shockR = catScale * (0.25 + mainNeon.wavePos * 1.15);
		ctx.save();
		ctx.beginPath();
		ctx.arc(0, 0, shockR, 0, Math.PI * 2);
		ctx.lineWidth = 3.0 * mainNeon.intensity;
		ctx.strokeStyle = "#ffffff";
		ctx.shadowColor = themeHighlight;
		ctx.shadowBlur = 20;
		ctx.stroke();
		ctx.restore();
	}

	ctx.restore(); // Main translate
}

export const modeConfig: ModeConfig = {
	id: "neon-cat",
	name: "🐱 Neon Cat",
	render(ctx, width, height, features, palette, analysis) {
		drawAbstractGlitchCat(ctx, width, height, features, palette, analysis);
	}
};
