import { ThemePalette } from "../core/palette";

/**
 * 💧 GOUTTE D'AURA ABYSSALE VIVANTE PLEIN ÉCRAN
 * - 3 membranes fluides concentriques emboîtées avec tension de surface organique
 * - Cœur nucléaire cytoplasmique avec organites luminescents en lévitation interne
 * - Déformation harmonique multi-fréquence soyeuse
 * - Ondes capillaires expansives sur les percussions se propageant jusqu'aux bords
 */
export function drawBioluminescentWaterdrop(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	radius: number,
	time: number,
	bassEnergy: number,
	trebleEnergy: number,
	palette: ThemePalette
) {
	ctx.save();
	ctx.translate(cx, cy);

	const punch = palette.punch;
	const R = radius * (1.0 + bassEnergy * 0.22 + punch * 0.24);

	// 1. ONDES CAPILLAIRES EXPANSIVES SUR LES PERCUSSIONS
	if (bassEnergy > 0.1 || punch > 0.12) {
		const maxShockR = Math.max(radius * 3.4, ctx.canvas.width * 0.48);
		const ringProg = (time * 1.4) % 1;
		const ringR = radius * (1.1 + ringProg * (maxShockR / radius));
		ctx.beginPath();
		ctx.arc(0, 0, ringR, 0, Math.PI * 2);
		ctx.lineWidth = 1.6 + punch * 1.5;
		ctx.strokeStyle = palette.veil((1 - ringProg) * (bassEnergy * 0.42 + punch * 0.38));
		ctx.stroke();
	}

	// 2. AURA DIFFUSE ABYSSALE
	const auraGrad = palette.radialGrad(ctx, 0, 0, 0, R * 1.8, 0.28 + bassEnergy * 0.22, 0);
	ctx.fillStyle = auraGrad;
	ctx.beginPath();
	ctx.arc(0, 0, R * 1.8, 0, Math.PI * 2);
	ctx.fill();

	// 3. LES 3 MEMBRANES FLUIDES CONCENTRIQUES
	const membranes = [
		{ scale: 1.0, alpha: 0.18, defAmp: 1.0, phase: 0 },
		{ scale: 0.74, alpha: 0.3, defAmp: 0.7, phase: 1.2 },
		{ scale: 0.48, alpha: 0.48, defAmp: 0.45, phase: 2.4 }
	];

	membranes.forEach((mem, mIdx) => {
		const mR = R * mem.scale;
		const pts = 72;
		const poly: { x: number; y: number }[] = [];

		for (let i = 0; i <= pts; i++) {
			const angle = (i / pts) * Math.PI * 2;
			const deform =
				Math.sin(angle * 3 + time * 2.8 + mem.phase) * (mR * 0.08 * (1 + bassEnergy) * mem.defAmp) +
				Math.cos(angle * 5 - time * 2.2 + mem.phase) * (mR * 0.05 * (1 + trebleEnergy) * mem.defAmp) +
				Math.sin(angle * 2 + time * 1.4) * (mR * 0.12 * bassEnergy * mem.defAmp);
			const curR = mR + deform;
			poly.push({ x: Math.cos(angle) * curR, y: Math.sin(angle) * curR });
		}

		ctx.beginPath();
		ctx.moveTo(poly[0].x, poly[0].y);
		for (let i = 1; i < poly.length; i++) {
			const prev = poly[i - 1];
			const curr = poly[i];
			const mx = (prev.x + curr.x) / 2;
			const my = (prev.y + curr.y) / 2;
			ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
		}
		ctx.closePath();

		const dropGrad = ctx.createRadialGradient(-mR * 0.25, -mR * 0.25, 0, 0, 0, mR * 1.2);
		dropGrad.addColorStop(0, palette.veil(mem.alpha * 1.5 + bassEnergy * 0.2));
		dropGrad.addColorStop(0.7, palette.veil(mem.alpha));
		dropGrad.addColorStop(1, palette.veil(mem.alpha * 0.2));
		ctx.fillStyle = dropGrad;
		ctx.fill();

		ctx.lineWidth = mIdx === 0 ? 2.4 + punch * 1.2 : 1.4;
		ctx.strokeStyle = palette.veil(mem.alpha * 2.0 + punch * 0.2);
		ctx.shadowColor = palette.glow;
		ctx.shadowBlur = 12;
		ctx.stroke();
	});

	// 4. ORGANITES ET MICRONOYAUX EN LÉVITATION CYTOPLASMIQUE
	const numOrganelles = 6;
	for (let o = 0; o < numOrganelles; o++) {
		const oAngle = time * (0.6 + o * 0.18) + o * ((Math.PI * 2) / numOrganelles);
		const oDist = R * (0.24 + Math.sin(time * 1.5 + o) * 0.08);
		const ox = Math.cos(oAngle) * oDist;
		const oy = Math.sin(oAngle) * oDist;

		ctx.beginPath();
		ctx.arc(ox, oy, 3.2 + punch * 1.8 + trebleEnergy * 1.5, 0, Math.PI * 2);
		ctx.fillStyle = palette.highlight;
		ctx.shadowColor = palette.highlight;
		ctx.shadowBlur = 8;
		ctx.fill();
	}

	// 5. CŒUR NUCLÉAIRE CENTRAL HYPER-LUMINEUX
	const coreR = R * (0.16 + bassEnergy * 0.12 + punch * 0.15);
	const cGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR * 2.2);
	cGrad.addColorStop(0, palette.highlight);
	cGrad.addColorStop(0.38, palette.solid);
	cGrad.addColorStop(1, palette.veil(0));
	ctx.fillStyle = cGrad;
	ctx.beginPath();
	ctx.arc(0, 0, coreR * 2.2, 0, Math.PI * 2);
	ctx.fill();

	ctx.restore();
}
