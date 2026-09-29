# HOW TO ADD / CHANGE QUESTIONS

## Easiest method right now: edit questions.js

Each question has this structure:

{
  "id": 101,
  "module": 1,
  "moduleName": "Module 1",
  "question": "Your question?",
  "options": [
    "Option A",
    "Option B",
    "Option C",
    "Option D"
  ],
  "answer": 0,
  "difficulty": "Easy",
  "co": "CO1"
}

Answer numbers:
0 = A
1 = B
2 = C
3 = D

After changing questions.js:
1. Save it.
2. Upload/replace questions.js in GitHub.
3. Commit changes.
4. Wait for GitHub Pages deployment.
5. Open the game and press Ctrl + Shift + R.

## Recommended final method: Google Sheets

Use the `Questions_Master.csv` file to create a `Questions` tab.

Columns:
QuestionID | Module | CO | Difficulty | Question | OptionA | OptionB | OptionC | OptionD | Answer | Explanation | Active

Answer values in the sheet should be A, B, C or D.

Then deploy `GOOGLE_SHEETS_SETUP.gs` as a Google Apps Script Web App and put its URL in game.js:

GOOGLE_SHEET_WEBAPP_URL:'YOUR_WEB_APP_URL'

The game can then read the active questions from the Google Sheet.

IMPORTANT:
- Keep the Google Sheet itself private if it contains student data.
- For the official event, verify all questions against the approved 24SPJPECT502 syllabus and CO mapping.
