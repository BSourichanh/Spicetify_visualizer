/**
 * 🔬 DSP AUDIO ENGINE — MÉTHODE C
 *
 * Moteur d'analyse musicale et de traitement numérique du signal (DSP) en temps réel.
 * Fonctionne de façon autonome en dehors de l'API Spotify :
 * - Capture audio Web Audio API (Microphone, Stereo Mix, Loopback de la carte son).
 * - Transformée de Fourier Rapide (FFT 2048 points).
 * - Extraction des 12 demi-tons de la gamme chromatique (Chroma 12-pitch).
 * - Détection des attaques et des kicks par flux spectral rectifié (Spectral Flux & Onset).
 * - Décomposition d'énergie multi-bandes (Sub-bass, Kick, Snare, Vocals, Presence, Treble).
 * - Estimation adaptative du tempo (BPM Tracker & Phase).
 * - Zéro allocation dynamique par trame (Object Pool & TypedArrays).
 */

import { AudioFeatures } from "./audioFeatures";

export type DspAnalysisResult = {
	isActive: boolean;
	sampleRate: number;
	rms: number;
	amplitude: number;
	smoothAmp: number;
	spectralFlux: number;
	spectralCentroid: number;
	isOnset: boolean;
	punch: number;
	subBass: number;
	kick: number;
	snare: number;
	vocal: number;
	presence: number;
	treble: number;
	chroma: Float32Array; // 12 notes (0 = C, 1 = C#, ..., 9 = A, 11 = B)
	detectedBpm: number;
	beatPulse: number;
};

export class DspAudioEngine {
	private static instance: DspAudioEngine | null = null;

	// Web Audio Nodes
	private audioCtx: AudioContext | null = null;
	private analyserNode: AnalyserNode | null = null;
	private mediaStream: MediaStream | null = null;
	private sourceNode: MediaStreamAudioSourceNode | null = null;

	// État
	private isCapturing = false;
	private currentDeviceId = "";
	private lastProcessTime = 0;
	private detectedBpm = 124;
	private beatPhase = 0;
	private lastOnsetTime = 0;
	private onsetIntervals: number[] = [];
	private runningAmp = 0;
	private runningPunch = 0;

	// Buffers pré-alloués (0 allocation par frame)
	private static readonly FFT_SIZE = 2048;
	private static readonly BIN_COUNT = DspAudioEngine.FFT_SIZE / 2; // 1024 bins
	private readonly timeData = new Float32Array(DspAudioEngine.FFT_SIZE);
	private readonly freqData = new Float32Array(DspAudioEngine.BIN_COUNT);
	private readonly prevFreqData = new Float32Array(DspAudioEngine.BIN_COUNT);
	private readonly chromaAccumulator = new Float32Array(12);
	private readonly smoothedChroma = new Float32Array(12);
	private readonly binToChromaMap = new Int8Array(DspAudioEngine.BIN_COUNT);
	private readonly binWeights = new Float32Array(DspAudioEngine.BIN_COUNT);

	// Historique du flux spectral pour seuil adaptatif
	private static readonly FLUX_HIST_SIZE = 40;
	private readonly fluxHistory = new Float32Array(DspAudioEngine.FLUX_HIST_SIZE);
	private fluxHistIndex = 0;

	// Résultat exportable réutilisable (Flyweight / DTO)
	private readonly result: DspAnalysisResult = {
		isActive: false,
		sampleRate: 44100,
		rms: 0,
		amplitude: 0,
		smoothAmp: 0,
		spectralFlux: 0,
		spectralCentroid: 0.5,
		isOnset: false,
		punch: 0,
		subBass: 0,
		kick: 0,
		snare: 0,
		vocal: 0,
		presence: 0,
		treble: 0,
		chroma: new Float32Array(12),
		detectedBpm: 124,
		beatPulse: 0
	};

	public static getInstance(): DspAudioEngine {
		if (!DspAudioEngine.instance) {
			DspAudioEngine.instance = new DspAudioEngine();
		}
		return DspAudioEngine.instance;
	}

	private constructor() {
		this.initChromaMapping(44100);
	}

