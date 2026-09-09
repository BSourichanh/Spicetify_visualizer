import React, { useCallback, useContext, useMemo } from "react";
import AnimatedCanvas from "../AnimatedCanvas";
import { ErrorHandlerContext, ErrorRecovery } from "../../error";
import { RendererProps } from "../../defs";
import { AudioSyncManager } from "../../audio-sync";
import {
	buildAmplitudeCurve,
	drawBackgroundShockwave,
	drawBigBangAmbient,
	drawFireflies,
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
	palette: ThemePalette,
	analysis?: SpotifyAudioAnalysis
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

		const featuresRef = React.useRef<AudioFeatures | null>(null);

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
					const settings = getVisualizerSettings();

					// Fond 100% transparent (ou tamisé si backgroundDim est activé)
					ctx.clearRect(0, 0, width, height);
					if (settings.backgroundDim > 0) {
						ctx.fillStyle = `rgba(0, 0, 0, ${settings.backgroundDim})`;
						ctx.fillRect(0, 0, width, height);
					}

					const isPlaying =
						typeof Spicetify?.Player?.isPlaying === "function" ? Spicetify.Player.isPlaying() : true;
					const progress = AudioSyncManager.getProgress();

					const rawFeatures = extractAudioFeatures(data.audioAnalysis, data.amplitudeCurve, progress);
					const bassEnergy = isPlaying
						? Math.max(
								0.05,
								Math.min(
									1.0,
									rawFeatures.bassEnergy * settings.punchScale * (settings.bassScale ?? 1.0)
								)
							)
						: 0.05;
					const punch = isPlaying ? Math.max(0, Math.min(1.0, rawFeatures.punch * settings.punchScale)) : 0;
					const trebleEnergy = isPlaying
						? Math.max(0.05, Math.min(1.0, rawFeatures.trebleEnergy * (settings.trebleScale ?? 1.0)))
						: 0.05;
					const energyTime = rawFeatures.energyTime * settings.speedScale;

					// Réutilisation de l'objet AudioFeatures (Zéro allocation par trame)
					if (!featuresRef.current) {
						featuresRef.current = {
							...rawFeatures,
							isPlaying,
							beatIntensity: isPlaying ? rawFeatures.beatIntensity : 0,
							transientEnergy: isPlaying ? rawFeatures.transientEnergy : 0,
							bassEnergy,
							punch,
							trebleEnergy,
							energyTime
						};
					} else {
						const f = featuresRef.current;
						Object.assign(f, rawFeatures);
						f.isPlaying = isPlaying;
						f.beatIntensity = isPlaying ? rawFeatures.beatIntensity : 0;
						f.transientEnergy = isPlaying ? rawFeatures.transientEnergy : 0;
						f.bassEnergy = bassEnergy;
						f.punch = punch;
						f.trebleEnergy = trebleEnergy;
						f.energyTime = energyTime;
					}
					const features = featuresRef.current;

					// Palette : couleur de l'album, couleur fixe ou cycle chromatique arc-en-ciel
					let colorInfo: { r: number; g: number; b: number };
					if (settings.colorCycleEnabled) {
						const timeSec = performance.now() * 0.001 * (settings.colorCycleSpeed ?? 1.0);
						colorInfo = {
							r: Math.round(128 + 127 * Math.sin(timeSec * 1.4)),
							g: Math.round(128 + 127 * Math.sin(timeSec * 1.4 + (2 * Math.PI) / 3)),
							b: Math.round(128 + 127 * Math.sin(timeSec * 1.4 + (4 * Math.PI) / 3))
						};
					} else {
						const activeColor = settings.colorMode === "custom" ? settings.customColor : data.themeColor;
						colorInfo = getThemeColor(activeColor);
					}

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

					// 2. Lucioles bioluminescentes flottantes (sursaut d'intensité au passage de l'onde)
					drawFireflies(ctx, width, height, features, palette, settings);

					// 3. Ambiance & Arrière-plan Big Bang Cosmic Origin (onde d'inflation, nébuleuse, poussière cosmique)
					if (settings.bigBangAmbientEnabled && modeName !== "💥 Big Bang") {
						drawBigBangAmbient(ctx, width, height, features, palette, settings);
					}

					// 4. Mise à jour de la propagation du courant néon à travers le modèle
					neonCurrentManager.update(features, settings);

					// 4. Échelle du visuel centrée optiquement (Modèle en premier plan)
					ctx.save();
					if (settings.sizeScale !== 1.0) {
						const { cx, cy } = getVisualizerCenter(ctx);
						ctx.translate(cx, cy);
						ctx.scale(settings.sizeScale, settings.sizeScale);
						ctx.translate(-cx, -cy);
					}

					render(ctx, width, height, features, palette, data.audioAnalysis);
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
