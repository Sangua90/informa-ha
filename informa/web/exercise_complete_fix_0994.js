// InFormha 0.9.94 - fix finale tracking serie adattive + completa esercizio
(function(){
 const KEY='informha_workout_flow_0949';
 function allStates(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){return {}}}
 function put(id,fn){const a=allStates(),s=a[id]||(a[id]={stage:'started',sets:{},fatigue:'Giusta',status:null});fn(s);localStorage.setItem(KEY,JSON.stringify(a));return s}
 function ex(id){return (window.IF50?.plan||[]).find(x=>x.id===id)||null}
 function card(id){return document.getElementById('if50ex_'+id)}
 function countDone(id){return [...(card(id)?.querySelectorAll('.setrow .check')||[])].filter(b=>b.classList.contains('done')).length}
 function total(id){return card(id)?.querySelectorAll('.setrow').length||0}
 function showComplete(id){
  const c=card(id);if(!c)return;
  const n=countDone(id),t=total(id),bar=c.querySelector('.if949-flow');
  if(!bar)return;
  if(t&&n>=t){bar.innerHTML=`<div><b class="green">Tutte le serie completate</b><span>${n}/${t} serie registrate. Conferma per passare al prossimo esercizio.</span></div><button class="btn" onclick="if994CompleteExercise('${id}',this)">Completa esercizio</button>`}
  else if((allStates()[id]?.stage||'')==='started')bar.querySelector('span')&&(bar.querySelector('span').textContent=`${n} / ${t} serie registrate.`)
 }
 function nextCard(id){const cs=[...document.querySelectorAll('[data-page="workout"] .if50-ex')],i=cs.findIndex(c=>c.id==='if50ex_'+id);return cs.slice(i+1).find(c=>allStates()[c.id.replace('if50ex_','')]?.stage!=='archived')||null}
 const baseComplete=window.if50CompleteSet;
 if(typeof baseComplete==='function')window.if50CompleteSet=async function(id,n){
  const r=await baseComplete.apply(this,arguments);
  const b=document.getElementById(`if50c_${id}_${n}`);
  if(b?.classList.contains('done')){
   put(id,s=>{s.stage='started';s.sets=s.sets||{};s.sets[String(n)]={...(s.sets[String(n)]||{}),done:true};s.fatigue=document.getElementById(`if50f_${id}`)?.value||s.fatigue||'Giusta'});
   setTimeout(()=>showComplete(id),50);
  }
  return r
 };
 window.if994CompleteExercise=async function(id,btn){
  const c=card(id),n=countDone(id),t=total(id),e=ex(id);if(!c||!t||n<t){toast('Completa prima tutte le serie');return}
  if(btn){btn.disabled=true;btn.textContent='Salvataggio…'}
  try{
   const s=allStates()[id]||{};
   const out=await api('api/workout-flow-0949/archive',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workout_id:currentWorkoutId||null,workout_title:window.IF50?.planTitle||'Seduta adattata',exercise:e?.name||id,priority:e?.priority||'Utile',status:'Completato',notes:'Fatica: '+(s.fatigue||'Giusta')})});
   if(out?.workout_id)currentWorkoutId=out.workout_id;
   put(id,x=>{x.stage='archived';x.status='Completato';x.archivedAt=new Date().toISOString()});
   c.classList.add('if949-archived','if950-hidden');c.classList.remove('if950-current');
   const next=nextCard(id);
   if(next){const nid=next.id.replace('if50ex_','');put(nid,x=>{if(!x.stage||x.stage==='planned'){x.stage='started';x.startedAt=new Date().toISOString()}});if(typeof window.go==='function')window.go('workout');setTimeout(()=>{document.querySelectorAll('[data-page="workout"] .if50-ex').forEach(x=>{const on=x===next;x.classList.toggle('if950-hidden',!on);x.classList.toggle('if950-current',on)});next.querySelectorAll('.setrow input,.setrow .check').forEach(x=>x.disabled=false);next.scrollIntoView({behavior:'smooth',block:'start'});next.querySelector('.setrow input')?.focus()},120)}
   else{toast('Esercizi completati')}
  }catch(err){toast(err.message||'Errore completamento esercizio');if(btn){btn.disabled=false;btn.textContent='Completa esercizio'}}
 };
 const render=window.if50RenderWorkout;if(typeof render==='function')window.if50RenderWorkout=function(){const r=render.apply(this,arguments);setTimeout(()=>{(window.IF50?.plan||[]).filter(x=>!x.cardio).forEach(x=>showComplete(x.id))},180);return r};
 setTimeout(()=>{(window.IF50?.plan||[]).filter(x=>!x.cardio).forEach(x=>showComplete(x.id))},500);
 console.log('[INFORMHA_EXERCISE_COMPLETE_FIX] version=0.9.94 adaptive_set_tracking=1 explicit_complete=1 next_exercise=1 loaded_last=1');
})();