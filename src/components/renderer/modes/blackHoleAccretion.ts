import { ThemePalette } from "../core/palette";

/**
 * 🕳️ TROU NOIR & DISQUE D'ACCRÉTION CINÉMATIQUE PLEIN ÉCRAN
 * - Disque d'accrétion étendu sur 90% de la fenêtre
 * - Effet Doppler relativiste (approche éclatante à gauche, atténuation à droite)
 * - Double lentille gravitationnelle (arc supérieur + arc inférieur)
 * - Jets relativistes polaires verticaux
 * - 24 anneaux képlériens en rotation différentielle
 */
export function drawBlackHoleAccretion(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	radius: number,
	time: number,
	bassEnergy: number,
	midEnergy: number,
	palette: ThemePalette
) {
	ctx.save();
	ctx.translate(cx, cy);

	const punch = palette.punch;
	const bhRadius = radius * (0.32 + bassEnergy * 0.08 + punch * 0.04);
	const maxDiscR = Math.max(radius * 3.2, ctx.canvas.width * 0.44);
	const tilt = 0.32;

	// 1. ONDES GRAVITATIONNELLES CONCENTRIQUES (Ripples de l'espace-temps sur les kicks)
	if (bassEnergy > 0.12 || punch > 0.12) {
		const waveProg = (time * 1.3) % 1;
		const waveR = bhRadius * (1.2 + waveProg * 3.2);
		ctx.beginPath();
		ctx.ellipse(0, 0, waveR, waveR * tilt * 1.2, 0, 0, Math.PI * 2);
		ctx.lineWidth = 1.6 + punch * 1.4;
		ctx.strokeStyle = palette.veil((1 - waveProg) * (bassEnergy * 0.4 + punch * 0.35));
		ctx.stroke();
	}

	// 2. JETS RELATIVISTES POLAIRES À NŒUDS DE CHOC
	const jetH = ctx.canvas.height * (0.55 + punch * 0.35 + bassEnergy * 0.25);
	for (let j = -1; j <= 1; j += 2) {
		const jGrad = ctx.createLinearGradient(0, 0, 0, j * jetH);
		jGrad.addColorStop(0, palette.veil(0.45 + punch * 0.35));
		jGrad.addColorStop(0.35, palette.veil(0.18 + bassEnergy * 0.15));
		jGrad.addColorStop(1, palette.veil(0));

		ctx.beginPath();
		ctx.moveTo(-bhRadius * 0.2, 0);
		ctx.lineTo(-bhRadius * 0.05, j * jetH);
		ctx.lineTo(bhRadius * 0.05, j * jetH);
		ctx.lineTo(bhRadius * 0.2, 0);
		ctx.closePath();
		ctx.fillStyle = jGrad;
		ctx.fill();

		// Nœuds de choc (Shock diamonds)
		for (let s = 1; s <= 4; s++) {
			const sy = j * (jetH * (s / 5));
			const sw = bhRadius * 0.12 * (1 - s / 5.5) * (1 + punch * 0.5);
			ctx.beginPath();
			ctx.moveTo(0, sy - sw * 1.5);
			ctx.lineTo(sw, sy);
			ctx.lineTo(0, sy + sw * 1.5);
			ctx.lineTo(-sw, sy);
			ctx.closePath();
			ctx.fillStyle = palette.highlight;
			ctx.shadowColor = palette.glow;
			ctx.shadowBlur = 10;
			ctx.fill();
		}
	}

	// 3. LENTILLE GRAVITATIONNELLE D'EINSTEIN : ARC SUPÉRIEUR (Disque arrière courbé au-dessus)
	ctx.save();
	ctx.beginPath();
	ctx.ellipse(0, -bhRadius * 0.42, bhRadius * 2.3, bhRadius * 1.45, 0, Math.PI, Math.PI * 2);
	// Dégradé asymétrique Doppler : éclatant et incandescent à gauche (vers observateur)
	const lensGrad = ctx.createLinearGradient(-bhRadius * 2.3, 0, bhRadius * 2.3, 0);
	lensGrad.addColorStop(0, palette.highlight);
	lensGrad.addColorStop(0.3, palette.veil(0.75 + bassEnergy * 0.2));
	lensGrad.addColorStop(0.7, palette.veil(0.35));
	lensGrad.addColorStop(1, palette.veil(0.1));
	ctx.lineWidth = 18 + bassEnergy * 14 + punch * 12;
	ctx.strokeStyle = lensGrad;
	ctx.shadowColor = palette.glow;
	ctx.shadowBlur = 24;
	ctx.stroke();

	// Filet de lumière intense sur la crête de courbure
	ctx.lineWidth = 2.4 + punch * 1.5;
	ctx.strokeStyle = palette.highlight;
	ctx.stroke();
	ctx.restore();

	// 4. LENTILLE GRAVITATIONNELLE INFÉRIEURE SECONDAIRE
	ctx.save();
	ctx.beginPath();
	ctx.ellipse(0, bhRadius * 0.35, bhRadius * 1.9, bhRadius * 0.85, 0, 0, Math.PI);
	ctx.lineWidth = 8 + bassEnergy * 6;
	ctx.strokeStyle = palette.veil(0.3 + bassEnergy * 0.2);
	ctx.shadowBlur = 14;
	ctx.stroke();
	ctx.restore();

	// 5. NAPPES GAZEUSES D'ACCRÉTION VOLUMÉTRIQUES EN ROTATION KÉPLÉRIENNE
	const numLanes = 6;
	for (let l = 0; l < numLanes; l++) {
		const laneFrac = (l + 1) / (numLanes + 1);
		const lr = bhRadius * 1.25 + laneFrac * (maxDiscR - bhRadius * 1.25);
		const speed = time * (1.2 / Math.sqrt(laneFrac + 0.2));

		ctx.beginPath();
		const pts = 64;
		for (let i = 0; i <= pts; i++) {
			const normP = i / pts;
			const angle = normP * Math.PI * 2 + speed;
			const x = Math.cos(angle) * lr;
			// Asymétrie Doppler : l'épaisseur et la turbulence augmentent à gauche (x < 0)
			const dopplerFactor = 1 + Math.max(0, -Math.cos(angle)) * 0.45;
			const y = Math.sin(angle) * (lr * tilt) * dopplerFactor;

			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.closePath();

		const laneAlpha = (1 - laneFrac * 0.6) * (0.28 + bassEnergy * 0.22 + punch * 0.18);
		ctx.lineWidth = (4 + laneFrac * 8 + bassEnergy * 5) * (1 + punch * 0.2);
		ctx.strokeStyle = palette.veil(laneAlpha);
		ctx.shadowColor = palette.glow;
		ctx.shadowBlur = 12;
		ctx.stroke();
	}

	// 6. RUISSEAUX D'ÉMISSION TOURBILLONNAIRES RELATIVISTES
	const numStreams = 5;
	for (let st = 0; st < numStreams; st++) {
		const streamOffset = st * ((Math.PI * 2) / numStreams);
		ctx.beginPath();
		const sSteps = 60;
		for (let s = 0; s <= sSteps; s++) {
			const normS = s / sSteps;
			const speed = time * 0.9 + normS * 1.8;
			const theta = normS * Math.PI * 3.2 + streamOffset + speed;
			const r = bhRadius * 1.1 + normS * (maxDiscR - bhRadius * 1.1);
			const x = Math.cos(theta) * r;
			const y = Math.sin(theta) * r * tilt;

			if (s === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}

		ctx.lineWidth = 2.0 + punch * 1.4;
		ctx.strokeStyle = palette.veil(0.4 + bassEnergy * 0.25 + punch * 0.25);
		ctx.shadowColor = palette.glow;
		ctx.shadowBlur = 14;
		ctx.stroke();
	}

	// 7. HORIZON DES ÉVÉNEMENTS (Trou Noir Abyssal Absolu)
	ctx.beginPath();
	ctx.arc(0, 0, bhRadius, 0, Math.PI * 2);
	ctx.save();
	ctx.globalCompositeOperation = "destination-out";
	ctx.fillStyle = "rgba(0, 0, 0, 1)";
	ctx.fill();
	ctx.restore();

	// Anneau de photons incandescents (Photon Sphere)
	ctx.beginPath();
	ctx.arc(0, 0, bhRadius * 1.04, 0, Math.PI * 2);
	ctx.lineWidth = 2.8 + punch * 3.5;
	ctx.strokeStyle = palette.highlight;
	ctx.shadowColor = palette.highlight;
	ctx.shadowBlur = 24;
	ctx.stroke();

	// 8. DISQUE D'ACCRÉTION AU PREMIER PLAN (Passe majestueusement DEVANT l'horizon)
	ctx.save();
	ctx.beginPath();
	ctx.ellipse(0, 0, maxDiscR * 0.88, maxDiscR * 0.88 * tilt, 0, 0, Math.PI);
	const frontGrad = ctx.createLinearGradient(-maxDiscR * 0.88, 0, maxDiscR * 0.88, 0);
	frontGrad.addColorStop(0, palette.highlight);
	frontGrad.addColorStop(0.35, palette.veil(0.75 + bassEnergy * 0.25));
	frontGrad.addColorStop(0.7, palette.veil(0.4));
	frontGrad.addColorStop(1, palette.veil(0.12));
	ctx.lineWidth = 18 + bassEnergy * 18 + punch * 14;
	ctx.strokeStyle = frontGrad;
	ctx.shadowColor = palette.glow;
	ctx.shadowBlur = 28;
	ctx.stroke();

	// Ligne d'arête incandescente de premier plan
	ctx.lineWidth = 2.2 + punch * 1.4;
	ctx.strokeStyle = palette.highlight;
	ctx.stroke();
	ctx.restore();

	ctx.restore();
}
