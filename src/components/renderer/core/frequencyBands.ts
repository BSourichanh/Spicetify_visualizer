import { AudioFeatures } from "./audioFeatures";
import { binarySearchIndex, decibelsToAmplitude } from "../../../math";

export type ExtractedFrequencyBands = {
	subBass: number; // 20 - 60 Hz: infrabasses, 808
	kick: number; // 60 - 250 Hz: grosse caisse, punch d'impact
	snare: number; // 250 - 800 Hz: caisse claire, claps, bas-médiums
	vocal: number; // 800 - 3000 Hz: voix, mélodies lead, guitares/synthés
	presence: number; // 3000 - 6000 Hz: clarté, attaque des cordes et peaux
	treble: number; // 6000 - 16000 Hz: charlestons, cymbales, souffle
	channels: number[]; // 36 canaux lissés pour le rendu du spectre (0.0 à 1.0)
	peaks: number[]; // 36 crêtes flottantes
};

const NUM_CHANNELS = 36;
const smoothedChannels: number[] = new Array(NUM_CHANNELS).fill(0.04);
const peaks: number[] = new Array(NUM_CHANNELS).fill(0.04);
const peakVelocities: number[] = new Array(NUM_CHANNELS).fill(0);
let lastTimestamp = 0;

/**
 * Analyseur multi-bandes haute fidélité.
 * Découpe avec précision l'audio Spotify en 6 bandes fondamentales
 * et génère 36 canaux de spectre avec physique d'attaque et de relâchement analogique.
 */
