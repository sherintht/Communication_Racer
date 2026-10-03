/** COMMUNICATION RACER 2026 — GOOGLE SHEETS DATABASE
 * Deploy as Web App: Execute as Me / Who has access: Anyone.
 * Create a spreadsheet and add sheets: RESULTS and CONFIG.
 * CONFIG rows: KEY | VALUE
 * EVENT_ID | CR2026-CHAMPIONSHIP-01
 * EVENT_NAME | Communication Racer 2026 Championship
 * START_ISO | 2026-10-05T09:00:00+05:30
 * END_ISO | 2026-10-30T17:00:00+05:30
 * RUN_MINUTES | 15
 * PRIZE | ECSA Championship Prize
 */
const SHEET_ID='PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const RESULT_HEADERS=['timestamp','eventId','name','roll','department','mode','official','score','accuracy','questions','correct','timeSeconds','maxCombo','xp','co1','co2','co3','co4','prizeEligible'];
function ss_(){return SpreadsheetApp.openById(SHEET_ID)}
function cfg_(){const sh=ss_().getSheetByName('CONFIG');const out={};if(!sh)return out;sh.getDataRange().getValues().slice(1).forEach(r=>{if(r[0])out[String(r[0]).trim()]=r[1]});return out}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function setup(){const ss=ss_();let r=ss.getSheetByName('RESULTS');if(!r)r=ss.insertSheet('RESULTS');if(r.getLastRow()===0)r.appendRow(RESULT_HEADERS);let c=ss.getSheetByName('CONFIG');if(!c)c=ss.insertSheet('CONFIG');if(c.getLastRow()===0)c.getRange(1,1,7,2).setValues([['KEY','VALUE'],['EVENT_ID','CR2026-CHAMPIONSHIP-01'],['EVENT_NAME','Communication Racer 2026 Championship'],['START_ISO','2026-10-05T09:00:00+05:30'],['END_ISO','2026-10-30T17:00:00+05:30'],['RUN_MINUTES',15],['PRIZE','ECSA Championship Prize']]);}
function doGet(e){const p=e.parameter||{};if(p.action==='leaderboard')return leaderboard_(p.eventId||cfg_().EVENT_ID);return json_({ok:true,service:'Communication Racer 2026 database',event:cfg_()})}
function doPost(e){try{const r=JSON.parse(e.postData.contents);const c=cfg_();const eventId=c.EVENT_ID||'CR2026-CHAMPIONSHIP-01';if(r.eventId!==eventId)return json_({ok:false,error:'Invalid championship event.'});
 if(r.official){const now=new Date(),start=c.START_ISO?new Date(c.START_ISO):null,end=c.END_ISO?new Date(c.END_ISO):null;if(start&&now<start)return json_({ok:false,error:'Championship has not started.'});if(end&&now>end)return json_({ok:false,error:'Championship window is closed.'});}
 const sh=ss_().getSheetByName('RESULTS');if(!sh)throw Error('RESULTS sheet missing. Run setup().');
 const vals=sh.getDataRange().getValues();const roll=String(r.roll||'').trim();if(r.official&&vals.slice(1).some(x=>String(x[1])===eventId&&String(x[3]).trim()===roll&&String(x[6])==='true'))return json_({ok:false,duplicate:true,error:'Official attempt already submitted for this register number.'});
 const eligible=!!r.official;sh.appendRow([new Date(),eventId,r.name,r.roll,r.department||'ECE',r.mode,!!r.official,Number(r.score)||0,Number(r.accuracy)||0,Number(r.questions)||0,Number(r.correct)||0,Number(r.timeSeconds)||0,Number(r.maxCombo)||0,Number(r.xp)||0,Number(r.co1)||0,Number(r.co2)||0,Number(r.co3)||0,Number(r.co4)||0,eligible]);return json_({ok:true,prizeEligible:eligible});
 }catch(err){return json_({ok:false,error:String(err)})}}
function leaderboard_(eventId){const sh=ss_().getSheetByName('RESULTS');if(!sh)return json_({ok:true,rows:[]});const v=sh.getDataRange().getValues();const rows=v.slice(1).filter(r=>String(r[1])===eventId&&String(r[6])==='true').map(r=>({timestamp:r[0],eventId:r[1],name:r[2],roll:r[3],department:r[4],score:r[7],accuracy:r[8],questions:r[9],correct:r[10],timeSeconds:r[11],maxCombo:r[12],xp:r[13],co1:r[14],co2:r[15],co3:r[16],co4:r[17],prizeEligible:r[18]}));rows.sort((a,b)=>Number(b.score)-Number(a.score)||Number(a.timeSeconds)-Number(b.timeSeconds)||Number(b.accuracy)-Number(a.accuracy));return json_({ok:true,rows:rows.slice(0,50)});}
