import React, { useEffect, useMemo, useState } from "react";
import { RendererProps } from "../../defs";
import { GENERATED_RANDOM_VISUALIZERS } from "./modes.generated";

export default function RandomVisualizer(props: RendererProps) {
	const [currentIndex, setCurrentIndex] = useState(() =>
		GENERATED_RANDOM_VISUALIZERS.length > 0 ? Math.floor(Math.random() * GENERATED_RANDOM_VISUALIZERS.length) : 0
	);

	// Auto-cycle toutes les 45 secondes si le morceau est long
	useEffect(() => {
		if (GENERATED_RANDOM_VISUALIZERS.length <= 1) return;
		const interval = setInterval(() => {
			setCurrentIndex(prev => {
				let next = Math.floor(Math.random() * (GENERATED_RANDOM_VISUALIZERS.length - 1));
				if (next >= prev) next += 1;
				return next;
			});
		}, 45000);

		return () => clearInterval(interval);
	}, []);

	const CurrentRenderer = useMemo(() => {
		return GENERATED_RANDOM_VISUALIZERS[currentIndex]?.Component ?? null;
	}, [currentIndex]);

	if (!CurrentRenderer) return null;
	return <CurrentRenderer {...props} />;
}
