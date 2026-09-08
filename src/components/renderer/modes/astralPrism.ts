import { ThemePalette } from "../core/palette";
import { getVisualizerCenter } from "../core/geometry";
import { ModeConfig } from "../createCanvasVisualizer";

/**
 * 💎 LE MONOLITHE CRISTALLIN VIVANT PLEIN ÉCRAN
 * - Prisme minéral astral 3D bipyramidal hexagonal à 14 sommets et 24 facettes
 * - Rendu 3D complet avec calcul des normales de surface et tri Z (Painter's Algorithm)
 * - Éclats spéculaires directionnels et caustiques de réfraction volumétriques
 * - Cœur lumineux rayonnant à travers les facettes translucides
 * - Satellites cristallins en orbite elliptique
 */
export function drawAstralPrism(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	size: number,
	time: number,
	bassEnergy: number,
	palette: ThemePalette
) {
	ctx.save();
	ctx.translate(cx, cy);

	const punch = palette.punch;
	const s = size * 0.72 * (1.0 + bassEnergy * 0.22 + punch * 0.25);

	// 1. FAISCEAUX CAUSTIQUES DE RÉFRACTION VOLUMÉTRIQUE
	const numCaustics = 8;
	const causticRot = time * 0.15;
	for (let c = 0; c < numCaustics; c++) {
		const ca = causticRot + (c / numCaustics) * Math.PI * 2;
		const cLen = Math.max(ctx.canvas.width, ctx.canvas.height) * (0.42 + punch * 0.2);
		const spread = 0.08 + punch * 0.04;

		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(Math.cos(ca - spread) * cLen, Math.sin(ca - spread) * cLen);
		ctx.lineTo(Math.cos(ca + spread) * cLen, Math.sin(ca + spread) * cLen);
		ctx.closePath();

		const bGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, cLen);
		bGrad.addColorStop(0, palette.veil(0.24 + punch * 0.22));
		bGrad.addColorStop(0.5, palette.veil(0.06 + bassEnergy * 0.06));
		bGrad.addColorStop(1, palette.veil(0));
		ctx.fillStyle = bGrad;
		ctx.fill();
	}

	// 2. MATRICES DE ROTATION 3D FLUIDES DU MONOLITHE
	const rotY = time * 0.45;
	const rotX = Math.sin(time * 0.3) * 0.35 + 0.15;
	const rotZ = time * 0.12;

	const cosY = Math.cos(rotY),
		sinY = Math.sin(rotY);
	const cosX = Math.cos(rotX),
		sinX = Math.sin(rotX);
	const cosZ = Math.cos(rotZ),
		sinZ = Math.sin(rotZ);

	const project3D = (x: number, y: number, z: number) => {
		const x1 = x * cosY + z * sinY;
		const z1 = -x * sinY + z * cosY;
		const y1 = y * cosX - z1 * sinX;
		const z2 = y * sinX + z1 * cosX;
		const x2 = x1 * cosZ - y1 * sinZ;
		const y2 = x1 * sinZ + y1 * cosZ;
		const fov = 750 / (750 + z2);
		return { x: x2 * fov, y: y2 * fov, z: z2 };
	};

	// 14 Sommets du Prisme Bipyramidal Hexagonal Astral
	const h = s * 1.55;
	const rHex = s * 0.95;
	const rawVerts: { x: number; y: number; z: number }[] = [];

	// 0: Apex supérieur
	rawVerts.push({ x: 0, y: -h, z: 0 });
	// 1..6: Couronne haute
	for (let i = 0; i < 6; i++) {
		const a = (i / 6) * Math.PI * 2;
		rawVerts.push({ x: Math.cos(a) * rHex, y: -h * 0.42, z: Math.sin(a) * rHex });
	}
	// 7..12: Couronne basse
	for (let i = 0; i < 6; i++) {
		const a = (i / 6) * Math.PI * 2;
		rawVerts.push({ x: Math.cos(a) * rHex, y: h * 0.42, z: Math.sin(a) * rHex });
	}
	// 13: Apex inférieur
	rawVerts.push({ x: 0, y: h, z: 0 });

	const projected = rawVerts.map(v => project3D(v.x, v.y, v.z));

	// 3. CŒUR ÉNERGÉTIQUE INTERNE RAYONNANT (Placé à l'intérieur du cristal)
	const coreR = s * (0.35 + bassEnergy * 0.16 + punch * 0.22);
	const cGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR * 1.8);
	cGrad.addColorStop(0, palette.highlight);
	cGrad.addColorStop(0.4, palette.solid);
	cGrad.addColorStop(1, palette.veil(0));
	ctx.fillStyle = cGrad;
	ctx.beginPath();
	ctx.arc(0, 0, coreR * 1.8, 0, Math.PI * 2);
	ctx.fill();

	// 4. 24 FACETTES CRISTALLINES AVEC CALCUL 3D & ÉCLATS SPÉCULAIRES
	type Face = [number, number, number];
	const faces: Face[] = [];
	for (let i = 0; i < 6; i++) {
		const next = (i + 1) % 6;
		// Cône supérieur
		faces.push([0, 1 + i, 1 + next]);
		// Corps hexagonal (2 triangles par face quadrilatère)
		faces.push([1 + i, 7 + i, 7 + next]);
		faces.push([1 + i, 7 + next, 1 + next]);
		// Cône inférieur
		faces.push([13, 7 + next, 7 + i]);
	}

	// Tri par profondeur Z (Painter's algorithm)
	faces.sort((a, b) => {
		const zA = (projected[a[0]].z + projected[a[1]].z + projected[a[2]].z) / 3;
		const zB = (projected[b[0]].z + projected[b[1]].z + projected[b[2]].z) / 3;
		return zA - zB;
	});

	// Rendu des facettes cristallines translucides
	faces.forEach(f => {
		const p0 = projected[f[0]];
		const p1 = projected[f[1]];
		const p2 = projected[f[2]];

		const v1x = p1.x - p0.x,
			v1y = p1.y - p0.y;
		const v2x = p2.x - p0.x,
			v2y = p2.y - p0.y;
		const normalZ = v1x * v2y - v1y * v2x;
		const isFront = normalZ > 0;

		ctx.beginPath();
		ctx.moveTo(p0.x, p0.y);
		ctx.lineTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.closePath();

		const baseFaceAlpha = isFront ? 0.16 : 0.05;
		const spec = isFront ? Math.max(0, normalZ / 22000) * 0.35 : 0;
		const faceAlpha = Math.min(0.65, baseFaceAlpha + spec + bassEnergy * 0.12 + punch * 0.18);

		ctx.fillStyle = palette.veil(faceAlpha);
		ctx.fill();

		ctx.lineWidth = isFront ? 1.8 + punch * 1.2 : 0.9;
		ctx.strokeStyle = isFront ? palette.veil(0.7 + bassEnergy * 0.25 + punch * 0.2) : palette.veil(0.24);
		if (isFront) {
			ctx.shadowColor = palette.glow;
			ctx.shadowBlur = 10;
		}
		ctx.stroke();
	});

	// Éclats aux sommets du cristal
	projected.forEach(p => {
		ctx.beginPath();
		ctx.arc(p.x, p.y, 2.4 + punch * 1.5, 0, Math.PI * 2);
		ctx.fillStyle = palette.highlight;
		ctx.shadowColor = palette.highlight;
		ctx.shadowBlur = 8;
		ctx.fill();
	});

	// 5. SATELLITES CRISTALLINS EN ORBITE ELLIPTIQUE
	const numSatellites = 4;
	for (let st = 0; st < numSatellites; st++) {
		const sAngle = time * (0.8 + st * 0.25) + st * ((Math.PI * 2) / numSatellites);
		const orbRx = s * (1.6 + st * 0.22);
		const orbRy = orbRx * 0.42;
		const sx = Math.cos(sAngle) * orbRx;
		const sy = Math.sin(sAngle) * orbRy;

		const satSize = 4.5 + punch * 2.5;
		ctx.beginPath();
		ctx.moveTo(sx, sy - satSize * 1.4);
		ctx.lineTo(sx + satSize, sy);
		ctx.lineTo(sx, sy + satSize * 1.4);
		ctx.lineTo(sx - satSize, sy);
		ctx.closePath();
		ctx.fillStyle = palette.highlight;
		ctx.shadowColor = palette.highlight;
		ctx.shadowBlur = 12;
		ctx.fill();
	}

	ctx.restore();
}

export const modeConfig: ModeConfig = {
	id: "polyhedra",
	name: "💎 3D Crystal",
	render(ctx, width, height, features, palette) {
		const { cx, cy } = getVisualizerCenter(ctx);
		const size = Math.min(width, height) * 0.28;
		drawAstralPrism(ctx, cx, cy, size, features.energyTime, features.bassEnergy, palette);
	}
};