	/**
	 * Pré-calcule la table de projection des 1024 fréquences FFT vers les 12 demi-tons (Chroma)
	 */
	private initChromaMapping(sampleRate: number): void {
		const binWidth = sampleRate / DspAudioEngine.FFT_SIZE;
		// Fréquence de référence A4 = 440 Hz
		for (let i = 0; i < DspAudioEngine.BIN_COUNT; i++) {
			const freq = i * binWidth;
			if (freq < 27.5 || freq > 5000) {
				// En dehors de la tessiture musicale clé (A0 à C8)
				this.binToChromaMap[i] = -1;
				this.binWeights[i] = 0;
			} else {
				// Numéro de demi-ton continu (MIDI note)
				const midi = 12 * Math.log2(freq / 440) + 69;
				// Pitch class : 0 = C, 1 = C#, 2 = D, ..., 9 = A, 11 = B
				const pitchClass = Math.round(midi) % 12;
				this.binToChromaMap[i] = (pitchClass + 12) % 12;
				// Pondération en A (accentue les médiums audibles)
				const weight = Math.min(1.0, freq / 400) * Math.min(1.0, 3500 / Math.max(1, freq));
				this.binWeights[i] = weight;
			}
		}
	}

	/**
	 * Liste les périphériques audio d'entrée disponibles
	 */
	public async getAudioDevices(): Promise<MediaDeviceInfo[]> {
		try {
			if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
				return [];
			}
			const devices = await navigator.mediaDevices.enumerateDevices();
			return devices.filter(d => d.kind === "audioinput");
		} catch (e) {
			console.warn("[DSP Engine] Error enumerating audio devices:", e);
			return [];
		}
	}

	/**
	 * Démarre la capture audio en direct (Microphone, Stereo Mix ou Loopback)
	 */
	public async startCapture(deviceId?: string): Promise<boolean> {
		if (this.isCapturing && deviceId && deviceId === this.currentDeviceId) return true;
		if (this.isCapturing) {
			this.stopCapture();
		}

		try {
			if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
				console.warn("[DSP Engine] navigator.mediaDevices.getUserMedia n'est pas disponible.");
				return false;
			}

			const audioConstraints: MediaTrackConstraints = {
				echoCancellation: false,
				noiseSuppression: false,
				autoGainControl: false
			};
			if (deviceId) {
				audioConstraints.deviceId = { exact: deviceId };
			}

			const stream = await navigator.mediaDevices.getUserMedia({
				audio: audioConstraints
			});

			this.currentDeviceId = deviceId || "";
			this.mediaStream = stream;
			const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
			this.audioCtx = new AudioContextClass();

			if (this.audioCtx.state === "suspended") {
				await this.audioCtx.resume();
			}

			this.initChromaMapping(this.audioCtx.sampleRate);

			this.analyserNode = this.audioCtx.createAnalyser();
			this.analyserNode.fftSize = DspAudioEngine.FFT_SIZE;
			this.analyserNode.smoothingTimeConstant = 0.35;

			this.sourceNode = this.audioCtx.createMediaStreamSource(stream);
			this.sourceNode.connect(this.analyserNode);

			this.isCapturing = true;
			this.result.isActive = true;
			this.result.sampleRate = this.audioCtx.sampleRate;
			console.info(
				"[DSP Engine] Capture audio démarrée avec succès. Device:",
				deviceId || "default",
				"Sample rate:",
				this.audioCtx.sampleRate
			);
			return true;
		} catch (err) {
			console.warn("[DSP Engine] Impossible d'accéder au périphérique audio:", err);
			this.stopCapture();
			return false;
		}
	}

	/**
	 * Arrête la capture audio
	 */
	public stopCapture(): void {
		if (this.mediaStream) {
			this.mediaStream.getTracks().forEach(t => t.stop());
			this.mediaStream = null;
		}
		if (this.sourceNode) {
			this.sourceNode.disconnect();
			this.sourceNode = null;
		}
		if (this.audioCtx) {
			this.audioCtx.close().catch(() => {});
			this.audioCtx = null;
		}
		this.analyserNode = null;
		this.isCapturing = false;
		this.currentDeviceId = "";
		this.result.isActive = false;
		console.info("[DSP Engine] Capture audio arrêtée.");
	}

	public get capturing(): boolean {
		return this.isCapturing;
	}

	public get deviceId(): string {
		return this.currentDeviceId;
	}

	public isActive(): boolean {
		return this.isCapturing;
	}

	public getResult(): DspAnalysisResult {
		return this.result;
	}

	/**
	 * Analyse le flux audio actuel à 60 FPS (Zéro allocation)
	 */
	public processFrame(now = performance.now()): DspAnalysisResult {
		const dt = this.lastProcessTime > 0 ? Math.min(0.08, (now - this.lastProcessTime) / 1000) : 0.016;
		this.lastProcessTime = now;

		if (!this.isCapturing || !this.analyserNode) {
			// Mode passif : amortissement analogique doux
			this.result.punch *= 0.88;
			this.result.amplitude *= 0.88;
			this.result.smoothAmp *= 0.94;
			this.result.isOnset = false;
			return this.result;
		}

		// 1. Récupération des données temporelles et spectrales
		this.analyserNode.getFloatTimeDomainData(this.timeData);
		this.analyserNode.getFloatFrequencyData(this.freqData);

		// 2. Calcul du RMS (Root Mean Square) / Énergie instantanée
		let sumSquares = 0;
		for (let i = 0; i < DspAudioEngine.FFT_SIZE; i++) {
			const s = this.timeData[i];
			sumSquares += s * s;
		}
		const rms = Math.sqrt(sumSquares / DspAudioEngine.FFT_SIZE);
		const amp = Math.min(1.0, rms * 5.5); // Normalisation plus réactive vers [0.0, 1.0]

		this.runningAmp += (amp - this.runningAmp) * (amp > this.runningAmp ? 0.45 : 0.15);
		const smoothAmp = this.runningAmp;

		// 3. Décomposition fréquentielle multi-bandes & Flux spectral
		let subBassSum = 0;
		let kickSum = 0;
		let snareSum = 0;
		let vocalSum = 0;
		let presenceSum = 0;
		let trebleSum = 0;

		let spectralFlux = 0;
		let centroidNum = 0;
		let centroidDen = 0;

		// Réinitialisation de l'accumulateur Chroma
		this.chromaAccumulator.fill(0);

		const binWidth = (this.audioCtx?.sampleRate ?? 44100) / DspAudioEngine.FFT_SIZE;

		for (let i = 1; i < DspAudioEngine.BIN_COUNT; i++) {
			const db = this.freqData[i];
			// Convertit les décibels (-100 dB à 0 dB) en amplitude linéaire
			const mag = db > -85 ? Math.pow(10, (db + 6) / 20) : 0;
			const prevMag = this.prevFreqData[i];
			this.prevFreqData[i] = mag;

			// Flux spectral : demi-onde positive (énergie montante)
			const diff = mag - prevMag;
			if (diff > 0) {
				spectralFlux += diff;
			}

			// Centroïde spectral
			const freq = i * binWidth;
			centroidNum += freq * mag;
			centroidDen += mag;

			// Répartition multi-bandes
			if (freq < 60) subBassSum += mag;
			else if (freq < 250) kickSum += mag;
			else if (freq < 800) snareSum += mag;
			else if (freq < 3000) vocalSum += mag;
			else if (freq < 6000) presenceSum += mag;
			else if (freq < 16000) trebleSum += mag;

			// Accumulation Chroma
			const cIdx = this.binToChromaMap[i];
			if (cIdx >= 0) {
				this.chromaAccumulator[cIdx] += mag * this.binWeights[i];
			}
		}

		// Normalisation multi-bandes
		const subBass = Math.min(1.0, subBassSum * 2.8);
		const kick = Math.min(1.0, kickSum * 2.4);
		const snare = Math.min(1.0, snareSum * 2.8);
		const vocal = Math.min(1.0, vocalSum * 3.5);
		const presence = Math.min(1.0, presenceSum * 5.0);
		const treble = Math.min(1.0, trebleSum * 8.0);

		const centroid = centroidDen > 0.0001 ? Math.min(1.0, centroidNum / centroidDen / 7000) : 0.5;

		// 4. Détection d'Attaque / Onset adaptatif
		this.fluxHistory[this.fluxHistIndex] = spectralFlux;
		this.fluxHistIndex = (this.fluxHistIndex + 1) % DspAudioEngine.FLUX_HIST_SIZE;

		let fluxMean = 0;
		for (let h = 0; h < DspAudioEngine.FLUX_HIST_SIZE; h++) {
			fluxMean += this.fluxHistory[h];
		}
		fluxMean /= DspAudioEngine.FLUX_HIST_SIZE;

		const onsetThreshold = fluxMean * 1.55 + 0.015;
		const isOnset = spectralFlux > onsetThreshold && spectralFlux > 0.04;

		if (isOnset && now - this.lastOnsetTime > 160) {
			const intervalMs = now - this.lastOnsetTime;
			this.lastOnsetTime = now;

			// Tracker de tempo (BPM) par lissage des intervalles d'attaques
			if (intervalMs >= 240 && intervalMs <= 1200) {
				this.onsetIntervals.push(intervalMs);
				if (this.onsetIntervals.length > 8) {
					this.onsetIntervals.shift();
				}
				let avgInterval = 0;
				for (const intv of this.onsetIntervals) avgInterval += intv;
				avgInterval /= this.onsetIntervals.length;

				const instantBpm = 60000 / avgInterval;
				if (instantBpm >= 65 && instantBpm <= 185) {
					this.detectedBpm += (instantBpm - this.detectedBpm) * 0.2;
				}
			}

			// Punch impulsionnel
			this.runningPunch = Math.min(1.0, this.runningPunch + 0.75 + kick * 0.4);
		} else {
			this.runningPunch *= 0.86;
		}

		// Phase du beat synchronisé sur le BPM détecté
		const bps = this.detectedBpm / 60;
		this.beatPhase = (this.beatPhase + dt * bps) % 1.0;
		const beatPulse = Math.pow(Math.max(0, 1.0 - this.beatPhase * 2.0), 2.0);

		// 5. Normalisation des 12 Chromas
		let maxChroma = 0.001;
		for (let c = 0; c < 12; c++) {
			if (this.chromaAccumulator[c] > maxChroma) {
				maxChroma = this.chromaAccumulator[c];
			}
		}
		for (let c = 0; c < 12; c++) {
			const normVal = this.chromaAccumulator[c] / maxChroma;
			this.smoothedChroma[c] += (normVal - this.smoothedChroma[c]) * 0.25;
			this.result.chroma[c] = this.smoothedChroma[c];
		}

		// Remplissage du résultat DTO
		this.result.rms = rms;
		this.result.amplitude = amp;
		this.result.smoothAmp = smoothAmp;
		this.result.spectralFlux = spectralFlux;
		this.result.spectralCentroid = centroid;
		this.result.isOnset = isOnset;
		this.result.punch = this.runningPunch;
		this.result.subBass = subBass;
		this.result.kick = kick;
		this.result.snare = snare;
		this.result.vocal = vocal;
		this.result.presence = presence;
		this.result.treble = treble;
		this.result.detectedBpm = Math.round(this.detectedBpm);
		this.result.beatPulse = beatPulse;

		return this.result;
	}

	/**
	 * Injecte les métriques DSP dans un objet AudioFeatures existant
	 */
	public injectFeatures(features: AudioFeatures, sensitivity = 1.0): void {
		if (!this.isCapturing) return;

		const dsp = this.result;
		const sens = Math.max(0.2, Math.min(2.5, sensitivity));

		features.amplitude = Math.max(features.amplitude, dsp.amplitude * sens);
		features.smoothAmp = Math.max(features.smoothAmp, dsp.smoothAmp * sens);
		features.bassEnergy = Math.max(features.bassEnergy, (dsp.subBass * 0.6 + dsp.kick * 0.5) * sens);
		features.punch = Math.max(features.punch, dsp.punch * sens);
		features.midEnergy = Math.max(features.midEnergy, (dsp.snare * 0.4 + dsp.vocal * 0.6) * sens);
		features.trebleEnergy = Math.max(features.trebleEnergy, (dsp.presence * 0.4 + dsp.treble * 0.6) * sens);
		features.spectralCentroid = dsp.spectralCentroid;
		features.beatIntensity = Math.max(features.beatIntensity, dsp.beatPulse);
		features.tempo = dsp.detectedBpm;

		// Injection des 12 chromas dans pitches
		for (let i = 0; i < 12; i++) {
			features.pitches[i] = Math.max(features.pitches[i], dsp.chroma[i]);
		}
	}
}

export const dspAudioEngine = DspAudioEngine.getInstance();
