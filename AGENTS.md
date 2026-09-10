# Spicetify Visualizer — Project Memory & Architecture Guide

This file is automatically loaded by Antigravity agents in any conversation on this repository.
It preserves project architecture, file locations, rules, and workflows to prevent redundant code exploration and minimize token consumption.

---

## 1. Project Architecture & File Map

### Core Architecture
- **Tech Stack**: React 19, TypeScript, Canvas 2D (60 FPS), Spicetify API.
- **Render Loop**: 
  - `src/components/renderer/createCanvasVisualizer.tsx`: High-performance 2D canvas wrapper, audio feature extraction, background layers, neon current, universal glitch post-processing, and main mode dispatch.
  - Zero dynamic object allocation per frame in render functions (Object Pooling Pattern).

### Modes & Discovery
- **Active Modes Directory**: `src/components/renderer/modes/`
  - Each mode exports `modeConfig: ModeConfig` with `id`, `name`, `render(ctx, width, height, features, palette, analysis)`.
  - Active modes: `bigBang.ts`, `astralLotus.ts`, `neonCat.ts`, `cosmicNebula.ts`, `liquidSpectrum.ts`.
- **Auto-Discovery Script**: `scripts/discover-modes.js`
  - Generates `src/components/renderer/modes.generated.ts` automatically before build.
  - To disable a mode: add `.disabled` suffix (e.g. `modes/disabled/bioluminescentJellyfish.ts.disabled`).

### Shared Core FX (Rendered behind, within, or around models)
- `src/components/renderer/core/audioFeatures.ts`: Extracts audio metrics (`bassEnergy`, `punch`, `transientEnergy`, `beatPulse`, `pitches`, `timbre`). Includes adaptive AGC loudness normalization (-9 dB reference), continuous IIR smoothing, and dual-speed ballistics (instant attack, analog release).
- `src/components/renderer/core/glitchFx.ts`: Universal Cyberpunk Glitch engine (horizontal slice displacement, holographic RGB split, data corruption blocks, CRT/VHS tracking scanlines) with zero memory allocations per frame.
- `src/components/renderer/core/backgroundShockwave.ts`: Universal background shockwave (`BackgroundShockwaveEngine`, pool of 5 waves, sensitive to kick transients and drops).
- `src/components/renderer/core/cosmicOrigin.ts`: Ambient background version of Big Bang (`BigBangAmbientEngine`), can render behind any active mode.
- `src/components/renderer/core/fireflies.ts`: Bioluminescent floating particles with shockwave proximity reactivity.
- `src/components/renderer/core/neonCurrent.ts`: Propagating neon current traveling along active models on bass pulses.
- `src/components/renderer/core/palette.ts`: Theme palette generated from album art or custom HEX color.

### Settings & UI
- `src/settings/settingsManager.ts`:
  - Interface `VisualizerSettings`, `DEFAULT_SETTINGS`, `loadVisualizerSettings()`, `updateVisualizerSettings()`.
  - Persisted in `Spicetify.LocalStorage` (`"visualizer:custom-settings"`).
- `src/components/SettingsModal.tsx`:
  - Full modal UI with tabs: "Options Générales", "Options par Modèle", "Couleurs & Ambiance".

### Application Entry & Registry
- `src/defs.ts`: Defines `RENDERERS` (`random`, `chaos`, `debug`) and audio loaders.
- `src/app.tsx`: Main React application, fullscreen management, secondary window support.
- `src/menu.tsx`: Spotify in-app menu (renderer switcher, settings toggle, latency correction).

---

## 2. Strict Project Rules & Workflows

1. **Deploying Changes**:
   - ALWAYS run `./apply` to build and deploy to the Spotify client.
   - `./apply` automatically triggers `npm run build && npm run build-local && spicetify apply`.
2. **Git Push**:
   - NEVER run `git push` unless the user explicitly types `"push"`.
3. **Quality & Validation**:
   - Always verify `npx tsc --noEmit` (must have 0 errors).
   - Format with `npm run format` (Prettier).
4. **Mandatory Design Patterns**:
   - ALWAYS adhere to established software design patterns:
     - **Object Pool Pattern**: Strictly required for visual FX, waves, particles, and transient objects (0 dynamic allocations per frame, avoiding GC pauses in the 60 FPS canvas loop).
     - **Pipeline & Strategy Pattern**: Modular rendering layers (`RenderLayer` strategy) decoupled from main orchestrator.
     - **Context / DTO Pattern**: Immutable frame contexts passed down through render pipelines.
     - **Flyweight / Lookup Tables**: Trigonometric precomputations and shared immutable geometric configurations.
     - **Observer / Pub-Sub Pattern**: Reactive settings updates (`subscribeToSettings`) without polling.
5. **Efficiency & No Redundant Commands**:
   - NEVER run `git status` automatically at the end of turns or after builds. Trust `npx tsc --noEmit`, `npm run format`, and `./apply`.
   - Do NOT run redundant discovery, grep, or file-reading commands when the user's request is direct and the target file is already known from this document.
   - Go straight to editing, compiling, and applying.
6. **Theme Palette Compliance (Coloration Obligatoire)**:
   - ALL models and visualizer modes MUST ALWAYS strictly base their colors, glows, highlights, and effects on the active theme palette (`palette: ThemePalette`, e.g. `palette.primary`, `palette.secondary`, `palette.accent`, `palette.glow`).
   - NEVER hardcode arbitrary static colors as the principal visual scheme; all visualizer modes must dynamically adapt to the user's selected palette or the album cover art.
