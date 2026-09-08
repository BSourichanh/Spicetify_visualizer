import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";

/**
 * 🌸 LA FLEUR DE VIE & MANDALA ASTRAL PLEIN ÉCRAN
 * - Géométrie sacrée organique basée sur la Graine de Vie & Rosette Astrale
 * - 3 étages de pétales diaphanes harmoniques en proportion dorée (Phi)
 * - Nervures cristallines internes et perles nodales de lumière aux intersections
 * - Anneaux de résonance sacrés et pulsation d'aura concentrique
 * - Cœur géométrique stellaire avec illumination centrale
 */
export function drawBioluminescentBiocells(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	time: number,
	bassEnergy: number,
	palette: ThemePalette
) {
	ctx.save();
	const { cx, cy } = getVisualizerCenter(ctx);
	ctx.translate(cx, cy);

	const punch = palette.punch;
	const maxR = Math.min(width, height) * 0.44 * (1.0 + bassEnergy * 0.2 + punch * 0.18);
	const rot = time * (0.2 + bassEnergy * 0.1);

	// 1. ONDES D'AURA GÉOMÉTRIQUE EXPANSIVES SUR LES PERCUSSIONS
	if (bassEnergy > 0.12 || punch > 0.12) {
		const waveProg = (time * 1.35) % 1;
		const shockR = maxR * (0.7 + waveProg * 1.8);
		ctx.beginPath();
		ctx.arc(0, 0, shockR, 0, Math.PI * 2);
		ctx.lineWidth = 1.6 + punch * 1.5;
		ctx.strokeStyle = palette.veil((1 - waveProg) * (bassEnergy * 0.4 + punch * 0.38));
		ctx.stroke();
	}

	// 2. AURA DE RADIANCE RADIALE PROFONDE
	const auraGrad = palette.radialGrad(ctx, 0, 0, 0, maxR * 1.6, 0.3 + bassEnergy * 0.22 + punch * 0.2, 0);
	ctx.fillStyle = auraGrad;
	ctx.beginPath();
	ctx.arc(0, 0, maxR * 1.6, 0, Math.PI * 2);
	ctx.fill();

	// 3. LES 3 ÉTAGES DE PÉTALES SACRÉS DE LA FLEUR DE VIE (Graine, Cœur, Rosette)
	const tiers = [
		{ count: 6, r: maxR * 0.32, width: 0.38, alpha: 0.35, rotSpeed: 0.1 },
		{ count: 12, r: maxR * 0.65, width: 0.28, alpha: 0.24, rotSpeed: -0.06 },
		{ count: 12, r: maxR * 1.0, width: 0.22, alpha: 0.16, rotSpeed: 0.04 }
	];

	tiers.forEach((tier, tIdx) => {
		const tierRot = rot * (tIdx % 2 === 0 ? 1 : -0.7) + tIdx * (Math.PI / tier.count);
		const petalLen = tier.r * (1 + bassEnergy * 0.18 + punch * 0.14);

		for (let i = 0; i < tier.count; i++) {
			const angle = tierRot + (i / tier.count) * Math.PI * 2;
			ctx.save();
			ctx.rotate(angle);

			const petalWid = petalLen * tier.width * (1 + Math.sin(time * 2.2 + i * 0.5) * 0.08);

			// Pétale en amande sacrée (Vesica Piscis organique)
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.bezierCurveTo(-petalWid, petalLen * 0.42, -petalWid * 0.6, petalLen * 0.85, 0, petalLen);
			ctx.bezierCurveTo(petalWid * 0.6, petalLen * 0.85, petalWid, petalLen * 0.42, 0, 0);
			ctx.closePath();

			const pGrad = ctx.createLinearGradient(0, 0, 0, petalLen);
			pGrad.addColorStop(0, palette.veil(tier.alpha * 0.3));
			pGrad.addColorStop(0.65, palette.veil(tier.alpha + bassEnergy * 0.15 + punch * 0.14));
			pGrad.addColorStop(1, palette.veil(tier.alpha * 1.8));
			ctx.fillStyle = pGrad;
			ctx.fill();

			ctx.lineWidth = 1.4 + punch * 0.8;
			ctx.strokeStyle = palette.veil(tier.alpha * 2.2);
			ctx.shadowColor = palette.glow;
			ctx.shadowBlur = 10;
			ctx.stroke();

			// Nervure médiane cristalline
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(0, petalLen * 0.88);
			ctx.lineWidth = 0.8;
			ctx.strokeStyle = palette.veil(tier.alpha * 1.5);
			ctx.stroke();

			// Perle nodale à la pointe du pétale
			if (tIdx > 0) {
				ctx.beginPath();
				ctx.arc(0, petalLen, 2.0 + punch * 1.4, 0, Math.PI * 2);
				ctx.fillStyle = palette.highlight;
				ctx.shadowColor = palette.highlight;
				ctx.shadowBlur = 8;
				ctx.fill();
			}

			ctx.restore();
		}
	});

	// 4. ANNEAUX CONCENTRIQUES DE GÉOMÉTRIE SACRÉE
	for (let ring = 1; ring <= 3; ring++) {
		const ringR = maxR * (0.32 * ring);
		ctx.beginPath();
		ctx.arc(0, 0, ringR, 0, Math.PI * 2);
		ctx.lineWidth = 1.2 + (ring === 3 ? punch * 0.8 : 0);
		ctx.strokeStyle = palette.veil(0.24 + ring * 0.08 + bassEnergy * 0.15);
		ctx.stroke();
	}

	// 5. CŒUR GÉOMÉTRIQUE STELLAIRE LUMINEUX
	const coreR = maxR * (0.15 + bassEnergy * 0.12 + punch * 0.15);
	const cGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR * 2.0);
	cGrad.addColorStop(0, palette.highlight);
	cGrad.addColorStop(0.35, palette.solid);
	cGrad.addColorStop(1, palette.veil(0));
	ctx.fillStyle = cGrad;
	ctx.beginPath();
	ctx.arc(0, 0, coreR * 2.0, 0, Math.PI * 2);
	ctx.fill();

	// Étoile sacrée à 6 branches au cœur
	ctx.save();
	ctx.rotate(rot * 2);
	for (let star = 0; star < 2; star++) {
		ctx.rotate((Math.PI / 3) * star);
		ctx.beginPath();
		for (let pt = 0; pt < 3; pt++) {
			const pa = pt * ((Math.PI * 2) / 3);
			const px = Math.cos(pa) * (coreR * 1.3);
			const py = Math.sin(pa) * (coreR * 1.3);
			if (pt === 0) ctx.moveTo(px, py);
			else ctx.lineTo(px, py);
		}
		ctx.closePath();
		ctx.lineWidth = 1.2 + punch * 0.8;
		ctx.strokeStyle = palette.highlight;
		ctx.stroke();
	}
	ctx.restore();

	ctx.restore();
}

export const modeConfig: ModeConfig = {
	id: "hex-grid",
	name: "🔬 Biocellules Luminescentes",
	render(ctx, width, height, features, palette) {
		drawBioluminescentBiocells(ctx, width, height, features.energyTime, features.bassEnergy, palette);
	}
};
