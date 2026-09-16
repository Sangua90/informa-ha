// InFormha 0.9.84 - un solo completamento tapis roulant: salva, archivia, avanza
(function(){
 const originalSave=window.if970SaveTreadmill;
 if(typeof originalSave!=='function')return;
 window.if984CompleteTreadmill=async function(btn){
  if(btn){btn.disabled=true;btn.textContent='Salvataggio…'}
  try{
   await originalSave();
   if(typeof window.if50Status==='function')await window.if50Status('treadmill','Completato','Cardio',btn);
   if(typeof window.go==='function')window.go('workout');
   setTimeout(()=>{
    const cards=[...document.querySelectorAll('[data-page="workout"] .if50-ex,[data-page="workout"] #if50ex_cardio')];
    const next=cards.find(c=>!c.classList.contains('if949-archived')&&c.id!=='if50ex_treadmill');
    if(next){cards.forEach(c=>c.classList.toggle('if950-hidden',c!==next));next.classList.add('if950-current');next.scrollIntoView({behavior:'smooth',block:'start'});}
   },180);
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
 console.log('[INFORMHA_TREADMILL_COMPLETE_FIX] version=0.9.84 single_complete=1 save_archive_advance=1');
})();
