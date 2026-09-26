# COMMUNICATION RACER 2026 — FINAL

## Main objective
The **primary objective is QUESTION ANSWERING**.

The racing layer is used to make answering 100 Communication Systems questions engaging:
**ANSWER → GET FEEDBACK → SCORE → STREAK → TURBO → CHECKPOINT → ACHIEVEMENT → CONTINUE**

This is an educational game, not a racing game with a quiz pasted on top.

## Included
- `index.html` — game interface
- `style.css` — arcade/racing UI
- `game.js` — game engine, scoring, sound, achievements, leaderboard
- `questions.js` — 100 starter questions (25 per module)
- `Questions_Master.csv` — same 100 questions in Google-Sheets-ready format
- `Results_Template.csv` — result database header
- `GOOGLE_SHEETS_SETUP.gs` — Google Sheets master database connector
- `README.md` / `README.txt`
- `assets/README.txt`

## Game modes
### Learning Mode
- Unlimited time
- Immediate answer feedback
- Explanation after each answer
- Replayable
- Intended for learning and practice

### Championship Mode
- 15 minutes
- Official event mode
- 100-question target
- Score, accuracy, time and achievements are recorded

## Student game loop
1. Enter name and roll number.
2. Select Learning or Championship.
3. Start the race.
4. Read the question.
5. Select A/B/C/D (or press keyboard 1–4).
6. Correct answer = score + streak + overtake.
7. Wrong answer = life lost + streak reset.
8. Every 3 correct answers can generate Turbo.
9. After each 25 questions, a module checkpoint appears.
10. Achievements unlock during the run.
11. Final result shows accuracy, module performance, XP and badges.

## Sound
The game uses browser-generated arcade sound effects:
- countdown
- correct answer
- wrong answer
- turbo
- checkpoint
- achievement unlock
- finish

The top-right sound button toggles audio.

## GitHub Pages
Upload the files to the repository root and enable:
Settings → Pages → Deploy from branch → `main` → `/ (root)`.

Open the generated GitHub Pages URL. Do not click `game.js` to play; open the deployed `index.html` site.

## Google Sheets master database
Recommended sheet tabs:
- `Config`
- `Questions`
- `Results`
- `Players`

### Step 1 — create the database
Open your Google Sheet → Extensions → Apps Script.
Paste `GOOGLE_SHEETS_SETUP.gs`.

Run `setupRacer()` once.

### Step 2 — load the 100 questions
Open `Questions_Master.csv` and import it into the `Questions` tab.
Keep the first row as headers.

The `Questions` tab becomes the editable master question bank.

### Step 3 — deploy Apps Script
Apps Script:
Deploy → New deployment → Web app

Execute as: **Me**
Who has access: choose the option permitted by your college/institution.

Copy the Web App URL.

### Step 4 — connect the game
Open `game.js` and set:

`GOOGLE_SHEET_WEBAPP_URL:'YOUR_WEB_APP_URL'`

Set:

`EVENT_KEY:'RACER2026'`

The same key should be present in the `Config` tab.

Commit and push the changed `game.js` to GitHub.

## Important privacy note
Do not make the Google Sheet itself public if it contains student names/roll numbers.
The Apps Script Web App is the interface used by the game.

## Academic note
The included 100 questions are the current starter bank used in the prototype. Before the official ECE event, replace/verify them against the approved **24SPJPECT502 Communication Systems syllabus and official CO mapping**.
