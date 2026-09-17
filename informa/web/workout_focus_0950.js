// InFormha 0.9.92 - flusso unico persistente: tapis, focus, sostituzione e serie
(function(){
  let activeId=null,timerContext=null,timerLeft=0,timerTotal=0,timerPaused=false;
  const FLOW_KEY='informha_workout_flow_0949';
  function states(){try{return JSON.parse(localStorage.getItem(FLOW_KEY)||'{}')||{}}catch(e){return {}}}
  function state(id){return states()[id]||null}
  function workoutCards(){return [...document.querySelectorAll('[data-page="workout"] .if50-ex,[data-page="workout"] #if50ex_cardio')]}
  function cardId(card){return card.id==='if50ex_cardio'?'cardio':String(card.id||'').replace('if50ex_','')}
  function archived(id,card){return state(id)?.stage==='archived'||!!card?.classList.contains('if949-archived')}
  function cardFor(id){return workoutCards().find(c=>cardId(c)===id)||null}
  function firstPending(){return workoutCards().find(c=>{const id=cardId(c);return id!=='treadmill'&&!archived(id,c)})||null}
  function chooseCurrent(){
    let c=activeId?cardFor(activeId):null;
    if(c&&!archived(activeId,c))return c;
    c=firstPending();
    activeId=c?cardId(c):null;
    return c;
  }
  function focus(id){
    if(id)activeId=id;
    const all=workoutCards(),current=chooseCurrent();
    all.forEach(c=>{const on=c===current;c.classList.toggle('if950-current',on);c.classList.toggle('if950-hidden',!on)});
    document.body.classList.toggle('if950-session-focus',!!current);
    return current;
  }
  function nextPendingSet(id){return cardFor(id)?.querySelector('.check:not(.done)')?.closest('.setrow')||null}
  function returnToExercise(){clearInterval(timerInt);timerPaused=false;const context=timerContext;timerContext=null;if(context?.id)activeId=context.id;if(typeof go==='function')go('workout');setTimeout(()=>{focus(context?.id);const row=context?.id?nextPendingSet(context.id):null;if(row){row.classList.add('if950-next-set');row.scrollIntoView({behavior:'smooth',block:'center'});row.querySelector('input')?.focus();setTimeout(()=>row.classList.remove('if950-next-set'),1800);toast('Serie successiva pronta')}else if(context?.id){toast('Serie finite: indica risultato e fatica')}},80)}
  function timerDraw(){const display=document.getElementById('timer'),bar=document.getElementById('timerbar');if(display){const m=Math.floor(timerLeft/60),s=timerLeft%60;display.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}if(bar)bar.style.width=(timerTotal?Math.max(0,timerLeft)/timerTotal*100:0)+'%';const pause=document.getElementById('if950Pause');if(pause)pause.textContent=timerPaused?'Riprendi':'Pausa'}
  function installRecoveryControls(){const page=document.querySelector('[data-page="recovery"]'),box=page?.querySelector('.card');if(!box)return;const primary=[...box.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Torna all')||(b.textContent||'').includes('Salta recupero'));if(primary){primary.textContent='Salta recupero';primary.removeAttribute('onclick');primary.onclick=()=>window.if950SkipRecovery()}timerDraw()}
  function beginTimer(seconds){clearInterval(timerInt);timerLeft=Math.max(1,Math.round(Number(seconds)||1));timerTotal=timerLeft;timerPaused=false;timerDraw();setTimeout(installRecoveryControls,0);timerInt=setInterval(()=>{if(timerPaused)return;timerLeft-=1;timerDraw();if(timerLeft<=0){clearInterval(timerInt);const display=document.getElementById('timer');if(display)display.textContent='VAI!';setTimeout(returnToExercise,350)}},1000)}
  window.startTimer=beginTimer;window.if950SkipRecovery=returnToExercise;window.if950PauseRecovery=function(){timerPaused=!timerPaused;timerDraw()};window.if950AddRecovery=function(){timerLeft+=30;timerTotal+=30;timerDraw()};

  const baseStart=window.if949Start;
  if(typeof baseStart==='function')window.if949Start=function(id){
    if(id==='treadmill'&&state('treadmill')?.stage==='archived'){activeId=cardId(firstPending()||{});setTimeout(()=>focus(activeId),0);return}
    const r=baseStart.apply(this,arguments);activeId=id;focus(id);return r;
  };
  const complete=window.if50CompleteSet;if(typeof complete==='function')window.if50CompleteSet=async function(id,n){activeId=id;timerContext={id,kind:'between_sets',completedSet:n};return await complete.apply(this,arguments)};
  const status=window.if50Status;if(typeof status==='function')window.if50Status=async function(id){const r=await status.apply(this,arguments);if(state(id)?.stage==='archived'&&activeId===id)activeId=null;setTimeout(()=>focus(),40);return r};
  const render=window.if50RenderWorkout;if(typeof render==='function')window.if50RenderWorkout=function(){const r=render.apply(this,arguments);setTimeout(()=>focus(activeId),40);return r};

  // Sostituzione atomica: il vecchio stato non viene trasferito; il tapis archiviato resta archiviato.
  // Il nuovo esercizio diventa il focus e viene avviato una sola volta dopo il rerender.
  const swap=window.if60Swap;
  if(typeof swap==='function')window.if60Swap=async function(oldId,newId){
    const r=await swap.apply(this,arguments);
    activeId=newId||null;
    setTimeout(()=>{
      const c=cardFor(newId);if(!c)return;
      focus(newId);
      const s=state(newId);
      if(!s||s.stage==='planned'){
        try{window.if949Start?.(newId)}catch(e){}
      }else focus(newId);
      c.querySelector('.setrow input')?.focus();
    },140);
    return r;
  };
  const remove=window.if60RemoveExercise;if(typeof remove==='function')window.if60RemoveExercise=async function(){const r=await remove.apply(this,arguments);activeId=null;setTimeout(()=>focus(),50);return r};
  const oldGo=window.go;if(typeof oldGo==='function')window.go=function(page){const r=oldGo.apply(this,arguments);if(page==='workout')setTimeout(()=>focus(activeId),30);if(page==='recovery')setTimeout(installRecoveryControls,30);return r};
  const css=document.createElement('style');css.textContent='.if950-hidden{display:none!important}.if950-next-set{outline:2px solid var(--green);box-shadow:0 0 28px rgba(34,197,94,.32)}';document.head.appendChild(css);
  setTimeout(()=>focus(),350);
  console.log('[INFORMHA_WORKOUT_FOCUS] version=0.9.92 unified_flow=1 persistent_treadmill=1 atomic_swap=1 replacement_auto_start=1 no_preparation_timer=1');
})();