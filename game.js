const CONFIG={
  GOOGLE_SHEET_WEBAPP_URL:'', // Paste Apps Script Web App URL here.
  EVENT_KEY:'',               // Optional event key; not a security boundary when embedded in public JS.
  QUESTION_FETCH:true,
  RESULT_POST:true,
  CHAMPIONSHIP_SECONDS:900,
  PASS_SCORE:50
};

const ACHIEVEMENTS=[
 {id:'first_lap',icon:'🏁',name:'First Lap',desc:'Complete your first run.',test:s=>s.completed},
 {id:'signal_starter',icon:'📡',name:'Signal Starter',desc:'Answer 10 questions correctly in one run.',test:s=>s.correct>=10},
 {id:'turbo_thinker',icon:'⚡',name:'Turbo Thinker',desc:'Build a 5-answer streak.',test:s=>s.bestStreak>=5},
 {id:'combo_master',icon:'🔥',name:'Combo Master',desc:'Build a 10-answer streak.',test:s=>s.bestStreak>=10},
 {id:'analog_ace',icon:'📻',name:'Analog Ace',desc:'Score 20+ correct in Module 1.',test:s=>s.modules[0]>=20},
 {id:'digital_dominator',icon:'💻',name:'Digital Dominator',desc:'Score 20+ correct in Module 2.',test:s=>s.modules[1]>=20},
 {id:'modulation_master',icon:'📶',name:'Modulation Master',desc:'Score 20+ correct in Module 3.',test:s=>s.modules[2]>=20},
 {id:'noise_breaker',icon:'🛡️',name:'Noise Breaker',desc:'Score 20+ correct in Module 4.',test:s=>s.modules[3]>=20},
 {id:'speed_scholar',icon:'⏱️',name:'Speed Scholar',desc:'Finish a championship run in 10 minutes or less.',test:s=>s.mode==='championship'&&s.elapsed<=600&&s.completed},
 {id:'perfect_lap',icon:'💎',name:'Perfect Lap',desc:'Answer all 100 questions correctly.',test:s=>s.correct===100},
 {id:'comeback_racer',icon:'🚀',name:'Comeback Racer',desc:'Recover from 1 life and finish the run.',test:s=>s.usedLastLife&&s.completed},
 {id:'communication_champion',icon:'👑',name:'Communication Champion',desc:'Score 90 or more out of 100.',test:s=>s.correct>=90},
 {id:'noise_king_slayer',icon:'👑',name:'Noise King Slayer',desc:'Clear all four modules.',test:s=>s.correct>=50&&s.completed}
];

