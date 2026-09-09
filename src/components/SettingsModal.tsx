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

type SettingsModalProps = {
	isOpen: boolean;
	onClose: () => void;
};

const COLOR_PRESETS = [
	{ name: "Spotify Green", hex: "#1db954" },
	{ name: "Neon Cyan", hex: "#00f0ff" },
	{ name: "Cosmic Purple", hex: "#b347eb" },
	{ name: "Solar Gold", hex: "#ffaa00" },
	{ name: "Neon Rose", hex: "#ff2a70" },
	{ name: "Pure Ice", hex: "#ffffff" }
];

export default function SettingsModal(props: SettingsModalProps) {
	const [settings, setSettings] = useState<VisualizerSettings>(() => getVisualizerSettings());

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

	const handleColorModeChange = (mode: "theme" | "custom") => {
		const updated = updateVisualizerSettings({ colorMode: mode });
		setSettings({ ...updated });
	};

	const handleColorChange = (hex: string) => {
		const updated = updateVisualizerSettings({ customColor: hex, colorMode: "custom" });
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

				<div className={styles.section}>
					{/* 1. Sensibilité / Punch */}
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

					{/* 2. Vitesse / Motion Speed */}
					<div className={styles.control_row}>
						<div className={styles.control_header}>
							<span>🌊 Motion Speed & Smoothness</span>
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

					{/* 3. Lueur / Glow */}
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

					{/* 4. Échelle / Zoom */}
					<div className={styles.control_row}>
						<div className={styles.control_header}>
							<span>🔍 Visualizer Size (Scale)</span>
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
				</div>

				{/* 5. Cycles & Transitions (Random & Chaos) */}
				<div className={styles.section}>
					{/* Durée du mode Random */}
					<div className={styles.control_row}>
						<div className={styles.control_header}>
							<span>⏱️ Random Mode Duration</span>
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

					{/* Cadence du mode Chaos */}
					<div className={styles.control_row}>
						<div className={styles.control_header}>
							<span>💥 Chaos Bass Cadence</span>
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
				</div>

				{/* 6. Neon Current Propagation on Bass */}
				<div className={styles.section}>
					<div className={styles.control_header}>
						<span>⚡ Neon Current Propagation on Bass</span>
						<button
							className={`${styles.tab_btn} ${settings.neonBassEnabled ? styles.active : ""}`}
							style={{
								flex: "none",
								padding: "4px 14px",
								fontSize: "0.8rem",
								borderRadius: "14px",
								minWidth: "60px"
							}}
							onClick={() => handleToggleChange("neonBassEnabled")}
						>
							{settings.neonBassEnabled ? "ON" : "OFF"}
						</button>
					</div>

					{settings.neonBassEnabled && (
						<div className={styles.control_row} style={{ marginTop: "10px" }}>
							<div className={styles.control_header}>
								<span>🌊 Neon Current Intensity</span>
								<span className={styles.badge}>{settings.neonBassIntensity.toFixed(2)}x</span>
							</div>
							<input
								type="range"
								min="0.2"
								max="2.0"
								step="0.05"
								value={settings.neonBassIntensity}
								className={styles.slider}
								onChange={e => handleSliderChange("neonBassIntensity", parseFloat(e.target.value))}
							/>
						</div>
					)}
				</div>

				{/* 7. Background Shockwave on Bass */}
				<div className={styles.section}>
					<div className={styles.control_header}>
						<span>💥 Background Shockwave on Bass</span>
						<button
							className={`${styles.tab_btn} ${settings.shockwaveEnabled ? styles.active : ""}`}
							style={{
								flex: "none",
								padding: "4px 14px",
								fontSize: "0.8rem",
								borderRadius: "14px",
								minWidth: "60px"
							}}
							onClick={() => handleToggleChange("shockwaveEnabled")}
						>
							{settings.shockwaveEnabled ? "ON" : "OFF"}
						</button>
					</div>

					{settings.shockwaveEnabled && (
						<div className={styles.control_row} style={{ marginTop: "10px" }}>
							<div className={styles.control_header}>
								<span>⚡ Shockwave Intensity</span>
								<span className={styles.badge}>{settings.shockwaveIntensity.toFixed(2)}x</span>
							</div>
							<input
								type="range"
								min="0.2"
								max="2.0"
								step="0.05"
								value={settings.shockwaveIntensity}
								className={styles.slider}
								onChange={e => handleSliderChange("shockwaveIntensity", parseFloat(e.target.value))}
							/>
						</div>
					)}
				</div>

				{/* 8. Couleur / Palette */}
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
						<div className={styles.color_presets}>
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
				</div>

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
