import React, { useCallback, useContext, useMemo } from "react";
import AnimatedCanvas from "../AnimatedCanvas";
import { ErrorHandlerContext, ErrorRecovery } from "../../error";
import { RendererProps } from "../../defs";
import { AudioSyncManager } from "../../audio-sync";
import {
	buildAmplitudeCurve,
	drawAstralPrism,
	extractAudioFeatures,
	getThemeColor,
	getThemePalette,
	getVisualizerCenter
} from "./visualizerUtils";

type CanvasData = {
	themeColor: any;
	audioAnalysis?: SpotifyAudioAnalysis;
	amplitudeCurve: CurveEntry[];
};

type RendererState = {
	isError: boolean;
};

export default function PolyhedraVisualizer(props: RendererProps) {
	const onError = useContext(ErrorHandlerContext);

	const audioAnalysis = useMemo(() => {
		const result = props.trackData.audioAnalysis;
		if (result?.error) onError(result.error, ErrorRecovery.MANUAL);
		return result?.value;
	}, [props.trackData.audioAnalysis, onError]);

	const amplitudeCurve = useMemo(() => {
		return buildAmplitudeCurve(audioAnalysis);
	}, [audioAnalysis]);

	const onInit = useCallback(
		(ctx: CanvasRenderingContext2D | null): RendererState => {
			if (!ctx) {
				onError("Error: 2D rendering is not supported", ErrorRecovery.NONE);
				return { isError: true };
			}
			return { isError: false };
		},
		[onError]
	);

	const onResize = useCallback((ctx: CanvasRenderingContext2D | null, state: RendererState) => {
		if (state.isError || !ctx) return;
	}, []);

	const onRender = useCallback((ctx: CanvasRenderingContext2D | null, data: CanvasData, state: RendererState) => {
		if (state.isError || !ctx) return;

		try {
			const { width, height } = ctx.canvas;
			if (width <= 0 || height <= 0) return;

			// Fond 100% transparent
			ctx.clearRect(0, 0, width, height);

			const progress = AudioSyncManager.getProgress();
			const features = extractAudioFeatures(data.audioAnalysis, data.amplitudeCurve, progress);
			const { bassEnergy, energyTime, punch } = features;

			// Palette strictement basée sur le thème
			const colorInfo = getThemeColor(data.themeColor);
			const palette = getThemePalette(colorInfo, bassEnergy, punch);

			const { cx, cy } = getVisualizerCenter(ctx);
			const size = Math.min(width, height) * 0.28;

			// Dessin du Cristal Astral Diaphane
			drawAstralPrism(ctx, cx, cy, size, energyTime, bassEnergy, palette);
		} catch (err) {
			console.error("[Visualizer] Polyhedra render error:", err);
		}
	}, []);

	const canvasData = useMemo(() => {
		return {
			themeColor: props.trackData.extractedColor?.value,
			audioAnalysis,
			amplitudeCurve
		};
	}, [props.trackData.extractedColor, audioAnalysis, amplitudeCurve]);

	return (
		<AnimatedCanvas
			contextType="2d"
			isEnabled={props.isEnabled}
			data={canvasData}
			onInit={onInit}
			onResize={onResize}
			onRender={onRender}
		/>
	);
}
