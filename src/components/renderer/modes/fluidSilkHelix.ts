import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";

/**
 * 🧬 LA SPIRALE VITALE (DOUBLE HÉLICE DE SOIE COSMIQUE) PLEIN ÉCRAN
 * - Double hélice 3D avec occultation de profondeur (brin avant éclatant, brin arrière estompé)
 * - Voile de soie diaphane en torsion continue entre les brins
 * - Ponts de nucléotides lumineux avec nœuds de liaison hydrogène incandescents
 * - Filaments orbitaux en contre-rotation
 */
export function drawFluidSilkHelix(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	time: number,
	bassEnergy: number,
	midEnergy: number,
	palette: ThemePalette
) {
	ctx.save();
	const { cx, cy } = getVisualizerCenter(ctx);
	const punch = palette.punch;

	const numNodes = 44;
	const helixH = height * 0.94;
	const startY = cy - helixH / 2;
	const helixRadius = Math.min(width * 0.22, 175) * (1.0 + bassEnergy * 0.25 + punch * 0.2);

	const strandA: { x: number; y: number; z: number }[] = [];
	const strandB: { x: number; y: number; z: number }[] = [];

	for (let i = 0; i < numNodes; i++) {
		const prog = i / (numNodes - 1);
		const y = startY + prog * helixH;
		const angle = prog * Math.PI * 5.5 + time * 2.0;

		const xA = cx + Math.cos(angle) * helixRadius;
		const zA = Math.sin(angle);

		const xB = cx + Math.cos(angle + Math.PI) * helixRadius;
		const zB = Math.sin(angle + Math.PI);

		strandA.push({ x: xA, y, z: zA });
		strandB.push({ x: xB, y, z: zB });
	}

	// 1. FILAMENTS SATELLITES ORBITAUX EN CONTRE-ROTATION
	for (let sat = 0; sat < 2; sat++) {
		const satOffset = sat * Math.PI;
		ctx.beginPath();
		for (let i = 0; i < numNodes; i++) {
			const prog = i / (numNodes - 1);
			const y = startY + prog * helixH;
			const angle = -prog * Math.PI * 4 + time * 1.5 + satOffset;
			const sx = cx + Math.cos(angle) * (helixRadius * 1.25);
			if (i === 0) ctx.moveTo(sx, y);
			else ctx.lineTo(sx, y);
		}
		ctx.lineWidth = 1.0;
		ctx.strokeStyle = palette.veil(0.2 + bassEnergy * 0.15);
		ctx.stroke();
	}

	// 2. PONTS DE NUCLÉOTIDES ET BASES AZOTÉES EN ROTATION 3D
	for (let i = 0; i < numNodes; i += 2) {
		const pA = strandA[i];
		const pB = strandB[i];
		const midZ = (pA.z + pB.z) / 2;
		const isFront = pA.z > 0 || pB.z > 0;

		ctx.beginPath();
		ctx.moveTo(pA.x, pA.y);
		ctx.lineTo(pB.x, pB.y);

		const rungAlpha = 0.18 + (midZ + 1) * 0.18 + bassEnergy * 0.22;
		ctx.lineWidth = 1.2 + (isFront ? punch * 1.0 : 0);
		ctx.strokeStyle = palette.veil(rungAlpha);
		ctx.stroke();

		// Deux perles de liaison moléculaire (Adénine/Thymine, Guanine/Cytosine)
		const nodeR = 2.0 + (midZ + 1) * 1.0 + punch * 1.4;
		for (const frac of [0.34, 0.66]) {
			const nx = pA.x * (1 - frac) + pB.x * frac;
			const ny = pA.y * (1 - frac) + pB.y * frac;
			ctx.beginPath();
			ctx.arc(nx, ny, nodeR, 0, Math.PI * 2);
			ctx.fillStyle = palette.highlight;
			ctx.shadowColor = palette.highlight;
			ctx.shadowBlur = 8;
			ctx.fill();
		}
	}

	// 3. LES DEUX RUBANS HÉLICOÏDAUX AVEC EFFET DE PROFONDEUR 3D
	[strandA, strandB].forEach(strand => {
		for (let i = 1; i < strand.length; i++) {
			const prev = strand[i - 1];
			const curr = strand[i];
			const avgZ = (prev.z + curr.z) / 2;
			const isFront = avgZ > 0;

			ctx.beginPath();
			ctx.moveTo(prev.x, prev.y);
			const midX = (prev.x + curr.x) / 2;
			const midY = (prev.y + curr.y) / 2;
			ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
			ctx.lineTo(curr.x, curr.y);

			ctx.lineWidth = isFront ? 3.0 + punch * 1.5 : 1.4;
			ctx.strokeStyle = isFront ? palette.veil(0.85 + bassEnergy * 0.15 + punch * 0.15) : palette.veil(0.28);
			if (isFront) {
				ctx.shadowColor = palette.glow;
				ctx.shadowBlur = 14;
			}
			ctx.stroke();
		}
	});

	ctx.restore();
}
