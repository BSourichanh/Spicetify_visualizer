# 🌌 Spicetify Visualizer (v2.0)

> **High-Performance Audio-Reactive Visualizer Suite for Spotify via Spicetify**  
> _60 FPS Zero-Allocation Engine • Multi-Layered Shaders & Canvas • Dynamic Theme Palette Synchronization_

[![Spicetify](https://img.shields.io/badge/Spicetify-CustomApp-1db954?logo=spotify&logoColor=white)](https://spicetify.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

![Preview](resources/screenshot.png)

---

## 📑 Sommaire / Table of Contents

- [✨ Modèles de Visualisation / Visualizer Models](#-modèles-de-visualisation--visualizer-models)
- [🌌 Effets d'Ambiance & Arrière-plan Universels](#-effets-dambiance--arrière-plan-universels)
- [🎛️ Panneau d'Options & Réglages](#️-panneau-doptions--réglages)
- [🎲 Modes Aléatoire & Chaos](#-modes-aléatoire--chaos)
- [⚡ Architecture & Performance (0 Allocation)](#-architecture--performance-0-allocation)
- [📦 Installation & Mise à Jour](#-installation--mise-à-jour)
- [🛠️ Développement & Commandes](#️-développement--commandes)

---

## ✨ Modèles de Visualisation / Visualizer Models

Spicetify Visualizer intègre **6 modèles réactifs haute fidélité**, chacun doté d'une identité géométrique et physique propre :

| Modèle                          | Description                                                                           | Spécificités & Options Dédiées                                                                                                                                                    |
| :------------------------------ | :------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🌊 **Liquid Spectrum**          | Égaliseur spectral fluide inspiré des aurores boréales.                               | • Disposition bilatérale symétrique ou linéaire (20 Hz - 16 kHz)<br>• Échelle de hauteur d'onde paramétrable<br>• Crêtes de brume flottantes (_Aurora Mist Peaks_)                |
| 🌸 **Astral Lotus**             | Mandala floral cosmique à pétales superposés s'épanouissant au rythme des basses.     | • 4 étages de pétales harmoniques<br>• Vitesse de rotation ajustable<br>• Inversion du sens de rotation                                                                           |
| 🪼 **Bioluminescent Jellyfish** | Organisme marin des abysses nageant en apesanteur.                                    | • Pulsations de nage synchronisées aux drops de sub-basses<br>• Longueur et ondulation soyeuse des tentacules                                                                     |
| 💥 **Big Bang Cosmic Origin**   | Déflagration primordiale de l'univers avec jets relativistes et singularité centrale. | • Singularité centrale avec anneaux quantiques de l'horizon<br>• 20 jets de plasma à 360° et aigrettes de diffraction<br>• Ondes d'inflation cosmologique sur basses très lourdes |
| ☀️ **Black Sun**                | Trou noir cosmique avec disque d'accrétion et éruptions magnétiques solaires.         | • Effet de lentille gravitationnelle<br>• Couronne incandescente réactive aux transitoires                                                                                        |
| 🌌 **Cosmic Nebula**            | Nébuleuse gazeuse interstellaire et turbulences chromatiques.                         | • Nuages de poussière volumétrique multi-couches<br>• Ondulations spectrales organiques                                                                                           |

---

## 🌌 Effets d'Ambiance & Arrière-plan Universels

Ces effets transversaux enrichissent l'arrière-plan de **tous les modèles** :

1. **💥 Big Bang Cosmic Origin (Ambiance Universelle)** :
    - **🌊 Ondes d'Inflation Cosmologique** : vagues d'expansion volumétriques déclenchées exclusivement lors des impacts de **basses très lourdes** (drops, kicks sub-basses). Seuil de déclenchement réglable (`60%` à `95%`).
    - **🌌 Nébuleuse de Matière Primordiale** : 8 lobes de gaz nébuleux diaphane en rotation lente créant une profondeur abyssale.
    - **✨ Poussière & Graines Stellaires** : 45 étoiles relativistes qui accélèrent et projettent des traînées de vélocité lumineuse sur chaque beat.
2. **💥 Background Shockwave** : onde de choc d'impact douce et atmosphérique centrée optiquement.
3. **✨ Lucioles Bioluminescentes (Fireflies)** : braises lumineuses en suspension dérivant organiquement, avec sursaut d'excitation au passage des ondes de choc.
4. **⚡ Courant Néon (Neon Current)** : paquet d'énergie lumineuse se propageant le long de la géométrie du modèle selon la dynamique audio.

---

## 🎛️ Panneau d'Options & Réglages

Accessible directement depuis l'icône d'engrenage `⚙️ Options`, la fenêtre de configuration est scindée en deux espaces distincts :

### 🌐 Onglet 1 : Options Générales (Tous les modèles)

- **🎛️ Sensibilités Audio & Physique** :
    - _Bass Responsiveness & Punch_ : vivacité et impact percussif (`0.2x` à `2.5x`).
    - _Sub & Bass Frequency Boost_ : amplification spécifique des fréquences graves (`0.2x` à `2.5x`).
    - _Treble & Highs Sensitivity_ : réactivité aux cymbales et harmoniques aiguës (`0.2x` à `2.5x`).
- **👁️ Visuel & Atmosphère** :
    - _Vitesse d'animation_ (`0.4x` à `2.0x`)
    - _Éclat lumineux & lueur néon_ (`0.0x` à `2.5x`)
    - _Échelle / Zoom du visualiseur_ (`0.5x` à `1.6x`)
    - _Assombrissement du fond Spotify_ (`0%` à `90%`)
- **🌌 Effets d'Ambiance Globaux** :
    - Interrupteurs et curseurs fins pour le _Big Bang en arrière-plan_, les _Lucioles_, l'_Onde de choc_ et le _Courant néon_.
- **⏱️ Cycles & Transitions** :
    - Intervalles temporels et sélection personnalisée des modèles autorisés en mode Aléatoire et Chaos.
- **🎨 Couleurs & Palette Dynamique** :
    - Mode automatique extrait de la pochette de l'album Spotify en cours.
    - Mode personnalisé avec nuancier de présélections et sélecteur de code couleur HEX.
    - Défilement chromatique prismatique arc-en-ciel (_Rainbow Cycling_).

### 🎯 Onglet 2 : Options par Modèle (Spécifiques)

- Barre de sélection rapide avec pilules de filtrage (`[ 📑 Tous ]`, `[ 🌊 Liquid Spectrum ]`, `[ 🌸 Astral Lotus ]`, etc.).
- Badge lumineux vert **`[En cours]`** identifiant en direct le modèle actuellement affiché à l'écran.
- Réglages exclusifs propres à la mécanique interne de chaque modèle.

---

## 🎲 Modes Aléatoire & Chaos

- **🎲 Mode Aléatoire (Random Mode)** :
    - Alterne automatiquement les modèles selon un intervalle temporel configurable (5s à 180s).
    - Permet de choisir via des puces cliquables quels modèles sont autorisés à entrer dans la rotation.
- **💥 Mode Chaos (Chaos Mode)** :
    - Déclenche un changement instantané de modèle lors d'un gros drop de basse.
    - Cadence minimale anti-épilepsie paramétrable (délai de 0.6s à 5.0s entre deux changements).
    - Pool de modèles autorisés personnalisable indépendamment du mode Aléatoire.

---

## ⚡ Architecture & Performance (0 Allocation)

L'ensemble de la suite est conçu pour garantir un rendu à **60 FPS constants sans saccades** liées au ramasse-miettes (Garbage Collector) :

- **Pattern Object Pool** : toutes les ondes de choc, lucioles, graines stellaires et paquets d'énergie sont alloués au démarrage dans des pools statiques réutilisables.
- **Pattern Flyweight & Trig Tables** : mise en cache des calculs d'angles, des coordonnées circulaires et des amplitudes harmoniques.
- **Pattern Pipeline & Strategy** : séparation modulaire de chaque étage de rendu (`RenderLayer`).
- **Centrage Optique Automatique** : calcul géométrique adaptatif centrant le visualiseur en tenant compte des barres latérales rétractables de Spotify et du mode plein écran.

---

## 📦 Installation & Mise à Jour

### Méthode 1 : Déploiement Direct

1. Ouvrez le terminal et placez-vous dans le dossier de configuration Spicetify :
    ```bash
    spicetify config-dir
    ```
2. Rendez-vous dans le sous-dossier `CustomApps/` et créez ou ouvrez le dossier `visualizer`.
3. Téléchargez la dernière version compilée (dossier `dist/`) et déposez-y `index.js`, `index.css` et `manifest.json`.
4. Activez l'application dans la configuration Spicetify :
    ```bash
    spicetify config custom_apps visualizer
    spicetify apply
    ```

### Méthode 2 : Mise à Jour

```bash
spicetify update
spicetify apply
```

---

## 🛠️ Développement & Commandes

Pour contribuer ou modifier les visualisateurs :

```bash
# 1. Cloner le dépôt
git clone https://github.com/BSourichanh/Spicetify_visualizer.git
cd Spicetify_visualizer

# 2. Installer les dépendances
npm install

# 3. Découverte automatique des modes (scanne src/components/renderer/modes/)
npm run discover

# 4. Compiler l'application Spicetify
npm run build

# 5. Formater le code avec Prettier
npm run format

# 6. Vérifier les types TypeScript
npx tsc --noEmit

# 7. Déployer directement dans Spotify
./apply
```

> **Créer un nouveau modèle de visualisation :**  
> Il suffit de créer un nouveau fichier `.ts` dans `src/components/renderer/modes/` exportant un objet `modeConfig`. Lancez ensuite `npm run discover` ou `npm run build` : le système détecte, enregistre et intègre automatiquement votre nouveau visualiseur sans modifier une seule ligne du cœur de l'application !

---

## 📄 Licence

Ce projet est distribué sous licence MIT.  
Projet original basé sur NCS Visualizer par Konsl, réarchitecturé et enrichi pour Spicetify.
