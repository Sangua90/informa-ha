// InFormha 0.9.84 - un solo completamento tapis roulant: salva, archivia, avanza
(function(){
 const originalSave=window.if970SaveTreadmill;
 if(typeof originalSave!=='function')return;
 window.if984CompleteTreadmill=async function(btn){
  if(btn){btn.disabled=true;btn.textContent='Salvataggio…'}
  try{
   await originalSave();
   if(typeof window.if50Status==='function')await window.if50Status('treadmill','Completato','Cardio',btn);
   try{
    const key='informha_workout_flow_0949',activeKey='informha_workout_active_0109';
    const flow=JSON.parse(localStorage.getItem(key)||'{}')||{};
    flow.treadmill={...(flow.treadmill||{}),stage:'archived',status:'Completato',archivedAt:new Date().toISOString()};
    localStorage.setItem(key,JSON.stringify(flow));
    if(localStorage.getItem(activeKey)==='treadmill')localStorage.removeItem(activeKey);
   }catch(e){}
   if(typeof window.go==='function')window.go('workout');
   if(typeof window.if50RenderWorkout==='function')window.if50RenderWorkout();
  }catch(e){toast(e.message||'Errore completamento tapis roulant');if(btn){btn.disabled=false;btn.textContent='Completa tapis roulant'}}
 };
 function patch(){
  const card=document.getElementById('if50ex_treadmill');if(!card)return;
  const save=[...card.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='Completa tapis roulant');
  if(save){save.removeAttribute('onclick');save.onclick=function(){if984CompleteTreadmill(this)};}
  const status=[...card.querySelectorAll('.choice')].find(x=>[...x.querySelectorAll('button')].some(b=>['Completato','Parziale','Saltato'].includes((b.textContent||'').trim())));
  if(status)status.style.display='none';
 }
 const render=window.if50RenderWorkout;if(typeof render==='function')window.if50RenderWorkout=function(){const r=render.apply(this,arguments);setTimeout(patch,180);return r};
 setTimeout(patch,650);
 console.log('[INFORMHA_TREADMILL_COMPLETE_FIX] version=0.9.84 single_complete=1 save_archive_advance=2 canonical_state=1 no_manual_card_selection=1');
})();
