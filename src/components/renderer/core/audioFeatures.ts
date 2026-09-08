import {
	binarySearchIndex,
	decibelsToAmplitude,
	integrateLinearSegment,
	sampleAccumulatedIntegral,
	sampleAmplitudeMovingAverage
} from "../../../math";
import { DEFAULT_COLOR } from "../../../defs";

export type AudioFeatures = {
	amplitude: number;
	smoothAmp: number;
	bassEnergy: number;
	midEnergy: number;
	trebleEnergy: number;
	vocalEnergy: number;
	transientEnergy: number;
	pitches: number[];
	beatIntensity: number;
	punch: number;
	spectralCentroid: number;
	tempo: number;
	energyTime: number;
};

export function getThemeColor(color: any): { css: string; r: number; g: number; b: number } {
	if (color?.rgb && typeof color.rgb.r === "number") {
		const r = Math.round(color.rgb.r);
		const g = Math.round(color.rgb.g);
		const b = Math.round(color.rgb.b);
		return { css: `rgb(${r}, ${g}, ${b})`, r, g, b };
	}

	if (typeof color?.toCSS === "function") {
		try {
			const css = color.toCSS(0);
			if (css) return { css, r: 83, g: 83, b: 83 };
		} catch {}
	}

	if (typeof color === "string" && color.startsWith("#")) {
		const hex = color.slice(1);
		if (hex.length === 6) {
			const r = parseInt(hex.slice(0, 2), 16);
			const g = parseInt(hex.slice(2, 4), 16);
			const b = parseInt(hex.slice(4, 6), 16);
			return { css: color, r, g, b };
		}
		return { css: color, r: 83, g: 83, b: 83 };
	}

	return { css: DEFAULT_COLOR, r: 83, g: 83, b: 83 };
}

export function buildAmplitudeCurve(analysis?: SpotifyAudioAnalysis): CurveEntry[] {
	if (!analysis?.segments || analysis.segments.length === 0) {
		return [{ x: 0, y: 0 }];
	}

	const segments = analysis.segments;
	const curve: CurveEntry[] = segments.flatMap(segment =>
		segment.loudness_max_time
			? [
					{ x: segment.start, y: decibelsToAmplitude(segment.loudness_start) },
					{
						x: segment.start + segment.loudness_max_time,
						y: decibelsToAmplitude(segment.loudness_max)
					}
				]
			: [{ x: segment.start, y: decibelsToAmplitude(segment.loudness_start) }]
	);

	if (segments.length) {
		curve[0].accumulatedIntegral = 0;
		for (let i = 1; i < curve.length; i++) {
			const prev = curve[i - 1];
			const curr = curve[i];
			curr.accumulatedIntegral = (prev.accumulatedIntegral ?? 0) + integrateLinearSegment(prev, curr);
		}

		const lastSegment = segments[segments.length - 1];
		curve.push({
			x: lastSegment.start + lastSegment.duration,
			y: decibelsToAmplitude(lastSegment.loudness_end)
		});
	}

	return curve;
}

