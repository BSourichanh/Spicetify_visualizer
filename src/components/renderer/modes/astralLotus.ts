import { ThemePalette } from "../core/palette";

/**
 * 🌸 LOTUS ASTRAL ÉPANOUI PLEIN ÉCRAN
 * - 4 rangées de pétales sacrés (36 pétales au total)
 * - Nervures radiales internes dans chaque pétale
 * - Ondes d'aura sacrées expansives
 * - Pistil incandescent avec étamines stellaires
 */
export function drawAstralLotus(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	radius: number,
	time: number,
	beatProgress: number,
	bassEnergy: number,
	trebleEnergy: number,
	palette: ThemePalette
) {
	ctx.save();
	ctx.translate(cx, cy);

	const punch = palette.punch;
	// Rotation calme, majestueuse et continue
	const rot = time * (0.2 + bassEnergy * 0.12);
	ctx.rotate(rot);

	// 1. ONDES D'AURA SACRÉES EXPANSIVES
	if (bassEnergy > 0.1 || punch > 0.12) {
		const waveProg = (time * 1.4) % 1;
		const auraWaveR = radius * (0.85 + waveProg * 1.6);
		ctx.beginPath();
		ctx.arc(0, 0, auraWaveR, 0, Math.PI * 2);
		ctx.lineWidth = 1.6 + punch * 1.5;
		ctx.strokeStyle = palette.veil((1 - waveProg) * (bassEnergy * 0.42 + punch * 0.38));
		ctx.stroke();
	}

	const auraGrad = palette.radialGrad(ctx, 0, 0, 0, radius * 1.7, 0.28 + bassEnergy * 0.22 + punch * 0.18, 0);
	ctx.fillStyle = auraGrad;
	ctx.beginPath();
	ctx.arc(0, 0, radius * 1.7, 0, Math.PI * 2);
	ctx.fill();

	// 2. 4 ÉTAGES DE PÉTALES SACRÉS PURS ET ÉLÉGANTS (36 pétales)
	const petalScale = 1.0 + bassEnergy * 0.26 + punch * 0.22;
	const petalTiers = [
		{ count: 16, r: radius * 1.0 * petalScale, width: 0.26 * (1 + punch * 0.14), alpha: 0.14 },
		{
			count: 12,
			r: radius * 0.78 * (1 + bassEnergy * 0.22 + punch * 0.18),
			width: 0.32 * (1 + punch * 0.14),
			alpha: 0.2
		},
		{
			count: 8,
			r: radius * 0.56 * (1 + bassEnergy * 0.18 + punch * 0.15),
			width: 0.42 * (1 + punch * 0.14),
			alpha: 0.28
		},
		{
			count: 6,
			r: radius * 0.34 * (1 + bassEnergy * 0.14 + punch * 0.12),
			width: 0.52 * (1 + punch * 0.14),
			alpha: 0.38
		}
	];

	petalTiers.forEach((tier, tIdx) => {
		const tierDirection = tIdx % 2 === 0 ? 1 : -1;
		const tierRot = tIdx * (Math.PI / tier.count) + time * 0.08 * tierDirection;

		for (let i = 0; i < tier.count; i++) {
			const a = tierRot + (i / tier.count) * Math.PI * 2;
			ctx.save();
			ctx.rotate(a);

			// Ondulation très douce et soyeuse (non saccadée)
			const pLen = tier.r;
			const pWid = tier.r * tier.width * (1 + Math.sin(time * 2.0 + i * 0.4) * 0.08);

			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.bezierCurveTo(-pWid, -pLen * 0.42, -pWid * 0.6, -pLen * 0.85, 0, -pLen);
			ctx.bezierCurveTo(pWid * 0.6, -pLen * 0.85, pWid, -pLen * 0.42, 0, 0);
			ctx.closePath();

			const grad = ctx.createLinearGradient(0, 0, 0, -pLen);
			grad.addColorStop(0, palette.veil(tier.alpha * 0.25));
			grad.addColorStop(0.7, palette.veil(tier.alpha + bassEnergy * 0.15 + punch * 0.12));
			grad.addColorStop(1, palette.veil(tier.alpha * 1.8));

			ctx.fillStyle = grad;
			ctx.fill();

			ctx.lineWidth = 1.3;
			ctx.strokeStyle = palette.veil(tier.alpha * 2.2);
			ctx.shadowColor = palette.glow;
			ctx.shadowBlur = 8;
			ctx.stroke();

			// Finesse de la nervure centrale
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(0, -pLen * 0.9);
			ctx.lineWidth = 0.8;
			ctx.strokeStyle = palette.veil(tier.alpha * 1.6);
			ctx.stroke();

			ctx.restore();
		}
	});

	// 3. PISTIL CENTRAL PUR, ÉPURÉ ET SANS SPIRALES (FOCAL POINT CLAIR ET NET)
	const pistilR = radius * (0.16 + bassEnergy * 0.12 + punch * 0.16);
	const pGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, pistilR * 2.0);
	pGrad.addColorStop(0, palette.highlight);
	pGrad.addColorStop(0.35, palette.solid);
	pGrad.addColorStop(1, palette.veil(0));
	ctx.fillStyle = pGrad;
	ctx.beginPath();
	ctx.arc(0, 0, pistilR * 2.0, 0, Math.PI * 2);
	ctx.fill();

	// 12 Fines étamines stellaires discrètes
	for (let s = 0; s < 12; s++) {
		const sa = (s / 12) * Math.PI * 2 + time * 0.4;
		const sx = Math.cos(sa) * (pistilR * (1.2 + punch * 0.45));
		const sy = Math.sin(sa) * (pistilR * (1.2 + punch * 0.45));
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(sx, sy);
		ctx.lineWidth = 1.0 + punch * 0.8;
		ctx.strokeStyle = palette.highlight;
		ctx.stroke();
	}

	ctx.restore();
}
