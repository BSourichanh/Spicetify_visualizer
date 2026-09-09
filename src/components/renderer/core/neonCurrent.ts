import { AudioFeatures } from "./audioFeatures";
import { VisualizerSettings } from "../../../settings/settingsManager";

export type NeonCurrentPulse = {
	startTime: number;
	intensity: number;
	duration: number;
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
		if (!settings.neonBassEnabled) {
			this.pulses = [];
			return;
		}

		const now = performance.now();
		const intensityMult = settings.neonBassIntensity ?? 1.0;

		// Détection de l'impact de basse (punch transitoire et sub-bass)
		const bassHit = features.punch * 0.78 + features.bassEnergy * 0.45;
		const isPeak = (features.punch > 0.26 && features.bassEnergy > 0.2) || features.punch > 0.38;

		// Déclenchement d'un nouveau flux de courant depuis le centre
		if (isPeak && !this.wasBassPeak && now - this.lastTriggerTime > 120) {
			const intensity = Math.min(1.0, bassHit) * intensityMult;
			if (intensity > 0.05) {
				this.pulses.push({
					startTime: now,
					intensity,
					duration: 750 // Trajet du centre jusqu'aux extrémités en 750ms
				});
				this.lastTriggerTime = now;
			}
		}
		this.wasBassPeak = isPeak;

		// Nettoyage des impulsions achevées
		for (let i = this.pulses.length - 1; i >= 0; i--) {
			if (now - this.pulses[i].startTime > 950) {
				this.pulses.splice(i, 1);
			}
		}
	}

	/**
	 * Calcule l'intensité lumineuse du courant néon à un point donné du modèle.
	 * @param distProgress 0.0 = centre/cœur du modèle, 1.0 = extrémités/pointes
	 * @param delayOffset Décalage temporel éventuel (ex: déphasage entre tentacules)
	 * @returns Intensité du courant entre 0.0 et 1.0
	 */
	public getIntensityAt(distProgress: number, delayOffset = 0): number {
		if (this.pulses.length === 0) return 0;

		const now = performance.now();
		let maxIntensity = 0;

		for (const pulse of this.pulses) {
			const elapsed = now - pulse.startTime - delayOffset * 100;
			if (elapsed < 0) continue;

			const wavePos = elapsed / pulse.duration; // 0.0 au centre -> 1.0 aux extrémités
			if (wavePos < 0 || wavePos > 1.25) continue;

			// Paquet d'onde de courant fluide
			const packetWidth = 0.28;
			const diff = Math.abs(distProgress - wavePos);
			if (diff < packetWidth) {
				const packet = Math.cos((diff / packetWidth) * (Math.PI / 2));
				// Maintien d'intensité tout au long du parcours jusqu'aux extrémités
				const fade = wavePos <= 1.0 ? 1.0 - wavePos * 0.15 : Math.max(0, 1.0 - (wavePos - 1.0) * 4);
				const val = packet * pulse.intensity * fade;
				if (val > maxIntensity) maxIntensity = val;
			}
		}

		return Math.min(1.0, maxIntensity);
	}

	/**
	 * Retourne la position actuelle du courant principal (0.0 au centre à 1.0+ aux extrémités)
	 * ainsi que son intensité, ou null si aucun courant n'est actif.
	 */
	public getMainWave(): { wavePos: number; intensity: number } | null {
		if (this.pulses.length === 0) return null;
		const now = performance.now();
		const latest = this.pulses[this.pulses.length - 1];
		const elapsed = now - latest.startTime;
		const wavePos = elapsed / latest.duration;
		if (wavePos < 0 || wavePos > 1.2) return null;
		return { wavePos, intensity: latest.intensity };
	}

	/**
	 * Intensité instantanée au cœur/centre du modèle
	 */
	public getCenterIntensity(): number {
		return this.getIntensityAt(0.0);
	}

	/**
	 * Intensité instantanée aux extrémités/pointes du modèle
	 */
	public getExtremityIntensity(): number {
		return this.getIntensityAt(1.0);
	}
}

export const neonCurrentManager = new NeonCurrentManager();
