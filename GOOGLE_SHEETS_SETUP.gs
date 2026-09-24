// Google Apps Script backend for Communication Racer 2026
// 1) Create/open your Google Sheet.
// 2) Extensions -> Apps Script.
// 3) Replace the script with this code.
// 4) Deploy -> New deployment -> Web app.
// 5) Execute as: Me. Who has access: Anyone (or your institution, if supported).
// 6) Copy the Web app URL into GOOGLE_SHEET_WEBAPP_URL in game.js.
//
// The script automatically creates a Results sheet.

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('Results');
  if (!sh) {
    sh = ss.insertSheet('Results');
    sh.appendRow(['Timestamp','Name','Roll No','Class','Mode','Score','Points','Accuracy','Time (sec)','Qualified','M1','M2','M3','M4']);
  }
  const d = JSON.parse(e.postData.contents || '{}');
  sh.appendRow([
    new Date(), d.name||'', d.roll||'', d.className||'', d.mode||'',
    d.score||0, d.points||0, d.accuracy||0, d.time||0,
    d.qualified?'YES':'NO',
    (d.modules||[])[0]||0,(d.modules||[])[1]||0,(d.modules||[])[2]||0,(d.modules||[])[3]||0
  ]);
  return ContentService.createTextOutput(JSON.stringify({ok:true}))
    .setMimeType(ContentService.MimeType.JSON);
}
