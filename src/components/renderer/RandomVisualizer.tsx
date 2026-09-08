import React, { useEffect, useMemo, useState } from "react";
import { RendererProps } from "../../defs";
import CyberRingsVisualizer from "./CyberRingsVisualizer";
import NeonWavesVisualizer from "./NeonWavesVisualizer";
import KaleidoVisualizer from "./KaleidoVisualizer";
import NeonTunnelVisualizer from "./NeonTunnelVisualizer";
import SolarFlareVisualizer from "./SolarFlareVisualizer";
import CyberRainVisualizer from "./CyberRainVisualizer";
import LissajousVisualizer from "./LissajousVisualizer";
import PolyhedraVisualizer from "./PolyhedraVisualizer";
import StarfieldVisualizer from "./StarfieldVisualizer";
import HarmonicStringsVisualizer from "./HarmonicStringsVisualizer";
import LiquidBlobVisualizer from "./LiquidBlobVisualizer";
import HexGridVisualizer from "./HexGridVisualizer";
import DnaHelixVisualizer from "./DnaHelixVisualizer";

const VISUALIZERS = [
	{ name: "Cyber Rings", Component: CyberRingsVisualizer },
	{ name: "Neon Waves", Component: NeonWavesVisualizer },
	{ name: "Kaleido Matrix", Component: KaleidoVisualizer },
	{ name: "Neon Tunnel", Component: NeonTunnelVisualizer },
	{ name: "Solar Flare", Component: SolarFlareVisualizer },
	{ name: "Cyber Rain", Component: CyberRainVisualizer },
	{ name: "Lissajous Knot", Component: LissajousVisualizer },
	{ name: "Sacred Polyhedra", Component: PolyhedraVisualizer },
	{ name: "Starfield Warp", Component: StarfieldVisualizer },
	{ name: "Harmonic Strings", Component: HarmonicStringsVisualizer },
	{ name: "Liquid Blob", Component: LiquidBlobVisualizer },
	{ name: "Hex Grid", Component: HexGridVisualizer },
	{ name: "DNA Helix", Component: DnaHelixVisualizer }
];

export default function RandomVisualizer(props: RendererProps) {
	const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * VISUALIZERS.length));

	// Kept stable across track changes - does NOT switch template when music changes

	// Also auto-cycle every 45 seconds if the track is long
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentIndex(prev => {
				let next = Math.floor(Math.random() * (VISUALIZERS.length - 1));
				if (next >= prev) next += 1;
				return next;
			});
		}, 45000);

		return () => clearInterval(interval);
	}, []);

	const CurrentRenderer = useMemo(() => {
		return VISUALIZERS[currentIndex]?.Component ?? CyberRingsVisualizer;
	}, [currentIndex]);

	return <CurrentRenderer {...props} />;
}
