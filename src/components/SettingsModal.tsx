import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import styles from "../settings/settings.module.scss";
import {
	DEFAULT_SETTINGS,
	getVisualizerSettings,
	resetVisualizerSettings,
	updateVisualizerSettings,
	VisualizerSettings
} from "../settings/settingsManager";
import { ACTIVE_MODES } from "./renderer/modes.generated";

type SettingsModalProps = {
	isOpen: boolean;
	onClose: () => void;
	currentRendererId?: string;
};

const COLOR_PRESETS = [
	{ name: "Spotify Green", hex: "#1db954" },
	{ name: "Neon Cyan", hex: "#00f0ff" },
	{ name: "Cosmic Purple", hex: "#b347eb" },
	{ name: "Solar Gold", hex: "#ffaa00" },
	{ name: "Neon Rose", hex: "#ff2a70" },
	{ name: "Pure Ice", hex: "#ffffff" }
];

const SPECIFIC_MODELS = [
	{ id: "all", name: "Tous", icon: "📑" },
	{ id: "spectrum", name: "Liquid Spectrum", icon: "🌊" },
	{ id: "kaleido", name: "Astral Lotus", icon: "🌸" },
	{ id: "cyber-rings", name: "Bioluminescent Jellyfish", icon: "🪼" },
	{ id: "big-bang", name: "Big Bang", icon: "💥" }
];

