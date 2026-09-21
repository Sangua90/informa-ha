// InFormha 0.6.0 - continuità sedute, sostituzioni e cambio gruppo
const IF60_ALTERNATIVES={
 shoulder_press:['lateral_raise','calf_raise','plank'],
 chest:['pec_fly','calf_raise','plank'],
 lat:['seated_row','curl','calf_raise'],
 seated_row:['lat','curl','plank'],
 goblet_squat:['glute_bridge','calf_raise','plank'],
 romanian_deadlift:['glute_bridge','calf_raise','curl'],
 pushdown:['curl','lateral_raise','calf_raise'],
 curl:['pushdown','lateral_raise','calf_raise'],
 face_pull:['lateral_raise','curl','calf_raise']
};
const IF60_GROUPS={
 'Petto + Tricipiti':['chest','pec_fly','pushdown'],
 'Schiena + Bicipiti':['lat','seated_row','curl'],
 'Spalle + Core':['shoulder_press','lateral_raise','face_pull','plank'],
 'Gambe + Glutei':['goblet_squat','romanian_deadlift','glute_bridge','calf_raise'],
 'Cardio':['treadmill','stepper']
};
let IF60_PENDING=[];
function if60Library(id){return window.IF72_LIBRARY?.[id]||IF51_LIBRARY[id]||IF50_EX[id]||null}
function if60PainBlocks(id){const ex=if60Library(id);return !!(ex?.painAvoid||[]).includes(IF50.pain)}
const IF60_FAMILIES=[
 ['chest','pec_fly','push_up'],
 ['lat','lat_close_grip','lat_reverse_grip','straight_arm_pulldown','one_arm_dumbbell_row'],
 ['dumbbell_shoulder_press','dumbbell_lateral_raise','face_pull','dumbbell_reverse_fly'],
 ['pushdown','triceps_short_bar_pushdown','overhead_triceps_extension','single_arm_triceps_pushdown'],
 ['dumbbell_curl','dumbbell_hammer_curl','reverse_curl','curl'],
 ['goblet_squat','leg_extension','dumbbell_split_squat','step_up'],
 ['romanian_deadlift','single_leg_romanian_deadlift','hamstring_walkout'],
 ['glute_bridge','bodyweight_glute_kickback'],
 ['calf_raise','single_leg_step_calf_raise','seated_dumbbell_calf_raise'],
 ['plank','incline_bench_crunch','heel_taps','reverse_crunch'],
 ['treadmill','stepper']
];
function if60NormGroup(g){g=String(g||'').toLowerCase();if(g.includes('bicip'))return'Bicipiti';if(g.includes('tricip'))return'Tricipiti';if(g.includes('petto'))return'Petto';if(g.includes('schiena'))return'Schiena';if(g.includes('spall'))return'Spalle';if(g.includes('femoral')||g.includes('catena'))return'Femorali';if(g.includes('gamb')||g.includes('quadric'))return'Gambe';if(g.includes('glute'))return'Glutei';if(g.includes('polp'))return'Polpacci';if(g.includes('core'))return'Core';if(g.includes('cardio'))return'Cardio';return g}
function if60Family(id){return IF60_FAMILIES.find(a=>a.includes(id))||[]}
function if60AllIds(){const supported=Object.keys(window.IF72_LIBRARY||{});return supported.length?supported:[...new Set([...Object.keys(IF51_LIBRARY||{}),...Object.keys(IF50_EX||{})])]}
function if60AlternativeList(id){
 const src=if60Library(id);if(!src)return[];
 const group=if60NormGroup(src.group),family=if60Family(id),used=new Set((IF50.plan||[]).map(x=>x.id));
 return if60AllIds().filter(x=>x!==id&&!used.has(x)&&if60Library(x)&&!if60PainBlocks(x)).map(x=>{
   const e=if60Library(x);let score=0;
   if(if60NormGroup(e.group)===group)score+=100;
   if(family.includes(x))score+=40;
   if(src.loadType&&e.loadType===src.loadType)score+=8;
   if(src.equipment&&e.equipment&&src.equipment===e.equipment)score+=5;
   return {id:x,score,name:e.name||x};
 }).filter(x=>x.score>=100).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)).slice(0,6).map(x=>x.id)
}
function if60ToPlan(id){const x=if60Library(id);if(!x)return null;const reps=x.reps??(x.repType==='seconds'?30:10);return {id,name:x.name,priority:x.priority||'Utile',sets:x.sets||3,reps,rest:x.rest||90,repType:x.repType||'reps',perSide:!!x.perSide,loadType:x.loadType||'bodyweight',guide:x.guide||null,cardio:!!x.cardio,mobility:!!x.mobility,stretching:!!x.stretching,seconds:x.seconds||((x.mobility||x.stretching)&&x.repType==='seconds'?reps:null),duration:x.duration||null,equipment:x.equipment||'',group:x.group||''}}
function if60AddExerciseControls(){
 document.querySelectorAll('[data-page="workout"] .if50-ex').forEach(card=>{
   if(card.querySelector('.if60-actions'))return;
   const id=(card.id||'').replace('if50ex_',''); if(!id)return;
   const box=document.createElement('div');box.className='if60-actions row';box.innerHTML=`<button class="btn secondary" onclick="if60ShowSwap('${id}')">Sostituisci</button>`;card.appendChild(box)
 });
 const work=document.querySelector('[data-page="workout"]');if(work&&!document.getElementById('if60SessionControls')){
   const box=document.createElement('div');box.id='if60SessionControls';box.className='card';box.innerHTML=`<div class="ey">Gestisci allenamento</div><button class="btn secondary" onclick="if60AddExercise()">＋ Aggiungi esercizio</button>`;
   const end=[...work.querySelectorAll('button')].find(b=>b.textContent.includes('Fine allenamento'));work.insertBefore(box,end||null)
 }
}
function if60Modal(title,html){let m=document.getElementById('if60Modal');if(!m){m=document.createElement('div');m.id='if60Modal';m.className='if60-modal';m.innerHTML='<div class="if60-sheet"><div class="row"><h2 id="if60Title" style="flex:1"></h2><button class="btn secondary" style="width:auto" onclick="if60Close()">✕</button></div><div id="if60Body"></div></div>';document.body.appendChild(m)}document.getElementById('if60Title').textContent=title;document.getElementById('if60Body').innerHTML=html;m.classList.add('open')}
function if60Close(){document.getElementById('if60Modal')?.classList.remove('open')}
function if60ShowSwap(id){const opts=if60AlternativeList(id),src=if60Library(id);if60Modal('Sostituisci esercizio',`<div class="sub" style="margin-bottom:10px">Alternative per <b>${src?.name||'esercizio'}</b>: stesso gruppo muscolare, senza duplicati e compatibili con eventuali fastidi.</div>`+opts.map(x=>{const e=if60Library(x);return `<button class="btn secondary" onclick="if60Swap('${id}','${x}')"><b>${e.name}</b><br><span class="sub">${e.group||''} · ${e.equipment||''}</span></button>`}).join('')||'<div class="sub">Nessuna alternativa equivalente disponibile con il fastidio segnalato.</div>')}
function if60Swap(oldId,newId){const idx=IF50.plan.findIndex(x=>x.id===oldId);if(idx<0)return;const p=if60ToPlan(newId);if(!p)return;IF50.plan[idx]=p;if60Close();if50RenderWorkout();if60AddExerciseControls();toast('Esercizio sostituito')}
function if60RemoveExercise(id){IF50.plan=IF50.plan.filter(x=>x.id!==id);if50RenderWorkout();if60AddExerciseControls();toast('Esercizio tolto dalla seduta')}
function if60ChangeGroup(){if60Modal('Cambia gruppo muscolare',Object.keys(IF60_GROUPS).map(g=>`<button class="btn secondary" onclick="if60UseGroup('${g.replace(/'/g,"\\'")}')">${g}</button>`).join(''))}
function if60UseGroup(group){let ids=IF60_GROUPS[group]||[];ids=ids.filter(id=>!if60PainBlocks(id));IF50.plan=ids.map(if60ToPlan).filter(Boolean);IF50.planTitle=group;if60Close();if50RenderWorkout();if60AddExerciseControls();toast('Gruppo cambiato')}
function if60AddExercise(){const ids=if60AllIds().filter(id=>!IF50.plan.some(x=>x.id===id)&&!if60PainBlocks(id));if60Modal('Aggiungi esercizio',ids.map(id=>{const e=if60Library(id);return `<button class="btn secondary" onclick="if60Append('${id}')">${e.name}<br><span class="sub">${e.group||''}</span></button>`}).join(''))}
function if60Append(id){const p=if60ToPlan(id);if(!p)return;IF50.plan.push(p);if60Close();if50RenderWorkout();if60AddExerciseControls();toast('Esercizio aggiunto')}
function if60ExerciseDone(id){const card=document.getElementById(`if50ex_${id}`);if(!card)return false;const checks=[...card.querySelectorAll('.check')];return checks.length>0&&checks.every(x=>x.classList.contains('done'))}
async function if60Suspend(){
 const pending=IF50.plan.filter(x=>x.priority==='Essenziale'&&!x.cardio&&!if60ExerciseDone(x.id)).map(x=>({id:x.id,name:x.name,priority:x.priority}));
 try{await api('api/coach/pending',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source_plan:IF50.planTitle||'Seduta',items:pending})});await api('api/coach/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({last_action:'suspended',last_plan:IF50.planTitle||'',last_suspend_at:new Date().toISOString()})})}catch(e){}
 toast(pending.length?`Salvati ${pending.length} esercizi essenziali da riprendere`:'Nessun essenziale da recuperare');currentWorkoutId=null;go('home');if60LoadPending()
}
async function if60LoadPending(){try{const d=await api('api/coach/pending');IF60_PENDING=d.items||[]}catch(e){IF60_PENDING=[]}if60HomePending()}
function if60HomePending(){const home=document.querySelector('[data-page="home"]');if(!home)return;document.getElementById('if60PendingCard')?.remove();if(!IF60_PENDING.length)return;const c=document.createElement('div');c.id='if60PendingCard';c.className='card coach';c.innerHTML=`<div class="ey">Da riprendere</div><h2>${IF60_PENDING.length} essenzial${IF60_PENDING.length===1?'e':'i'}</h2><div class="sub">${IF60_PENDING.map(x=>x.exercise_name).join(' · ')}</div><button class="btn" onclick="if60ResumePending()">Continua la seduta</button><button class="btn secondary" onclick="if60IgnorePending()">Non recuperare</button>`;home.insertBefore(c,home.firstChild.nextSibling)}
function if60ResumePending(){IF50.plan=IF60_PENDING.map(x=>if60ToPlan(x.exercise_id)).filter(Boolean);IF50.planTitle='Ripresa essenziali';IF50.started=Date.now();if50RenderWorkout();if60AddExerciseControls();go('workout')}
async function if60IgnorePending(){try{await api('api/coach/pending/resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({exercise_ids:IF60_PENDING.map(x=>x.exercise_id)})})}catch(e){}IF60_PENDING=[];if60HomePending();toast('Recupero annullato')}
async function if60ResolveCompletedPending(){if(!IF60_PENDING.length)return;const done=IF60_PENDING.filter(x=>if60ExerciseDone(x.exercise_id)).map(x=>x.exercise_id);if(!done.length)return;try{await api('api/coach/pending/resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({exercise_ids:done})})}catch(e){}}
function if60PainSuggestions(){if(IF50.pain==='Nessuno')return;const blocked=IF50.plan.filter(x=>if60PainBlocks(x.id));if(!blocked.length)return;blocked.forEach(x=>{const alt=if60AlternativeList(x.id)[0];if(alt){const i=IF50.plan.findIndex(y=>y.id===x.id);IF50.plan[i]=if60ToPlan(alt)}});toast('Seduta adattata in modo prudente al fastidio segnalato')}
(function(){const st=document.createElement('style');st.textContent='.if60-actions{gap:8px;margin-top:10px}.if60-actions .btn{margin:0}.if60-modal{display:none;position:fixed;inset:0;z-index:12000;background:rgba(0,0,0,.72);padding:18px;align-items:flex-end}.if60-modal.open{display:flex}.if60-sheet{width:100%;max-height:82vh;overflow:auto;background:#0e1115;border:1px solid #303640;border-radius:24px;padding:18px}.if60-sheet .btn{margin-top:8px}';document.head.appendChild(st);const oldGen=window.if50Generate;window.if50Generate=async function(){if50BuildPlan();if60PainSuggestions();IF50.started=Date.now();try{await api('api/coach/checkin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({time_min:IF50.time,energy:IF50.energy,pain:IF50.pain,intent:IF50.intent,plan:IF50.plan})})}catch(e){}if50RenderWorkout();if60AddExerciseControls();go('workout')};const oldRender=window.if50RenderWorkout;window.if50RenderWorkout=function(){oldRender();setTimeout(if60AddExerciseControls,0)};const oldFinish=window.if50Finish;window.if50Finish=async function(){await if60ResolveCompletedPending();return oldFinish()};if60LoadPending()})();
