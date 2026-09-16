// InFormha 0.9.87 - tapis roulant: avvio una sola volta, stato persistente rispettato
(function(){
 if(typeof IF50==='undefined')return;
 const KEY='informha_workout_flow_0949';
 function state(){try{return (JSON.parse(localStorage.getItem(KEY)||'{}')||{}).treadmill||null}catch(e){return null}}
 const render=window.if50RenderWorkout;
 function prepareTreadmill(){
  const c=document.getElementById('if50ex_treadmill');if(!c)return;
  const s=state();
  // Se completato/archiviato, un rerender o una sostituzione NON deve riavviarlo.
  if(s?.stage==='archived'){
   c.classList.add('if949-archived','if950-hidden');c.classList.remove('if950-current');
   return;
  }
  // Avvia automaticamente solo quando lo stato persistente e ancora planned/assente.
  if(!s||s.stage==='planned'){
   try{if(typeof window.if949Start==='function')window.if949Start('treadmill')}catch(e){}
  }
  const now=state();
  if(now?.stage==='started'){
   const bar=c.querySelector('.if949-flow');
   if(bar)bar.innerHTML='<div><b class="green">Cardio in corso</b><span>Al termine scegli Completato o Parziale.</span></div>';
  }
 }
 if(typeof render==='function')window.if50RenderWorkout=function(){const r=render.apply(this,arguments);setTimeout(prepareTreadmill,120);return r};
 setTimeout(prepareTreadmill,350);
 console.log('[INFORMHA_TREADMILL_FLOW_FIX] version=0.9.87 persistent_state_guard=1 archived_never_restart=1');
})();