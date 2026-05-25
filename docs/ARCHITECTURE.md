# Architecture

Brahmanda is a static browser app built from three files:

- `index.html` defines the canvas, mode tabs, sliders, event selector, buttons, telemetry panel, and spectrum canvas.
- `style.css` handles the full-screen dark interface, responsive control layout, and visual hierarchy.
- `app.js` owns all simulation state, rendering, interaction, and audio synthesis.

## Rendering Loop

`app.js` starts a `requestAnimationFrame` loop after initialization. Each frame:

1. Updates simulation state from the current controls and pointer state.
2. Draws the shared background and active mode.
3. Draws waves, spectrum data, and telemetry.
4. Updates WebAudio parameters if sound is enabled.

## Simulation Modes

| Mode | Main behavior |
| --- | --- |
| Cosmos | Projects seeded stars into a rotating large-scale structure field. |
| Quantum | Draws a fluctuating vector field with localized collapse disturbances. |
| Collider | Generates Standard Model-inspired events and detector-style tracks. |
| Entropy | Draws a thermal surface with expanding fronts and information flow. |

## Event Generation

Collider events are generated locally in the browser. The model includes particle metadata, detector layer limits, track generation, missing-energy arrows, and weighted event selection.

The goal is visual and educational plausibility, not numerical agreement with experimental data.

## Audio

Audio is disabled until the user presses `Sonify`, which keeps browser autoplay restrictions satisfied. The audio layer uses oscillators, filters, gain envelopes, and short percussive noise bursts to respond to interaction and mode changes.
