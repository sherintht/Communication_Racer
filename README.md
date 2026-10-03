# COMMUNICATION RACER 2026 — GAMEPLAY V2

This version changes the core experience from a moving-road quiz into an arcade gameplay loop.

## New gameplay systems
- 3-lane motorcycle racing
- Continuous steering between lanes
- AI traffic with cars, bikes and trucks
- Rival Noise Racer visible on the road
- Signal packet collectibles
- Turbo and shield pickups
- Potholes, oil patches and barriers
- Dynamic signal-storm events
- Rival attacks and traffic ambushes
- Checkpoints and world transitions
- Four communication worlds
- Smart Signal Gates: questions appear as in-world events rather than as the primary screen
- Route Decisions: correct answers unlock a fast route; wrong answers send the rider through a risk route
- Score, XP, combo, lives, packets, turbo and rival pressure
- Learning and Championship modes
- CO1–CO4 performance
- Rain, fog, night, particles and generated sound

## Run
Use VS Code Live Server on `index.html` or run:
`python -m http.server 8080`

## Controls
W/Up = accelerate
S/Down = brake
A/Left = move left lane
D/Right = move right lane
SPACE = turbo
R = recover
M = sound
ESC = pause

## Design principle
The race should remain active while educational decisions are made. The question is now a gameplay trigger: it can clear a Signal Gate, unlock a fast route, recover the rival gap, or cause a risk route.

## PLAYER DATABASE + CHAMPIONSHIP LEAGUE

The professional build now supports two race types:

- **Learning / Practice:** unlimited attempts; not included in the official championship ranking.
- **Championship:** one official attempt per register number, maximum **15:00** race time, with score + accuracy + completion time used for ranking.

### Player data captured
Name, Register Number, Department, Event ID, Mode, Official status, Score, Accuracy, Questions, Correct Answers, Time, Max Combo, XP and CO1–CO4 performance.

### Database options
The game works immediately with browser `localStorage` as a fallback. For a real shared college leaderboard, use Google Sheets + Apps Script:

1. Create a Google Sheet.
2. Open **Extensions → Apps Script**.
3. Copy `apps-script/Code.gs` into the Apps Script project.
4. Replace `PASTE_YOUR_GOOGLE_SHEET_ID_HERE` with the Sheet ID.
5. Run `setup()` once and authorize it.
6. Edit the `CONFIG` sheet with the official championship **START_ISO**, **END_ISO**, **RUN_MINUTES** and **PRIZE**.
7. Deploy as a Web App, execute as you, access for anyone with the link.
8. Copy the deployed Web App URL into `database.js` → `API_URL`.

### Ranking rule
Official results are ordered by **score**, then **lower completion time**, then **higher accuracy**. The Google Sheet keeps the complete result record for faculty/admin use.

### Prize workflow
The database marks official results as `prizeEligible=true`. The faculty can announce the top ranked official performer(s) according to the prize policy set for the event. The game itself does not make claims about a student's academic/career suitability.