export function extractAudioFeatures(
	analysis: SpotifyAudioAnalysis | undefined,
	amplitudeCurve: CurveEntry[],
	progress: number
): AudioFeatures {
	const safeProgress = Number.isFinite(progress) ? Math.max(0, progress) : 0;

	let rawAmp = 0;
	let rawSmooth = 0;
	if (amplitudeCurve && amplitudeCurve.length > 1) {
		try {
			const a = sampleAmplitudeMovingAverage(amplitudeCurve, safeProgress, 0.04);
			if (Number.isFinite(a)) rawAmp = Math.max(0, a);
			const sa = sampleAmplitudeMovingAverage(amplitudeCurve, safeProgress, 0.28);
			if (Number.isFinite(sa)) rawSmooth = Math.max(0, sa);
		} catch {}
	}

	const amplitude = Math.max(0, Math.min(1, Math.pow(rawAmp, 0.6) * 1.6 - 0.08));
	const smoothAmp = Math.max(0, Math.min(1, Math.pow(rawSmooth, 0.6) * 1.5 - 0.08));

	let pitches = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
	let timbre = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	let segTransient = 0;
	if (analysis?.segments && analysis.segments.length > 0) {
		try {
			const segIndex = Math.max(
				0,
				Math.min(
					analysis.segments.length - 1,
					binarySearchIndex(analysis.segments, s => s.start, safeProgress)
				)
			);
			const segment = analysis.segments[segIndex];
			if (segment?.pitches && Array.isArray(segment.pitches)) {
				pitches = segment.pitches.map(p => {
					if (!Number.isFinite(p)) return 0.1;
					return Math.max(0, Math.min(1, Math.pow(Math.max(0, p), 1.6)));
				});
			}
			if (segment?.timbre && Array.isArray(segment.timbre)) {
				timbre = segment.timbre.map(t => (Number.isFinite(t) ? t : 0));
			}

			// Attaque transitoire instantanée sur l'analyse de segment Spotify (kicks / drums)
			const segTime = safeProgress - segment.start;
			const maxTime = Math.max(0.02, segment.loudness_max_time ?? 0.06);
			if (segTime >= 0 && segTime < maxTime + 0.14) {
				const attackDb = Math.max(0, (segment.loudness_max ?? -20) - (segment.loudness_start ?? -40));
				const normAttack = Math.min(1, attackDb / 22);
				const decay = Math.max(0, 1 - segTime / (maxTime + 0.14));
				segTransient = normAttack * decay;
			}
		} catch {}
	}

	let beatPulse = 0;
	let beatPunch = 0;
	if (analysis?.beats && analysis.beats.length > 0) {
		try {
			const beatIndex = Math.max(
				0,
				Math.min(
					analysis.beats.length - 1,
					binarySearchIndex(analysis.beats, b => b.start, safeProgress)
				)
			);
			const currentBeat = analysis.beats[beatIndex];
			if (currentBeat) {
				const timeSinceBeat = safeProgress - currentBeat.start;
				const dur = Math.max(0.2, currentBeat.duration || 0.5);
				if (timeSinceBeat >= 0 && timeSinceBeat < dur) {
					const conf = currentBeat.confidence ?? 0.85;
					// Impact sec et percutant sur les 120 premières ms (vrai punch physique)
					const punchDur = Math.min(0.13, dur * 0.35);
					if (timeSinceBeat < punchDur) {
						beatPunch = Math.pow(1 - timeSinceBeat / punchDur, 1.8) * conf;
					}
					// Décroissance résonante de la basse sur le reste du beat
					beatPulse = Math.pow(1 - timeSinceBeat / dur, 2.2) * conf;
				}
			}
		} catch {}
	}

	// 1. Analyse multi-bande spectrale basée sur les chroma et le timbre Spotify
	const chromaBass = (pitches[0] + pitches[1] + pitches[2] + pitches[11]) / 4;
	const subTimbre = Math.max(0, Math.min(1, ((70 - timbre[1]) / 120) * 0.6 + ((timbre[4] + 25) / 50) * 0.4));

	// 2. Médiums et voix
	const chromaMid = (pitches[2] + pitches[3] + pitches[4] + pitches[5] + pitches[6]) / 5;

	// 3. Aigus et brillance cristalline
	const chromaTreble = (pitches[7] + pitches[8] + pitches[9] + pitches[10]) / 4;
	const spectralCentroid = Math.max(0, Math.min(1, (timbre[1] + 50) / 110));

	// Punch : impact physique instantané (kick / caisse claire / drops)
	const punch = Math.max(0, Math.min(1, beatPunch * 0.72 + segTransient * 0.48));

	// Bass Energy : Juste milieu dynamique (plage 0.12 repos -> 1.0 kick fort, sans blocage mou)
	const rawBass = amplitude * 0.34 + beatPulse * 0.32 + punch * 0.28 + subTimbre * 0.14 + chromaBass * 0.12;
	const bassEnergy = Math.max(0.12, Math.min(1.0, Math.pow(rawBass, 0.92) * 1.32));

	// Mid Energy : harmoniques mélodiques & corps musical (plage 0.15 -> 0.95)
	const rawMid = amplitude * 0.4 + chromaMid * 0.35 + smoothAmp * 0.25;
	const midEnergy = Math.max(0.15, Math.min(0.95, rawMid * 1.22));

	// Treble Energy : étincelles, brillance et cils vibratiles (plage 0.10 -> 0.90)
	const rawTreble = amplitude * 0.28 + chromaTreble * 0.36 + spectralCentroid * 0.36;
	const trebleEnergy = Math.max(0.1, Math.min(0.9, rawTreble * 1.18));

	const vocalEnergy = midEnergy * 0.75 + trebleEnergy * 0.25;
	const transientEnergy = Math.max(0, amplitude - smoothAmp);
	const tempo = Number.isFinite(analysis?.track?.tempo) ? analysis!.track.tempo : 120;

	// Intégration temporelle continue et fluide (strictement monotone, sans téléportation ni à-coups)
	let energyTime = safeProgress;
	if (amplitudeCurve && amplitudeCurve.length > 1) {
		try {
			const integral = sampleAccumulatedIntegral(amplitudeCurve, safeProgress);
			if (Number.isFinite(integral)) {
				energyTime = safeProgress * 0.7 + integral * 0.35;
			}
		} catch {}
	}

	return {
		amplitude,
		smoothAmp,
		bassEnergy,
		midEnergy,
		trebleEnergy,
		vocalEnergy,
		transientEnergy,
		pitches,
		beatIntensity: Math.max(beatPulse, beatPunch),
		punch,
		spectralCentroid,
		tempo,
		energyTime
	};
}