export function extractFrequencyBands(
	analysis: SpotifyAudioAnalysis | undefined,
	progress: number,
	features: AudioFeatures
): ExtractedFrequencyBands {
	const now = performance.now();
	const isPlaying = features.isPlaying ?? true;
	const dt = lastTimestamp > 0 && isPlaying ? Math.min(0.08, (now - lastTimestamp) / 1000) : 0;
	lastTimestamp = now;

	// Si en pause, on retourne l'état actuel figé
	if (!isPlaying || !analysis?.segments || analysis.segments.length === 0) {
		return {
			subBass: isPlaying ? features.bassEnergy * 0.6 : 0,
			kick: isPlaying ? features.punch : 0,
			snare: isPlaying ? features.midEnergy * 0.5 : 0,
			vocal: isPlaying ? features.midEnergy * 0.7 : 0,
			presence: isPlaying ? features.trebleEnergy * 0.6 : 0,
			treble: isPlaying ? features.trebleEnergy : 0,
			channels: [...smoothedChannels],
			peaks: [...peaks]
		};
	}

	// 1. Recherche du segment temporel actif
	const segIndex = Math.max(
		0,
		Math.min(
			analysis.segments.length - 1,
			binarySearchIndex(analysis.segments, s => s.start, progress)
		)
	);
	const segment = analysis.segments[segIndex];
	const pitches = segment?.pitches ?? [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
	const timbre = segment?.timbre ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

	// Calcul de l'amplitude instantanée à l'intérieur du segment
	const segTime = Math.max(0, progress - segment.start);
	const maxTime = Math.max(0.02, segment.loudness_max_time ?? 0.06);
	let currentLoudnessDb = segment.loudness_start;
	if (segTime <= maxTime) {
		const ratio = segTime / maxTime;
		currentLoudnessDb = segment.loudness_start + (segment.loudness_max - segment.loudness_start) * ratio;
	} else {
		const remDuration = Math.max(0.02, segment.duration - maxTime);
		const ratio = Math.min(1.0, (segTime - maxTime) / remDuration);
		currentLoudnessDb = segment.loudness_max + (segment.loudness_end - segment.loudness_max) * ratio;
	}
	const instAmp = decibelsToAmplitude(currentLoudnessDb);

	// 2. Détection physique des 6 bandes acoustiques clés
	// A. Sub-bass (20 - 60 Hz) : Infrabasse & 808
	const subCentroidWeight = Math.max(0, (-timbre[1] - 5) / 45); // Centroïde négatif = basses profondes
	const subTimbreWeight = Math.max(0, (timbre[4] + 15) / 50);
	const subBass = Math.min(
		1.0,
		(features.bassEnergy * 0.45 + instAmp * 0.3 + subCentroidWeight * 0.4 + subTimbreWeight * 0.25) *
			(1.0 + features.punch * 0.25)
	);

	// B. Kick / Punch (60 - 250 Hz) : Attaque percutante de la grosse caisse
	const isFastAttack = (segment.loudness_max_time ?? 0.08) < 0.095;
	const attackRiseDb = Math.max(0, segment.loudness_max - segment.loudness_start);
	const normAttack = Math.min(1.0, attackRiseDb / 18);
	const kick = Math.min(
		1.0,
		features.punch * 0.72 +
			(isFastAttack ? normAttack * 0.48 : 0) +
			(features.beatIntensity > 0.35 ? features.beatIntensity * 0.3 : 0)
	);

	// C. Snare / Low-Mids (250 - 800 Hz) : Caisses claires, claps, corps des rythmiques
	const noiseFlatness = Math.max(0, Math.min(1.0, (timbre[2] + 12) / 38)); // Bruit percussif / timbre de caisse claire
	const midCentroid = Math.max(0, 1.0 - Math.abs(timbre[1] - 15) / 35);
	const snare = Math.min(
		1.0,
		(isFastAttack ? normAttack * 0.42 : 0) +
			noiseFlatness * 0.42 +
			midCentroid * 0.28 +
			features.transientEnergy * 0.35
	);

	// D. Vocals / Mids (800 - 3000 Hz) : Voix humaine, synthés mélodiques, guitares
	const maxPitch = Math.max(...pitches);
	const avgPitch = pitches.reduce((a, b) => a + b, 0) / 12;
	const pitchContrast = Math.max(0, maxPitch - avgPitch); // Clarté d'une note de voix vs bruit blanc
	const isSustained = (segment.loudness_max_time ?? 0.08) > 0.08;
	const vocal = Math.min(1.0, features.midEnergy * 0.42 + pitchContrast * 0.45 + (isSustained ? instAmp * 0.32 : 0));

	// E. Presence / High-Mids (3000 - 6000 Hz) : Attaque de médiator, claquant
	const highCentroid = Math.max(0, Math.min(1.0, (timbre[1] - 18) / 48));
	const presence = Math.min(1.0, highCentroid * 0.52 + features.trebleEnergy * 0.32 + features.transientEnergy * 0.3);

	// F. Treble / Air (6000 - 16000 Hz) : Charlestons (hi-hats), cymbales, brillance cristalline
	const airCentroid = Math.max(0, Math.min(1.0, (timbre[1] - 38) / 58));
	const treble = Math.min(1.0, features.trebleEnergy * 0.62 + airCentroid * 0.42 + (instAmp > 0.15 ? 0.12 : 0));

	// 3. Distribution harmonieuse sur les 36 canaux du spectre
	const targetChannels: number[] = new Array(NUM_CHANNELS).fill(0);

	for (let ch = 0; ch < NUM_CHANNELS; ch++) {
		const norm = ch / (NUM_CHANNELS - 1); // 0.0 (sub) à 1.0 (extrême aigu)
		let val = 0.03;

		if (ch < 6) {
			// Sub-Bass (canaux 0 à 5)
			const pIdx = ch % 4;
			const subMod = 0.8 + pitches[pIdx] * 0.35;
			val = subBass * subMod;
		} else if (ch < 12) {
			// Kick & Punch (canaux 6 à 11)
			const pIdx = (ch - 6) % 6;
			const kickMod = 0.82 + pitches[pIdx] * 0.3;
			val = kick * kickMod;
		} else if (ch < 18) {
			// Snare & Low-Mids (canaux 12 à 17)
			const pIdx = (ch - 12) % 6;
			const snareMod = 0.78 + pitches[pIdx] * 0.32;
			val = snare * snareMod;
		} else if (ch < 26) {
			// Vocals & Melody (canaux 18 à 25 : les 12 demi-tons de la voix/mélodie)
			const pitchIdx = (ch - 18) % 12;
			const voiceTone = pitches[pitchIdx];
			val = vocal * (0.65 + voiceTone * 0.55);
		} else if (ch < 31) {
			// Presence & Attack (canaux 26 à 30)
			val = presence * (0.8 + pitches[ch % 12] * 0.25);
		} else {
			// Treble & Hi-Hats (canaux 31 à 35)
			val = treble * (0.85 + Math.sin(now * 0.01 + ch) * 0.12);
		}

		targetChannels[ch] = Math.max(0.03, Math.min(1.0, val));
	}

	// 4. Balistique analogique : Attaque ultra-rapide (26/s) et descente soyeuse (7/s)
	for (let i = 0; i < NUM_CHANNELS; i++) {
		const target = targetChannels[i];
		if (target > smoothedChannels[i]) {
			smoothedChannels[i] += (target - smoothedChannels[i]) * Math.min(1.0, dt * 26.0);
		} else {
			smoothedChannels[i] += (target - smoothedChannels[i]) * Math.min(1.0, dt * 7.0);
		}

		// Crêtes flottantes (floating peaks)
		if (smoothedChannels[i] > peaks[i]) {
			peaks[i] = smoothedChannels[i];
			peakVelocities[i] = 0;
		} else {
			peakVelocities[i] += dt * 0.65;
			peaks[i] = Math.max(0.02, peaks[i] - peakVelocities[i] * dt);
		}
	}

	return {
		subBass,
		kick,
		snare,
		vocal,
		presence,
		treble,
		channels: [...smoothedChannels],
		peaks: [...peaks]
	};
}
