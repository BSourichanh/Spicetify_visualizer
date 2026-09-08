import {
	AudioAttributesV2,
	Beats,
	CacheStatus,
	ColorResult,
	ExtensionKind,
	MetadataService,
	parseProtobuf,
	PBValue,
	PBValueTypeOf,
	ThreebandWaveforms,
	VocalActivity
} from "spicetify-utils";
import { DEFAULT_COLOR, Result } from "./defs";

async function loadMetadata<T>(
	metadataService: MetadataService,
	extensionKind: ExtensionKind,
	typeUrl: string,
	parser: PBValue<T>,
	entityUri: string
): Promise<{ value: T } | { error: CacheStatus }> {
	try {
		const responseData = await metadataService.fetch(extensionKind, entityUri);
		if (!responseData || responseData.value.length === 0 || responseData.typeUrl !== typeUrl)
			return { error: CacheStatus.UNKNOWN };

		return { value: parseProtobuf(responseData.value, parser) };
	} catch (e) {
		return { error: e as CacheStatus };
	}
}

export function generateFallbackAudioAnalysis(durationSeconds: number): SpotifyAudioAnalysis {
	const tempo = 124;
	const safeDuration = Number.isFinite(durationSeconds) && durationSeconds > 5 ? durationSeconds : 180;
	const beatInterval = 60 / tempo;
	const beatsCount = Math.ceil(safeDuration / beatInterval);
	const beats: { start: number; duration: number; confidence: number }[] = [];
	const tatums: { start: number; duration: number; confidence: number }[] = [];
	const bars: { start: number; duration: number; confidence: number }[] = [];
	const sections: any[] = [];

	for (let i = 0; i < beatsCount; i++) {
		const start = i * beatInterval;
		beats.push({
			start,
			duration: beatInterval,
			confidence: 0.85 + 0.15 * Math.sin(i * 0.5)
		});
		tatums.push({
			start,
			duration: beatInterval / 2,
			confidence: 0.7
		});
		tatums.push({
			start: start + beatInterval / 2,
			duration: beatInterval / 2,
			confidence: 0.7
		});
		if (i % 4 === 0) {
			bars.push({
				start,
				duration: beatInterval * 4,
				confidence: 0.8
			});
		}
	}

	const sectionDuration = beatInterval * 4 * 16;
	const sectionCount = Math.ceil(safeDuration / sectionDuration);
	for (let i = 0; i < sectionCount; i++) {
		sections.push({
			start: i * sectionDuration,
			duration: Math.min(sectionDuration, safeDuration - i * sectionDuration),
			confidence: 1,
			loudness: -10,
			tempo,
			tempo_confidence: 0.9,
			key: (i * 5) % 12,
			key_confidence: 0.8,
			mode: 1,
			mode_confidence: 0.8,
			time_signature: 4,
			time_signature_confidence: 1
		});
	}

	const segmentInterval = 0.2;
	const segmentsCount = Math.ceil(safeDuration / segmentInterval);
	const segments: any[] = [];
	for (let i = 0; i < segmentsCount; i++) {
		const start = i * segmentInterval;
		const beatPos = (start % beatInterval) / beatInterval;
		const phraseCycle = (start % 30) / 30;
		const phraseAmp = 0.6 + 0.4 * Math.sin(phraseCycle * Math.PI);
		const beatAmp = Math.pow(Math.max(0, 1 - beatPos), 1.5) * 0.4;
		const normLoudness = Math.max(0.05, Math.min(1, phraseAmp * 0.6 + beatAmp));

		const loudness_start = -50 + normLoudness * 42;
		const loudness_max = loudness_start + 4;
		const loudness_end = loudness_start - 2;

		const chordRoot = (Math.floor(start / (beatInterval * 8)) * 5) % 12;
		const pitches = Array.from({ length: 12 }, (_, p) => {
			const isRoot = p === chordRoot;
			const isThird = p === (chordRoot + 4) % 12 || p === (chordRoot + 3) % 12;
			const isFifth = p === (chordRoot + 7) % 12;
			const isOctave = p === (chordRoot + 11) % 12;
			let val = 0.15;
			if (isRoot) val = 0.95;
			else if (isFifth) val = 0.8;
			else if (isThird) val = 0.65;
			else if (isOctave) val = 0.5;
			val += 0.15 * Math.sin(start * 3 + p);
			return Math.max(0, Math.min(1, val));
		});

		segments.push({
			start,
			duration: segmentInterval,
			confidence: 0.8,
			loudness_start,
			loudness_max_time: 0.05,
			loudness_max,
			loudness_end,
			pitches,
			timbre: [12, -35, -80, -70, 30, -30, -35, -2, -20, 1, 3, -15]
		});
	}

	return {
		bars,
		beats,
		tatums,
		sections,
		segments,
		track: {
			duration: safeDuration,
			tempo,
			tempo_confidence: 0.9,
			time_signature: 4,
			time_signature_confidence: 1,
			key: 0,
			key_confidence: 0.8,
			mode: 1,
			mode_confidence: 0.8,
			loudness: -8,
			rhythm_version: 1,
			rhythmstring: "eJyNXAmS5Liuu4qPYO3S_S_2CYCU5K",
			analysis_sample_rate: 22050,
			analysis_channels: 1,
			end_of_fade_in: 0,
			start_of_fade_out: Math.max(0, safeDuration - 5),
			num_samples: Math.round(safeDuration * 22050),
			offset_seconds: 0,
			window_seconds: 0,
			codestring: "",
			code_version: 3.15,
			echoprintstring: "",
			echoprint_version: 4.12,
			synchstring: "",
			synch_version: 1,
			sample_md5: ""
		}
	} as unknown as SpotifyAudioAnalysis;
}

