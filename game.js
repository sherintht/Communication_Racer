let player={}, questions=[], idx=0, score=0, correct=0, lives=3, streak=0, overtakes=0;
let startTime=0, timerId=null, limit=0, gameMode='learning', moduleCorrect=[0,0,0,0], moduleTotal=[0,0,0,0], answered=false;
const GOOGLE_SHEET_WEBAPP_URL=''; // Paste your Google Apps Script Web App URL here after deployment.
const GOOGLE_SHEET_RESULTS_ENABLED=true;

const $=id=>document.getElementById(id);
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id).classList.add('active')}
function setModeInfo(){
  const m=$('gameMode').value;
  if(m==='championship'){
    $('modeTitle').textContent='🏆 CHAMPIONSHIP MODE — 15 MINUTES';
    $('modeDescription').textContent='Competitive mode. The 15-minute timer starts only when you click START CHAMPIONSHIP.';
  }else{
    $('modeTitle').textContent='📚 LEARNING MODE — UNLIMITED TIME';
    $('modeDescription').textContent='Learning mode. No timer. Take your time and complete all 100 questions.';
  }
}
function updateModeInfo(){ setModeInfo(); }
function register(){
  const name=$('playerName').value.trim(), roll=$('rollNo').value.trim();
  if(!name||!roll){alert('Please enter your name and roll number.');return}
  player={name,roll,className:$('className').value.trim()||'S5 ECE'};
  gameMode=$('gameMode').value; limit=(gameMode==='championship'?900:0); updateModeInfo(); show('map');
}
function startGame(){
  questions=[...QUESTION_BANK].sort(()=>Math.random()-.5);
  idx=0;score=0;correct=0;lives=3;streak=0;overtakes=0;moduleCorrect=[0,0,0,0];moduleTotal=[0,0,0,0];
  startTime=Date.now(); $('game').classList.add('active'); document.querySelectorAll('.screen').forEach(s=>{if(s.id!=='game')s.classList.remove('active')});
  if(limit>0){clearInterval(timerId);timerId=setInterval(updateTimer,1000)} updateTimer(); loadQuestion(); playTone('start');
}
function updateTimer(){
  if(!limit){$('timer').textContent='UNLIMITED';return}
  const left=Math.max(0,limit-Math.floor((Date.now()-startTime)/1000));
  $('timer').textContent=fmt(left);
  if(left<=0) finish();
}
function fmt(s){return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function loadQuestion(){
  if(idx>=100 || lives<=0){finish();return}
  const q=questions[idx]; answered=false;
  $('qnum').textContent=idx+1;$('score').textContent=score;$('lives').textContent=lives;
  $('moduleLabel').textContent='MODULE '+q.module;
  $('question').textContent=q.question;$('difficulty').textContent=q.difficulty.toUpperCase();$('streak').textContent='STREAK ×'+streak;$('feedback').textContent='';
  const box=$('options');box.innerHTML='';
  q.options.forEach((o,i)=>{const b=document.createElement('button');b.textContent=String.fromCharCode(65+i)+'. '+o;b.onclick=()=>answer(i,b);box.appendChild(b)});
}
function answer(choice,btn){
  if(answered)return;answered=true;
  const q=questions[idx], buttons=[...$('options').children];
  buttons.forEach((b,i)=>{if(i===q.answer)b.classList.add('correct');if(i===choice&&i!==q.answer)b.classList.add('wrong')});
  moduleTotal[q.module-1]++;
  if(choice===q.answer){
    correct++;moduleCorrect[q.module-1]++;streak++;overtakes++;score+=100+(streak>=3?50:0);
    $('feedback').textContent='✅ CORRECT!  +'+(100+(streak>=3?50:0))+' POINTS';
    playTone('correct');
  }else{
    lives--;streak=0;$('feedback').textContent='❌ WRONG!  '+(lives?'−1 LIFE':'RACE OVER');
    playTone('wrong');
  }
  $('score').textContent=score;$('lives').textContent=lives;
  setTimeout(()=>{idx++;loadQuestion()},700);
}
function finish(){
  clearInterval(timerId);
  const elapsed=Math.floor((Date.now()-startTime)/1000), acc=Math.round(correct/100*100);
  let title=correct>=90?'COMMUNICATION CHAMPION':correct>=75?'EXPERT RACER':correct>=60?'COMMUNICATION DRIVER':correct>=50?'QUALIFIED RACER':'RE-RACE REQUIRED';
  $('finalScore').textContent=correct;$('correct').textContent=correct;$('accuracy').textContent=acc+'%';
  $('elapsed').textContent=fmt(elapsed);$('overtakes').textContent=overtakes;$('rankText').textContent=title;
  $('moduleStats').innerHTML=moduleCorrect.map((v,i)=>`<div class="module-row"><b>Module ${i+1} — ${v}/25</b><div class="bar"><i style="width:${v/25*100}%"></i></div></div>`).join('');
  let badges=[];
  if(correct>=50)badges.push('🏆 Communication Champion');
  if(correct>=90)badges.push('📡 Signal Specialist');
  if(streak>=5)badges.push('⚡ Turbo Thinker');
  if(elapsed<=900)badges.push('⏱ Speed Scholar');
  badges.push('🏍️ Race Finisher');
  $('badges').innerHTML=badges.map(x=>`<span class="badge">${x}</span>`).join('');
  const record={...player,score:correct,points:score,accuracy:acc,time:elapsed,date:new Date().toLocaleString(),modules:moduleCorrect};
  const db=JSON.parse(localStorage.getItem('communicationRacerDB')||'[]');db.push(record);db.sort((a,b)=>b.score-a.score||a.time-b.time);localStorage.setItem('communicationRacerDB',JSON.stringify(db.slice(0,200)));
  if(GOOGLE_SHEET_RESULTS_ENABLED && GOOGLE_SHEET_WEBAPP_URL){
    fetch(GOOGLE_SHEET_WEBAPP_URL,{
      method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({...record,mode:gameMode,qualified:correct>=50})
    }).catch(()=>{});
  }
  show('result');playTone('finish');
}
function showLeaderboard(){
  const db=JSON.parse(localStorage.getItem('communicationRacerDB')||'[]');
  $('leaderboardTable').innerHTML=db.length?`<table class="table"><tr><th>#</th><th>Player</th><th>Roll</th><th>Score</th><th>Accuracy</th><th>Time</th></tr>${db.slice(0,30).map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.roll)}</td><td>${r.score}/100</td><td>${r.accuracy}%</td><td>${fmt(r.time)}</td></tr>`).join('')}</table>`:'<p class="muted">No results yet. Be the first racer!</p>';
  show('leaderboard');
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
let audioCtx=null;
function playTone(type){
  try{
    audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);
    const now=audioCtx.currentTime;
    const seq=type==='correct'?[660,880]:type==='wrong'?[180,120]:type==='finish'?[523,659,784,1046]:[330,440,660];
    seq.forEach((f,i)=>{o.frequency.setValueAtTime(f,now+i*.09)});
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.12,now+.02);g.gain.exponentialRampToValueAtTime(.0001,now+seq.length*.09+.05);
    o.start(now);o.stop(now+seq.length*.09+.08);
  }catch(e){}
}
