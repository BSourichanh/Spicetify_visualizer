import { AudioFeatures } from "./audioFeatures";
import { binarySearchIndex, decibelsToAmplitude } from "../../../math";
import { dspAudioEngine } from "./dspAudioEngine";

export type ExtractedFrequencyBands = {
	subBass: number; // 20 - 60 Hz: infrabasses, 808
	kick: number; // 60 - 250 Hz: grosse caisse, punch d'impact
	snare: number; // 250 - 800 Hz: caisse claire, claps, bas-médiums
	vocal: number; // 800 - 3000 Hz: voix, mélodies lead, guitares/synthés
	presence: number; // 3000 - 6000 Hz: clarté, attaque des cordes et peaux
	treble: number; // 6000 - 16000 Hz: charlestons, cymbales, souffle
	channels: number[]; // 36 canaux lissés mix mono (0.0 à 1.0)
	peaks: number[]; // 36 crêtes flottantes mix mono
	channelsLeft: number[]; // 36 canaux stéréo gauche
	channelsRight: number[]; // 36 canaux stéréo droite
	peaksLeft: number[]; // 36 crêtes flottantes gauche
	peaksRight: number[]; // 36 crêtes flottantes droite
};

const NUM_CHANNELS = 36;
const smoothedChannels: number[] = new Array(NUM_CHANNELS).fill(0.04);
const smoothedChannelsLeft: number[] = new Array(NUM_CHANNELS).fill(0.04);
const smoothedChannelsRight: number[] = new Array(NUM_CHANNELS).fill(0.04);

const peaks: number[] = new Array(NUM_CHANNELS).fill(0.04);
const peaksLeft: number[] = new Array(NUM_CHANNELS).fill(0.04);
const peaksRight: number[] = new Array(NUM_CHANNELS).fill(0.04);