export default function SettingsModal(props: SettingsModalProps) {
	const [settings, setSettings] = useState<VisualizerSettings>(() => getVisualizerSettings());
	const [mainTab, setMainTab] = useState<"global" | "models">("global");
	const [selectedModel, setSelectedModel] = useState<string>("all");

	useEffect(() => {
		if (props.isOpen) {
			setSettings(getVisualizerSettings());
		}
	}, [props.isOpen]);

	// Fermeture sur touche Echap
	useEffect(() => {
		if (!props.isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				props.onClose();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [props.isOpen, props.onClose]);

	if (!props.isOpen) return null;

	const handleSliderChange = (key: keyof VisualizerSettings, val: number) => {
		const updated = updateVisualizerSettings({ [key]: val });
		setSettings({ ...updated });
	};

	const handleToggleChange = (key: keyof VisualizerSettings) => {
		const current = Boolean(settings[key]);
		const updated = updateVisualizerSettings({ [key]: !current });
		setSettings({ ...updated });
	};

	const handleLayoutChange = (layout: "mirror" | "linear") => {
		const updated = updateVisualizerSettings({ spectrumLayout: layout });
		setSettings({ ...updated });
	};

	const handleColorModeChange = (mode: "theme" | "custom") => {
		const updated = updateVisualizerSettings({ colorMode: mode });
		setSettings({ ...updated });
	};

	const handleColorChange = (hex: string) => {
		const updated = updateVisualizerSettings({ customColor: hex, colorMode: "custom" });
		setSettings({ ...updated });
	};

	const isRandomActive = (modeId: string): boolean => {
		if (!settings.enabledRandomModes || settings.enabledRandomModes.length === 0) return true;
		return settings.enabledRandomModes.includes(modeId);
	};

	const toggleRandomMode = (modeId: string) => {
		const eligible = ACTIVE_MODES.filter(m => Boolean(m) && m.randomPool !== false);
		const allIds = eligible.map(m => m.id);
		const currentList =
			!settings.enabledRandomModes || settings.enabledRandomModes.length === 0
				? allIds
				: [...settings.enabledRandomModes];

		let updatedList: string[];
		if (currentList.includes(modeId)) {
			// Empêcher de désactiver le dernier modèle restant
			if (currentList.length <= 1) return;
			updatedList = currentList.filter(id => id !== modeId);
		} else {
			updatedList = [...currentList, modeId];
		}

		const isAll = allIds.every(id => updatedList.includes(id));
		const finalVal = isAll ? [] : updatedList;
		const updated = updateVisualizerSettings({ enabledRandomModes: finalVal });
		setSettings({ ...updated });
	};

	const selectAllRandom = () => {
		const updated = updateVisualizerSettings({ enabledRandomModes: [] });
		setSettings({ ...updated });
	};

	const isChaosActive = (modeId: string): boolean => {
		if (!settings.enabledChaosModes || settings.enabledChaosModes.length === 0) return true;
		return settings.enabledChaosModes.includes(modeId);
	};

	const toggleChaosMode = (modeId: string) => {
		const eligible = ACTIVE_MODES.filter(m => Boolean(m) && m.randomPool !== false);
		const allIds = eligible.map(m => m.id);
		const currentList =
			!settings.enabledChaosModes || settings.enabledChaosModes.length === 0
				? allIds
				: [...settings.enabledChaosModes];

		let updatedList: string[];
		if (currentList.includes(modeId)) {
			// Empêcher de désactiver le dernier modèle restant
			if (currentList.length <= 1) return;
			updatedList = currentList.filter(id => id !== modeId);
		} else {
			updatedList = [...currentList, modeId];
		}

		const isAll = allIds.every(id => updatedList.includes(id));
		const finalVal = isAll ? [] : updatedList;
		const updated = updateVisualizerSettings({ enabledChaosModes: finalVal });
		setSettings({ ...updated });
	};

	const selectAllChaos = () => {
		const updated = updateVisualizerSettings({ enabledChaosModes: [] });
		setSettings({ ...updated });
	};

	const handleReset = () => {
		const reset = resetVisualizerSettings();
		setSettings({ ...reset });
	};

	const modalContent = (
		<div className={styles.modal_overlay} onClick={props.onClose}>
			<div className={styles.modal_card} onClick={e => e.stopPropagation()}>
				<div className={styles.modal_header}>
					<h2>⚙️ Visualizer Options</h2>
					<button className={styles.close_btn} onClick={props.onClose} aria-label="Close">
						✕
					</button>
				</div>

				{/* NAVIGATION PAR ONGLETS */}
				<div className={styles.main_tabs_nav}>
					<button
						className={`${styles.main_tab} ${mainTab === "global" ? styles.active_tab : ""}`}
						onClick={() => setMainTab("global")}
					>
						<span>🌐</span>
						<span>Options Générales</span>
					</button>
					<button
						className={`${styles.main_tab} ${mainTab === "models" ? styles.active_tab : ""}`}
						onClick={() => setMainTab("models")}
					>
						<span>🎯</span>
						<span>Options par Modèle</span>
					</button>
				</div>

				{/* CONTENU ONGLET 1 : OPTIONS GÉNÉRALES */}
				{mainTab === "global" && (
					<>
						<div className={styles.scope_banner}>
							<span>🌐 Mode Global :</span> Ces options s'appliquent en continu à tous les modèles
							(sensibilité audio, ambiance visuelle, effets d'arrière-plan, transitions et palettes).
						</div>

						{/* 1. SENSIVITÉS AUDIO */}
						<div className={styles.section_title}>🎛️ Audio Sensitivities & Physics</div>
						<div className={styles.section}>
							{/* Punch */}
							<div className={styles.control_row}>
								<div className={styles.control_header}>
									<span>⚡ Bass Responsiveness & Punch</span>
									<span className={styles.badge}>{settings.punchScale.toFixed(2)}x</span>
								</div>
								<input
									type="range"
									min="0.2"
									max="2.5"
									step="0.05"
									value={settings.punchScale}
									className={styles.slider}
									onChange={e => handleSliderChange("punchScale", parseFloat(e.target.value))}
								/>
							</div>

							{/* Bass Boost */}
							<div className={styles.control_row}>
								<div className={styles.control_header}>
									<span>🔊 Sub & Bass Frequency Boost</span>
									<span className={styles.badge}>{settings.bassScale.toFixed(2)}x</span>
								</div>
								<input
									type="range"
									min="0.2"
									max="2.5"
									step="0.05"
									value={settings.bassScale}
									className={styles.slider}
									onChange={e => handleSliderChange("bassScale", parseFloat(e.target.value))}
								/>
							</div>

							{/* Treble Sensitivity */}
							<div className={styles.control_row}>
								<div className={styles.control_header}>
									<span>✨ Treble & Highs Sensitivity</span>
									<span className={styles.badge}>{settings.trebleScale.toFixed(2)}x</span>
								</div>
								<input
									type="range"
									min="0.2"
									max="2.5"
									step="0.05"
									value={settings.trebleScale}
									className={styles.slider}
									onChange={e => handleSliderChange("trebleScale", parseFloat(e.target.value))}
								/>
							</div>
						</div>

						{/* 2. GÉOMÉTRIE & ATMOSPHÈRE */}
						<div className={styles.section_title}>👁️ Visual & Atmosphere</div>
						<div className={styles.section}>
							{/* Motion Speed */}
							<div className={styles.control_row}>
								<div className={styles.control_header}>
									<span>🌊 Motion Speed & Flow</span>
									<span className={styles.badge}>{settings.speedScale.toFixed(2)}x</span>
								</div>
								<input
									type="range"
									min="0.4"
									max="2.0"
									step="0.05"
									value={settings.speedScale}
									className={styles.slider}
									onChange={e => handleSliderChange("speedScale", parseFloat(e.target.value))}
								/>
							</div>

							{/* Glow */}
							<div className={styles.control_row}>
								<div className={styles.control_header}>
									<span>✨ Glow & Radiance</span>
									<span className={styles.badge}>{settings.glowScale.toFixed(2)}x</span>
								</div>
								<input
									type="range"
									min="0.0"
									max="2.5"
									step="0.05"
									value={settings.glowScale}
									className={styles.slider}
									onChange={e => handleSliderChange("glowScale", parseFloat(e.target.value))}
								/>
							</div>

							{/* Size Scale */}
							<div className={styles.control_row}>
								<div className={styles.control_header}>
									<span>🔍 Visualizer Scale</span>
									<span className={styles.badge}>{settings.sizeScale.toFixed(2)}x</span>
								</div>
								<input
									type="range"
									min="0.5"
									max="1.6"
									step="0.05"
									value={settings.sizeScale}
									className={styles.slider}
									onChange={e => handleSliderChange("sizeScale", parseFloat(e.target.value))}
								/>
							</div>

							{/* Background Dimming */}
							<div className={styles.control_row}>
								<div className={styles.control_header}>
									<span>🌑 Background Dimming</span>
									<span className={styles.badge}>{Math.round(settings.backgroundDim * 100)}%</span>
								</div>
								<input
									type="range"
									min="0.0"
									max="0.9"
									step="0.05"
									value={settings.backgroundDim}
									className={styles.slider}
									onChange={e => handleSliderChange("backgroundDim", parseFloat(e.target.value))}
								/>
							</div>
						</div>

						{/* 3. BIOLUMINESCENT FIREFLIES */}
						<div className={styles.section_title}>✨ Bioluminescent Fireflies</div>
						<div className={styles.section}>
							<div className={styles.control_header}>
								<span>✨ Ambient Fireflies</span>
								<button
									className={`${styles.toggle_btn} ${settings.firefliesEnabled ? styles.active : ""}`}
									onClick={() => handleToggleChange("firefliesEnabled")}
								>
									{settings.firefliesEnabled ? "ON" : "OFF"}
								</button>
							</div>

							{settings.firefliesEnabled && (
								<>
									<div className={styles.control_row} style={{ marginTop: "10px" }}>
										<div className={styles.control_header}>
											<span>🌟 Fireflies Radiance</span>
											<span className={styles.badge}>
												{settings.firefliesIntensity.toFixed(2)}x
											</span>
										</div>
										<input
											type="range"
											min="0.2"
											max="2.0"
											step="0.05"
											value={settings.firefliesIntensity}
											className={styles.slider}
											onChange={e =>
												handleSliderChange("firefliesIntensity", parseFloat(e.target.value))
											}
										/>
									</div>

									<div className={styles.control_row}>
										<div className={styles.control_header}>
											<span>🔍 Fireflies Size</span>
											<span className={styles.badge}>{settings.firefliesSize.toFixed(2)}x</span>
										</div>
										<input
											type="range"
											min="0.3"
											max="3.0"
											step="0.05"
											value={settings.firefliesSize}
											className={styles.slider}
											onChange={e =>
												handleSliderChange("firefliesSize", parseFloat(e.target.value))
											}
										/>
									</div>

									<div className={styles.control_row}>
										<div className={styles.control_header}>
											<span>🌌 Fireflies Density (Count)</span>
											<span className={styles.badge}>{settings.firefliesCount}</span>
										</div>
										<input
											type="range"
											min="10"
											max="90"
											step="2"
											value={settings.firefliesCount}
											className={styles.slider}
											onChange={e =>
												handleSliderChange("firefliesCount", parseInt(e.target.value, 10))
											}
										/>
									</div>

									<div className={styles.control_row}>
										<div className={styles.control_header}>
											<span>💨 Fireflies Drift Speed</span>
											<span className={styles.badge}>{settings.firefliesSpeed.toFixed(2)}x</span>
										</div>
										<input
											type="range"
											min="0.2"
											max="2.5"
											step="0.05"
											value={settings.firefliesSpeed}
											className={styles.slider}
											onChange={e =>
												handleSliderChange("firefliesSpeed", parseFloat(e.target.value))
											}
										/>
									</div>
								</>
							)}
						</div>

						{/* 4. BACKGROUND SHOCKWAVE */}
						<div className={styles.section_title}>💥 Background Shockwave</div>
						<div className={styles.section}>
							<div className={styles.control_header}>
								<span>💥 Shockwave on Bass Impact</span>
								<button
									className={`${styles.toggle_btn} ${settings.shockwaveEnabled ? styles.active : ""}`}
									onClick={() => handleToggleChange("shockwaveEnabled")}
								>
									{settings.shockwaveEnabled ? "ON" : "OFF"}
								</button>
							</div>

							{settings.shockwaveEnabled && (
								<>
									<div className={styles.control_row} style={{ marginTop: "10px" }}>
										<div className={styles.control_header}>
											<span>⚡ Shockwave Intensity</span>
											<span className={styles.badge}>
												{settings.shockwaveIntensity.toFixed(2)}x
											</span>
										</div>
										<input
											type="range"
											min="0.2"
											max="2.0"
											step="0.05"
											value={settings.shockwaveIntensity}
											className={styles.slider}
											onChange={e =>
												handleSliderChange("shockwaveIntensity", parseFloat(e.target.value))
											}
										/>
									</div>

									<div className={styles.control_row}>
										<div className={styles.control_header}>
											<span>💨 Shockwave Expansion Speed</span>
											<span className={styles.badge}>{settings.shockwaveSpeed.toFixed(2)}x</span>
										</div>
										<input
											type="range"
											min="0.4"
											max="2.5"
											step="0.05"
											value={settings.shockwaveSpeed}
											className={styles.slider}
											onChange={e =>
												handleSliderChange("shockwaveSpeed", parseFloat(e.target.value))
											}
										/>
									</div>
								</>
							)}
						</div>

						{/* 5. NEON CURRENT */}
						<div className={styles.section_title}>⚡ Neon Current Propagation</div>
						<div className={styles.section}>
							<div className={styles.control_header}>
								<span>⚡ Neon Current Propagation</span>
								<button
									className={`${styles.toggle_btn} ${settings.neonBassEnabled ? styles.active : ""}`}
									onClick={() => handleToggleChange("neonBassEnabled")}
								>
									{settings.neonBassEnabled ? "ON" : "OFF"}
								</button>
							</div>

							{settings.neonBassEnabled && (
								<>
									<div className={styles.control_row} style={{ marginTop: "10px" }}>
										<div className={styles.control_header}>
											<span>🌊 Neon Current Intensity</span>
											<span className={styles.badge}>
												{settings.neonBassIntensity.toFixed(2)}x
											</span>
										</div>
										<input
											type="range"
											min="0.2"
											max="2.0"
											step="0.05"
											value={settings.neonBassIntensity}
											className={styles.slider}
											onChange={e =>
												handleSliderChange("neonBassIntensity", parseFloat(e.target.value))
											}
										/>
									</div>

									<div className={styles.control_row}>
										<div className={styles.control_header}>
											<span>⚡ Neon Propagation Speed</span>
											<span className={styles.badge}>{settings.neonBassSpeed.toFixed(2)}x</span>
										</div>
										<input
											type="range"
											min="0.4"
											max="2.5"
											step="0.05"
											value={settings.neonBassSpeed}
											className={styles.slider}
											onChange={e =>
												handleSliderChange("neonBassSpeed", parseFloat(e.target.value))
											}
										/>
									</div>
								</>
							)}
						</div>

						{/* 6. BIG BANG COSMIC ORIGIN (AMBIANCE & ARRIÈRE-PLAN) */}
						<div className={styles.section_title}>💥 Big Bang Cosmic Origin (Ambiance & Arrière-plan)</div>
						<div className={styles.section}>
							<div className={styles.control_header}>
								<span>💥 Ambiance Cosmique en Arrière-plan (Tous modèles)</span>
								<button
									className={`${styles.toggle_btn} ${settings.bigBangAmbientEnabled ? styles.active : ""}`}
									onClick={() => handleToggleChange("bigBangAmbientEnabled")}
								>
									{settings.bigBangAmbientEnabled ? "ON" : "OFF"}
								</button>
							</div>

							{settings.bigBangAmbientEnabled && (
								<>
									{/* Ondes d'inflation cosmologique */}
									<div className={styles.control_header} style={{ marginTop: "12px" }}>
										<span>🌊 Ondes d'Inflation Cosmologique</span>
										<button
											className={`${styles.toggle_btn} ${settings.bigBangWaveEnabled ? styles.active : ""}`}
											onClick={() => handleToggleChange("bigBangWaveEnabled")}
										>
											{settings.bigBangWaveEnabled ? "ON" : "OFF"}
										</button>
									</div>

									{settings.bigBangWaveEnabled && (
										<div className={styles.control_row} style={{ marginTop: "10px" }}>
											<div className={styles.control_header}>
												<span>🔊 Seuil Déclenchement Basses Très Élevées</span>
												<span className={styles.badge}>
													{Math.round(settings.bigBangWaveThreshold * 100)}%
												</span>
											</div>
											<input
												type="range"
												min="0.60"
												max="0.95"
												step="0.02"
												value={settings.bigBangWaveThreshold}
												className={styles.slider}
												onChange={e =>
													handleSliderChange(
														"bigBangWaveThreshold",
														parseFloat(e.target.value)
													)
												}
											/>
										</div>
									)}

									{/* Nébuleuse & Nuages Primordiaux */}
									<div className={styles.control_header} style={{ marginTop: "12px" }}>
										<span>🌌 Nébuleuse de Matière Primordiale</span>
										<button
											className={`${styles.toggle_btn} ${settings.bigBangNebulaEnabled ? styles.active : ""}`}
											onClick={() => handleToggleChange("bigBangNebulaEnabled")}
										>
											{settings.bigBangNebulaEnabled ? "ON" : "OFF"}
										</button>
									</div>

									{/* Graines Stellaires */}
									<div className={styles.control_header} style={{ marginTop: "12px" }}>
										<span>✨ Graines Stellaires & Poussière Cosmique</span>
										<button
											className={`${styles.toggle_btn} ${settings.bigBangStarsEnabled ? styles.active : ""}`}
											onClick={() => handleToggleChange("bigBangStarsEnabled")}
										>
											{settings.bigBangStarsEnabled ? "ON" : "OFF"}
										</button>
									</div>

									{/* Intensité globale de l'ambiance */}
									<div className={styles.control_row} style={{ marginTop: "12px" }}>
										<div className={styles.control_header}>
											<span>✨ Intensité de l'Ambiance Cosmique</span>
											<span className={styles.badge}>
												{settings.bigBangAmbientIntensity.toFixed(2)}x
											</span>
										</div>
										<input
											type="range"
											min="0.2"
											max="2.0"
											step="0.05"
											value={settings.bigBangAmbientIntensity}
											className={styles.slider}
											onChange={e =>
												handleSliderChange(
													"bigBangAmbientIntensity",
													parseFloat(e.target.value)
												)
											}
										/>
									</div>
								</>
							)}
						</div>

						{/* 7. CYCLES & TRANSITIONS */}
						<div className={styles.section_title}>⏱️ Modes Cycles & Transitions</div>
						<div className={styles.section}>
							<div className={styles.control_row}>
								<div className={styles.control_header}>
									<span>⏱️ Random Mode Switch Interval</span>
									<span className={styles.badge}>{settings.randomInterval}s</span>
								</div>
								<input
									type="range"
									min="5"
									max="180"
									step="5"
									value={settings.randomInterval}
									className={styles.slider}
									onChange={e => handleSliderChange("randomInterval", parseInt(e.target.value, 10))}
								/>
							</div>

							{/* 🎲 Random Mode Pool */}
							<div className={styles.pool_container}>
								<div className={styles.pool_title_row}>
									<div className={styles.pool_label}>
										<span>🎲 Modèles autorisés (Mode Aléatoire)</span>
									</div>
									<div className={styles.pool_actions}>
										<button
											className={styles.pool_action_btn}
											onClick={selectAllRandom}
											title="Activer tous les modèles"
										>
											Tout activer
										</button>
									</div>
								</div>
								<div className={styles.chip_grid}>
									{ACTIVE_MODES.filter(m => Boolean(m) && m.randomPool !== false).map(mode => {
										const active = isRandomActive(mode.id);
										return (
											<button
												key={mode.id}
												className={`${styles.mode_chip} ${active ? styles.active_chip : ""}`}
												onClick={() => toggleRandomMode(mode.id)}
												title={active ? `Désactiver ${mode.name}` : `Activer ${mode.name}`}
											>
												<span className={styles.chip_check}>{active ? "✓" : "○"}</span>
												<span>{mode.name}</span>
											</button>
										);
									})}
								</div>
							</div>

							<div className={styles.control_row} style={{ marginTop: "14px" }}>
								<div className={styles.control_header}>
									<span>💥 Chaos Mode Bass Cadence</span>
									<span className={styles.badge}>{settings.chaosCooldown.toFixed(1)}s</span>
								</div>
								<input
									type="range"
									min="0.6"
									max="5.0"
									step="0.2"
									value={settings.chaosCooldown}
									className={styles.slider}
									onChange={e => handleSliderChange("chaosCooldown", parseFloat(e.target.value))}
								/>
							</div>

							{/* 💥 Chaos Mode Pool */}
							<div className={styles.pool_container}>
								<div className={styles.pool_title_row}>
									<div className={styles.pool_label}>
										<span>💥 Modèles autorisés (Mode Chaos)</span>
									</div>
									<div className={styles.pool_actions}>
										<button
											className={styles.pool_action_btn}
											onClick={selectAllChaos}
											title="Activer tous les modèles"
										>
											Tout activer
										</button>
									</div>
								</div>
								<div className={styles.chip_grid}>
									{ACTIVE_MODES.filter(m => Boolean(m) && m.randomPool !== false).map(mode => {
										const active = isChaosActive(mode.id);
										return (
											<button
												key={mode.id}
												className={`${styles.mode_chip} ${active ? styles.active_chip : ""}`}
												onClick={() => toggleChaosMode(mode.id)}
												title={active ? `Désactiver ${mode.name}` : `Activer ${mode.name}`}
											>
												<span className={styles.chip_check}>{active ? "✓" : "○"}</span>
												<span>{mode.name}</span>
											</button>
										);
									})}
								</div>
							</div>
						</div>

						{/* 7. COULEURS & CHROMATIQUE */}
						<div className={styles.section_title}>🎨 Colors & Dynamic Palette</div>
						<div className={styles.section}>
							<div className={styles.control_header}>
								<span>🎨 Color Source</span>
							</div>

							<div className={styles.color_mode_tabs}>
								<button
									className={`${styles.tab_btn} ${settings.colorMode === "theme" ? styles.active : ""}`}
									onClick={() => handleColorModeChange("theme")}
								>
									🎵 Album Dynamic Color
								</button>
								<button
									className={`${styles.tab_btn} ${settings.colorMode === "custom" ? styles.active : ""}`}
									onClick={() => handleColorModeChange("custom")}
								>
									🎨 Custom Static Color
								</button>
							</div>

							{settings.colorMode === "custom" && (
								<div className={styles.color_presets} style={{ marginBottom: "14px" }}>
									{COLOR_PRESETS.map(preset => (
										<button
											key={preset.hex}
											title={preset.name}
											className={`${styles.color_swatch} ${settings.customColor.toLowerCase() === preset.hex.toLowerCase() ? styles.active_swatch : ""}`}
											style={{ backgroundColor: preset.hex }}
											onClick={() => handleColorChange(preset.hex)}
										/>
									))}
									<input
										type="color"
										value={settings.customColor}
										className={styles.color_picker_input}
										title="Custom color picker"
										onChange={e => handleColorChange(e.target.value)}
									/>
								</div>
							)}

							{/* Rainbow Prism Cycle */}
							<div className={styles.control_header} style={{ marginTop: "10px" }}>
								<span>🌈 Rainbow Prism Cycling</span>
								<button
									className={`${styles.toggle_btn} ${settings.colorCycleEnabled ? styles.active : ""}`}
									onClick={() => handleToggleChange("colorCycleEnabled")}
								>
									{settings.colorCycleEnabled ? "ON" : "OFF"}
								</button>
							</div>

							{settings.colorCycleEnabled && (
								<div className={styles.control_row} style={{ marginTop: "10px" }}>
									<div className={styles.control_header}>
										<span>🌈 Rainbow Cycle Speed</span>
										<span className={styles.badge}>{settings.colorCycleSpeed.toFixed(2)}x</span>
									</div>
									<input
										type="range"
										min="0.2"
										max="3.0"
										step="0.05"
										value={settings.colorCycleSpeed}
										className={styles.slider}
										onChange={e =>
											handleSliderChange("colorCycleSpeed", parseFloat(e.target.value))
										}
									/>
								</div>
							)}
						</div>
					</>
				)}

				{/* CONTENU ONGLET 2 : OPTIONS PAR MODÈLE */}
				{mainTab === "models" && (
					<>
						<div className={styles.scope_banner}>
							<span>🎯 Mode Spécifique :</span> Ces options s'appliquent exclusivement au comportement
							interne de chaque modèle lorsqu'il est actif à l'écran.
						</div>

						{/* Barre de sélection de modèle */}
						<div className={styles.model_selector_bar}>
							{SPECIFIC_MODELS.map(m => {
								const isCurrent = props.currentRendererId === m.id;
								const isSelected = selectedModel === m.id;
								return (
									<button
										key={m.id}
										className={`${styles.model_pill} ${isSelected ? styles.active_model_pill : ""}`}
										onClick={() => setSelectedModel(m.id)}
									>
										<span>{m.icon}</span>
										<span>{m.name}</span>
										{isCurrent && <span className={styles.now_playing_badge}>En cours</span>}
									</button>
								);
							})}
						</div>

						{/* 1. LIQUID SPECTRUM */}
						{(selectedModel === "all" || selectedModel === "spectrum") && (
							<div
								className={`${styles.model_card} ${props.currentRendererId === "spectrum" ? styles.active_model_card : ""}`}
							>
								<div className={styles.model_card_header}>
									<h3>🌊 Liquid Spectrum Equalizer</h3>
									{props.currentRendererId === "spectrum" && (
										<span className={styles.now_playing_badge}>Modèle en cours</span>
									)}
								</div>

								{/* Layout Mode */}
								<div className={styles.control_row}>
									<div className={styles.control_header}>
										<span>📊 Frequency Distribution</span>
									</div>
									<div className={styles.button_group}>
										<button
											className={`${styles.tab_btn} ${settings.spectrumLayout === "mirror" ? styles.active : ""}`}
											onClick={() => handleLayoutChange("mirror")}
										>
											↔️ Bilateral Mirror
										</button>
										<button
											className={`${styles.tab_btn} ${settings.spectrumLayout === "linear" ? styles.active : ""}`}
											onClick={() => handleLayoutChange("linear")}
										>
											➡️ Linear (Low → High)
										</button>
									</div>
								</div>

								{/* Spectrum Height */}
								<div className={styles.control_row}>
									<div className={styles.control_header}>
										<span>📏 Spectrum Height Scale</span>
										<span className={styles.badge}>{settings.spectrumHeightScale.toFixed(2)}x</span>
									</div>
									<input
										type="range"
										min="0.4"
										max="2.2"
										step="0.05"
										value={settings.spectrumHeightScale}
										className={styles.slider}
										onChange={e =>
											handleSliderChange("spectrumHeightScale", parseFloat(e.target.value))
										}
									/>
								</div>

								{/* Spectrum Peaks */}
								<div className={styles.control_header} style={{ marginTop: "8px" }}>
									<span>☁️ Floating Aurora Mist Peaks</span>
									<button
										className={`${styles.toggle_btn} ${settings.spectrumShowPeaks ? styles.active : ""}`}
										onClick={() => handleToggleChange("spectrumShowPeaks")}
									>
										{settings.spectrumShowPeaks ? "ON" : "OFF"}
									</button>
								</div>
							</div>
						)}

						{/* 2. ASTRAL LOTUS */}
						{(selectedModel === "all" || selectedModel === "kaleido") && (
							<div
								className={`${styles.model_card} ${props.currentRendererId === "kaleido" ? styles.active_model_card : ""}`}
							>
								<div className={styles.model_card_header}>
									<h3>🌸 Astral Lotus</h3>
									{props.currentRendererId === "kaleido" && (
										<span className={styles.now_playing_badge}>Modèle en cours</span>
									)}
								</div>

								<div className={styles.control_row}>
									<div className={styles.control_header}>
										<span>🌀 Lotus Rotation Speed</span>
										<span className={styles.badge}>{settings.lotusRotationScale.toFixed(2)}x</span>
									</div>
									<input
										type="range"
										min="0.2"
										max="3.0"
										step="0.05"
										value={settings.lotusRotationScale}
										className={styles.slider}
										onChange={e =>
											handleSliderChange("lotusRotationScale", parseFloat(e.target.value))
										}
									/>
								</div>

								<div className={styles.control_header} style={{ marginTop: "8px" }}>
									<span>🔄 Reverse Rotation Direction</span>
									<button
										className={`${styles.toggle_btn} ${settings.lotusReverse ? styles.active : ""}`}
										onClick={() => handleToggleChange("lotusReverse")}
									>
										{settings.lotusReverse ? "REVERSE" : "NORMAL"}
									</button>
								</div>
							</div>
						)}

						{/* 3. BIOLUMINESCENT JELLYFISH */}
						{(selectedModel === "all" || selectedModel === "cyber-rings") && (
							<div
								className={`${styles.model_card} ${props.currentRendererId === "cyber-rings" ? styles.active_model_card : ""}`}
							>
								<div className={styles.model_card_header}>
									<h3>🪼 Bioluminescent Jellyfish</h3>
									{props.currentRendererId === "cyber-rings" && (
										<span className={styles.now_playing_badge}>Modèle en cours</span>
									)}
								</div>

								<div className={styles.control_row}>
									<div className={styles.control_header}>
										<span>🏊 Swim Pulse & Propel Speed</span>
										<span className={styles.badge}>{settings.jellyfishSwimSpeed.toFixed(2)}x</span>
									</div>
									<input
										type="range"
										min="0.4"
										max="2.5"
										step="0.05"
										value={settings.jellyfishSwimSpeed}
										className={styles.slider}
										onChange={e =>
											handleSliderChange("jellyfishSwimSpeed", parseFloat(e.target.value))
										}
									/>
								</div>

								<div className={styles.control_row}>
									<div className={styles.control_header}>
										<span>✨ Tentacle Flow & Length</span>
										<span className={styles.badge}>
											{settings.jellyfishTentacleLength.toFixed(2)}x
										</span>
									</div>
									<input
										type="range"
										min="0.5"
										max="1.8"
										step="0.05"
										value={settings.jellyfishTentacleLength}
										className={styles.slider}
										onChange={e =>
											handleSliderChange("jellyfishTentacleLength", parseFloat(e.target.value))
										}
									/>
								</div>
							</div>
						)}

						{/* 4. BIG BANG COSMIC ORIGIN */}
						{(selectedModel === "all" || selectedModel === "big-bang") && (
							<div
								className={`${styles.model_card} ${props.currentRendererId === "big-bang" ? styles.active_model_card : ""}`}
							>
								<div className={styles.model_card_header}>
									<h3>💥 Big Bang Cosmic Origin</h3>
									{props.currentRendererId === "big-bang" && (
										<span className={styles.now_playing_badge}>Modèle en cours</span>
									)}
								</div>

								<div
									style={{
										fontSize: "0.78rem",
										color: "#b3b3b3",
										marginBottom: "12px",
										background: "rgba(255, 255, 255, 0.04)",
										padding: "8px 10px",
										borderRadius: "6px",
										borderLeft: "2px solid #1db954"
									}}
								>
									🌌 <strong>Effet d'Ambiance Global :</strong> Vous pouvez également activer
									l'ambiance cosmique complète (ondes d'inflation, nébuleuse, poussière stellaire) en
									arrière-plan de <em>tous les autres modèles</em> depuis l'onglet{" "}
									<strong>Options Générales</strong>.
								</div>

								<div className={styles.control_header}>
									<span>💥 Cosmic Inflation Shockwaves</span>
									<button
										className={`${styles.toggle_btn} ${settings.bigBangWaveEnabled ? styles.active : ""}`}
										onClick={() => handleToggleChange("bigBangWaveEnabled")}
									>
										{settings.bigBangWaveEnabled ? "ON" : "OFF"}
									</button>
								</div>

								{settings.bigBangWaveEnabled && (
									<div className={styles.control_row} style={{ marginTop: "10px" }}>
										<div className={styles.control_header}>
											<span>🔊 Heavy Bass Trigger Threshold</span>
											<span className={styles.badge}>
												{Math.round(settings.bigBangWaveThreshold * 100)}%
											</span>
										</div>
										<input
											type="range"
											min="0.60"
											max="0.95"
											step="0.02"
											value={settings.bigBangWaveThreshold}
											className={styles.slider}
											onChange={e =>
												handleSliderChange("bigBangWaveThreshold", parseFloat(e.target.value))
											}
										/>
									</div>
								)}
							</div>
						)}
					</>
				)}

				{/* Footer buttons */}
				<div className={styles.footer_actions}>
					<button className={styles.reset_btn} onClick={handleReset}>
						↺ Reset to Defaults
					</button>
					<button className={styles.save_btn} onClick={props.onClose}>
						Done
					</button>
				</div>
			</div>
		</div>
	);

	if (typeof document !== "undefined" && document.body) {
		return ReactDOM.createPortal(modalContent, document.body);
	}

	return modalContent;
}
