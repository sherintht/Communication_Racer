/**
 * COMMUNICATION RACER 2026 — Google Sheets master database
 * Architecture: GitHub Pages game <-> Apps Script Web App <-> private Google Sheet
 *
 * Sheet tabs created automatically:
 *  Config      : event settings
 *  Questions   : master question bank (edit here for future batches)
 *  Results     : every completed run
 *  Players     : latest summary per roll number
 *
 * IMPORTANT: If the Web App is public, the endpoint can be called by anyone who knows its URL.
 * Keep student personal data in the Sheet itself and use an event key only as a basic anti-spam check,
 * not as a secret. For institutional deployment, prefer an authenticated/restricted Web App if your
 * Google Workspace policy supports it.
 */
const SHEET_NAMES={CONFIG:'Config',QUESTIONS:'Questions',RESULTS:'Results',PLAYERS:'Players'};
const DEFAULT_EVENT_KEY='RACER2026';

function setupRacer(){
  const ss=SpreadsheetApp.getActive();
  setupConfig_(ss); setupQuestions_(ss); setupResults_(ss); setupPlayers_(ss);
  SpreadsheetApp.getUi().alert('Communication Racer database is ready. Fill/edit the Questions tab, then deploy this script as a Web App.');
}
function setupConfig_(ss){let sh=ss.getSheetByName(SHEET_NAMES.CONFIG)||ss.insertSheet(SHEET_NAMES.CONFIG);if(sh.getLastRow()===0)sh.getRange(1,1,5,2).setValues([['Key','Value'],['EventName','Communication Racer 2026'],['ChampionshipMinutes','15'],['PassScore','50'],['EventKey',DEFAULT_EVENT_KEY]]);}
function setupQuestions_(ss){let sh=ss.getSheetByName(SHEET_NAMES.QUESTIONS)||ss.insertSheet(SHEET_NAMES.QUESTIONS);const h=['QuestionID','Module','CO','Difficulty','Question','OptionA','OptionB','OptionC','OptionD','Answer','Explanation','Active'];if(sh.getLastRow()===0)sh.getRange(1,1,1,h.length).setValues([h]);sh.setFrozenRows(1);}
function setupResults_(ss){let sh=ss.getSheetByName(SHEET_NAMES.RESULTS)||ss.insertSheet(SHEET_NAMES.RESULTS);const h=['Timestamp','Name','Roll No','Class','Mode','Correct','Points','Accuracy','Time (sec)','Qualified','M1','M2','M3','M4','Best Streak','Overtakes','XP','Achievements'];if(sh.getLastRow()===0)sh.getRange(1,1,1,h.length).setValues([h]);sh.setFrozenRows(1);}
function setupPlayers_(ss){let sh=ss.getSheetByName(SHEET_NAMES.PLAYERS)||ss.insertSheet(SHEET_NAMES.PLAYERS);const h=['Last Update','Name','Roll No','Class','Runs','Best Championship Score','Best Accuracy','XP','Achievements'];if(sh.getLastRow()===0)sh.getRange(1,1,1,h.length).setValues([h]);sh.setFrozenRows(1);}
function cfg_(){const sh=SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.CONFIG);const v=sh?sh.getDataRange().getValues():[];const o={};v.slice(1).forEach(r=>{if(r[0])o[String(r[0])]=r[1]});return o;}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
function jsonp_(o,callback){const safe=String(callback||'').replace(/[^a-zA-Z0-9_.$]/g,'');if(!safe)return json_(o);return ContentService.createTextOutput(safe+'('+JSON.stringify(o)+')').setMimeType(ContentService.MimeType.JAVASCRIPT);}
function doGet(e){e=e||{parameter:{}};const p=e.parameter||{};const action=p.action||'questions';const cfg=cfg_();if(cfg.EventKey&&p.key&&String(p.key)!==String(cfg.EventKey))return jsonp_({ok:false,error:'Invalid event key'},p.callback);if(action==='questions')return jsonp_({ok:true,questions:readQuestions_(),config:{eventName:cfg.EventName||'Communication Racer 2026',championshipMinutes:Number(cfg.ChampionshipMinutes||15),passScore:Number(cfg.PassScore||50)}},p.callback);if(action==='leaderboard')return jsonp_({ok:true,leaderboard:readLeaderboard_()},p.callback);return jsonp_({ok:false,error:'Unknown action'},p.callback);}
function readQuestions_(){const sh=SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.QUESTIONS);if(!sh||sh.getLastRow()<2)return [];const rows=sh.getRange(2,1,sh.getLastRow()-1,12).getValues();return rows.filter(r=>String(r[11]).toUpperCase()!=='NO'&&r[4]).map(r=>({id:r[0],module:Number(r[1]),co:r[2],difficulty:r[3],question:r[4],options:[r[5],r[6],r[7],r[8]],answer:Number(r[9]),explanation:r[10]||''}));}
function doPost(e){try{const d=JSON.parse((e.postData&&e.postData.contents)||'{}');const cfg=cfg_();if(cfg.EventKey&&d.eventKey&&String(d.eventKey)!==String(cfg.EventKey))return json_({ok:false,error:'Invalid event key'});if(!d.name||!d.roll)return json_({ok:false,error:'Name and roll are required'});const ss=SpreadsheetApp.getActive();setupResults_(ss);const sh=ss.getSheetByName(SHEET_NAMES.RESULTS);const m=d.modules||[];sh.appendRow([new Date(),d.name,d.roll,d.className||'',d.mode||'',d.correct||0,d.points||0,d.accuracy||0,d.time||0,d.qualified?'YES':'NO',m[0]||0,m[1]||0,m[2]||0,m[3]||0,d.bestStreak||0,d.overtakes||0,d.xp||0,(d.achievements||[]).join(', ')]);updatePlayer_(ss,d);return json_({ok:true});}catch(err){return json_({ok:false,error:String(err)});}}
function updatePlayer_(ss,d){const sh=ss.getSheetByName(SHEET_NAMES.PLAYERS);const vals=sh.getDataRange().getValues();let row=-1;for(let i=1;i<vals.length;i++)if(String(vals[i][2])===String(d.roll)){row=i+1;break}if(row<0){sh.appendRow([new Date(),d.name,d.roll,d.className||'',1,d.correct||0,d.accuracy||0,d.xp||0,(d.achievements||[]).join(', ')]);return}const old=vals[row-1];sh.getRange(row,1,1,9).setValues([[new Date(),d.name,d.roll,d.className||'',Number(old[4]||0)+1,Math.max(Number(old[5]||0),Number(d.correct||0)),Math.max(Number(old[6]||0),Number(d.accuracy||0)),Number(old[7]||0)+Number(d.xp||0),[old[8],(d.achievements||[]).join(', ')].filter(Boolean).join(', ')]]);}
function readLeaderboard_(){const sh=SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.RESULTS);if(!sh||sh.getLastRow()<2)return [];const rows=sh.getRange(2,1,sh.getLastRow()-1,18).getValues().filter(r=>String(r[4]).toLowerCase()==='championship');rows.sort((a,b)=>Number(b[5]||0)-Number(a[5]||0)||Number(a[8]||0)-Number(b[8]||0));return rows.slice(0,50).map((r,i)=>({rank:i+1,name:r[1],roll:r[2],className:r[3],correct:r[5],accuracy:r[7],time:r[8]}));}
