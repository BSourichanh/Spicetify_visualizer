import React, { useEffect, useMemo, useRef, useState } from "react";
import { RendererProps } from "../../defs";
import { GENERATED_RANDOM_VISUALIZERS } from "./modes.generated";
import { getVisualizerSettings, subscribeToSettings } from "../../settings/settingsManager";

export default function RandomVisualizer(props: RendererProps) {
	const [currentIndex, setCurrentIndex] = useState(() =>
		GENERATED_RANDOM_VISUALIZERS.length > 0 ? Math.floor(Math.random() * GENERATED_RANDOM_VISUALIZERS.length) : 0
	);
	const [randomInterval, setRandomInterval] = useState(() => getVisualizerSettings().randomInterval);

	useEffect(() => {
		return subscribeToSettings(newSettings => {
			if (typeof newSettings.randomInterval === "number") {
				setRandomInterval(newSettings.randomInterval);
			}
		});
	}, []);

	// Auto-cycle selon le délai configuré dans les options
	useEffect(() => {
		if (GENERATED_RANDOM_VISUALIZERS.length <= 1) return;
		const intervalMs = Math.max(3000, (randomInterval || 30) * 1000);
		const interval = setInterval(() => {
			setCurrentIndex(prev => {
				let next = Math.floor(Math.random() * (GENERATED_RANDOM_VISUALIZERS.length - 1));
				if (next >= prev) next += 1;
				return next;
			});
		}, intervalMs);

		return () => clearInterval(interval);
	}, [randomInterval]);

	// Changer de mode aléatoire au changement de morceau
	const currentTrackUri = Spicetify?.Player?.data?.item?.uri;
	const prevTrackUriRef = useRef<string | undefined>(currentTrackUri);
	useEffect(() => {
		if (currentTrackUri && prevTrackUriRef.current && currentTrackUri !== prevTrackUriRef.current) {
			if (GENERATED_RANDOM_VISUALIZERS.length > 1) {
				setCurrentIndex(prev => {
					let next = Math.floor(Math.random() * (GENERATED_RANDOM_VISUALIZERS.length - 1));
					if (next >= prev) next += 1;
					return next;
				});
			}
		}
		prevTrackUriRef.current = currentTrackUri;
	}, [currentTrackUri]);

	const CurrentRenderer = useMemo(() => {
		return GENERATED_RANDOM_VISUALIZERS[currentIndex]?.Component ?? null;
	}, [currentIndex]);

	if (!CurrentRenderer) return null;
	return <CurrentRenderer {...props} />;
}
