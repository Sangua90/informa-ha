// InFormha 0.9.86 - flusso esercizio: niente timer prima serie + tapis completato persistente
(function(){
 const FLOW_KEY='informha_workout_flow_0949';
 function flowState(id){
  try{return (JSON.parse(localStorage.getItem(FLOW_KEY)||'{}')||{})[id]||null}catch(e){return null}
 }
 function treadmillArchived(){return flowState('treadmill')?.stage==='archived'}
 function cards(){return [...document.querySelectorAll('[data-page="workout"] .if50-ex,[data-page="workout"] #if50ex_cardio')]}
 function cardId(c){return c.id==='if50ex_cardio'?'cardio':String(c.id||'').replace('if50ex_','')}
 function focusFirstPending(){
  const all=cards();
  if(treadmillArchived()){
   const t=document.getElementById('if50ex_treadmill');
   if(t){t.classList.add('if949-archived','if950-hidden');t.classList.remove('if950-current')}
  }
  const next=all.find(c=>cardId(c)!=='treadmill'&&!c.classList.contains('if949-archived'));
  if(next){
   all.forEach(c=>{const on=c===next;c.classList.toggle('if950-hidden',!on);c.classList.toggle('if950-current',on)});
   next.scrollIntoView({behavior:'smooth',block:'start'});
  }
 }

 // 1) Inizia esercizio deve solo aprire/abilitare la prima serie: nessun recupero iniziale.
 const startBefore=window.if949Start;
 if(typeof startBefore==='function'){
  window.if949Start=function(id){
   if(id==='treadmill'&&treadmillArchived()){setTimeout(focusFirstPending,0);return}
   const result=startBefore.apply(this,arguments);
   // workout_focus_0950 puo aver aperto il recupero come preparazione: torna subito all'esercizio.
   if(id!=='treadmill'){
    try{clearInterval(timerInt)}catch(e){}
    if(typeof go==='function')go('workout');
    setTimeout(()=>{
     const c=document.getElementById('if50ex_'+id);
     if(c){cards().forEach(x=>x.classList.toggle('if950-hidden',x!==c));c.classList.add('if950-current');c.querySelector('.setrow input')?.focus()}
    },30);
   }
   return result;
  };
 }

 // 2) Ogni rerender/sostituzione rispetta lo stato persistente del tapis roulant.
 const render=window.if50RenderWorkout;
 if(typeof render==='function')window.if50RenderWorkout=function(){
  const result=render.apply(this,arguments);
  if(treadmillArchived())setTimeout(focusFirstPending,120);
  return result;
 };
 const swap=window.if60Swap;
 if(typeof swap==='function')window.if60Swap=async function(){
  const result=await swap.apply(this,arguments);
  if(treadmillArchived())setTimeout(focusFirstPending,180);
  return result;
 };

 console.log('[INFORMHA_WORKOUT_FLOW_FIX] version=0.9.86 no_pre_series_timer=1 timer_after_completed_set=1 treadmill_persistent_archive=1 swap_no_treadmill_return=1');
})();
