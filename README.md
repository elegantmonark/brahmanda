<div align="center">

# Brahmanda

**An interactive universe simulator for cosmology, quantum fields, collider traces, entropy flow, and audio-reactive geometry.**

[Live Demo](https://brahmanda.netlify.app/) · [Demo Video](https://youtu.be/Ki1QejVvP8E) · [Architecture](docs/ARCHITECTURE.md) · [Roadmap](docs/ROADMAP.md)

</div>

---

## Contents

- [Overview](#overview)
- [Demo](#demo)
- [Features](#features)
- [Simulation Modes](#simulation-modes)
- [Controls](#controls)
- [How It Works](#how-it-works)
- [Run Locally](#run-locally)
- [Project Structure](#project-structure)
- [Status](#status)

## Overview

Brahmanda is a full-screen browser experiment that turns ideas from cosmology, quantum mechanics, particle physics, thermodynamics, and sound into one interactive simulation surface.

It is built as a static app with vanilla JavaScript, Canvas 2D, and the WebAudio API. There is no backend, no install step, and no build process. Open the demo and start exploring.

## Demo

**Live:** [brahmanda.netlify.app](https://brahmanda.netlify.app/)

**Video:** [Watch the demo on YouTube](https://youtu.be/Ki1QejVvP8E)

The demo moves through Brahmanda's four main visual states: cosmic structure, quantum field motion, collider-style particle events, and entropy flow.

## Features

<details open>
<summary><strong>Interactive physics-inspired canvas</strong></summary>

Brahmanda renders a continuously animated universe scene on an HTML canvas. Pointer input affects the simulation, allowing the user to drag through fields, create disturbances, collapse structures, and seed events.

</details>

<details>
<summary><strong>Collider-style event generation</strong></summary>

The collider mode generates readable particle-event traces inspired by detector displays. Event presets include Z boson decays, Higgs to four leptons, di-muon events, di-electron events, top-pair events, and QCD jets.

The model uses particle mass, charge, transverse momentum, pseudorapidity, detector layers, missing energy, and stylized curvature. It is visual and educational, not a replacement for a scientific detector simulator.

</details>

<details>
<summary><strong>Live telemetry</strong></summary>

The interface displays simulated age, CMB temperature, entropy, redshift, coherence, particle count, and event count. These readouts update as the user changes the current epoch, expansion, quantum fluctuation, and gravity parameters.

</details>

<details>
<summary><strong>Optional sonification</strong></summary>

The WebAudio layer maps interaction and simulation state into oscillators, filters, gain envelopes, and short percussive bursts. Audio stays disabled until the user presses `Sonify`, matching browser autoplay requirements.

</details>

## Simulation Modes

| Mode | What it shows |
| --- | --- |
| `Cosmos` | A rotating large-scale structure field with cosmic-web style connections. |
| `Quantum` | A fluctuating vector field with local collapse disturbances. |
| `Collider` | Standard Model-inspired event traces inside a stylized detector. |
| `Entropy` | A thermal surface with expanding fronts and information flow. |

## Controls

| Control | Purpose |
| --- | --- |
| `Epoch` | Moves the simulation between earlier and later universe states. |
| `Expansion` | Changes the scale and spread of the rendered system. |
| `Quantum` | Increases field fluctuation, particle density, and disturbance strength. |
| `Gravity` | Changes pointer pull, clustering, and field response. |
| `Event` | Chooses the collider event preset used by `Inject`. |
| `Inject` | Adds a mode-specific event or disturbance. |
| `Collapse Field` | Pulls the current field toward the pointer region. |
| `Sonify` | Enables audio-reactive synthesis. |
| `Reset` | Reseeds the simulation state. |

## How It Works

Brahmanda starts from browser cryptographic randomness when available, then advances the state with a deterministic PRNG so each reset produces a coherent but different universe.

The main animation loop:

1. Reads the current mode, sliders, pointer state, and event queue.
2. Updates simulation objects such as stars, waves, disturbances, entropy fronts, and collider events.
3. Draws the selected mode on the main canvas.
4. Updates the telemetry panel and spectrum display.
5. Updates WebAudio parameters if sound is enabled.

More detail is available in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Run Locally

Open `index.html` directly in a modern browser.

No package manager is required.

## Project Structure

```text
.
+-- app.js
+-- index.html
+-- style.css
+-- docs/
|   +-- ARCHITECTURE.md
|   +-- ROADMAP.md
+-- README.md
```

## Status

Prototype. Brahmanda is suitable for public viewing, experimentation, screenshots, demos, and GitHub/Netlify hosting.

## Roadmap

- Add a compressed GIF or preview image for the README.
- Add shareable seeded replay links.
- Add PNG snapshot export.
- Explore a Three.js renderer for depth, camera motion, and volumetric scenes.
- Add a clearer particle/event legend for collider mode.

## License

No license has been selected yet. Add one before inviting external reuse or contributions.
