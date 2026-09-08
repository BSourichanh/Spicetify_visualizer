import React, { useCallback, useContext, useMemo } from "react";
import AnimatedCanvas from "../AnimatedCanvas";
import { decibelsToAmplitude, binarySearchIndex, sampleSegmentedFunction, smoothstep, mapLinear } from "../../math";
import { parseRhythmString } from "../../RhythmString";
import { ErrorHandlerContext, ErrorRecovery } from "../../error";
import { DEFAULT_COLOR, RendererProps } from "../../defs";
import { AudioSyncManager } from "../../audio-sync";

import {
	buildAmplitudeCurve,
	drawBassBloom,
	drawPolygon,
	extractAudioFeatures,
	getLuminousColor,
	getThemeColor
} from "./visualizerUtils";

type CanvasData = {
	themeColor: Spicetify.Color;
	spectrumData: { x: number; y: number }[][];
	audioAnalysis?: SpotifyAudioAnalysis;
	amplitudeCurve: CurveEntry[];
};

type RendererState =
	| {
			isError: true;
	  }
	| {
			isError: false;
	  };

export default function SpectrumVisualizer(props: RendererProps) {
	const onError = useContext(ErrorHandlerContext);

	const audioAnalysis = useMemo(() => {
		const result = props.trackData.audioAnalysis;

		if (result?.error) onError(result.error, ErrorRecovery.MANUAL);
		return result?.value;
	}, [props.trackData.audioAnalysis]);

	const amplitudeCurve = useMemo(() => {
		return buildAmplitudeCurve(audioAnalysis);
	}, [audioAnalysis]);

	const spectrumData = useMemo(() => {
		if (!audioAnalysis) return [];

		if (audioAnalysis.track.rhythm_version !== 1) {
			onError(
				`Error: Unsupported rhythmstring version ${audioAnalysis.track.rhythm_version}`,
				ErrorRecovery.SONG_CHANGE
			);
			return [];
		}

		const segments = audioAnalysis.segments;
		const rhythm = parseRhythmString(audioAnalysis.track.rhythmstring);

		if (segments.length === 0 || rhythm.length === 0) return [];

		const RHYTHM_WEIGHT = 0.4;
		const RHYTHM_OFFSET = 0.2;
		const FALLOFF_SPEED = 0.4;

		const rhythmWindowSize = (RHYTHM_WEIGHT / Math.sqrt(2)) * 8;

		const channelCount = 12 * rhythm.length;
		const channelSegments: number[][] = [];

		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			const amplitudeStart = decibelsToAmplitude(segment.loudness_start);
			const amplitudeMax = decibelsToAmplitude(segment.loudness_max);
			const peakPosition = segment.start + segment.loudness_max_time;
			const pitches = segment.pitches;

			const rhythmWindowStart = peakPosition - rhythmWindowSize;
			const rhythmWindowEnd = peakPosition + rhythmWindowSize;
			const frequencies = rhythm.map(channel => {
				const start = binarySearchIndex(channel, e => e, rhythmWindowStart);
				const end = binarySearchIndex(channel, e => e, rhythmWindowEnd);

				return (
					channel
						.slice(start, end)
						.map(e => Math.exp(-Math.pow((e - peakPosition) / RHYTHM_WEIGHT, 2)))
						.reduce((a, b) => a + b, 0) + RHYTHM_OFFSET
				);
			});

			const frequenciesMax = Math.max(...frequencies);
			for (let i = 0; i < frequencies.length; i++) frequencies[i] /= frequenciesMax;

			const channels: number[] = Array(channelCount);
			for (let j = 0; j < frequencies.length; j++) {
				const pitchVariation = mapLinear(j, 0, frequencies.length - 1, 0.2, 0.6);

				for (let k = 0; k < 12; k++) {
					const frequency = sampleSegmentedFunction(
						[...frequencies.entries()],
						e => e[0],
						e => e[1],
						smoothstep,
						j + k / 12
					);
					const pitchAvg = pitches.reduce((a, b) => a + b, 0) / pitches.length;
					const pitch = pitches[k] * pitchVariation + pitchAvg * (1 - pitchVariation);
					channels[12 * j + k] = frequency * pitch;
				}
			}

			channelSegments.push([segment.start, ...channels.map(c => c * amplitudeStart)]);
			channelSegments.push([peakPosition, ...channels.map(c => c * amplitudeMax)]);

			if (i == segments.length - 1) {
				const amplitudeEnd = decibelsToAmplitude(segment.loudness_end);
				channelSegments.push([segment.start + segment.duration, ...channels.map(c => c * amplitudeEnd)]);
			}
		}

		const spectrumData: { x: number; y: number }[][] = Array(channelCount)
			.fill(0)
			.map(_ => Array(channelSegments.length));
		for (let i = 0; i < channelCount; i++) {
			let channelIndex = 0;
			let prevSegment = { x: 0, y: 0 };
			let prevPeak = { x: 0, y: 0 };

			for (let j = 0; j < channelSegments.length; j++) {
				const currentSegment = { x: channelSegments[j][0], y: channelSegments[j][i + 1] };
				const currentEnd = currentSegment.x + currentSegment.y / FALLOFF_SPEED;
				const prevPeakEnd = prevPeak.x + prevPeak.y / FALLOFF_SPEED;

				if (currentEnd > prevPeakEnd) {
					if (prevPeak.x !== prevSegment.x) {
						const m1 = (currentSegment.y - prevSegment.y) / (currentSegment.x - prevSegment.x);
						const b1 = prevSegment.y - m1 * prevSegment.x;
						const m2 = -FALLOFF_SPEED;
						const b2 = prevPeak.y - m2 * prevPeak.x;

						const cx = (b2 - b1) / (m1 - m2);
						const cy = m1 * cx + b1;

						spectrumData[i][channelIndex] = { x: cx, y: cy };
						channelIndex++;
					}

					prevPeak = currentSegment;

					spectrumData[i][channelIndex] = currentSegment;
					channelIndex++;
				}

				prevSegment = currentSegment;
			}

			spectrumData[i].length = channelIndex;
		}

		return spectrumData;
	}, [audioAnalysis]);

	const onInit = useCallback((ctx: CanvasRenderingContext2D | null): RendererState => {
		if (!ctx) {
			onError("Error: 2D rendering is not supported", ErrorRecovery.NONE);
			return { isError: true };
		}

		return {
			isError: false
		};
	}, []);

	const onResize = useCallback((ctx: CanvasRenderingContext2D | null, state: RendererState) => {
		if (state.isError || !ctx) return;
	}, []);

	const onRender = useCallback((ctx: CanvasRenderingContext2D | null, data: CanvasData, state: RendererState) => {
		if (state.isError || !ctx) return;

		const { width, height } = ctx.canvas;
		if (width <= 0 || height <= 0) return;

		ctx.clearRect(0, 0, width, height);

		const progress = AudioSyncManager.getProgress();
		const features = extractAudioFeatures(data.audioAnalysis, data.amplitudeCurve, progress);
		const { bassEnergy, midEnergy, trebleEnergy, vocalEnergy, transientEnergy } = features;

		const colorInfo = getThemeColor(data.themeColor);
		const luminous = getLuminousColor(colorInfo, bassEnergy);
		const baseColor = luminous.css;
		const glowColor = luminous.glowCss;

		const idleTime = performance.now() * 0.001;

		// Bottom bass bloom halo
		drawBassBloom(ctx, width * 0.5, height, Math.max(width * 0.5, height * 0.6), colorInfo, bassEnergy);

		const barCount = data.spectrumData.length;
		if (barCount === 0) return;

		const barWidth = (width / barCount) * 0.72;
		const spaceWidth = (width - barWidth * barCount) / (barCount + 1);

		const peakPoints: { x: number; y: number }[] = [];

		ctx.save();
		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		// 1. Draw Ethereal Translucent Spectrum Bars
		for (let i = 0; i < barCount; i++) {
			const value = sampleSegmentedFunction(
				data.spectrumData[i],
				x => x.x,
				x => x.y,
				x => x,
				progress
			);
			const barHeight = value * height * (0.85 + midEnergy * 0.2 + bassEnergy * 0.15);
			const barX = spaceWidth * (i + 1) + barWidth * i;
			const barY = height - barHeight;

			peakPoints.push({ x: barX + barWidth * 0.5, y: barY });

			if (barHeight < 2) continue;

			// Translucent gradient fill (ethereal, not solid plastic)
			const grad = ctx.createLinearGradient(barX, height, barX, barY);
			grad.addColorStop(0, "transparent");
			grad.addColorStop(0.3, glowColor);
			grad.addColorStop(1, baseColor);

			ctx.fillStyle = grad;
			ctx.globalAlpha = Math.max(0.15, Math.min(0.7, 0.35 + value * 0.45 + vocalEnergy * 0.2));
			ctx.fillRect(barX, barY, barWidth, barHeight);

			// Delicate 1px wireframe outline
			ctx.strokeStyle = baseColor;
			ctx.lineWidth = 0.8;
			ctx.shadowBlur = 6 + bassEnergy * 18;
			ctx.shadowColor = glowColor;
			ctx.strokeRect(barX, barY, barWidth, barHeight);

			// Crown each active bar with a faceted geometric diamond node
			if (barHeight > 8) {
				const particleSize = Math.max(1.8, 2.5 + value * 3.5 + trebleEnergy * 2.5);
				ctx.save();
				ctx.translate(barX + barWidth * 0.5, barY - 4);
				ctx.rotate(idleTime + i);
				drawPolygon(ctx, 0, 0, particleSize, 4, 0);
				ctx.fillStyle = value > 0.4 ? "#ffffff" : baseColor;
				ctx.fill();
				ctx.stroke();
				ctx.restore();
			}
		}

		// 2. Abstract Geometric Constellation Wireframe connecting neighboring peaks
		ctx.lineWidth = 0.7;
		ctx.strokeStyle = baseColor;
		ctx.globalAlpha = 0.12 + midEnergy * 0.22 + transientEnergy * 0.25;
		ctx.shadowBlur = 8 + trebleEnergy * 16;
		ctx.shadowColor = glowColor;

		ctx.beginPath();
		for (let i = 0; i < peakPoints.length - 1; i++) {
			const p1 = peakPoints[i];
			const p2 = peakPoints[i + 1];
			if (i === 0) ctx.moveTo(p1.x, p1.y);
			ctx.lineTo(p2.x, p2.y);
		}
		ctx.stroke();

		ctx.restore();
	}, []);

	return (
		<AnimatedCanvas
			isEnabled={props.isEnabled}
			data={{
				themeColor: props.trackData.extractedColor?.value ?? Spicetify.Color.fromHex(DEFAULT_COLOR),
				spectrumData,
				audioAnalysis,
				amplitudeCurve
			}}
			contextType="2d"
			onInit={onInit}
			onResize={onResize}
			onRender={onRender}
			style={{
				width: "100%",
				height: "100%"
			}}
		/>
	);
}
