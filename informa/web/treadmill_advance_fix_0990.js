// InFormha 0.9.90 - completamento tapis roulant: avanzamento persistente al prossimo esercizio
(function(){
 const FLOW_KEY='informha_workout_flow_0949';
 const saveTreadmill=window.if970SaveTreadmill;
 function state(id){try{return (JSON.parse(localStorage.getItem(FLOW_KEY)||'{}')||{})[id]||null}catch(e){return null}}
 function cards(){return [...document.querySelectorAll('[data-page="workout"] .if50-ex,[data-page="workout"] #if50ex_cardio')]}
 function idOf(c){return c.id==='if50ex_cardio'?'cardio':String(c.id||'').replace('if50ex_','')}
 function advance(){
  const all=cards();
  const treadmill=document.getElementById('if50ex_treadmill');
  if(treadmill){treadmill.classList.add('if949-archived','if950-hidden');treadmill.classList.remove('if950-current')}
  const next=all.find(c=>idOf(c)!=='treadmill'&&state(idOf(c))?.stage!=='archived'&&!c.classList.contains('if949-archived'));
  if(!next)return;
  all.forEach(c=>{const on=c===next;c.classList.toggle('if950-hidden',!on);c.classList.toggle('if950-current',on)});
  if(typeof window.go==='function')window.go('workout');
  setTimeout(()=>{all.forEach(c=>{const on=c===next;c.classList.toggle('if950-hidden',!on);c.classList.toggle('if950-current',on)});next.scrollIntoView({behavior:'smooth',block:'start'})},100);
 }
 window.if984CompleteTreadmill=async function(btn){
  if(btn){btn.disabled=true;btn.textContent='Salvataggio…'}
  try{
   if(typeof saveTreadmill==='function')await saveTreadmill();
   if(state('treadmill')?.stage!=='archived'&&typeof window.if50Status==='function')await window.if50Status('treadmill','Completato','Cardio',btn);
   advance();
  }catch(e){toast(e.message||'Errore completamento tapis roulant');if(btn){btn.disabled=false;btn.textContent='Completa tapis roulant'}}
 };
 function patch(){const c=document.getElementById('if50ex_treadmill');if(!c)return;const b=[...c.querySelectorAll('button')].find(x=>(x.textContent||'').trim()==='Completa tapis roulant');if(b){b.removeAttribute('onclick');b.onclick=function(){window.if984CompleteTreadmill(this)}}}
 const render=window.if50RenderWorkout;if(typeof render==='function')window.if50RenderWorkout=function(){const r=render.apply(this,arguments);setTimeout(patch,180);return r};
 setTimeout(patch,500);
 console.log('[INFORMHA_TREADMILL_ADVANCE_FIX] version=0.9.90 persistent_advance=1 next_strength_focus=1');
})();