let drive={lane:1,speed:60,targetSpeed:60,keys:{},running:false,raf:0,traffic:[],last:0};
let state={player:{},mode:'learning',questions:[],idx:0,score:0,correct:0,lives:3,streak:0,bestStreak:0,overtakes:0,turbo:0,startTime:0,elapsed:0,timer:null,moduleCorrect:[0,0,0,0],moduleTotal:[0,0,0,0],answered:false,finished:false,achievements:[],usedLastLife:false,paused:false};
let audio=null,soundOn=true,lastLB='championship';
const $=id=>document.getElementById(id);
const screens=[...document.querySelectorAll('.screen')];
function show(id){screens.forEach(s=>s.classList.toggle('active',s.id===id));window.scrollTo(0,0)}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function fmt(sec){sec=Math.max(0,Math.floor(sec));return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`}
function initAudio(){try{audio=audio||new (window.AudioContext||window.webkitAudioContext)(); if(audio.state==='suspended')audio.resume()}catch(e){}}
function tone(freq,dur=.08,type='sine',gain=.07,delay=0){if(!soundOn||!audio)return;try{const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime+delay);g.gain.setValueAtTime(.0001,audio.currentTime+delay);g.gain.exponentialRampToValueAtTime(gain,audio.currentTime+delay+.01);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+delay+dur);o.connect(g);g.connect(audio.destination);o.start(audio.currentTime+delay);o.stop(audio.currentTime+delay+dur+.02)}catch(e){}}
function sfx(kind){initAudio();const map={click:[330],correct:[660,880],wrong:[180,120],turbo:[260,520,780],checkpoint:[523,659,784],achievement:[784,988,1175],finish:[523,659,784,1046]};(map[kind]||map.click).forEach((f,i)=>tone(f,.09,'square',.055,i*.07))}
function toggleSound(){soundOn=!soundOn;$('globalSound').textContent=soundOn?'🔊':'🔇';if(soundOn){initAudio();sfx('click')}}
function stored(){try{return JSON.parse(localStorage.getItem('communicationRacerV2')||'{}')}catch(e){return {}}}
function saveLocalRun(record){const d=stored();d.runs=Array.isArray(d.runs)?d.runs:[];d.runs.push(record);d.runs=d.runs.slice(-300);d.unlocked=Array.isArray(d.unlocked)?d.unlocked:[];for(const id of state.achievements)if(!d.unlocked.includes(id))d.unlocked.push(id);d.xp=(d.xp||0)+record.xp;localStorage.setItem('communicationRacerV2',JSON.stringify(d))}
function unlocked(){return stored().unlocked||[]}
function totalXP(){return stored().xp||0}
function levelName(){const xp=totalXP();return xp>=5000?'LEGEND RACER':xp>=3000?'ELITE RACER':xp>=1500?'SIGNAL MASTER':xp>=700?'PRO RACER':'ROOKIE RACER'}
function renderHome(){
 $('xpText').textContent=totalXP();$('xpBar').style.width=(Math.min(100,totalXP()%500/5))+'%';$('garageLevel').textContent=levelName();
 const u=new Set(unlocked());$('badgeCount').textContent=u.size;$('homeBadges').innerHTML=ACHIEVEMENTS.filter(a=>u.has(a.id)).slice(-6).map(a=>`<span class="badge-dot" title="${escapeHtml(a.name)}">${a.icon}</span>`).join('')||'<span class="muted">No badges yet — start your first run.</span>';
 $('achievementCabinet').innerHTML=ACHIEVEMENTS.slice(0,9).map(a=>`<div class="ach-mini ${u.has(a.id)?'unlocked':''}" title="${escapeHtml(a.name)}">${a.icon}</div>`).join('');
 const runs=(stored().runs||[]).filter(r=>r.mode==='championship').sort((a,b)=>b.correct-a.correct||a.elapsed-b.elapsed).slice(0,3);$('homeLeaderboard').innerHTML=runs.length?runs.map((r,i)=>`<div class="mini-row"><b>${i+1}</b><span>${escapeHtml(r.name)}</span><strong>${r.correct}/100</strong></div>`).join(''):'<div class="muted">Be the first champion.</div>';
}
function selectMode(mode){state.mode=mode;document.querySelectorAll('.mode-option').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));$('modeHint').textContent=mode==='championship'?'Championship mode: 15-minute official competitive run. The timer starts after the countdown.':'Learning mode: no countdown. Focus on understanding each answer and replay to improve.'}
function register(){const name=$('playerName').value.trim(),roll=$('rollNo').value.trim();if(!name||!roll){alert('Enter your name and roll number.');return}state.player={name,roll,className:$('className').value.trim()||'S5 ECE'};$('modeTitle').textContent=state.mode==='championship'?'🏆 CHAMPIONSHIP RUN — 15 MINUTES':'📚 LEARNING RUN — UNLIMITED TIME';$('modeDescription').textContent=state.mode==='championship'?'Official competitive run. Answer fast, protect your lives and finish before the timer.':'Unlimited-time learning run. Use the explanations, build streaks and replay as often as you like.';show('map');sfx('click')}
function normalizeQuestions(list){return (Array.isArray(list)?list:[]).map((q,i)=>{const opts=Array.isArray(q.options)?q.options:[q.optionA,q.optionB,q.optionC,q.optionD].filter(v=>v!=null&&String(v).trim()!=='');let ans=q.answer;if(typeof ans==='string'){const t=ans.trim().toUpperCase();ans=['A','B','C','D'].indexOf(t);if(ans<0)ans=Number(q.answer)}ans=Number.isFinite(Number(ans))?Number(ans):0;return {...q,id:q.id||i+1,module:Number(q.module)||1,options:opts.slice(0,4),answer:ans,question:String(q.question||'Question unavailable'),difficulty:String(q.difficulty||'Medium'),co:String(q.co||('CO'+(Number(q.module)||1))),explanation:String(q.explanation||('Correct answer: '+(opts[ans]||'See the highlighted option.')))}}).filter(q=>q.question&&q.options.length>=2)}
async function loadQuestions(){let qs=null;if(CONFIG.QUESTION_FETCH&&CONFIG.GOOGLE_SHEET_WEBAPP_URL){try{const url=CONFIG.GOOGLE_SHEET_WEBAPP_URL+'?action=questions'+(CONFIG.EVENT_KEY?'&key='+encodeURIComponent(CONFIG.EVENT_KEY):'');const r=await fetch(url,{cache:'no-store'});const j=await r.json();if(j.ok&&Array.isArray(j.questions)&&j.questions.length>=20)qs=j.questions}catch(e){console.warn('Sheet questions unavailable; using local bank.',e)}}return normalizeQuestions(qs||window.QUESTION_BANK||[])}

function laneX(lane){
  const w=$('raceScene')?.clientWidth||1000;
  const left=w*.26, span=w*.48;
  return left+span*(lane/3);
}
function setLane(lane){
  drive.lane=Math.max(0,Math.min(3,lane));
  const x=laneX(drive.lane);
  $('playerBike').style.left=x+'px';
  $('laneText').textContent=(drive.lane+1)+'/4';
  if(drive.lane===0)$('raceScene').classList.add('drive-left');else $('raceScene').classList.remove('drive-left');
  if(drive.lane===3)$('raceScene').classList.add('drive-right');else $('raceScene').classList.remove('drive-right');
}
function steer(dir){setLane(drive.lane+dir);drive.targetSpeed=Math.max(35,drive.targetSpeed-3)}
function accelerate(){drive.targetSpeed=Math.min(145,drive.targetSpeed+8)}
function brake(){drive.targetSpeed=Math.max(25,drive.targetSpeed-15)}
function initTraffic(){
  drive.traffic=[...document.querySelectorAll('.traffic')].map((el,i)=>({el,lane:i%4,y:80+i*150,speed:35+i*8}));
  drive.traffic.forEach((t,i)=>{t.el.style.left=laneX(t.lane)+'px';t.el.style.top=t.y+'px';});
}
function hitTest(a,b){
  const ar=a.getBoundingClientRect(), br=b.getBoundingClientRect();
  return !(ar.right<br.left+12||ar.left>br.right-12||ar.bottom<br.top+12||ar.top>br.bottom-12);
}
function driveLoop(ts){
  if(!drive.running)return;
  const dt=Math.min(.04,(ts-(drive.last||ts))/1000); drive.last=ts;
  if(drive.keys.ArrowLeft||drive.keys.a) steer(-1);
  if(drive.keys.ArrowRight||drive.keys.d) steer(1);
  if(drive.keys.ArrowUp||drive.keys.w) accelerate();
  if(drive.keys.ArrowDown||drive.keys.s) brake();
  drive.speed += (drive.targetSpeed-drive.speed)*Math.min(1,dt*4);
  $('speedText').textContent=Math.round(drive.speed);
  drive.traffic.forEach(t=>{
    t.y += (drive.speed-t.speed)*dt*2.2;
    if(t.y>620){t.y=-90-Math.random()*260;t.lane=Math.floor(Math.random()*4);t.el.style.left=laneX(t.lane)+'px';}
    t.el.style.top=t.y+'px';
    if(state.idx<100 && state.answered===false && t.lane===drive.lane && hitTest($('playerBike'),t.el)){
      t.y=-120;t.el.style.top=t.y+'px';t.lane=Math.floor(Math.random()*4);t.el.style.left=laneX(t.lane)+'px';
      if(state.lives>0){state.lives--;state.streak=0;drive.targetSpeed=Math.max(30,drive.targetSpeed-20);$('feedback').textContent='💥 TRAFFIC HIT — LIFE LOST';$('feedback').style.color='#ff5b87';sfx('wrong');renderHUD();}
    }
  });
  drive.raf=requestAnimationFrame(driveLoop);
}
function startDriving(){
  drive.running=true;drive.last=0;initTraffic();setLane(1);cancelAnimationFrame(drive.raf);drive.raf=requestAnimationFrame(driveLoop);
}
function stopDriving(){drive.running=false;cancelAnimationFrame(drive.raf);drive.raf=0}
function resetState(){stopDriving();drive={lane:1,speed:60,targetSpeed:60,keys:{},running:false,raf:0,traffic:[],last:0};state={...state,questions:[],idx:0,score:0,correct:0,lives:3,streak:0,bestStreak:0,overtakes:0,turbo:0,startTime:0,elapsed:0,timer:null,moduleCorrect:[0,0,0,0],moduleTotal:[0,0,0,0],answered:false,finished:false,achievements:[],usedLastLife:false,paused:false}}
async function startGame(){initAudio();sfx('click');resetState();$('startGameBtn').disabled=true;$('startGameBtn').textContent='LOADING GRID…';state.questions=(await loadQuestions()).sort(()=>Math.random()-.5).slice(0,100);if(state.questions.length<1){alert('No questions found. Check questions.js or Google Sheet.');$('startGameBtn').disabled=false;$('startGameBtn').textContent='START RACE →';return}show('game');startDriving();$('startGameBtn').disabled=false;$('startGameBtn').textContent='START RACE →';startCountdown()}
function startCountdown(){let n=3;$('feedback').textContent=`GET READY… ${n}`;const t=setInterval(()=>{n--;sfx('click');if(n>0)$('feedback').textContent=`GET READY… ${n}`;else{clearInterval(t);$('feedback').textContent='GO!';state.startTime=Date.now();if(state.mode==='championship')state.timer=setInterval(updateTimer,250);loadQuestion();renderHUD();}},700)}
function updateTimer(){if(state.finished||state.mode!=='championship')return;const left=CONFIG.CHAMPIONSHIP_SECONDS-Math.floor((Date.now()-state.startTime)/1000);$('timer').textContent=fmt(left);if(left<=0)finish('time')}
function moduleName(m){return ['ANALOG COMMUNICATION','DIGITAL COMMUNICATION','BASEBAND + AWGN','DIGITAL MODULATION'][m-1]||'RACE'}
function loadQuestion(){if(state.idx>=100||state.lives<=0){finish('complete');return}const q=state.questions[state.idx];state.answered=false;$('qnum').textContent=state.idx+1;$('moduleLabel').textContent=moduleName(Number(q.module));$('difficulty').textContent=String(q.difficulty||'MEDIUM').toUpperCase();$('coLabel').textContent=String(q.co||('CO'+q.module));$('streak').textContent=`STREAK ×${state.streak}`;$('question').textContent=q.question;$('explanation').textContent=q.explanation||'Correct answer! Keep the concept in mind for the next lap.';$('explanation').classList.remove('show');$('feedback').textContent='';const box=$('options');box.innerHTML='';(q.options||[]).forEach((o,i)=>{const b=document.createElement('button');b.innerHTML=`<b>${String.fromCharCode(65+i)}</b> ${escapeHtml(o)}`;b.addEventListener('click',()=>answer(i,b));box.appendChild(b)});updateProgress();}
function renderHUD(){$('lives').textContent=state.lives;$('score').textContent=state.score;$('overtakes').textContent=state.overtakes;$('turboText').textContent=state.turbo;$('comboText').textContent='x'+(1+Math.min(1.5,state.streak*.1)).toFixed(1);$('turboBtn').disabled=state.turbo<1;$('turboBtn').textContent=state.turbo>0?`⚡ TURBO ×${state.turbo}`:'⚡ TURBO';if(state.mode==='learning')$('timer').textContent='∞'}
function updateProgress(){$('raceProgress').style.width=(state.idx/100*100)+'%';const m=Math.floor(state.idx/25)+1;$('checkpointLabel').textContent=m<=4?`CHECKPOINT 0${m} • ${moduleName(m)}`:'NOISE KING';}
function answer(choice,btn){if(state.answered||state.finished)return;state.answered=true;const q=state.questions[state.idx],buttons=[...$('options').children];buttons.forEach((b,i)=>{b.disabled=true;if(i===Number(q.answer))b.classList.add('correct');if(i===choice&&i!==Number(q.answer))b.classList.add('wrong')});const mod=Math.min(4,Math.max(1,Number(q.module)||1))-1;state.moduleTotal[mod]++;if(choice===Number(q.answer)){state.correct++;state.moduleCorrect[mod]++;state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);state.overtakes++;const base=100+Math.min(150,state.streak*10);state.score+=base;drive.targetSpeed=Math.min(150,drive.targetSpeed+12);state.turbo=Math.min(3,state.turbo+(state.streak%3===0?1:0));$('feedback').textContent=`✓ OVERTAKE! +${base} POINTS`;$('feedback').style.color='#35f0bd';$('explanation').classList.add('show');sfx('correct');if(state.mode==='championship'&&state.streak>=3){const bonus=Math.min(4,state.streak-2);state.startTime-=bonus*1000}}else{if(state.lives===1)state.usedLastLife=true;state.lives--;state.streak=0;drive.targetSpeed=Math.max(30,drive.targetSpeed-20);$('feedback').textContent=state.lives?'✕ WRONG — LIFE LOST':'✕ RACE OVER';$('feedback').style.color='#ff5b87';$('explanation').classList.add('show');sfx('wrong')}
 renderHUD();const newly=checkAchievements(false);if(newly.length){showAchievement(newly[0],()=>advanceAfterAnswer())}else setTimeout(advanceAfterAnswer,900)}
function useTurbo(){if(state.turbo<1||state.answered||state.finished)return;state.turbo--;state.score+=200;state.overtakes+=2;drive.targetSpeed=Math.min(170,drive.targetSpeed+35);if(state.mode==='championship')state.startTime+=10000;$('boostFlame').classList.add('on');$('nitroTrail').classList.add('on');sfx('turbo');setTimeout(()=>{$('boostFlame').classList.remove('on');$('nitroTrail').classList.remove('on')},1200);renderHUD()}
function advanceAfterAnswer(){const was=state.idx;state.idx++;if(was===24||was===49||was===74||was===99){showCheckpoint(Math.floor(was/25)+1);return}loadQuestion()}
function showCheckpoint(m){if(m>=1&&m<=4){const names=['ANALOG MASTERED','DIGITAL DOMINATOR','MODULATION MASTER','FINAL RACE CLEARED'];const icons=['📡','💻','📶','👑'];$('checkpointIcon').textContent=icons[m-1];$('checkpointTitle').textContent=names[m-1];$('checkpointText').textContent=`Module ${m} checkpoint cleared. Your correct answers: ${state.moduleCorrect[m-1]}/25.`;$('checkpointReward').textContent=`+${500*m} XP • TURBO READY`;sfx('checkpoint');show('checkpoint')}else loadQuestion()}
function showAchievement(a,after){$('achievementIcon').textContent=a.icon;$('achievementTitle').textContent=a.name;$('achievementText').textContent=a.desc;sfx('achievement');$('achievementContinue').onclick=()=>{show('game');after()};show('achievement')}
function checkAchievements(final=false){const snap={completed:final&&state.idx>=100,correct:state.correct,bestStreak:state.bestStreak,modules:state.moduleCorrect,mode:state.mode,elapsed:state.elapsed,usedLastLife:state.usedLastLife};const already=new Set(unlocked().concat(state.achievements));const newly=[];ACHIEVEMENTS.forEach(a=>{if(!already.has(a.id)&&a.test(snap)){state.achievements.push(a.id);newly.push(a)}});return newly}
function finish(reason){if(state.finished)return;state.finished=true;if(state.timer)clearInterval(state.timer);state.elapsed=Math.floor((Date.now()-state.startTime)/1000);const completed=reason==='complete'&&state.idx>=100;const snap={completed,correct:state.correct,bestStreak:state.bestStreak,modules:state.moduleCorrect,mode:state.mode,elapsed:state.elapsed,usedLastLife:state.usedLastLife};const newly=checkAchievements(true);const xp=state.correct*10+state.bestStreak*20+state.overtakes*2+(completed?500:0);const acc=Math.round(state.correct/Math.max(1,state.idx)*100);const record={timestamp:new Date().toISOString(),name:state.player.name,roll:state.player.roll,className:state.player.className,mode:state.mode,correct:state.correct,points:state.score,accuracy:acc,time:state.elapsed,elapsed:state.elapsed,modules:[...state.moduleCorrect],bestStreak:state.bestStreak,overtakes:state.overtakes,xp,qualified:state.correct>=CONFIG.PASS_SCORE,achievements:[...state.achievements]};saveLocalRun(record);renderResult(record,newly);postResult(record);sfx('finish')}
function renderResult(r,newly){$('finalScore').textContent=r.correct;$('correct').textContent=r.correct;$('accuracy').textContent=r.accuracy+'%';$('elapsed').textContent=fmt(r.elapsed);$('finalOvertakes').textContent=r.overtakes;$('xpEarned').textContent=r.xp+' XP';$('rankText').textContent=r.correct>=90?'COMMUNICATION CHAMPION':r.correct>=75?'ELITE RACER':r.correct>=50?'QUALIFIED RACER':'KEEP TRAINING';$('finalMedal').textContent=r.correct>=90?'👑':r.correct>=75?'🏆':r.correct>=50?'🥇':'🔧';$('moduleStats').innerHTML=r.modules.map((v,i)=>`<div class="module-row"><b>${moduleName(i+1)} — ${v}/25</b><div class="bar"><i style="width:${v/25*100}%"></i></div></div>`).join('');$('badges').innerHTML=(r.achievements.length?r.achievements.map(id=>ACHIEVEMENTS.find(a=>a.id===id)).filter(Boolean).map(a=>`<span class="badge">${a.icon} ${escapeHtml(a.name)}</span>`).join(''):'<span class="muted">No new achievements this run.</span>');$('serverStatus').textContent=CONFIG.GOOGLE_SHEET_WEBAPP_URL?'Saving result to event database…':'Local result saved. Connect Google Sheets to use the shared event database.';show('result');renderHome()}
async function postResult(r){if(!CONFIG.RESULT_POST||!CONFIG.GOOGLE_SHEET_WEBAPP_URL)return;try{const body={...r,eventKey:CONFIG.EVENT_KEY};await fetch(CONFIG.GOOGLE_SHEET_WEBAPP_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)});$('serverStatus').textContent='✓ Result submitted to event database.'}catch(e){$('serverStatus').textContent='⚠ Local result saved; database submission could not be confirmed.'}}
function showLeaderboard(mode=lastLB){lastLB=mode;document.querySelectorAll('.lb-tab').forEach(b=>b.classList.toggle('active',b.dataset.lb===mode));const runs=(stored().runs||[]).filter(r=>mode==='all'||r.mode==='championship').sort((a,b)=>b.correct-a.correct||a.elapsed-b.elapsed);$('leaderboardTable').innerHTML=runs.length?`<table class="table"><tr><th>#</th><th>Racer</th><th>Mode</th><th>Score</th><th>Acc.</th><th>Time</th></tr>${runs.slice(0,30).map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(r.name)}</td><td>${r.mode==='championship'?'🏆':'📚'}</td><td><b>${r.correct}/100</b></td><td>${r.accuracy}%</td><td>${fmt(r.elapsed)}</td></tr>`).join('')}</table>`:'<p class="muted">No runs yet. Start the first race!</p>';show('leaderboard')}
function renderAchievements(){const u=new Set(unlocked());$('allAchievements').innerHTML=ACHIEVEMENTS.map(a=>`<div class="ach-card ${u.has(a.id)?'unlocked':'locked'}"><div class="icon">${a.icon}</div><b>${escapeHtml(a.name)}</b><p>${escapeHtml(a.desc)}</p><small>${u.has(a.id)?'✓ UNLOCKED':'🔒 LOCKED'}</small></div>`).join('');show('achievements')}
function quitRun(){if(state.timer)clearInterval(state.timer);state.finished=true;show('home');renderHome()}
document.addEventListener('keydown',e=>{
 if(!document.getElementById('game').classList.contains('active')||state.finished)return;
 if(e.target&&['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
 const k=e.key;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(k)){drive.keys[k]=true;e.preventDefault();return}
 if(state.answered)return;
 const n=Number(k);if(n>=1&&n<=4){const b=$('options').children[n-1];if(b&&!b.disabled){b.click();e.preventDefault()}}
});
document.addEventListener('keyup',e=>{if(e.key in drive.keys)drive.keys[e.key]=false;});

// UI wiring
document.querySelectorAll('.mode-option').forEach(b=>b.addEventListener('click',()=>selectMode(b.dataset.mode)));
$('startBtn').addEventListener('click',()=>{initAudio();sfx('click');show('registration')});$('howBtn').addEventListener('click',()=>show('howto'));$('leaderBtn').addEventListener('click',()=>showLeaderboard());$('achievementBtn').addEventListener('click',renderAchievements);
$('continueBtn').addEventListener('click',register);$('backHome1').addEventListener('click',()=>show('home'));$('backReg').addEventListener('click',()=>show('registration'));$('startGameBtn').addEventListener('click',startGame);$('checkpointContinue').addEventListener('click',()=>{show('game');loadQuestion()});$('turboBtn').addEventListener('click',useTurbo);$('pauseBtn').addEventListener('click',()=>{if(state.finished)return;state.paused=true;if(state.timer)clearInterval(state.timer);show('pause')});$('resumeBtn').addEventListener('click',()=>{state.paused=false;if(state.mode==='championship')state.timer=setInterval(updateTimer,250);show('game')});$('quitBtn').addEventListener('click',quitRun);$('resultAgain').addEventListener('click',()=>{show('map');setTimeout(startGame,100)});$('resultLeader').addEventListener('click',()=>showLeaderboard());$('resultHome').addEventListener('click',()=>{show('home');renderHome()});$('lbHome').addEventListener('click',()=>{show('home');renderHome()});$('achHome').addEventListener('click',()=>{show('home');renderHome()});$('howBack').addEventListener('click',()=>show('home'));$('globalSound').addEventListener('click',toggleSound);document.querySelectorAll('.lb-tab').forEach(b=>b.addEventListener('click',()=>showLeaderboard(b.dataset.lb)));
// fix achievement button event binding above: use direct listener
$('achievementBtn').onclick=renderAchievements;
selectMode('learning');renderHome();

;['steerLeft','steerRight','steerBrake'].forEach(id=>{
 const el=$(id); if(!el)return;
 el.addEventListener('pointerdown',e=>{e.preventDefault(); if(id==='steerLeft')steer(-1); else if(id==='steerRight')steer(1); else brake();});
});