const peakVelocities: number[] = new Array(NUM_CHANNELS).fill(0);
const peakVelocitiesLeft: number[] = new Array(NUM_CHANNELS).fill(0);
const peakVelocitiesRight: number[] = new Array(NUM_CHANNELS).fill(0);
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
	if (!isPlaying) {
		return {
			subBass: 0,
			kick: 0,
			snare: 0,
			vocal: 0,
			presence: 0,
			treble: 0,
			channels: [...smoothedChannels],
			peaks: [...peaks],
			channelsLeft: [...smoothedChannelsLeft],
			channelsRight: [...smoothedChannelsRight],
			peaksLeft: [...peaksLeft],
			peaksRight: [...peaksRight]
		};
	}

	let pitches: number[];
	let timbre: number[];
	let instAmp: number;
	let isFastAttack = features.punch > 0.45;
	let normAttack = features.punch;
	let isSustained = features.energy > 0.4;

	if (analysis?.segments && analysis.segments.length > 0) {
		// 1. Recherche du segment temporel actif
		const segIndex = Math.max(
			0,
			Math.min(
				analysis.segments.length - 1,
				binarySearchIndex(analysis.segments, s => s.start, progress)
			)
		);
		const segment = analysis.segments[segIndex];
		pitches = segment?.pitches ?? [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
		timbre = segment?.timbre ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

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
		instAmp = decibelsToAmplitude(currentLoudnessDb);

		isFastAttack = (segment.loudness_max_time ?? 0.08) < 0.095;
		const attackRiseDb = Math.max(0, segment.loudness_max - segment.loudness_start);
		normAttack = Math.min(1.0, attackRiseDb / 18);
		isSustained = (segment.loudness_max_time ?? 0.08) > 0.08;
	} else {
		// Repli dynamique réactif : synthèse harmonique fluide à partir des métriques audio réelles
		const t = features.energyTime;
		pitches = [
			0.2 + 0.3 * Math.sin(t * 1.7),
			0.3 + 0.4 * Math.sin(t * 2.3 + 1),
			0.25 + 0.35 * Math.cos(t * 1.9 + 2),
			0.4 + 0.4 * Math.sin(t * 3.1 + 0.5),
			0.2 + 0.3 * Math.cos(t * 2.7 + 1.5),
			0.5 + 0.3 * Math.sin(t * 1.5 + 3),
			0.3 + 0.4 * Math.cos(t * 2.1 + 0.8),
			0.2 + 0.35 * Math.sin(t * 2.9 + 2.2),
			0.35 + 0.35 * Math.cos(t * 1.8 + 1.2),
			0.25 + 0.4 * Math.sin(t * 2.4 + 0.3),
			0.4 + 0.3 * Math.cos(t * 3.3 + 2.7),
			0.3 + 0.35 * Math.sin(t * 2.0 + 1.9)
		];
		timbre = [
			features.amplitude * 40 - 20,
			(features.trebleEnergy - features.bassEnergy) * 30,
			features.punch * 20,
			features.midEnergy * 15,
			features.bassEnergy * 25 - 10,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		];
		instAmp = Math.max(0.05, features.amplitude);
	}

	// 2. Détection physique des 6 bandes acoustiques clés
	// Pondération globale par l'amplitude réelle pour préserver la sérénité des morceaux calmes
	const ampGate = Math.max(0.04, Math.min(1.0, features.amplitude * 1.35));

	// A. Sub-bass (20 - 60 Hz) : Infrabasse & 808
	const subCentroidWeight = Math.max(0, (-timbre[1] - 5) / 45); // Centroïde négatif = basses profondes
	const subTimbreWeight = Math.max(0, (timbre[4] + 15) / 50);
	const subBass = Math.min(
		1.0,
		ampGate *
			(features.bassEnergy * 0.65 + subCentroidWeight * 0.25 + subTimbreWeight * 0.2) *
			(1.0 + features.punch * 0.25)
	);

	// B. Kick / Punch (60 - 250 Hz) : Attaque percutante de la grosse caisse
	const kick = Math.min(
		1.0,
		ampGate *
			(features.punch * 0.72 +
				(isFastAttack ? normAttack * 0.42 : 0) +
				(features.beatIntensity > 0.35 ? features.beatIntensity * 0.25 : 0))
	);

	// C. Snare / Low-Mids (250 - 800 Hz) : Caisses claires, claps, corps des rythmiques
	const noiseFlatness = Math.max(0, Math.min(1.0, (timbre[2] + 12) / 38)); // Bruit percussif / timbre de caisse claire
	const midCentroid = Math.max(0, 1.0 - Math.abs(timbre[1] - 15) / 35);
	const snare = Math.min(
		1.0,
		ampGate *
			((isFastAttack ? normAttack * 0.38 : 0) +
				noiseFlatness * 0.38 +
				midCentroid * 0.24 +
				features.transientEnergy * 0.35)
	);

	// D. Vocals / Mids (800 - 3000 Hz) : Voix humaine, synthés mélodiques, guitares
	const maxPitch = Math.max(...pitches);
	const avgPitch = pitches.reduce((a, b) => a + b, 0) / 12;
	const pitchContrast = Math.max(0, maxPitch - avgPitch); // Clarté d'une note de voix vs bruit blanc
	const vocal = Math.min(
		1.0,
		ampGate * (features.midEnergy * 0.45 + pitchContrast * 0.4 + (isSustained ? instAmp * 0.25 : 0))
	);

	// E. Presence / High-Mids (3000 - 6000 Hz) : Attaque de médiator, claquant
	const highCentroid = Math.max(0, Math.min(1.0, (timbre[1] - 18) / 48));
	const presence = Math.min(
		1.0,
		ampGate * (highCentroid * 0.45 + features.trebleEnergy * 0.35 + features.transientEnergy * 0.25)
	);

	// F. Treble / Air (6000 - 16000 Hz) : Charlestons (hi-hats), cymbales, brillance cristalline
	const airCentroid = Math.max(0, Math.min(1.0, (timbre[1] - 38) / 58));
	const treble = Math.min(
		1.0,
		ampGate * (features.trebleEnergy * 0.6 + airCentroid * 0.35 + (instAmp > 0.15 ? 0.1 : 0))
	);

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

	// 4. Balistique analogique : Attaque ultra-rapide et descente soyeuse exponentielle
	const safeDt = Math.max(0.008, Math.min(0.08, dt));
	const attackRate = 1.0 - Math.exp(-safeDt * 28.0);
	const releaseRate = 1.0 - Math.exp(-safeDt * 7.5);

	// Si le moteur DSP est actif, échantillonner directement le spectre FFT 2048 points en stéréo
	if (dspAudioEngine.isActive()) {
		dspAudioEngine.fillSpectrumStereo(smoothedChannelsLeft, smoothedChannelsRight, NUM_CHANNELS);
		for (let i = 0; i < NUM_CHANNELS; i++) {
			smoothedChannels[i] = (smoothedChannelsLeft[i] + smoothedChannelsRight[i]) * 0.5;
		}
	} else {
		for (let i = 0; i < NUM_CHANNELS; i++) {
			const target = targetChannels[i];
			// Moduler légèrement gauche / droite pour créer de la largeur stéréo naturelle même sans DSP
			const stereoDiff = Math.sin(progress * 2.5 + i * 0.4) * 0.12 * (i > 8 ? 1.0 : 0.35);
			const targetL = Math.max(0.03, Math.min(1.0, target * (1.0 - stereoDiff)));
			const targetR = Math.max(0.03, Math.min(1.0, target * (1.0 + stereoDiff)));

			if (target > smoothedChannels[i]) {
				smoothedChannels[i] += (target - smoothedChannels[i]) * attackRate;
			} else {
				smoothedChannels[i] += (target - smoothedChannels[i]) * releaseRate;
			}
			if (targetL > smoothedChannelsLeft[i]) {
				smoothedChannelsLeft[i] += (targetL - smoothedChannelsLeft[i]) * attackRate;
			} else {
				smoothedChannelsLeft[i] += (targetL - smoothedChannelsLeft[i]) * releaseRate;
			}
			if (targetR > smoothedChannelsRight[i]) {
				smoothedChannelsRight[i] += (targetR - smoothedChannelsRight[i]) * attackRate;
			} else {
				smoothedChannelsRight[i] += (targetR - smoothedChannelsRight[i]) * releaseRate;
			}
		}
	}

	for (let i = 0; i < NUM_CHANNELS; i++) {
		// Crêtes flottantes mono
		if (smoothedChannels[i] > peaks[i]) {
			peaks[i] = smoothedChannels[i];
			peakVelocities[i] = 0;
		} else {
			peakVelocities[i] += safeDt * 0.65;
			peaks[i] = Math.max(0.02, peaks[i] - peakVelocities[i] * safeDt);
		}

		// Crêtes flottantes gauche
		if (smoothedChannelsLeft[i] > peaksLeft[i]) {
			peaksLeft[i] = smoothedChannelsLeft[i];
			peakVelocitiesLeft[i] = 0;
		} else {
			peakVelocitiesLeft[i] += safeDt * 0.65;
			peaksLeft[i] = Math.max(0.02, peaksLeft[i] - peakVelocitiesLeft[i] * safeDt);
		}

		// Crêtes flottantes droite
		if (smoothedChannelsRight[i] > peaksRight[i]) {
			peaksRight[i] = smoothedChannelsRight[i];
			peakVelocitiesRight[i] = 0;
		} else {
			peakVelocitiesRight[i] += safeDt * 0.65;
			peaksRight[i] = Math.max(0.02, peaksRight[i] - peakVelocitiesRight[i] * safeDt);
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
		peaks: [...peaks],
		channelsLeft: [...smoothedChannelsLeft],
		channelsRight: [...smoothedChannelsRight],
		peaksLeft: [...peaksLeft],
		peaksRight: [...peaksRight]
	};
}
