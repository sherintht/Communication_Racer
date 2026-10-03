/* COMMUNICATION RACER 2026 — PLAYER DATABASE BRIDGE
   1. Set API_URL after deploying the Apps Script web app.
   2. The game keeps a local fallback leaderboard if API_URL is blank/offline.
*/
window.CR_DATABASE={
  API_URL:'',
  EVENT_ID:'CR2026-CHAMPIONSHIP-01',
  saveLocal(record){
    const key='cr26_results'; const rows=JSON.parse(localStorage.getItem(key)||'[]');
    if(record.official){
      const old=rows.find(r=>r.eventId===this.EVENT_ID&&r.roll===record.roll&&r.official);
      if(old)return {ok:false,duplicate:true};
    }
    record.eventId=this.EVENT_ID; rows.push(record);
    localStorage.setItem(key,JSON.stringify(rows)); return {ok:true};
  },
  async save(record){
    record.eventId=this.EVENT_ID;
    const local=this.saveLocal(record);
    if(!this.API_URL)return local;
    try{
      const res=await fetch(this.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(record)});
      const data=await res.json(); return data;
    }catch(e){return {...local,offline:true};}
  },
  localRows(){return JSON.parse(localStorage.getItem('cr26_results')||'[]').filter(r=>r.official);},
  async leaderboard(){
    if(this.API_URL){try{const r=await fetch(this.API_URL+'?action=leaderboard&eventId='+encodeURIComponent(this.EVENT_ID));const d=await r.json();if(d.ok)return d.rows||[];}catch(e){}}
    return this.localRows();
  }
};
window.saveRaceResult=record=>CR_DATABASE.save(record);
window.renderLeaderboard=async()=>{
  const box=document.getElementById('leaderboard'); if(!box)return;
  const rows=await CR_DATABASE.leaderboard();
  rows.sort((a,b)=>Number(b.score)-Number(a.score)||Number(a.timeSeconds)-Number(b.timeSeconds)||Number(b.accuracy)-Number(a.accuracy));
  box.innerHTML='<div class="lb-head"><span>RANK</span><span>PLAYER</span><span>SCORE</span><span>ACC.</span><span>TIME</span></div>'+
    (rows.length?rows.slice(0,20).map((r,i)=>`<div class="lb-row"><span class="rank">${i<3?['🥇','🥈','🥉'][i]:i+1}</span><span>${escapeHtml(r.name||'Engineer')}<small class="lb-roll"> ${escapeHtml(r.roll||'')}</small></span><span>${Number(r.score||0).toLocaleString()}</span><span>${r.accuracy||0}%</span><span>${fmtTime(r.timeSeconds||0)}</span></div>`).join(''):'<div class="lb-empty">No official championship results yet. Be the first racer.</div>');
};
function fmtTime(s){s=Math.round(Number(s)||0);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function escapeHtml(x){return String(x).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
