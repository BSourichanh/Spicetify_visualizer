/**
 * Palette chromatique 100% issue de la couleur du thème Spotify.
 * Pure famille tonale (solid, glow, veil, highlight) sans aucune couleur externe.
 */
export type ThemePalette = {
	r: number;
	g: number;
	b: number;
	punch: number;
	valence: number;
	energy: number;
	solid: string;
	glow: string;
	highlight: string;
	rimLight: string;
	rimVeil: (alpha: number) => string;
	veil: (alpha: number) => string;
	radialGrad: (
		ctx: CanvasRenderingContext2D,
		cx: number,
		cy: number,
		r1: number,
		r2: number,
		a1?: number,
		a2?: number
	) => CanvasGradient;
};

export function getThemePalette(
	color: { r: number; g: number; b: number },
	bassEnergy = 0,
	punch = 0,
	valence = 0.5,
	energy = 0.5,
	glowScale = 1.0
): ThemePalette {
	const r = color?.r ?? 180;
	const g = color?.g ?? 180;
	const b = color?.b ?? 180;

	// Incandescence vive sur le punch et les crêtes de percussion
	const effectivePunch = Math.max(punch, bassEnergy > 0.55 ? (bassEnergy - 0.55) * 1.6 : 0);
	// Si valence élevée (mode majeur / radieux), on amplifie la luminosité et la clarté solaire
	const moodBrightness = (valence - 0.5) * 0.18 + (energy - 0.5) * 0.12;
	const flash = Math.max(
		0,
		Math.min(1, (effectivePunch * 0.8 + bassEnergy * 0.45 + Math.max(0, moodBrightness)) * Math.min(1.5, glowScale))
	);

	const hr = Math.min(255, Math.round(r + (255 - r) * flash * 0.95));
	const hg = Math.min(255, Math.round(g + (255 - g) * flash * 0.95));
	const hb = Math.min(255, Math.round(b + (255 - b) * flash * 0.95));

	// Bordures nettement plus claires que l'intérieur (mélange lumineux pour liseré / effet Fresnel)
	const rimFactor = 0.58 + flash * 0.32;
	const rimR = Math.min(255, Math.round(r + (255 - r) * rimFactor));
	const rimG = Math.min(255, Math.round(g + (255 - g) * rimFactor));
	const rimB = Math.min(255, Math.round(b + (255 - b) * rimFactor));
	const rimLight = `rgb(${rimR}, ${rimG}, ${rimB})`;
	const rimVeil = (alpha: number) => `rgba(${rimR}, ${rimG}, ${rimB}, ${Math.max(0, Math.min(1, alpha))})`;

	// Pour les morceaux mélancoliques/mystiques (valence < 0.5), les voiles sont plus profonds et veloutés
	const veilDepthFactor = valence < 0.5 ? 1.0 + (0.5 - valence) * 0.25 : 1.0;

	return {
		r,
		g,
		b,
		punch: effectivePunch,
		valence,
		energy,
		solid: `rgb(${r}, ${g}, ${b})`,
		glow: `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, (0.4 + bassEnergy * 0.45 + effectivePunch * 0.35 + (energy - 0.5) * 0.15) * glowScale))})`,
		highlight: `rgb(${hr}, ${hg}, ${hb})`,
		rimLight,
		rimVeil,
		veil: (alpha: number) =>
			`rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha * veilDepthFactor * Math.min(1.4, glowScale)))})`,
		radialGrad: (
			ctx: CanvasRenderingContext2D,
			cx: number,
			cy: number,
			r1: number,
			r2: number,
			a1 = 0.25,
			a2 = 0
		) => {
			const grad = ctx.createRadialGradient(cx, cy, Math.max(0, r1), cx, cy, Math.max(1, r2));
			grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${Math.min(1, a1 * veilDepthFactor)})`);
			grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${a2})`);
			return grad;
		}
	};
}

export function getHarmonicPalette(
	colorInfo: { r: number; g: number; b: number },
	bassEnergy: number,
	punch = 0,
	valence = 0.5,
	energy = 0.5
) {
	const p = getThemePalette(colorInfo, bassEnergy, punch, valence, energy);
	return {
		primary: { css: p.solid, glowCss: p.glow, r: p.r, g: p.g, b: p.b },
		secondary: { css: p.veil(0.75), glowCss: p.glow, r: p.r, g: p.g, b: p.b },
		accent: { css: p.highlight, glowCss: p.glow, r: p.r, g: p.g, b: p.b }
	};
}

export function getLuminousColor(
	color: { r: number; g: number; b: number },
	bassEnergy: number,
	extraWhite = 0
): { css: string; glowCss: string; r: number; g: number; b: number } {
	const boost = Math.max(0, Math.min(1, bassEnergy * 1.55 + extraWhite));
	const r = Math.min(255, Math.round(color.r + (255 - color.r) * boost * 0.75));
	const g = Math.min(255, Math.round(color.g + (255 - color.g) * boost * 0.75));
	const b = Math.min(255, Math.round(color.b + (255 - color.b) * boost * 0.75));
	return {
		css: `rgb(${r}, ${g}, ${b})`,
		glowCss: `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(1, 0.45 + bassEnergy * 0.55)})`,
		r,
		g,
		b
	};
}
