// InFormha 0.9.78 - mobilita/stretching automatici e budget tempo totale
(function(){
 if(typeof IF50==='undefined')return;
 const EXTRA={
  mobility_upper:{id:'mobility_upper',name:'Mobilità dinamica parte alta',group:'Mobilità',mobility:true,seconds:120,guide:'mobility_upper'},
  mobility_back:{id:'mobility_back',name:'Mobilità dinamica schiena e dorsali',group:'Mobilità',mobility:true,seconds:120,guide:'mobility_back'},
  mobility_hips:{id:'mobility_hips',name:'Mobilità dinamica anche',group:'Mobilità',mobility:true,seconds:120,guide:'mobility_hips'},
  mobility_ankles:{id:'mobility_ankles',name:'Mobilità dinamica caviglie',group:'Mobilità',mobility:true,seconds:90,guide:'mobility_ankles'},
  mobility_trunk:{id:'mobility_trunk',name:'Mobilità dinamica tronco',group:'Mobilità',mobility:true,seconds:90,guide:'mobility_trunk'},
  stretch_chest:{id:'stretch_chest',name:'Stretching petto',group:'Stretching',stretching:true,seconds:90,guide:'stretch_chest'},
  stretch_back_lats:{id:'stretch_back_lats',name:'Stretching schiena e dorsali',group:'Stretching',stretching:true,seconds:90,guide:'stretch_back_lats'},
  stretch_shoulders_triceps:{id:'stretch_shoulders_triceps',name:'Stretching spalle e tricipiti',group:'Stretching',stretching:true,seconds:90,guide:'stretch_shoulders_triceps'},
  stretch_biceps_forearms:{id:'stretch_biceps_forearms',name:'Stretching bicipiti e avambracci',group:'Stretching',stretching:true,seconds:90,guide:'stretch_biceps_forearms'},
  stretch_quads:{id:'stretch_quads',name:'Stretching quadricipiti',group:'Stretching',stretching:true,seconds:90,guide:'stretch_quads'},
  stretch_hamstrings_glutes:{id:'stretch_hamstrings_glutes',name:'Stretching femorali e glutei',group:'Stretching',stretching:true,seconds:90,guide:'stretch_hamstrings_glutes'},
  stretch_calves:{id:'stretch_calves',name:'Stretching polpacci',group:'Stretching',stretching:true,seconds:90,guide:'stretch_calves'},
  stretch_trunk:{id:'stretch_trunk',name:'Stretching tronco e core',group:'Stretching',stretching:true,seconds:90,guide:'stretch_trunk'}
 };
 const MAP={Petto:{pre:['mobility_upper'],post:['stretch_chest']},Schiena:{pre:['mobility_back'],post:['stretch_back_lats']},Spalle:{pre:['mobility_upper'],post:['stretch_shoulders_triceps']},Tricipiti:{pre:['mobility_upper'],post:['stretch_shoulders_triceps']},Bicipiti:{pre:['mobility_upper'],post:['stretch_biceps_forearms']},Gambe:{pre:['mobility_hips','mobility_ankles'],post:['stretch_quads']},Femorali:{pre:['mobility_hips'],post:['stretch_hamstrings_glutes']},Glutei:{pre:['mobility_hips'],post:['stretch_hamstrings_glutes']},Polpacci:{pre:['mobility_ankles'],post:['stretch_calves']},Core:{pre:['mobility_trunk'],post:['stretch_trunk']}};
 const uniq=a=>[...new Set(a)];
 function extras(kind,strength){return uniq(strength.flatMap(x=>MAP[x.group]?.[kind]||[])).slice(0,3).map(id=>({...EXTRA[id],priority:'Opzionale',sets:1,reps:null,rest:0,repType:'seconds',loadType:'bodyweight'}))}
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
  let extrasMin=(pre.reduce((s,x)=>s+x.seconds,0)+post.reduce((s,x)=>s+x.seconds,0))/60;
  let strengthMin=Math.max(8,total-tmMin-extrasMin);
  strength=trimStrength(strength,strengthMin);
  pre=stretch&&!treadmill?extras('pre',strength):[];post=stretch?extras('post',strength):[];
  extrasMin=(pre.reduce((s,x)=>s+x.seconds,0)+post.reduce((s,x)=>s+x.seconds,0))/60;
  strengthMin=Math.max(8,total-tmMin-extrasMin);strength=trimStrength(strength,strengthMin);
  IF50.plan=[...(treadmill?[treadmill]:pre),...strength,...post];
  IF50.timeBudget={total,treadmill:tmMin,mobility:pre.reduce((s,x)=>s+x.seconds,0)/60,stretching:post.reduce((s,x)=>s+x.seconds,0)/60,strength:strengthMin};
  return IF50.plan;
 };
 const card0=window.if50ExerciseCard;
 window.if50ExerciseCard=function(ex){
  if(ex?.mobility||ex?.stretching){const sec=ex.seconds||90,label=ex.mobility?'Mobilità dinamica':'Stretching finale';return `<div class="card if50-ex if978-extra" id="if50ex_${ex.id}"><div class="ey">${label} · circa ${Math.round(sec/60*10)/10} min</div><h2>${ex.name}</h2><div class="sub">${ex.mobility?'Preparazione dinamica mirata alla seduta di oggi.':'Allungamento finale scelto da iCoach per i gruppi allenati.'}</div>${ex.guide?`<button class="btn secondary" onclick="openGuide('${ex.guide}')">Guida</button>`:''}<div class="if978-timer" id="if978timer_${ex.id}"><b>${sec} s</b><span>Tempo esercizio</span></div><div class="choice"><button class="if978-start" onclick="if978Start('${ex.id}',${sec},this)">▶ Avvia esercizio</button><button onclick="if50Status('${ex.id}','Saltato','Opzionale',this)">Salta</button></div></div>`}return card0.apply(this,arguments)};
 let if978Timer=null;
 window.if978Start=function(id,sec,btn){
  if(if978Timer){clearInterval(if978Timer);if978Timer=null}
  let left=Math.max(1,Number(sec)||90),box=document.getElementById('if978timer_'+id);btn.disabled=true;btn.textContent='In corso…';
  const draw=()=>{if(box)box.innerHTML='<b>'+left+' s</b><span>Tempo rimanente</span>'};draw();
  if978Timer=setInterval(async()=>{left--;draw();if(left<=0){clearInterval(if978Timer);if978Timer=null;if(box)box.innerHTML='<b>✓</b><span>Esercizio completato</span>';btn.textContent='✓ Completato';try{await if50Status(id,'Completato','Opzionale',btn)}catch(e){}setTimeout(()=>{if(typeof window.if978Advance==='function')window.if978Advance(id);else document.querySelector('#if50ex_'+id+' + .if50-ex')?.scrollIntoView({behavior:'smooth',block:'center'})},250)}},1000)
 };
 window.if978Advance=function(id){const cards=[...document.querySelectorAll('.if50-ex')],i=cards.findIndex(x=>x.id==='if50ex_'+id),next=cards.slice(i+1).find(x=>x.offsetParent!==null);if(next)next.scrollIntoView({behavior:'smooth',block:'center'})};
 const css=document.createElement('style');css.textContent='.if978-timer{margin-top:14px;padding:14px;border:1px solid var(--ln);border-radius:16px;text-align:center}.if978-timer b{display:block;font-size:28px}.if978-timer span{font-size:12px;color:var(--m)}';document.head.appendChild(css);
 console.log('[INFORMHA_AUTO_STRETCH] version=0.9.78 automatic=1 treadmill_replaces_mobility=1 final_stretch=1 total_time_budget=1');
})();
