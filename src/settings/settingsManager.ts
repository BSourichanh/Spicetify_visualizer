/**
 * Settings Manager for Spicetify Visualizer
 * Handles persistent settings stored in Spicetify.LocalStorage
 * and notifies listeners on changes for live updates.
 */

export type VisualizerSettings = {
	punchScale: number; // 0.2 to 2.5, default 1.0 (Sensibilité aux basses et percussions)
	bassScale: number; // 0.2 to 2.5, default 1.0 (Sensibilité spécifique aux sub-basses)
	trebleScale: number; // 0.2 to 2.5, default 1.0 (Sensibilité aux aigus et charlestons)
	speedScale: number; // 0.4 to 2.0, default 1.0 (Vitesse d'animation générale)
	glowScale: number; // 0.0 to 2.5, default 1.0 (Intensité de la lueur et des néons)
	sizeScale: number; // 0.5 to 1.6, default 1.0 (Échelle géométrique / Zoom)
	backgroundDim: number; // 0.0 to 0.9, default 0.0 (Assombrissement d'ambiance de l'arrière-plan)
	colorMode: "theme" | "custom"; // "theme" = Album Spotify, "custom" = Couleur fixe
	customColor: string; // Code HEX (défaut #1db954 vert Spotify)
	colorCycleEnabled: boolean; // default false (Défilement chromatique arc-en-ciel progressif)
	colorCycleSpeed: number; // 0.2 to 3.0, default 1.0 (Vitesse du défilement chromatique)
	randomInterval: number; // 5 to 300s, default 30 (Durée en secondes en mode Random)
	chaosCooldown: number; // 0.6 to 6.0s, default 1.8 (Délai minimal en secondes entre deux changements sur les basses)
	neonBassEnabled: boolean; // default true (Activer le courant néon le long du modèle)
	neonBassIntensity: number; // 0.2 to 2.0, default 1.0 (Intensité du courant néon)
	neonBassSpeed: number; // 0.4 to 2.5, default 1.0 (Vitesse de propagation du courant néon)
	shockwaveEnabled: boolean; // default true (Activer l'onde de choc en arrière-plan)
	shockwaveIntensity: number; // 0.2 to 2.0, default 1.0 (Intensité de l'onde de choc)
	shockwaveSpeed: number; // 0.4 to 2.5, default 1.0 (Vitesse d'expansion de l'onde de choc)
	firefliesEnabled: boolean; // default true (Activer les lucioles bioluminescentes)
	firefliesIntensity: number; // 0.2 to 2.0, default 1.0 (Intensité lumineuse des lucioles)
	firefliesCount: number; // 10 to 90, default 36 (Nombre/densité de lucioles)
	firefliesSpeed: number; // 0.2 to 2.5, default 1.0 (Vitesse de dérive des lucioles)
	lotusRotationScale: number; // 0.2 to 3.0, default 1.0 (Vitesse de rotation de la Fleur de Lotus)
	lotusReverse: boolean; // default false (Inverser le sens de rotation du Lotus)
	spectrumLayout: "mirror" | "linear"; // default "mirror" (Disposition symétrique vs panoramique 20Hz-16kHz)
	spectrumHeightScale: number; // 0.4 to 2.2, default 1.0 (Hauteur d'onde du spectre liquide)
	spectrumShowPeaks: boolean; // default true (Afficher les crêtes de brume flottantes)
	jellyfishSwimSpeed: number; // 0.4 to 2.5, default 1.0 (Cadence de nage de la Méduse)
	jellyfishTentacleLength: number; // 0.5 to 1.8, default 1.0 (Longueur des filaments soyeux)
	enabledRandomModes: string[]; // Liste des IDs de modes autorisés en mode Aléatoire (vide = tous)
	enabledChaosModes: string[]; // Liste des IDs de modes autorisés en mode Chaos (vide = tous)
};

