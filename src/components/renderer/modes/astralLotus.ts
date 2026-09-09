import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";
import { neonCurrentManager } from "../core/neonCurrent";

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

		// Distance relative du centre (0.34) aux extrémités (1.0)
		const tierDist = [1.0, 0.78, 0.56, 0.34][tIdx];
		const tierCurrent = neonCurrentManager.getIntensityAt(tierDist);

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
			grad.addColorStop(0, palette.veil(tier.alpha * 0.15));
			grad.addColorStop(0.7, palette.veil(tier.alpha * 0.5 + tierCurrent * 0.15));
			grad.addColorStop(1, tierCurrent > 0.2 ? palette.highlight : palette.rimVeil(0.7));

			ctx.fillStyle = grad;
			ctx.fill();

			// Bordure du pétale nettement plus claire que l'intérieur (halo transparent)
			ctx.lineWidth = 1.6 + tierCurrent * 1.5;
			ctx.strokeStyle = tierCurrent > 0.2 ? palette.highlight : palette.rimLight;
			ctx.shadowColor = "transparent";
			ctx.shadowBlur = 0;
			ctx.stroke();

			ctx.restore();
		}
	});

	ctx.restore();
}

export const modeConfig: ModeConfig = {
	id: "kaleido",
	name: "🌸 Lotus Flower",
	render(ctx, width, height, features, palette) {
		const { cx, cy } = getVisualizerCenter(ctx);
		const radius = Math.min(width, height) * 0.36;
		drawAstralLotus(
			ctx,
			cx,
			cy,
			radius,
			features.energyTime,
			0,
			features.bassEnergy,
			features.trebleEnergy,
			palette
		);
	}
};
