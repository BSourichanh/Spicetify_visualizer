import { AudioFeatures } from "./audioFeatures";
import { VisualizerSettings } from "../../../settings/settingsManager";

export type NeonCurrentPulse = {
	startTime: number;
	intensity: number;
	duration: number;
};

export type ActiveNeonWave = {
	wavePos: number;
	intensity: number;
};

/**
 * Gestionnaire de courant néon qui se propage depuis le centre du modèle
 * jusqu'à ses extrémités en parcourant son anatomie sur les coups de basse.
 */
class NeonCurrentManager {
	private pulses: NeonCurrentPulse[] = [];
	private lastTriggerTime = 0;
	private wasBassPeak = false;

	public update(features: AudioFeatures, settings: VisualizerSettings) {
		if (!settings.neonBassEnabled || !features.isPlaying) {
			this.pulses = [];
			return;
		}

		const now = performance.now();
		const intensityMult = settings.neonBassIntensity ?? 1.0;
		const speedMult = Math.max(0.4, Math.min(2.5, settings.neonBassSpeed ?? 1.0));

		// Durée de propagation du centre aux extrémités (défaut ~720ms, modulé par neonBassSpeed)
		const duration = Math.max(260, Math.round(720 / speedMult));
		const minInterval = Math.max(70, Math.round(130 / speedMult));

		// Détection de l'impact de basse (punch transitoire et sub-bass)
		const bassHit = features.punch * 0.78 + features.bassEnergy * 0.45;
		const isPeak = (features.punch > 0.25 && features.bassEnergy > 0.2) || features.punch > 0.36;

		// Déclenchement d'un nouveau flux de courant depuis le centre
		if (isPeak && !this.wasBassPeak && now - this.lastTriggerTime > minInterval) {
			const intensity = Math.min(1.0, bassHit) * intensityMult;
			if (intensity > 0.05) {
				// Limite à 5 impulsions simultanées
				if (this.pulses.length >= 5) {
					this.pulses.shift();
				}
				this.pulses.push({
					startTime: now,
					intensity,
					duration
				});
				this.lastTriggerTime = now;
			}
		}
		this.wasBassPeak = isPeak;

		// Nettoyage des impulsions achevées
		for (let i = this.pulses.length - 1; i >= 0; i--) {
			if (now - this.pulses[i].startTime > this.pulses[i].duration * 1.35) {
				this.pulses.splice(i, 1);
			}
		}
	}

	/**
	 * Calcule l'intensité lumineuse du courant néon à un point donné du modèle.
	 * @param distProgress 0.0 = centre/cœur du modèle, 1.0 = extrémités/pointes
	 * @param delayOffset Décalage temporel éventuel (ex: déphasage entre tentacules)
	 * @param packetWidth Largeur de l'onde de courant (défaut: 0.24)
	 * @returns Intensité du courant entre 0.0 et 1.0
	 */
	public getIntensityAt(distProgress: number, delayOffset = 0, packetWidth = 0.24): number {
		if (this.pulses.length === 0) return 0;

		const now = performance.now();
		let maxIntensity = 0;

		for (const pulse of this.pulses) {
			const elapsed = now - pulse.startTime - delayOffset * 90;
			if (elapsed < 0) continue;

			const wavePos = elapsed / pulse.duration; // 0.0 au centre -> 1.0 aux extrémités
			if (wavePos < 0 || wavePos > 1.3) continue;

			const diff = Math.abs(distProgress - wavePos);
			if (diff < packetWidth) {
				const packet = Math.cos((diff / packetWidth) * (Math.PI / 2));
				// Maintien d'intensité tout au long du parcours jusqu'aux extrémités
				const fade = wavePos <= 1.0 ? 1.0 - wavePos * 0.1 : Math.max(0, 1.0 - (wavePos - 1.0) * 3.5);
				const val = packet * pulse.intensity * fade;
				if (val > maxIntensity) maxIntensity = val;
			}
		}

		return Math.min(1.0, maxIntensity);
	}

	/**
	 * Retourne toutes les ondes actuellement en cours de propagation.
	 */
	public getActiveWaves(delayOffset = 0): ActiveNeonWave[] {
		if (this.pulses.length === 0) return [];
		const now = performance.now();
		const waves: ActiveNeonWave[] = [];

		for (const pulse of this.pulses) {
			const elapsed = now - pulse.startTime - delayOffset * 90;
			if (elapsed < 0) continue;
			const wavePos = elapsed / pulse.duration;
			if (wavePos >= 0 && wavePos <= 1.3) {
				waves.push({ wavePos, intensity: pulse.intensity });
			}
		}
		return waves;
	}

	/**
	 * Retourne l'onde principale la plus intense et visible, ou null si aucune.
	 */
	public getMainWave(delayOffset = 0): ActiveNeonWave | null {
		const waves = this.getActiveWaves(delayOffset);
		if (waves.length === 0) return null;
		// Priorité à l'onde la plus récente qui n'est pas encore sortie
		for (let i = waves.length - 1; i >= 0; i--) {
			if (waves[i].wavePos <= 1.2) return waves[i];
		}
		return waves[waves.length - 1];
	}

	/**
	 * Intensité instantanée au cœur/centre du modèle (distProgress = 0.0)
	 */
	public getCenterIntensity(): number {
		return this.getIntensityAt(0.0, 0, 0.3);
	}

	/**
	 * Intensité instantanée aux extrémités/pointes du modèle (distProgress = 1.0)
	 */
	public getExtremityIntensity(): number {
		return this.getIntensityAt(1.0, 0, 0.25);
	}
}

export const neonCurrentManager = new NeonCurrentManager();
