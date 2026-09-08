/**
 * Settings Manager for Spicetify Visualizer
 * Handles persistent settings stored in Spicetify.LocalStorage
 * and notifies listeners on changes for live updates.
 */

export type VisualizerSettings = {
	punchScale: number; // 0.2 to 2.5, default 1.0 (Sensibilité aux basses et percussions)
	speedScale: number; // 0.4 to 2.0, default 1.0 (Vitesse d'animation)
	glowScale: number; // 0.0 to 2.5, default 1.0 (Intensité de la lueur et des néons)
	sizeScale: number; // 0.5 to 1.6, default 1.0 (Échelle géométrique / Zoom)
	colorMode: "theme" | "custom"; // "theme" = Album Spotify, "custom" = Couleur fixe
	customColor: string; // Code HEX (défaut #1db954 vert Spotify)
};

export const DEFAULT_SETTINGS: VisualizerSettings = {
	punchScale: 1.0,
	speedScale: 1.0,
	glowScale: 1.0,
	sizeScale: 1.0,
	colorMode: "theme",
	customColor: "#1db954"
};

const STORAGE_KEY = "visualizer:custom-settings";

let currentSettings: VisualizerSettings = { ...DEFAULT_SETTINGS };
let isLoaded = false;

type SettingsListener = (settings: VisualizerSettings) => void;
const listeners = new Set<SettingsListener>();

export function getVisualizerSettings(): VisualizerSettings {
	if (!isLoaded) {
		loadVisualizerSettings();
	}
	return currentSettings;
}

export function loadVisualizerSettings(): VisualizerSettings {
	try {
		const raw = Spicetify?.LocalStorage?.get(STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			currentSettings = {
				punchScale:
					typeof parsed.punchScale === "number"
						? Math.max(0.2, Math.min(2.5, parsed.punchScale))
						: DEFAULT_SETTINGS.punchScale,
				speedScale:
					typeof parsed.speedScale === "number"
						? Math.max(0.4, Math.min(2.0, parsed.speedScale))
						: DEFAULT_SETTINGS.speedScale,
				glowScale:
					typeof parsed.glowScale === "number"
						? Math.max(0.0, Math.min(2.5, parsed.glowScale))
						: DEFAULT_SETTINGS.glowScale,
				sizeScale:
					typeof parsed.sizeScale === "number"
						? Math.max(0.5, Math.min(1.6, parsed.sizeScale))
						: DEFAULT_SETTINGS.sizeScale,
				colorMode: parsed.colorMode === "custom" ? "custom" : "theme",
				customColor:
					typeof parsed.customColor === "string" && parsed.customColor.startsWith("#")
						? parsed.customColor
						: DEFAULT_SETTINGS.customColor
			};
		}
	} catch (e) {
		console.warn("[Visualizer] Failed to load settings:", e);
	}
	isLoaded = true;
	return currentSettings;
}

export function updateVisualizerSettings(partial: Partial<VisualizerSettings>): VisualizerSettings {
	currentSettings = { ...currentSettings, ...partial };
	try {
		Spicetify?.LocalStorage?.set(STORAGE_KEY, JSON.stringify(currentSettings));
	} catch (e) {
		console.warn("[Visualizer] Failed to save settings:", e);
	}
	notifyListeners();
	return currentSettings;
}

export function resetVisualizerSettings(): VisualizerSettings {
	currentSettings = { ...DEFAULT_SETTINGS };
	try {
		Spicetify?.LocalStorage?.set(STORAGE_KEY, JSON.stringify(currentSettings));
	} catch (e) {
		console.warn("[Visualizer] Failed to reset settings:", e);
	}
	notifyListeners();
	return currentSettings;
}

export function subscribeToSettings(listener: SettingsListener): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function notifyListeners() {
	listeners.forEach(fn => {
		try {
			fn(currentSettings);
		} catch (err) {
			console.error("[Visualizer] Error in settings listener:", err);
		}
	});
}
