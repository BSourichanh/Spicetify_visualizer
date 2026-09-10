import { MetadataService } from "spicetify-utils";
import DebugVisualizer from "./components/renderer/DebugVisualizer";
import RandomVisualizer from "./components/renderer/RandomVisualizer";
import ChaosVisualizer from "./components/renderer/ChaosVisualizer";
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
		name: "🔀 Random",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: RandomVisualizer
	},
	chaos: {
		name: "💥 Chaos",
		requiredAudioData: ["audioAnalysis", "extractedColor"],
		renderer: ChaosVisualizer
	},
	debug: {
		name: "🛠️ Debug",
		requiredAudioData: ["audioAnalysis", "beats", "threebandWaveforms", "vocalActivity"],
		renderer: DebugVisualizer
	}
};

// Enregistrer les modes générés automatiquement dans RENDERERS
import "./components/renderer/modes.generated";

export const DEFAULT_COLOR = "#535353";