export const DEFAULT_SETTINGS: VisualizerSettings = {
	punchScale: 1.0,
	bassScale: 1.0,
	trebleScale: 1.0,
	speedScale: 1.0,
	glowScale: 1.0,
	sizeScale: 1.0,
	backgroundDim: 0.0,
	colorMode: "theme",
	customColor: "#1db954",
	colorCycleEnabled: false,
	colorCycleSpeed: 1.0,
	randomInterval: 30,
	chaosCooldown: 1.8,
	neonBassEnabled: true,
	neonBassIntensity: 1.0,
	neonBassSpeed: 1.0,
	shockwaveEnabled: true,
	shockwaveIntensity: 1.0,
	shockwaveSpeed: 1.0,
	firefliesEnabled: true,
	firefliesIntensity: 1.0,
	firefliesCount: 36,
	firefliesSpeed: 1.0,
	lotusRotationScale: 1.0,
	lotusReverse: false,
	spectrumLayout: "mirror",
	spectrumHeightScale: 1.0,
	spectrumShowPeaks: true,
	jellyfishSwimSpeed: 1.0,
	jellyfishTentacleLength: 1.0,
	enabledRandomModes: [],
	enabledChaosModes: []
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
				bassScale:
					typeof parsed.bassScale === "number"
						? Math.max(0.2, Math.min(2.5, parsed.bassScale))
						: DEFAULT_SETTINGS.bassScale,
				trebleScale:
					typeof parsed.trebleScale === "number"
						? Math.max(0.2, Math.min(2.5, parsed.trebleScale))
						: DEFAULT_SETTINGS.trebleScale,
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
				backgroundDim:
					typeof parsed.backgroundDim === "number"
						? Math.max(0.0, Math.min(0.9, parsed.backgroundDim))
						: DEFAULT_SETTINGS.backgroundDim,
				colorMode: parsed.colorMode === "custom" ? "custom" : "theme",
				customColor:
					typeof parsed.customColor === "string" && parsed.customColor.startsWith("#")
						? parsed.customColor
						: DEFAULT_SETTINGS.customColor,
				colorCycleEnabled:
					typeof parsed.colorCycleEnabled === "boolean"
						? parsed.colorCycleEnabled
						: DEFAULT_SETTINGS.colorCycleEnabled,
				colorCycleSpeed:
					typeof parsed.colorCycleSpeed === "number"
						? Math.max(0.2, Math.min(3.0, parsed.colorCycleSpeed))
						: DEFAULT_SETTINGS.colorCycleSpeed,
				randomInterval:
					typeof parsed.randomInterval === "number"
						? Math.max(5, Math.min(300, parsed.randomInterval))
						: DEFAULT_SETTINGS.randomInterval,
				chaosCooldown:
					typeof parsed.chaosCooldown === "number"
						? Math.max(0.6, Math.min(6.0, parsed.chaosCooldown))
						: DEFAULT_SETTINGS.chaosCooldown,
				neonBassEnabled:
					typeof parsed.neonBassEnabled === "boolean"
						? parsed.neonBassEnabled
						: DEFAULT_SETTINGS.neonBassEnabled,
				neonBassIntensity:
					typeof parsed.neonBassIntensity === "number"
						? Math.max(0.2, Math.min(2.0, parsed.neonBassIntensity))
						: DEFAULT_SETTINGS.neonBassIntensity,
				neonBassSpeed:
					typeof parsed.neonBassSpeed === "number"
						? Math.max(0.4, Math.min(2.5, parsed.neonBassSpeed))
						: DEFAULT_SETTINGS.neonBassSpeed,
				shockwaveEnabled:
					typeof parsed.shockwaveEnabled === "boolean"
						? parsed.shockwaveEnabled
						: DEFAULT_SETTINGS.shockwaveEnabled,
				shockwaveIntensity:
					typeof parsed.shockwaveIntensity === "number"
						? Math.max(0.2, Math.min(2.0, parsed.shockwaveIntensity))
						: DEFAULT_SETTINGS.shockwaveIntensity,
				shockwaveSpeed:
					typeof parsed.shockwaveSpeed === "number"
						? Math.max(0.4, Math.min(2.5, parsed.shockwaveSpeed))
						: DEFAULT_SETTINGS.shockwaveSpeed,
				firefliesEnabled:
					typeof parsed.firefliesEnabled === "boolean"
						? parsed.firefliesEnabled
						: DEFAULT_SETTINGS.firefliesEnabled,
				firefliesIntensity:
					typeof parsed.firefliesIntensity === "number"
						? Math.max(0.2, Math.min(2.0, parsed.firefliesIntensity))
						: DEFAULT_SETTINGS.firefliesIntensity,
				firefliesCount:
					typeof parsed.firefliesCount === "number"
						? Math.max(10, Math.min(90, Math.round(parsed.firefliesCount)))
						: DEFAULT_SETTINGS.firefliesCount,
				firefliesSpeed:
					typeof parsed.firefliesSpeed === "number"
						? Math.max(0.2, Math.min(2.5, parsed.firefliesSpeed))
						: DEFAULT_SETTINGS.firefliesSpeed,
				lotusRotationScale:
					typeof parsed.lotusRotationScale === "number"
						? Math.max(0.2, Math.min(3.0, parsed.lotusRotationScale))
						: DEFAULT_SETTINGS.lotusRotationScale,
				lotusReverse:
					typeof parsed.lotusReverse === "boolean" ? parsed.lotusReverse : DEFAULT_SETTINGS.lotusReverse,
				spectrumLayout: parsed.spectrumLayout === "linear" ? "linear" : "mirror",
				spectrumHeightScale:
					typeof parsed.spectrumHeightScale === "number"
						? Math.max(0.4, Math.min(2.2, parsed.spectrumHeightScale))
						: DEFAULT_SETTINGS.spectrumHeightScale,
				spectrumShowPeaks:
					typeof parsed.spectrumShowPeaks === "boolean"
						? parsed.spectrumShowPeaks
						: DEFAULT_SETTINGS.spectrumShowPeaks,
				jellyfishSwimSpeed:
					typeof parsed.jellyfishSwimSpeed === "number"
						? Math.max(0.4, Math.min(2.5, parsed.jellyfishSwimSpeed))
						: DEFAULT_SETTINGS.jellyfishSwimSpeed,
				jellyfishTentacleLength:
					typeof parsed.jellyfishTentacleLength === "number"
						? Math.max(0.5, Math.min(1.8, parsed.jellyfishTentacleLength))
						: DEFAULT_SETTINGS.jellyfishTentacleLength,
				enabledRandomModes: Array.isArray(parsed.enabledRandomModes)
					? parsed.enabledRandomModes.filter((id: unknown) => typeof id === "string")
					: DEFAULT_SETTINGS.enabledRandomModes,
				enabledChaosModes: Array.isArray(parsed.enabledChaosModes)
					? parsed.enabledChaosModes.filter((id: unknown) => typeof id === "string")
					: DEFAULT_SETTINGS.enabledChaosModes
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
