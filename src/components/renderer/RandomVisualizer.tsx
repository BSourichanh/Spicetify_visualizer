import React, { useEffect, useMemo, useRef, useState } from "react";
import { RendererProps } from "../../defs";
import { GENERATED_RANDOM_VISUALIZERS } from "./modes.generated";
import { getVisualizerSettings, subscribeToSettings, VisualizerSettings } from "../../settings/settingsManager";

export default function RandomVisualizer(props: RendererProps) {
	const [settings, setSettings] = useState<VisualizerSettings>(() => getVisualizerSettings());

	useEffect(() => {
		return subscribeToSettings(newSettings => {
			setSettings(newSettings);
		});
	}, []);

	// Pool actif filtré selon les préférences de l'utilisateur (avec repli si tout est désactivé)
	const activePool = useMemo(() => {
		const basePool = Array.isArray(GENERATED_RANDOM_VISUALIZERS) ? GENERATED_RANDOM_VISUALIZERS : [];
		const enabled = settings.enabledRandomModes;
		if (Array.isArray(enabled) && enabled.length > 0) {
			const filtered = basePool.filter(m => enabled.includes(m.id));
			if (filtered.length > 0) {
				return filtered;
			}
		}
		return basePool;
	}, [settings.enabledRandomModes]);

	const [currentIndex, setCurrentIndex] = useState(() =>
		activePool.length > 0 ? Math.floor(Math.random() * activePool.length) : 0
	);

	// Auto-cycle selon le délai configuré dans les options
	useEffect(() => {
		if (activePool.length <= 1) return;
		const intervalMs = Math.max(3000, (settings.randomInterval || 30) * 1000);
		const interval = setInterval(() => {
			setCurrentIndex(prev => {
				let next = Math.floor(Math.random() * (activePool.length - 1));
				if (next >= prev % activePool.length) next += 1;
				return next;
			});
		}, intervalMs);

		return () => clearInterval(interval);
	}, [settings.randomInterval, activePool]);

	// Changer de mode aléatoire au changement de morceau
	const currentTrackUri = Spicetify?.Player?.data?.item?.uri;
	const prevTrackUriRef = useRef<string | undefined>(currentTrackUri);
	useEffect(() => {
		if (currentTrackUri && prevTrackUriRef.current && currentTrackUri !== prevTrackUriRef.current) {
			if (activePool.length > 1) {
				setCurrentIndex(prev => {
					let next = Math.floor(Math.random() * (activePool.length - 1));
					if (next >= prev % activePool.length) next += 1;
					return next;
				});
			}
		}
		prevTrackUriRef.current = currentTrackUri;
	}, [currentTrackUri, activePool]);

	const CurrentRenderer = useMemo(() => {
		if (activePool.length === 0) return null;
		const safeIndex = currentIndex % activePool.length;
		return activePool[safeIndex]?.Component ?? null;
	}, [currentIndex, activePool]);

	if (!CurrentRenderer) return null;
	return <CurrentRenderer {...props} />;
}
