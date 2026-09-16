# 🌌 Spicetify Visualizer (v2.0)

> **Suite de Visualisation Audio-Réactive Haute Fidélité pour Spotify via Spicetify**  
> _Rendu 60–144 FPS Zero-Allocation • Moteur DSP Stéréo Temps Réel • Pipeline Modulaire Canvas 2D • Synchronisation Dynamique des Couleurs_

[![Spicetify](https://img.shields.io/badge/Spicetify-CustomApp-1db954?logo=spotify&logoColor=white)](https://spicetify.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Audio](https://img.shields.io/badge/Audio-Stereo%20DSP%20Loopback-purple)](#-moteur-dsp-audio-stéréo-temps-réel)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

![Preview](resources/screenshot.png)

---

## 📑 Sommaire / Table of Contents

- [✨ Modèles de Visualisation Actifs](#-modèles-de-visualisation-actifs)
- [🎙️ Moteur DSP Audio Stéréo Temps Réel](#️-moteur-dsp-audio-stéréo-temps-réel)
- [🌌 Effets d'Ambiance & Arrière-Plan Universels](#-effets-dambiance--arrière-plan-universels)
- [🎛️ Panneau d'Options & Réglages](#️-panneau-doptions--réglages)
- [🎲 Modes Aléatoire & Chaos](#-modes-aléatoire--chaos)
- [⚡ Architecture & Performance (0 Allocation)](#-architecture--performance-0-allocation)
- [📦 Installation & Déploiement](#-installation--déploiement)
- [🛠️ Développement & Commandes](#️-développement--commandes)

---

## ✨ Modèles de Visualisation Actifs

Spicetify Visualizer intègre **5 modèles réactifs haute fidélité** modulaires, détectés automatiquement au build :

| Modèle                        | Description                                                                           | Spécificités & Dynamique Audio                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| :---------------------------- | :------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ☀️ **Dark Sun (Soleil Noir)** | Éclipse cosmique gravitationnelle entourée d'un spectre circulaire fluide à 360°.     | • **Spectre Circulaire Stéréo 360°** : 72 bandes avec basses à 6h, canal gauche à 9h, canal droit à 3h et aigus cristallins à 12h<br>• **Membrane de Plasma $C^1$ Spline** : onde fermée fluide sans arêtes dures ni micro-saccades<br>• **Dilatation Explosive du Disque (`sunR`)** : le cœur d'ébène gonfle jusqu'à +42% sur les kicks et propulse le spectre vers l'extérieur<br>• **Liseré de Chromosphère** : filament blanc pur et halo incandescent qui s'illuminent et s'épaississent sur le rythme |
| 🐱 **Neon Cat (Cyber Neko)**  | Félin cyberpunk synthwave en tracé néon réactif.                                      | • Moustaches, oreilles et regard oscillant avec les transitoires et les mélodies<br>• Physique d'ondulation de la queue synchronisée aux basses<br>• Contour néon double éclat avec lueurs volumétriques                                                                                                                                                                                                                                                                                                    |
| 🌸 **Astral Lotus**           | Mandala floral cosmique à pétales superposés s'épanouissant au rythme des basses.     | • 4 étages de pétales harmoniques géométriques<br>• Vitesse de rotation réactive au BPM<br>• Épanouissement volumétrique sur les drops                                                                                                                                                                                                                                                                                                                                                                      |
| 💥 **Big Bang Cosmic Origin** | Déflagration primordiale de l'univers avec singularité centrale et jets relativistes. | • Singularité centrale avec anneaux quantiques de l'horizon<br>• 20 jets de plasma à 360° et aigrettes de diffraction<br>• Ondes d'inflation cosmologique sur les infrabasses                                                                                                                                                                                                                                                                                                                               |
| 🌌 **Cosmic Nebula**          | Nébuleuse gazeuse interstellaire et turbulences chromatiques.                         | • Nuages de poussière volumétrique multi-couches<br>• Ondulations spectrales organiques et flux de particules                                                                                                                                                                                                                                                                                                                                                                                               |

> _Note : D'autres modèles (ex: `Bioluminescent Jellyfish`) sont archivés dans `src/components/renderer/modes/disabled/` et peuvent être réactivés à tout moment en retirant l'extension `.disabled`._

---

## 🎙️ Moteur DSP Audio Stéréo Temps Réel

Le visualiseur intègre une chaîne d'acquisition et d'analyse sonore ultra-rapide capable de fonctionner en synchronisation native Spotify ou en **capture DSP matérielle directe** :

1. **Analyse Stéréo Discrète (`dspAudioEngine.ts`)** :
    - Flux scindé en deux canaux indépendants via un `ChannelSplitterNode`.
    - Deux instances `AnalyserNode` de 2048 points pour capturer la stéréo réelle (**Canal Gauche** vs **Canal Droit**).
2. **Égalisation Acoustique Perceptive (Tilt ISO 226)** :
    - Correction continue de **+3.2 dB par octave** relative à 1 000 Hz, compensant la perte naturelle d'énergie des aigus et égalisant la sensibilité entre sub-basses (40 Hz), voix (1-3 kHz) et charlestons (10 kHz).
3. **AGC Dynamique Multi-Bandes (Automatic Gain Control)** :
    - Suivi d'amplitude adaptatif avec seuil bas (-82 dB) et plafond (-6 dB).
    - Amplification dynamique jusqu'à 5.5× : le visualiseur reste percutant et vivant quel que soit le volume de sortie Spotify (10%, 50% ou 100%).
4. **Intégration Loopback Linux PipeWire** :
    - Service utilisateur systemd automatisé (`spicetify-dsp-loopback.service`) créant le pont audio `Son_PC_Loopback` sans configuration manuelle.
    - Sélection du périphérique d'entrée en un clic dans les options avec **VU-mètre en direct**, détection du BPM et indicateur de kick.

---

## 🌌 Effets d'Ambiance & Arrière-Plan Universels

Ces couches transversales s'exécutent en arrière-plan derrière le modèle actif :

1. **💥 Big Bang Cosmic Origin (Ambiance Universelle)** :
    - **Ondes d'Inflation Cosmologique** : vagues d'expansion volumétriques déclenchées sur les basses très lourdes (seuil paramétrable de `60%` à `95%`).
    - **Nébuleuse Primordiale** : 8 lobes de gaz diaphane créant une profondeur infinie.
    - **Graines Stellaires Relativistes** : étoiles en suspension qui étirent des traînées de vélocité lumineuse sur les kicks.
2. **⚡ Cyberpunk Glitch Engine** : moteur de post-traitement avec déplacement de tranches horizontales, séparation holographique RVB et lignes de balayage CRT/VHS sans allocation mémoire.
3. **💥 Background Shockwave** : onde de choc d'impact douce et atmosphérique centrée optiquement.
4. **✨ Lucioles Bioluminescentes (Fireflies)** : particules dérivant organiquement, excitées au passage des ondes de choc.
5. **⚡ Courant Néon (Neon Current)** : train d'ondes lumineuses circulant le long de la géométrie du modèle actif.

---

## 🎛️ Panneau d'Options & Réglages

Accessible via l'icône `⚙️ Options` dans le menu Spotify :

### 🌐 Options Générales

- **Capture DSP & Périphérique Audio** : activation du mode DSP direct, sélection du micro/loopback, VU-mètre live, BPM détecté et sensibilité DSP.
- **Sensibilités & Balistique** : curseurs indépendants pour _Bass Scale_, _Treble Scale_, _Punch Scale_ et _Speed Scale_.
- **Atmosphère & Rendu** : zoom global (`0.5x` à `1.6x`), intensité du glow néon (`glowScale`), assombrissement de l'arrière-plan Spotify (`0%` à `90%`).
- **Ambiance Universelle** : interrupteurs et seuils fins pour le Big Bang d'arrière-plan, les lucioles, l'onde de choc et le courant néon.
- **Couleurs & Thème** :
    - Mode automatique extrait de la pochette d'album en cours.
    - Mode personnalisé avec nuancier de présélections et sélecteur de code couleur HEX.
    - Cycle prismatique arc-en-ciel continu (_Rainbow Cycling_).

### 🎯 Options par Modèle

- Barre de sélection rapide avec pilules de filtrage (`[ 📑 Tous ]`, `[ ☀️ Dark Sun ]`, `[ 🐱 Cyber Neko ]`, `[ 🌸 Astral Lotus ]`, etc.).
- Badge lumineux vert **`[En cours]`** identifiant en direct le modèle affiché.
- Réglages exclusifs propres à la dynamique interne de chaque modèle.

---

## 🎲 Modes Aléatoire & Chaos

- **🎲 Mode Aléatoire (Random Mode)** :
    - Alterne automatiquement les modèles selon un intervalle temporel réglable (5s à 180s).
    - Choix individuel des modèles autorisés dans la rotation.
- **💥 Mode Chaos (Chaos Mode)** :
    - Déclenche un changement instantané de modèle lors d'un gros drop de basse.
    - Cadence minimale anti-épilepsie paramétrable (délai de sécurité entre deux changements).
    - Pool de modèles personnalisable.

---

## ⚡ Architecture & Performance (0 Allocation)

Conçu pour garantir un rendu à **60–144 FPS constants sans micro-saccades** :

- **Pattern Object Pool** : toutes les particules, ondes de choc, filaments et braises sont pré-alloués dans des pools statiques réutilisables.
- **Pattern Flyweight & Tables Trigonométriques** : tableaux `Float32Array` pré-calculés pour les angles et coordonnées circulaires (`cosAngles`, `sinAngles`).
- **Pattern Pipeline & Strategy** : architecture modulaire (`RenderLayer`, `DarkSunRenderPipeline`) séparant proprement chaque étape de calcul et de dessin.
- **Centrage Optique Automatique** : compensation géométrique adaptative en temps réel tenant compte de la barre latérale de Spotify et du mode plein écran.

---

## 📦 Installation & Déploiement

### Méthode 1 : Déploiement Local Rapide (Développeur)

```bash
# 1. Cloner le dépôt
git clone https://github.com/BSourichanh/Spicetify_visualizer.git
cd Spicetify_visualizer

# 2. Installer les dépendances
npm install

# 3. Compiler et déployer dans Spotify en une seule commande
./apply
```

### Méthode 2 : Installation Manuelle dans Spicetify

1. Ouvrez le dossier des applications personnalisées :
    ```bash
    cd "$(spicetify -c | xargs dirname)/CustomApps"
    ```
2. Clonez le dépôt sous le nom `visualizer` :
    ```bash
    git clone https://github.com/BSourichanh/Spicetify_visualizer.git visualizer
    cd visualizer
    npm install
    npm run build
    ```
3. Activez l'application dans Spicetify :
    ```bash
    spicetify config custom_apps visualizer
    spicetify apply
    ```

---

## 🛠️ Développement & Commandes

```bash
# Découverte automatique des modes (scanne src/components/renderer/modes/)
npm run discover

# Vérifier la validité des types TypeScript (0 erreur requis)
npx tsc --noEmit

# Formater tout le code source avec Prettier
npm run format

# Compiler et déployer directement dans le client Spotify
./apply
```

> **Ajouter un nouveau modèle de visualisation :**  
> Créez simplement un fichier `.ts` dans `src/components/renderer/modes/` exportant un objet `modeConfig`. Au prochain build ou exécution de `./apply`, le script `scripts/discover-modes.js` détecte, enregistre et intègre automatiquement votre nouveau visualiseur dans l'interface et le sélecteur !

---

## 📄 Licence

Ce projet est distribué sous licence MIT.  
Projet original inspiré de NCS Visualizer par Konsl, réarchitecturé et enrichi pour Spicetify.
