// InFormha 0.10.9 - controller finale: focus esercizio bloccato durante serie/render
(function(){
  const FLOW_KEY='informha_workout_flow_0949';
  const ACTIVE_KEY='informha_workout_active_0109';
  function states(){try{return JSON.parse(localStorage.getItem(FLOW_KEY)||'{}')||{}}catch(e){return {}}}
  function saveStates(x){try{localStorage.setItem(FLOW_KEY,JSON.stringify(x))}catch(e){}}
  function getActive(){try{return localStorage.getItem(ACTIVE_KEY)||null}catch(e){return null}}
  function setActive(id){try{id?localStorage.setItem(ACTIVE_KEY,id):localStorage.removeItem(ACTIVE_KEY)}catch(e){}}
  function cards(){return [...document.querySelectorAll('[data-page="workout"] .if50-ex,[data-page="workout"] #if50ex_cardio')]}
  function idOf(c){return c?.id==='if50ex_cardio'?'cardio':String(c?.id||'').replace('if50ex_','')}
  function card(id){return cards().find(c=>idOf(c)===id)||null}
  function isArchived(id,c){const s=states()[id];return s?.stage==='archived'||!!c?.classList.contains('if949-archived')}
  function showOnly(id){const target=card(id);if(!target||isArchived(id,target))return false;cards().forEach(c=>{const on=c===target;c.classList.toggle('if950-current',on);c.classList.toggle('if950-hidden',!on)});setActive(id);return true}
  function firstPending(){const all=cards().filter(x=>!isArchived(idOf(x),x));const strength=all.find(x=>{const id=idOf(x);const ex=(typeof IF50!=='undefined'&&Array.isArray(IF50.plan))?IF50.plan.find(y=>y.id===id):null;return id!=='cardio'&&id!=='treadmill'&&!ex?.cardio});const c=strength||all[0];return c?idOf(c):null}
  function restoreActive(){const id=getActive();if(id&&showOnly(id))return id;const next=firstPending();if(next)showOnly(next);else setActive(null);return next}
  function ensureStarted(id){const all=states(),s=all[id]||(all[id]={stage:'planned',sets:{},fatigue:'Giusta',status:null});if(s.stage==='archived')return false;saveStates(all);setActive(id);try{if(s.stage==='planned'&&typeof window.if949Start==='function')window.if949Start(id)}catch(e){}setTimeout(()=>showOnly(id),40);return true}

  window.openGuide=function(id){if(!id)return;if(typeof window.openGuideZoom040==='function'){window.openGuideZoom040(id);return}if(typeof window.if74OpenImage==='function'){window.if74OpenImage(id);return}window.open(`guide-local/${encodeURIComponent(id)}?t=${Date.now()}`,'_blank')};
  document.addEventListener('click',function(e){const b=e.target.closest('[data-page="workout"] button');if(!b||(b.textContent||'').trim().toLowerCase()!=='guida')return;const c=b.closest('.if50-ex,#if50ex_cardio');if(!c)return;e.preventDefault();e.stopImmediatePropagation();window.openGuide(idOf(c))},true);

  // Qualunque interazione con una card la rende autoritativa fino a Completa/Salta/Sostituisci.
  document.addEventListener('pointerdown',function(e){const c=e.target.closest('[data-page="workout"] .if50-ex,[data-page="workout"] #if50ex_cardio');if(c&&!isArchived(idOf(c),c))setActive(idOf(c))},true);

  // Salvataggio serie: blocca l'esercizio corrente PRIMA del salvataggio e lo ripristina dopo ogni render.
  const savingSets=new Set(),finishing=new Set();
  window.if108RecoveryFinished=async function(id){
    const c=card(id),rows=[...(c?.querySelectorAll('.setrow')||[])];
    if(!c||isArchived(id,c)||finishing.has(id)||!rows.length||!rows.every(r=>r.querySelector('.check')?.classList.contains('done')))return;
    finishing.add(id);
    try{const ex=(typeof IF50!=='undefined'&&Array.isArray(IF50.plan))?IF50.plan.find(x=>x.id===id):null;if(ex&&!ex.mobility&&!ex.stretching&&!ex.cardio){const effort=await window.if108AskEffort?.(id);if(effort==null)return;try{localStorage.setItem('informha_effort_'+id,JSON.stringify({value:Number(effort),at:new Date().toISOString()}))}catch(e){}}await window.if949CompleteExercise?.(id,null);window.if978PruneStretching?.()}finally{finishing.delete(id)}
  };
  const completeSet=window.if50CompleteSet;
  if(typeof completeSet==='function')window.if50CompleteSet=async function(id,n){
    if(savingSets.has(id)||isArchived(id,card(id)))return;
    savingSets.add(id);setActive(id);window.if950SetContext?.(id,n);
    try{return await completeSet.apply(this,arguments)}finally{savingSets.delete(id)}
  };
  // Anche il pulsante storico usa lo stesso completamento e avanzamento.
  window.if994CompleteExercise=function(id,btn){return window.if949CompleteExercise(id,btn)};
  // Gestore finale del pulsante: alcuni moduli legacy riassegnano l'onclick
  // dopo il caricamento e impediscono l'archiviazione/avanzamento.
  const completeExercise=window.if949CompleteExercise;
  window.if108Complete=async function(id,btn){
    if(!id||isArchived(id,card(id)))return;
    if(typeof completeExercise==='function'){
      try{await completeExercise.call(this,id,btn)}catch(e){toast(e.message||'Errore completamento esercizio');return}
    }
    if(isArchived(id,card(id)))advanceFrom(id);
  };

  const render=window.if50RenderWorkout;
  if(typeof render==='function')window.if50RenderWorkout=function(){const locked=getActive();const out=render.apply(this,arguments);setTimeout(()=>{if(locked&&showOnly(locked))return;restoreActive()},0);setTimeout(()=>{if(locked&&showOnly(locked))return;restoreActive()},80);return out};

  const swap=window.if60Swap;
  if(typeof swap==='function')window.if60Swap=async function(oldId,newId){setActive(newId);const out=await swap.apply(this,arguments);if(!(typeof IF50!=='undefined'&&IF50.plan?.some(x=>x.id===newId)&&!IF50.plan?.some(x=>x.id===oldId))){setActive(oldId);restoreActive();return out}window.if950CancelRecovery?.(oldId);const all=states();if(all[oldId]?.stage!=='archived'){all[oldId]=all[oldId]||{};all[oldId].stage='archived';all[oldId].status=all[oldId].status||'Sostituito'}all[newId]={stage:'planned',sets:{},fatigue:'Giusta',status:null};saveStates(all);setTimeout(()=>ensureStarted(newId),180);return out};

  // Solo il completamento dell'esercizio può liberare il focus e passare al successivo.
  const legacyStatus=window.if50Status;
  const status=window.if949ArchiveStatus||legacyStatus;
  if(typeof status==='function')window.if50Status=async function(id){setActive(id);const handler=(id==='treadmill'||id==='cardio')?legacyStatus:status;const out=await handler.apply(this,arguments);if(isArchived(id,card(id)))advanceFrom(id);else setTimeout(()=>showOnly(id),180);return out};
  const remove=window.if60RemoveExercise;
  if(typeof remove==='function')window.if60RemoveExercise=async function(id){const current=getActive();const out=await remove.apply(this,arguments);setTimeout(()=>{if(!current||current===id||isArchived(current,card(current)))setActive(null);restoreActive()},180);return out};

  function archiveLocal(id,status){const all=states(),s=all[id]||(all[id]={stage:'planned',sets:{},fatigue:'Giusta',status:null});s.stage='archived';s.status=status;s.archivedAt=new Date().toISOString();saveStates(all)}
  function advanceFrom(id){setActive(null);const all=cards(),i=all.findIndex(c=>idOf(c)===id),next=all.slice(i+1).find(c=>!isArchived(idOf(c),c))||all.find(c=>!isArchived(idOf(c),c));if(next)ensureStarted(idOf(next));else restoreActive();setTimeout(()=>{try{window.if67Refresh?.()}catch(e){}},60)}

  window.if108AskEffort=function(id){return new Promise(resolve=>{const old=document.getElementById('if108EffortModal');if(old)old.remove();const m=document.createElement('div');m.id='if108EffortModal';m.innerHTML='<div class="if108-effort-backdrop"><div class="if108-effort-card"><div class="if1041-kicker">ESERCIZIO COMPLETATO</div><h2>Quanto è stato impegnativo?</h2><div class="if108-effort-scale">'+[1,2,3,4,5].map(n=>'<button data-v="'+n+'">'+n+'<small>'+['Molto facile','Facile','Moderato','Difficile','Massimo sforzo'][n-1]+'</small></button>').join('')+'</div></div></div>';document.body.appendChild(m);m.querySelectorAll('button').forEach(b=>b.onclick=()=>{const v=b.dataset.v;m.remove();resolve(v)});});};
  const effortCss=document.createElement('style');effortCss.textContent='.if108-effort-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;background:rgba(0,0,0,.72);padding:18px}.if108-effort-card{width:min(520px,100%);padding:24px;border-radius:28px;background:linear-gradient(145deg,#1b1209,#0b0d10);border:1px solid rgba(255,126,0,.62);box-shadow:0 0 40px rgba(255,111,0,.22);text-align:center}.if108-effort-card h2{margin:10px 0 18px}.if108-effort-scale{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.if108-effort-scale button{min-height:82px;border-radius:16px;border:1px solid rgba(255,126,0,.45);background:#0d0f12;color:#fff;font-size:26px;font-weight:900}.if108-effort-scale button small{display:block;font-size:9px;line-height:1.1;color:#ffcf8a;margin-top:6px}';document.head.appendChild(effortCss);
  window.if108Skip=async function(id){const c=card(id);if(!c||isArchived(id,c))return;try{const out=await api('api/workout-flow-0949/archive',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workout_id:currentWorkoutId||null,workout_title:IF50.planTitle||'Seduta adattata',exercise:(IF50.plan||[]).find(x=>x.id===id)?.name||id,priority:(IF50.plan||[]).find(x=>x.id===id)?.priority||'Utile',status:'Saltato',notes:'Saltato durante allenamento'})});if(out?.workout_id)currentWorkoutId=out.workout_id}catch(e){toast(e.message||'Errore archiviazione');return}window.if950CancelRecovery?.(id);archiveLocal(id,'Saltato');c.classList.add('if949-archived','if950-hidden');c.classList.remove('if950-current');advanceFrom(id);setTimeout(()=>{const pending=(IF50.plan||[]).find(x=>x.id!==id&&states()[x.id]?.stage!=='archived');if(pending&&!getActive())ensureStarted(pending.id);window.if978PruneStretching?.();window.if1041Refresh?.()},120);toast('Esercizio saltato')};
  window.if108Remove=async function(id){const c=card(id);if(!c||isArchived(id,c))return;try{const out=await api('api/workout-flow-0949/archive',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workout_id:currentWorkoutId||null,workout_title:IF50.planTitle||'Seduta adattata',exercise:(IF50.plan||[]).find(x=>x.id===id)?.name||id,priority:(IF50.plan||[]).find(x=>x.id===id)?.priority||'Utile',status:'Saltato',notes:'Tolto dalla seduta'})});if(out?.workout_id)currentWorkoutId=out.workout_id}catch(e){toast(e.message||'Errore archiviazione');return}window.if950CancelRecovery?.(id);archiveLocal(id,'Saltato');IF50.plan=(IF50.plan||[]).filter(x=>x.id!==id);c.remove();advanceFrom(id);toast('Esercizio tolto dalla seduta')};
  document.addEventListener('click',function(e){const b=e.target.closest('[data-page="workout"] button');if(!b)return;const txt=(b.textContent||'').trim().toLowerCase(),c=b.closest('.if50-ex,#if50ex_cardio');if(!c)return;const id=idOf(c);if(txt==='completa esercizio'){e.preventDefault();e.stopImmediatePropagation();window.if108Complete(id,b)}else if(txt==='salta'){e.preventDefault();e.stopImmediatePropagation();window.if108Skip(id)}else if(txt==='togli'){e.preventDefault();e.stopImmediatePropagation();window.if108Remove(id)}},true);

  const go=window.go;
  if(typeof go==='function')window.go=function(page){const out=go.apply(this,arguments);if(page==='workout')setTimeout(restoreActive,120);return out};
  setTimeout(restoreActive,350);
  console.log('[INFORMHA_WORKOUT_CONTROLLER] version=0.10.17 active_lock=1 set_save_lock=1 render_preserve=1 atomic_swap=2 guide_all=1 skip_strength_first=1');
})();

