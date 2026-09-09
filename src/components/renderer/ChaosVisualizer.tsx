import { createCanvasVisualizer, ModeRenderFunction } from "./createCanvasVisualizer";
import { ACTIVE_MODES } from "./modes.generated";
import { getVisualizerSettings } from "../../settings/settingsManager";

function pickNextIndex(current: number, total: number): number {
	if (total <= 1) return 0;
	let next = Math.floor(Math.random() * (total - 1));
	if (next >= current) next += 1;
	return next;
}

function createChaosRenderer(): ModeRenderFunction {
	let currentModeIndex = Math.floor(Math.random() * Math.max(1, ACTIVE_MODES.length));
	let lastSwitchTime = 0;
	let wasBassHigh = false;
	let lastTrackUri: string | undefined = undefined;

	return (ctx, width, height, features, palette) => {
		const modes = ACTIVE_MODES.filter(m => Boolean(m) && m.randomPool !== false);
		if (modes.length === 0) return;

		const now = performance.now();
		const isPlaying = Spicetify?.Player?.isPlaying?.() ?? true;
		const currentTrackUri = Spicetify?.Player?.data?.item?.uri;

		// Changement de morceau -> nouveau mode immédiat
		if (currentTrackUri && lastTrackUri && currentTrackUri !== lastTrackUri) {
			currentModeIndex = pickNextIndex(currentModeIndex, modes.length);
			lastSwitchTime = now;
		}
		lastTrackUri = currentTrackUri;

		const settings = getVisualizerSettings();
		const minCooldown = Math.max(0.6, Math.min(6.0, settings.chaosCooldown ?? 1.8));

		// Détection d'impact de basse percutant :
		// 1. Punch transitoire puissant (kick drum / caisse / drop direct)
		// 2. Ou basse sub-bass lourde combinée à un punch modéré
		const isBassHit =
			(features.punch > 0.52 && features.bassEnergy > 0.38) ||
			features.punch > 0.68 ||
			(features.bassEnergy > 0.82 && features.punch > 0.3);

		const timeSinceLastSwitch = (now - lastSwitchTime) / 1000;

		if (isPlaying && timeSinceLastSwitch >= minCooldown) {
			// Fallback si passage calme sans basses fortes pendant 14 secondes
			const isFallback = timeSinceLastSwitch >= 14.0 && (features.bassEnergy > 0.2 || features.amplitude > 0.15);

			// Déclenchement sur le front montant du coup de basse
			if ((isBassHit && !wasBassHigh) || isFallback) {
				currentModeIndex = pickNextIndex(currentModeIndex, modes.length);
				lastSwitchTime = now;
			}
		}

		wasBassHigh = isBassHit;

		// Rendu du mode actif sélectionné
		const activeMode = modes[currentModeIndex % modes.length];
		if (activeMode && activeMode.render) {
			activeMode.render(ctx, width, height, features, palette);
		}
	};
}

const ChaosVisualizer = createCanvasVisualizer(createChaosRenderer(), "💥 Chaos");
export default ChaosVisualizer;
