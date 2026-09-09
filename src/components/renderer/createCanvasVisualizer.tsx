import React, { useCallback, useContext, useMemo } from "react";
import AnimatedCanvas from "../AnimatedCanvas";
import { ErrorHandlerContext, ErrorRecovery } from "../../error";
import { RendererProps } from "../../defs";
import { AudioSyncManager } from "../../audio-sync";
import {
	buildAmplitudeCurve,
	drawBackgroundShockwave,
	extractAudioFeatures,
	getThemeColor,
	getThemePalette,
	getVisualizerCenter,
	neonCurrentManager
} from "./visualizerUtils";
import { AudioFeatures } from "./core/audioFeatures";
import { ThemePalette } from "./core/palette";
import { getVisualizerSettings } from "../../settings/settingsManager";

export type ModeRenderFunction = (
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	features: AudioFeatures,
	palette: ThemePalette
) => void;

export type ModeConfig = {
	id: string;
	name: string;
	render: ModeRenderFunction;
	randomPool?: boolean;
};

type CanvasData = {
	themeColor: any;
	audioAnalysis?: SpotifyAudioAnalysis;
	amplitudeCurve: CurveEntry[];
};

type RendererState = {
	isError: boolean;
};

export function createCanvasVisualizer(render: ModeRenderFunction, modeName = "Visualizer") {
	return function ModeVisualizer(props: RendererProps) {
		const onError = useContext(ErrorHandlerContext);

		const audioAnalysis = useMemo(() => {
			const result = props.trackData.audioAnalysis;
			if (result?.error) console.warn(`[Visualizer] ${modeName}:`, result.error);
			return result?.value;
		}, [props.trackData.audioAnalysis]);

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

		const onRender = useCallback(
			(ctx: CanvasRenderingContext2D | null, data: CanvasData, state: RendererState) => {
				if (state.isError || !ctx) return;

				try {
					const { width, height } = ctx.canvas;
					if (width <= 0 || height <= 0) return;

					// Fond 100% transparent
					ctx.clearRect(0, 0, width, height);

					const progress = AudioSyncManager.getProgress();
					const settings = getVisualizerSettings();

					const rawFeatures = extractAudioFeatures(data.audioAnalysis, data.amplitudeCurve, progress);
					const bassEnergy = Math.max(0.05, Math.min(1.0, rawFeatures.bassEnergy * settings.punchScale));
					const punch = Math.max(0, Math.min(1.0, rawFeatures.punch * settings.punchScale));
					const energyTime = rawFeatures.energyTime * settings.speedScale;

					const features: AudioFeatures = {
						...rawFeatures,
						bassEnergy,
						punch,
						energyTime
					};

					// Palette : couleur de l'album ou couleur personnalisée
					const activeColor = settings.colorMode === "custom" ? settings.customColor : data.themeColor;
					const colorInfo = getThemeColor(activeColor);
					const palette = getThemePalette(
						colorInfo,
						bassEnergy,
						punch,
						features.valence,
						features.energy,
						settings.glowScale
					);

					// 1. Onde de choc d'arrière-plan sur les basses (rendue derrière le modèle)
					drawBackgroundShockwave(ctx, width, height, features, palette, settings);

					// 2. Mise à jour de la propagation du courant néon à travers le modèle
					neonCurrentManager.update(features, settings);

					// 3. Échelle du visuel centrée optiquement (Modèle en premier plan)
					ctx.save();
					if (settings.sizeScale !== 1.0) {
						const { cx, cy } = getVisualizerCenter(ctx);
						ctx.translate(cx, cy);
						ctx.scale(settings.sizeScale, settings.sizeScale);
						ctx.translate(-cx, -cy);
					}

					render(ctx, width, height, features, palette);
					ctx.restore();
				} catch (err) {
					console.error(`[Visualizer] ${modeName} render error:`, err);
				}
			},
			[render, modeName]
		);

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
				onInit={onInit}
				onResize={onResize}
				onRender={onRender}
				data={canvasData}
				isEnabled={props.isEnabled}
			/>
		);
	};
}
