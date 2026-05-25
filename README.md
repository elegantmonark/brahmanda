# Brahmanda

**Brahmanda** is an interactive browser-based universe simulator that blends cosmology, quantum-field motion, particle-collision traces, entropy flow, and audio-reactive geometry into one full-screen canvas experience.

The project is currently a static prototype: no backend, no build tooling, and no install step. Open the page and start experimenting.

## Preview

<!-- Add a screenshot or short demo GIF here after publishing:
![Brahmanda simulation preview](docs/preview.png)
-->

## What It Does

- Simulates four visual modes: Cosmos, Quantum, Collider, and Entropy.
- Renders large-scale structure, quantum foam, detector-style collision traces, and entropy surfaces on an HTML canvas.
- Generates seeded particle events such as Z boson decays, Higgs to four leptons, di-muon events, top-pair events, and QCD jets.
- Exposes live controls for epoch, expansion, quantum fluctuation, and gravity.
- Shows live telemetry for simulated age, CMB temperature, entropy, redshift, coherence, particles, and event count.
- Includes an optional WebAudio layer for sonified interaction.

## Run Locally

Open `index.html` directly in a modern browser.

No package manager is required.

## Controls

| Control | Purpose |
| --- | --- |
| `Cosmos` | Large-scale cosmic web and structure evolution. |
| `Quantum` | Vacuum fluctuation field with pointer-driven disturbances. |
| `Collider` | Standard Model-inspired detector traces and event readouts. |
| `Entropy` | Thermal arrow and information dispersal surface. |
| `Inject` | Adds a visual or physics event depending on the active mode. |
| `Collapse Field` | Pulls the field toward the current pointer position. |
| `Sonify` | Enables the browser audio synthesis layer. |
| `Reset` | Reseeds the simulation state. |

## Project Structure

```text
.
├── app.js          # Simulation state, renderer, physics-inspired event generation, audio
├── index.html      # Static app shell and controls
├── style.css       # Full-screen interface styling and responsive layout
├── docs/
│   ├── ARCHITECTURE.md
│   └── ROADMAP.md
└── README.md
```

## Technical Notes

Brahmanda is written in vanilla JavaScript with the Canvas 2D API and WebAudio API. Randomness is seeded through browser cryptographic randomness when available, then advanced through a deterministic PRNG so each reset produces a coherent simulation state.

The collider mode is not a scientific detector simulator. It is a physics-inspired visual model using particle masses, charge, transverse momentum, pseudorapidity, detector layers, missing energy, and stylized track curvature to create readable collision events.

## Status

Prototype. The repo is suitable for public viewing, experimentation, screenshots, and GitHub Pages hosting.

## License

No license has been selected yet. Add one before inviting external reuse or contributions.