export async function loadAudioAnalysis(item: Spicetify.PlayerTrack): Promise<Result<SpotifyAudioAnalysis>> {
	const durationSeconds = item.metadata?.duration ? parseInt(item.metadata.duration, 10) / 1000 : 180;
	try {
		const uri = Spicetify.URI.fromString(item.uri);
		const analysisRequestUrl = `https://spclient.wg.spotify.com/audio-attributes/v1/audio-analysis/${uri.id}?format=json`;

		const audioAnalysis = await Spicetify.CosmosAsync.get(analysisRequestUrl).catch(e => {
			console.warn("[Visualizer] CosmosAsync get failed:", e);
			return null;
		});

		if (
			audioAnalysis &&
			typeof audioAnalysis === "object" &&
			"track" in audioAnalysis &&
			"segments" in audioAnalysis &&
			Array.isArray(audioAnalysis.segments) &&
			audioAnalysis.segments.length > 0
		) {
			return { value: audioAnalysis };
		}
	} catch (e) {
		console.warn("[Visualizer] Error loading audio analysis from Spotify:", e);
	}

	// Graceful procedural fallback: keeps the visualizer running smoothly even if track has no audio analysis
	console.info("[Visualizer] Using high-reactivity procedural audio features for track:", item.name || item.uri);
	return { value: generateFallbackAudioAnalysis(durationSeconds) };
}

export async function loadExtractedColor(
	item: Spicetify.PlayerTrack,
	metadataService: MetadataService
): Promise<Result<Spicetify.Color>> {
	try {
		const result = await loadMetadata(
			metadataService,
			ExtensionKind.EXTRACTED_COLOR,
			"type.googleapis.com/spotify.context_track_color.ColorResult",
			ColorResult,
			item.metadata?.image_url
		);

		if ("error" in result) {
			return {
				value: Spicetify.Color?.fromHex
					? Spicetify.Color.fromHex(DEFAULT_COLOR)
					: ({ rgb: { r: 83, g: 83, b: 83 } } as any)
			};
		}

		const colorHex = result.value.colorLight?.rgb?.toString(16).padStart(6, "0");
		return {
			value:
				colorHex && Spicetify.Color?.fromHex
					? Spicetify.Color.fromHex(`#${colorHex}`)
					: Spicetify.Color?.fromHex
						? Spicetify.Color.fromHex(DEFAULT_COLOR)
						: ({ rgb: { r: 83, g: 83, b: 83 } } as any)
		};
	} catch (e) {
		return {
			value: Spicetify.Color?.fromHex
				? Spicetify.Color.fromHex(DEFAULT_COLOR)
				: ({ rgb: { r: 83, g: 83, b: 83 } } as any)
		};
	}
}

export async function loadAudioAttributes(
	item: Spicetify.PlayerTrack,
	metadataService: MetadataService
): Promise<Result<PBValueTypeOf<typeof AudioAttributesV2>>> {
	const result = await loadMetadata(
		metadataService,
		ExtensionKind.AUDIO_ATTRIBUTES_V2,
		"type.googleapis.com/spotify.playlistmixing.extensions.audio_attributes.v2.AudioAttributes",
		AudioAttributesV2,
		item.uri
	);

	if ("error" in result) return { error: `Could not load audio attributes. Status: ${CacheStatus[result.error]}` };

	return { value: result.value };
}

export async function loadBeats(
	item: Spicetify.PlayerTrack,
	metadataService: MetadataService
): Promise<Result<PBValueTypeOf<typeof Beats>>> {
	const result = await loadMetadata(
		metadataService,
		ExtensionKind.BEATS,
		"type.googleapis.com/spotify.playlistmixing.extensions.mixbeats.Beats",
		Beats,
		item.uri
	);

	if ("error" in result) return { error: `Could not load beats. Status: ${CacheStatus[result.error]}` };

	return { value: result.value };
}

export async function loadVocalActivity(
	item: Spicetify.PlayerTrack,
	metadataService: MetadataService
): Promise<Result<PBValueTypeOf<typeof VocalActivity>>> {
	const result = await loadMetadata(
		metadataService,
		ExtensionKind.VOCAL_ACTIVITY,
		"type.googleapis.com/spotify.playlistmixing.extensions.mixvocalactivity.VocalActivity",
		VocalActivity,
		item.uri
	);

	if ("error" in result) return { error: `Could not load vocal activity. Status: ${CacheStatus[result.error]}` };

	return { value: result.value };
}

export async function loadThreebandWaveform(
	item: Spicetify.PlayerTrack,
	metadataService: MetadataService
): Promise<Result<PBValueTypeOf<typeof ThreebandWaveforms>>> {
	const result = await loadMetadata(
		metadataService,
		ExtensionKind.THREEBAND_WAVEFORMS,
		"type.googleapis.com/spotify.playlistmixing.extensions.mixthreebandwaveforms.ThreeBandWaveforms",
		ThreebandWaveforms,
		item.uri
	);

	if ("error" in result) return { error: `Could not load threeband waveform. Status: ${CacheStatus[result.error]}` };

	return { value: result.value };
}
