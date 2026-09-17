// InFormha 0.10.8 - controller finale navigazione workout, sostituzioni e guide
(function(){
  const FLOW_KEY='informha_workout_flow_0949';
  function states(){try{return JSON.parse(localStorage.getItem(FLOW_KEY)||'{}')||{}}catch(e){return {}}}
  function saveStates(x){try{localStorage.setItem(FLOW_KEY,JSON.stringify(x))}catch(e){}}
  function cards(){return [...document.querySelectorAll('[data-page="workout"] .if50-ex,[data-page="workout"] #if50ex_cardio')]}
  function idOf(c){return c?.id==='if50ex_cardio'?'cardio':String(c?.id||'').replace('if50ex_','')}
  function card(id){return cards().find(c=>idOf(c)===id)||null}
  function isArchived(id,c){const s=states()[id];return s?.stage==='archived'||!!c?.classList.contains('if949-archived')}
  function showOnly(id){
    const target=card(id);if(!target)return false;
    cards().forEach(c=>{const on=c===target;c.classList.toggle('if950-current',on);c.classList.toggle('if950-hidden',!on)});
    target.classList.remove('if949-archived');
    target.scrollIntoView({behavior:'smooth',block:'start'});
    return true;
  }
  function ensureStarted(id){
    const all=states(),s=all[id]||(all[id]={stage:'planned',sets:{},fatigue:'Giusta',status:null});
    if(s.stage==='archived'){s.stage='planned';s.status=null;delete s.archivedAt}
    saveStates(all);
    try{if(s.stage==='planned'&&typeof window.if949Start==='function')window.if949Start(id)}catch(e){}
    setTimeout(()=>showOnly(id),40);
  }
  // Una sola apertura per tutte le guide: usa sempre l'immagine locale associata all'ID esercizio.
  window.openGuide=function(id){
    if(!id)return;
    if(typeof window.openGuideZoom040==='function'){window.openGuideZoom040(id);return}
    if(typeof window.if74OpenImage==='function'){window.if74OpenImage(id);return}
    window.open(`guide-local/${encodeURIComponent(id)}?t=${Date.now()}`,'_blank');
  };
  // Rende affidabile anche il pulsante Guida già presente nelle card del workout.
  document.addEventListener('click',function(e){
    const b=e.target.closest('[data-page="workout"] button');if(!b)return;
    if((b.textContent||'').trim().toLowerCase()!=='guida')return;
    const c=b.closest('.if50-ex,#if50ex_cardio');if(!c)return;
    e.preventDefault();e.stopImmediatePropagation();window.openGuide(idOf(c));
  },true);
  // Il controller viene caricato per ultimo: dopo una sostituzione il nuovo esercizio diventa
  // l'unico esercizio corrente e non può essere rimpiazzato dal focus di una card precedente.
  const swap=window.if60Swap;
  if(typeof swap==='function')window.if60Swap=async function(oldId,newId){
    const out=await swap.apply(this,arguments);
    const all=states();
    if(all[oldId]?.stage!=='archived'){all[oldId]=all[oldId]||{};all[oldId].stage='archived';all[oldId].status=all[oldId].status||'Sostituito'}
    all[newId]={stage:'planned',sets:{},fatigue:'Giusta',status:null};saveStates(all);
    setTimeout(()=>ensureStarted(newId),180);
    return out;
  };
  // Dopo completamento/salto scegli sempre la prima card successiva realmente non archiviata.
  function focusFirstPending(){const c=cards().find(x=>!isArchived(idOf(x),x));if(c){const id=idOf(c);showOnly(id);return id}return null}
  const status=window.if50Status;
  if(typeof status==='function')window.if50Status=async function(id){const out=await status.apply(this,arguments);setTimeout(focusFirstPending,180);return out};
  const remove=window.if60RemoveExercise;
  if(typeof remove==='function')window.if60RemoveExercise=async function(){const out=await remove.apply(this,arguments);setTimeout(focusFirstPending,180);return out};
  const go=window.go;
  if(typeof go==='function')window.go=function(page){const out=go.apply(this,arguments);if(page==='workout')setTimeout(focusFirstPending,120);return out};
  console.log('[INFORMHA_WORKOUT_CONTROLLER] version=0.10.8 final_focus=1 atomic_swap=1 guide_all=1');
})();
