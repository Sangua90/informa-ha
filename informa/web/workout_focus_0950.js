// InFormha 0.9.50 - un esercizio alla volta e recupero automatico
(function(){
  let activeId=null;
  let timerContext=null;
  let timerLeft=0;
  let timerTotal=0;
  let timerPaused=false;

  function workoutCards(){return [...document.querySelectorAll('[data-page="workout"] .if50-ex,[data-page="workout"] #if50ex_cardio')]}
  function cardId(card){return card.id==='if50ex_cardio'?'cardio':String(card.id||'').replace('if50ex_','')}
  function isArchived(card){return card.classList.contains('if949-archived')}
  function currentCard(){
    const cards=workoutCards();
    let current=activeId?cards.find(c=>cardId(c)===activeId&&!isArchived(c)):null;
    if(!current)current=cards.find(c=>!isArchived(c))||null;
    activeId=current?cardId(current):null;
    return current;
  }
  function focusWorkout(){
    const cards=workoutCards(),current=currentCard();
    cards.forEach(card=>{
      const selected=card===current;
      card.classList.toggle('if950-current',selected);
      card.classList.toggle('if950-hidden',!selected);
      if(selected){
        const index=cards.indexOf(card);
        document.body.dataset.if950ExerciseIndex=String(index);
        const badge=card.querySelector('.if67-index');
        if(badge)badge.textContent='Esercizio '+(index+1)+' di '+cards.length;
      }
    });
    document.body.classList.toggle('if950-session-focus',!!current);
    if(typeof if945TvPending==='function'&&current)setTimeout(()=>{},0);
  }
  function exercise(id){
    const plan=(typeof IF50!=='undefined'&&Array.isArray(IF50.plan))?IF50.plan:[];
    return plan.find(x=>x.id===id)||(typeof if60Library==='function'?if60Library(id):null);
  }
  function nextPendingSet(id){
    const card=workoutCards().find(c=>cardId(c)===id);
    return card?.querySelector('.check:not(.done)')?.closest('.setrow')||null;
  }
  function returnToExercise(){
    clearInterval(timerInt);timerPaused=false;
    const context=timerContext;timerContext=null;
    if(context?.id)activeId=context.id;
    go('workout');
    setTimeout(()=>{
      focusWorkout();
      const row=context?.id?nextPendingSet(context.id):null;
      if(row){
        row.classList.add('if950-next-set');
        row.scrollIntoView({behavior:'smooth',block:'center'});
        row.querySelector('input')?.focus();
        setTimeout(()=>row.classList.remove('if950-next-set'),1800);
        toast('Serie successiva pronta');
      }else if(context?.id){
        const card=workoutCards().find(c=>cardId(c)===context.id);
        const feedback=card?.querySelector('select[id^="if50f_"]')?.closest('.row');
        feedback?.scrollIntoView({behavior:'smooth',block:'center'});
        toast('Serie finite: indica risultato e fatica');
      }
    },80);
  }
  function timerDraw(){
    const display=document.getElementById('timer'),bar=document.getElementById('timerbar');
    if(display){const m=Math.floor(timerLeft/60),s=timerLeft%60;display.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
    if(bar)bar.style.width=(timerTotal?Math.max(0,timerLeft)/timerTotal*100:0)+'%';
    const pause=document.getElementById('if950Pause');if(pause)pause.textContent=timerPaused?'Riprendi':'Pausa';
  }
  function installRecoveryControls(){
    const page=document.querySelector('[data-page="recovery"]'),box=page?.querySelector('.card');if(!box)return;
    const primary=[...box.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Torna all'));
    if(primary){primary.textContent='Salta recupero';primary.removeAttribute('onclick');primary.onclick=()=>window.if950SkipRecovery()}
    const restart=[...box.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Riavvia'));if(restart)restart.style.display='none';
    let note=document.getElementById('if950TimerTarget');
    if(!note){note=document.createElement('div');note.id='if950TimerTarget';note.className='if950-timer-target';box.querySelector('.progress')?.insertAdjacentElement('afterend',note)}
    const row=timerContext?.id?nextPendingSet(timerContext.id):null;
    note.textContent=row?'Al termine si apre automaticamente la serie successiva':'Al termine torna all’esercizio per il risultato finale';
    let controls=document.getElementById('if950TimerControls');
    if(!controls){
      controls=document.createElement('div');controls.id='if950TimerControls';controls.className='grid2 if950-timer-controls';
      controls.innerHTML='<button id="if950Pause" class="btn secondary" type="button" onclick="if950PauseRecovery()">Pausa</button><button class="btn secondary" type="button" onclick="if950AddRecovery()">+30 secondi</button>';
      primary?.insertAdjacentElement('afterend',controls);
    }
    timerDraw();
  }
  function beginTimer(seconds){
    clearInterval(timerInt);
    timerLeft=Math.max(1,Math.round(Number(seconds)||1));
    timerTotal=timerLeft;
    timerPaused=false;
    timerDraw();
    setTimeout(installRecoveryControls,0);
    timerInt=setInterval(()=>{
      if(timerPaused)return;
      timerLeft-=1;timerDraw();
      if(timerLeft<=0){clearInterval(timerInt);const display=document.getElementById('timer');if(display)display.textContent='VAI!';setTimeout(returnToExercise,350)}
    },1000);
  }

  window.startTimer=beginTimer;
  window.if950SkipRecovery=returnToExercise;
  window.if950PauseRecovery=function(){timerPaused=!timerPaused;timerDraw()};
  window.if950AddRecovery=function(){timerLeft+=30;timerTotal+=30;timerDraw()};

  const start=window.if949Start;
  if(typeof start==='function')window.if949Start=function(id){
    const result=start.apply(this,arguments);
    activeId=id;
    const ex=exercise(id);
    timerContext={id:id,kind:'preparation'};
    beginTimer(ex?.rest||60);
    go('recovery');
    return result;
  };

  const complete=window.if50CompleteSet;
  if(typeof complete==='function')window.if50CompleteSet=async function(id,n){
    activeId=id;
    timerContext={id:id,kind:'between_sets',completedSet:n};
    const result=await complete.apply(this,arguments);
    setTimeout(installRecoveryControls,20);
    return result;
  };

  const status=window.if50Status;
  if(typeof status==='function')window.if50Status=async function(id){
    const result=await status.apply(this,arguments);
    const old=workoutCards().find(c=>cardId(c)===id);
    if(old&&isArchived(old))activeId=null;
    setTimeout(focusWorkout,40);
    return result;
  };

  const render=window.if50RenderWorkout;
  if(typeof render==='function')window.if50RenderWorkout=function(){
    const result=render.apply(this,arguments);
    setTimeout(focusWorkout,40);
    return result;
  };

  const swap=window.if60Swap;
  if(typeof swap==='function')window.if60Swap=async function(){
    const result=await swap.apply(this,arguments);
    activeId=null;setTimeout(focusWorkout,50);return result;
  };

  const remove=window.if60RemoveExercise;
  if(typeof remove==='function')window.if60RemoveExercise=async function(){
    const result=await remove.apply(this,arguments);
    activeId=null;setTimeout(focusWorkout,50);return result;
  };

  const oldGo=window.go;
  if(typeof oldGo==='function')window.go=function(page){
    const result=oldGo.apply(this,arguments);
    if(page==='workout')setTimeout(focusWorkout,30);
    if(page==='recovery')setTimeout(installRecoveryControls,30);
    return result;
  };

  const css=document.createElement('style');css.textContent='.if950-hidden{display:none!important}body.if950-session-focus [data-page="workout"]>#if60SessionControls{display:none!important}body.if950-session-focus [data-page="workout"]>.card:not(.if50-ex):not(#if50ex_cardio):not(#if67SessionHead):not(.warning){display:none}.if950-next-set{outline:2px solid var(--green);box-shadow:0 0 28px rgba(34,197,94,.32);transition:.25s}.if950-timer-target{margin:12px 0;color:var(--green2);font-weight:800;text-align:center}.if950-timer-controls{gap:8px}.if950-timer-controls .btn{margin:0}body.if950-session-focus .if945-tv-nav{display:none!important}';
  document.head.appendChild(css);
  setTimeout(focusWorkout,350);
  console.log('[INFORMHA_WORKOUT_FOCUS] version=0.9.50 single_exercise=1 timer_auto_advance=1 next_set_focus=1');
})();