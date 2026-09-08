import { MetadataService } from "spicetify-utils";
import DebugVisualizer from "./components/renderer/DebugVisualizer";
import NCSVisualizer from "./components/renderer/NCSVisualizer";
import SpectrumVisualizer from "./components/renderer/SpectrumVisualizer";
import CyberRingsVisualizer from "./components/renderer/CyberRingsVisualizer";
import NeonWavesVisualizer from "./components/renderer/NeonWavesVisualizer";
import KaleidoVisualizer from "./components/renderer/KaleidoVisualizer";
import NeonTunnelVisualizer from "./components/renderer/NeonTunnelVisualizer";
import SolarFlareVisualizer from "./components/renderer/SolarFlareVisualizer";
import CyberRainVisualizer from "./components/renderer/CyberRainVisualizer";
import LissajousVisualizer from "./components/renderer/LissajousVisualizer";
import PolyhedraVisualizer from "./components/renderer/PolyhedraVisualizer";
import StarfieldVisualizer from "./components/renderer/StarfieldVisualizer";
import HarmonicStringsVisualizer from "./components/renderer/HarmonicStringsVisualizer";
import LiquidBlobVisualizer from "./components/renderer/LiquidBlobVisualizer";
import HexGridVisualizer from "./components/renderer/HexGridVisualizer";
import DnaHelixVisualizer from "./components/renderer/DnaHelixVisualizer";
import RandomVisualizer from "./components/renderer/RandomVisualizer";
import {
	loadAudioAnalysis,
	loadAudioAttributes,
	loadBeats,
	loadExtractedColor,
	loadThreebandWaveform,
	loadVocalActivity
} from "./loaders";

export type Result<T> = { value: T; error?: undefined } | { value?: undefined; error: string };
export type LoaderDefinition<T> = (item: Spicetify.PlayerTrack, metadataService: MetadataService) => Promise<Result<T>>;

export const LOADERS = {
	audioAnalysis: loadAudioAnalysis,
	extractedColor: loadExtractedColor,

	audioAttributes: loadAudioAttributes,
	beats: loadBeats,
	vocalActivity: loadVocalActivity,
	threebandWaveforms: loadThreebandWaveform
}; // satisfies Record<string, LoaderDefinition<any>>;
export type LoaderID = keyof typeof LOADERS;

export type LoaderValue<T extends LoaderID> = (typeof LOADERS)[T] extends LoaderDefinition<infer U> ? U : never;
export type TrackData = { [ID in LoaderID]?: Result<LoaderValue<ID>> };

export type RendererProps = {
	isEnabled: boolean;
	trackData: TrackData;
};

export type RendererDefinition = {
	name: string;
	requiredAudioData: LoaderID[];
	renderer: React.FunctionComponent<RendererProps>;
};

export const RENDERERS: Record<string, RendererDefinition> = {
	random: {
		name: "🔀 Mode Aléatoire (Random)",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: RandomVisualizer
	},
	"cyber-rings": {
		name: "🪼 Méduse Céleste (Jellyfish)",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: CyberRingsVisualizer
	},
	"neon-waves": {
		name: "🌌 Nébuleuse Cosmique (Nebula)",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: NeonWavesVisualizer
	},
	kaleido: {
		name: "🌸 Lotus Astral (Astral Blossom)",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: KaleidoVisualizer
	},
	"neon-tunnel": {
		name: "🕳️ Trou Noir & Accrétion (Singularity)",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: NeonTunnelVisualizer
	},
	"solar-flare": {
		name: "☀️ Éclipse Stellaire & Couronne",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: SolarFlareVisualizer
	},
	"cyber-rain": {
		name: "✨ Aurore Boréale (Aurora)",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: CyberRainVisualizer
	},
	lissajous: {
		name: "🪐 Anneaux Célestes de Saturne",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: LissajousVisualizer
	},
	polyhedra: {
		name: "💎 Cristal Astral Diaphane",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: PolyhedraVisualizer
	},
	starfield: {
		name: "🌀 Galaxie Spirale (Spiral Galaxy)",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: StarfieldVisualizer
	},
	"harmonic-strings": {
		name: "🎵 Harpe de Soie Céleste",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: HarmonicStringsVisualizer
	},
	"liquid-blob": {
		name: "💧 Goutte d'Aura Abyssale",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: LiquidBlobVisualizer
	},
	"hex-grid": {
		name: "🔬 Biocellules Luminescentes",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: HexGridVisualizer
	},
	"dna-helix": {
		name: "🧬 Double Hélice de Soie",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: DnaHelixVisualizer
	},
	ncs: {
		name: "NCS",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: NCSVisualizer
	},
	spectrum: {
		name: "Spectrum (very WIP)",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: SpectrumVisualizer
	},
	debug: {
		name: "DEBUG",
		requiredAudioData: ["audioAnalysis", "beats", "threebandWaveforms", "vocalActivity"],
		renderer: DebugVisualizer
	}
};

export const DEFAULT_COLOR = "#535353";
