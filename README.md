# Communication Racer 2026 — Complete Phase 1

This ZIP is a fresh playable racing-game build for S5 ECE Communication Systems (24SPJPECT502).

## Included
- Continuous perspective racing
- Acceleration, brake, steering and turbo
- Traffic + barriers + collisions
- Speed loss, lives, combo, XP and score
- Rain / fog / night visual effects across four worlds
- 100 MCQs: 25 per module / CO1–CO4
- Correct/wrong answers change race state
- Learning Mode + Championship Mode
- CO performance profile
- WebAudio engine / collision / challenge sounds
- Keyboard and touch controls

## Run
Open `index.html` with VS Code Live Server, or:
`python -m http.server 8080`

Then visit `http://localhost:8080`.

## Controls
W/↑ accelerate | S/↓ brake | A/← left | D/→ right | SPACE turbo | R recover | M sound | ESC pause

## World mapping
Questions 1–25: ANALOG CITY / CO1
26–50: DIGITAL HIGHWAY / CO2
51–75: AWGN VALLEY / CO3
76–100: MODULATION ARENA / CO4

## Architecture
The first version intentionally uses an asset-free HTML5 Canvas perspective engine so it can be opened immediately from the ZIP. The gameplay/data layer is ready for a later Three.js/WebGL upgrade with 3D GLTF vehicles, spline roads, spatial audio and richer physics.

Google Sheets credentials are not included. Add a secure Google Apps Script endpoint in a later phase.
