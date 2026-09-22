// InFormha 0.9.78 - mobilita/stretching automatici e budget tempo totale
(function(){
 if(typeof IF50==='undefined')return;
 const EXTRA={
  mobility_upper:{id:'mobility_upper',name:'Mobilità dinamica parte alta',group:'Mobilità',mobility:true,seconds:60,perSide:true,guide:'mobility_upper'},
  mobility_back:{id:'mobility_back',name:'Mobilità dinamica schiena e dorsali',group:'Mobilità',mobility:true,seconds:60,perSide:true,guide:'mobility_back'},
  mobility_hips:{id:'mobility_hips',name:'Mobilità dinamica anche',group:'Mobilità',mobility:true,seconds:60,perSide:true,guide:'mobility_hips'},
  mobility_ankles:{id:'mobility_ankles',name:'Mobilità dinamica caviglie',group:'Mobilità',mobility:true,seconds:45,perSide:true,guide:'mobility_ankles'},
  mobility_trunk:{id:'mobility_trunk',name:'Mobilità dinamica tronco',group:'Mobilità',mobility:true,seconds:45,perSide:true,guide:'mobility_trunk'},
  stretch_chest:{id:'stretch_chest',name:'Stretching petto',group:'Stretching',stretching:true,seconds:45,perSide:true,guide:'stretch_chest'},
  stretch_back_lats:{id:'stretch_back_lats',name:'Stretching schiena e dorsali',group:'Stretching',stretching:true,seconds:45,perSide:true,guide:'stretch_back_lats'},
  stretch_shoulders_triceps:{id:'stretch_shoulders_triceps',name:'Stretching spalle e tricipiti',group:'Stretching',stretching:true,seconds:45,perSide:true,guide:'stretch_shoulders_triceps'},
  stretch_biceps_forearms:{id:'stretch_biceps_forearms',name:'Stretching bicipiti e avambracci',group:'Stretching',stretching:true,seconds:45,perSide:true,guide:'stretch_biceps_forearms'},
  stretch_quads:{id:'stretch_quads',name:'Stretching quadricipiti',group:'Stretching',stretching:true,seconds:45,perSide:true,guide:'stretch_quads'},
  stretch_hamstrings_glutes:{id:'stretch_hamstrings_glutes',name:'Stretching femorali e glutei',group:'Stretching',stretching:true,seconds:45,perSide:true,guide:'stretch_hamstrings_glutes'},
  stretch_calves:{id:'stretch_calves',name:'Stretching polpacci',group:'Stretching',stretching:true,seconds:45,perSide:true,guide:'stretch_calves'},
  stretch_trunk:{id:'stretch_trunk',name:'Stretching tronco e core',group:'Stretching',stretching:true,seconds:45,perSide:true,guide:'stretch_trunk'}
 };
 const MAP={Petto:{pre:['mobility_upper'],post:['stretch_chest']},Schiena:{pre:['mobility_back'],post:['stretch_back_lats']},Spalle:{pre:['mobility_upper'],post:['stretch_shoulders_triceps']},Tricipiti:{pre:['mobility_upper'],post:['stretch_shoulders_triceps']},Bicipiti:{pre:['mobility_upper'],post:['stretch_biceps_forearms']},Gambe:{pre:['mobility_hips','mobility_ankles'],post:['stretch_quads']},Femorali:{pre:['mobility_hips'],post:['stretch_hamstrings_glutes']},Glutei:{pre:['mobility_hips'],post:['stretch_hamstrings_glutes']},Polpacci:{pre:['mobility_ankles'],post:['stretch_calves']},Core:{pre:['mobility_trunk'],post:['stretch_trunk']}};
 const uniq=a=>[...new Set(a)];
 function extras(kind,strength){const groups=uniq(strength.map(x=>x.group));return uniq(strength.flatMap(x=>MAP[x.group]?.[kind]||[])).slice(0,3).map(id=>({...EXTRA[id],priority:'Opzionale',sets:1,reps:null,rest:0,repType:'seconds',loadType:'bodyweight',targetGroups:(kind==='post'?groups.filter(g=>(MAP[g]?.post||[]).includes(id)):[])}))}
 function trimStrength(strength,minutes){const perExercise=8;const max=Math.max(1,Math.floor(minutes/perExercise));return strength.slice(0,max)}
 const build0=window.if50BuildPlan;if(typeof build0!=='function')return;
 window.if50BuildPlan=function(){
  build0.apply(this,arguments);
  let strength=(IF50.plan||[]).filter(x=>!x.cardio&&!x.mobility&&!x.stretching);
  const treadmill=(IF50.plan||[]).find(x=>x.id==='treadmill')||null;
  const stretch=IF50.stretch_mode==='Sì';
  let pre=stretch&&!treadmill?extras('pre',strength):[];
  let post=stretch?extras('post',strength):[];
  const total=Math.max(10,Number(IF50.time)||45),tmMin=treadmill?Math.max(1,Number(treadmill.duration||treadmill.minutes||IF50.treadmillMinutes)||20):0;
  let extrasMin=(pre.reduce((s,x)=>s+x.seconds*(x.perSide?2:1),0)+post.reduce((s,x)=>s+x.seconds*(x.perSide?2:1),0))/60;
  let strengthMin=Math.max(8,total-tmMin-extrasMin);
  strength=trimStrength(strength,strengthMin);
  pre=stretch&&!treadmill?extras('pre',strength):[];post=stretch?extras('post',strength):[];
  extrasMin=(pre.reduce((s,x)=>s+x.seconds*(x.perSide?2:1),0)+post.reduce((s,x)=>s+x.seconds*(x.perSide?2:1),0))/60;
  strengthMin=Math.max(8,total-tmMin-extrasMin);strength=trimStrength(strength,strengthMin);
  IF50.plan=[...(treadmill?[treadmill]:pre),...strength,...post];
  IF50.timeBudget={total,treadmill:tmMin,mobility:pre.reduce((s,x)=>s+x.seconds*(x.perSide?2:1),0)/60,stretching:post.reduce((s,x)=>s+x.seconds*(x.perSide?2:1),0)/60,strength:strengthMin};
  return IF50.plan;
 };

 const card0=window.if50ExerciseCard;
 const sessions=new Map();
 function session(id){
  const ex=IF50.plan.find(e=>e.id===id);
  if(!ex||!(ex.mobility||ex.stretching))return null;
  let state=sessions.get(id);
  if(!state||state.ex!==ex){state={ex,done:[],index:-1,end:0,left:0,paused:false,saving:false};sessions.set(id,state)}
  return state;
 }
 function paint(id){
  const state=session(id),card=document.getElementById('if50ex_'+id);if(!state||!card)return;
  const count=state.ex.perSide?2:1;
  card.querySelectorAll('[data-timed-side]').forEach((b,i)=>{
   const label=count===2?(i===0?'Lato destro':'Lato sinistro'):'Esercizio';
   const running=state.index===i,done=!!state.done[i];
   b.disabled=done||state.saving||(i>0&&!state.done[i-1]);
   b.classList.toggle('if978-done',done);b.classList.toggle('if978-running',running);
   if(running){const pct=Math.max(0,Math.min(1,state.left/Math.max(1,Number(state.ex.seconds)||90)));b.style.setProperty('--if978-progress',(pct*100).toFixed(2)+'%');b.innerHTML='<span>'+label+'</span><strong>'+state.left+' s</strong>'}else{b.style.removeProperty('--if978-progress');b.textContent=label+' — '+(done?'✓ Completato':'▶ Avvia')};
  });
  const next=card.querySelector('[data-timed-next]');if(next){next.textContent=state.saving?'Salvataggio…':'Prossimo esercizio';next.disabled=state.saving||state.done.filter(Boolean).length!==count;}
 }
 window.if50ExerciseCard=function(ex){
  if(!(ex?.mobility||ex?.stretching))return card0.apply(this,arguments);
  const sec=ex.seconds||90,count=ex.perSide?2:1;
  return '<div class="card if50-ex if978-extra" id="if50ex_'+ex.id+'"><div class="ey">'+(ex.mobility?'Mobilità':'Stretching')+' · '+sec+' s'+(count===2?' per lato':'')+'</div><h2>'+ex.name+'</h2>'+(ex.guide?'<button type="button" class="if978-guide" onclick="openGuide(&quot;'+ex.guide+'&quot;)">ⓘ Guida</button>':'')+'<div class="if978-timed-controls">'+Array.from({length:count},(_,i)=>'<button type="button" data-timed-side="'+i+'" onclick="if978Side(&quot;'+ex.id+'&quot;,'+i+')" '+(i?'disabled':'')+'>'+(count===2?(i?'Lato sinistro':'Lato destro'):'Esercizio')+' — ▶ Avvia · '+sec+' s</button>').join('')+'<button type="button" data-timed-next disabled onclick="if978Next(&quot;'+ex.id+'&quot;)">Prossimo esercizio</button></div></div>';
 };
 window.if978Side=function(id,index){
  const state=session(id);if(!state||state.saving||state.done[index]||(index>0&&!state.done[index-1]))return;
  if(state.index===index){state.paused=!state.paused;if(!state.paused)state.end=Date.now()+state.left*1000}
  else{state.index=index;state.left=Math.max(1,Number(state.ex.seconds)||90);state.end=Date.now()+state.left*1000;state.paused=false;window.if949Start?.(id)}
  paint(id);
 };
 setInterval(()=>{for(const [id,state] of sessions){
  if(state.index>=0&&!state.paused){state.left=Math.max(0,Math.ceil((state.end-Date.now())/1000));if(!state.left){state.done[state.index]=true;state.index=-1}}
  paint(id);
 }},250);
 window.if978PruneStretching=function(){const flow=JSON.parse(localStorage.getItem('informha_workout_flow_0949')||'{}');const completed=new Set((IF50.plan||[]).filter(ex=>!ex.mobility&&!ex.stretching&&!ex.cardio&&flow[ex.id]?.stage==='archived'&&flow[ex.id]?.status==='Completato').map(ex=>ex.group));let changed=false;(IF50.plan||[]).filter(ex=>ex.stretching&&Array.isArray(ex.targetGroups)&&ex.targetGroups.length&&!ex.targetGroups.some(g=>completed.has(g))).forEach(ex=>{if(flow[ex.id]?.stage!=='archived'){flow[ex.id]={...(flow[ex.id]||{}),stage:'archived',status:'Non necessario'};document.getElementById('if50ex_'+ex.id)?.classList.add('if949-archived');changed=true}});if(changed)localStorage.setItem('informha_workout_flow_0949',JSON.stringify(flow));return changed;};
 window.if978Next=async function(id){
  const state=session(id);if(!state||state.saving||state.done.filter(Boolean).length!==(state.ex.perSide?2:1))return;
  state.saving=true;paint(id);
  try{
   const out=await api('api/workout-flow-0949/archive',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workout_id:currentWorkoutId||null,workout_title:IF50.planTitle||'Seduta adattata',exercise:state.ex.name,priority:'Opzionale',status:'Completato'})});
   if(out?.ok===false)throw Error(out.error||'Salvataggio non riuscito');
   if(out?.workout_id)currentWorkoutId=out.workout_id;
   const flow=JSON.parse(localStorage.getItem('informha_workout_flow_0949')||'{}');flow[id]={...flow[id],stage:'archived',status:'Completato'};localStorage.setItem('informha_workout_flow_0949',JSON.stringify(flow));
   document.getElementById('if50ex_'+id)?.classList.add('if949-archived');window.if978Advance(id);
  }catch(e){toast(e.message||'Errore salvataggio. Riprova.')}finally{state.saving=false;paint(id)}
 };
 window.if978Advance=function(id){
  const key='informha_workout_active_0109',flow=JSON.parse(localStorage.getItem('informha_workout_flow_0949')||'{}');
  const cards=[...document.querySelectorAll('[data-page="workout"] .if50-ex,[data-page="workout"] #if50ex_cardio')];
  const getId=c=>c.id.replace('if50ex_',''),index=cards.findIndex(c=>getId(c)===id);
  const next=cards.slice(index+1).find(c=>flow[getId(c)]?.stage!=='archived')||cards.find(c=>getId(c)!==id&&flow[getId(c)]?.stage!=='archived');
  if(next)localStorage.setItem(key,getId(next));else localStorage.removeItem(key);
  cards.forEach(c=>{const on=c===next;c.classList.toggle('if950-current',on);c.classList.toggle('if950-hidden',!on);c.classList.toggle('if1044-current',on);c.style.display=on?'block':'none'});
  if(next){window.if949Start?.(getId(next));next.scrollIntoView?.({behavior:'smooth',block:'center'})}
  window.if1041Refresh?.();window.if67Refresh?.();window.if945Refresh?.();
  if(!next&&typeof go==='function')go('endworkout');
 };
 const controlsStyle=document.createElement('style');controlsStyle.textContent='.if978-extra .if978-timed-controls button.if978-running{min-height:108px!important;padding:22px 26px!important;display:flex!important;align-items:center;justify-content:space-between;text-align:left;background:linear-gradient(to right,#ffae2b 0%,#ff7200 var(--if978-progress),#3b3f45 var(--if978-progress),#2b2e33 100%)!important;transition:background .25s linear;box-shadow:0 0 30px rgba(255,111,0,.25)!important}.if978-extra .if978-timed-controls button.if978-running span{font-size:22px;font-weight:900}.if978-extra .if978-timed-controls button.if978-running strong{font-size:34px;font-weight:950;color:#fff}.if978-extra .if978-timed-controls button.if978-running{display:flex!important;align-items:center;justify-content:space-between;text-align:left}.if978-ring{position:relative;display:inline-grid;place-items:center;width:54px;height:54px;flex:0 0 54px}.if978-ring svg{position:absolute;inset:0;width:54px;height:54px;transform:rotate(-90deg)}.if978-ring circle{fill:none;stroke-width:5}.if978-ring-bg{stroke:rgba(255,255,255,.24)}.if978-ring-progress{stroke:#fff;stroke-linecap:round;stroke-dasharray:201;transition:stroke-dashoffset .2s linear}.if978-ring>b{position:relative;font-size:16px;color:#fff;line-height:1}.if978-ring small{font-size:10px;margin-left:1px}.if978-extra .if978-guide{display:block!important;width:100%;max-width:680px;margin:14px auto 0;min-height:48px;border-radius:15px;border:1px solid rgba(255,176,64,.55);background:#17191d;color:#ffb04a;font-size:16px;font-weight:800}.if978-extra .if978-guide:active{transform:scale(.99)}.if978-extra .if978-timed-controls{display:flex!important;flex-direction:column;gap:12px;width:100%;max-width:680px;margin:24px auto 0}.if978-extra .if978-timed-controls button{display:block!important;width:100%;min-height:64px!important;padding:16px 20px!important;border-radius:20px!important;border:1px solid rgba(255,176,64,.7)!important;background:linear-gradient(110deg,#ffae2b,#ff7200,#ff3b20)!important;color:#fff!important;font-family:inherit;font-size:18px!important;font-weight:800!important;line-height:1.3;box-shadow:0 0 28px rgba(255,111,0,.25)!important;cursor:pointer;transition:opacity .15s,box-shadow .15s}.if978-extra .if978-timed-controls button:disabled{opacity:.45;cursor:default;box-shadow:none!important}.if978-extra .if978-timed-controls button:focus-visible{outline:2px solid #ffb04a;outline-offset:4px}.if978-extra .if978-timed-controls button.if978-done{background:linear-gradient(135deg,#15803d,#22c55e)!important;opacity:1;border-color:#4ade80!important;box-shadow:0 0 24px rgba(34,197,94,.25)!important}.if1041-runner .if978-extra>.ey,.if1041-runner .if978-extra>h2{display:none!important}';document.head.appendChild(controlsStyle);
 const css=document.createElement('style');css.textContent='.if978-timer{margin-top:14px;padding:16px;border:1px solid var(--ln);border-radius:16px;text-align:center}.if978-timer b{display:block;font-size:30px}.if978-timer span{font-size:13px;color:var(--m)}.if978-extra .choice{display:grid!important;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:12px;margin-top:14px}.if978-extra .choice.if978-timed-controls:has(.if978-start:only-child){grid-template-columns:1fr}.if978-extra .choice button{min-height:58px!important;width:100%!important;font-size:17px!important;font-weight:800!important;padding:14px 16px!important;border-radius:18px!important}.if978-extra .if978-start{background:linear-gradient(135deg,#16a34a,#22c55e)!important;color:#fff!important;border:1px solid #4ade80!important;box-shadow:0 0 0 1px rgba(74,222,128,.18),0 0 24px rgba(34,197,94,.32)!important}.if978-extra .if978-start.if978-paused{background:linear-gradient(135deg,#b45309,#f59e0b)!important;border-color:#fbbf24!important;box-shadow:0 0 24px rgba(245,158,11,.28)!important}.if978-extra .if978-timer{background:linear-gradient(180deg,rgba(56,189,248,.10),rgba(34,197,94,.06))!important;border:1px solid rgba(56,189,248,.42)!important;box-shadow:inset 0 0 24px rgba(56,189,248,.05),0 0 18px rgba(56,189,248,.10)!important}.if978-extra .if978-timer b{font-size:38px!important;color:#7dd3fc!important;font-variant-numeric:tabular-nums}.if978-extra .if978-timer span{font-size:14px!important;font-weight:700!important;letter-spacing:.04em}@media(max-width:520px){.if978-extra .choice{grid-template-columns:1fr}.if978-extra .choice button{min-height:60px!important}}';document.head.appendChild(css);
 console.log('[INFORMHA_AUTO_STRETCH] version=0.9.78 automatic=1 treadmill_replaces_mobility=1 final_stretch=1 total_time_budget=1');
})();




