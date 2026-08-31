// InFormha 0.7.2 - sospensione/ripresa pulita degli Essenziali
(function(){
  function doneEssentialIds(){
    return (IF50.plan||[]).filter(x=>x.priority==='Essenziale'&&!x.cardio&&typeof if60ExerciseDone==='function'&&if60ExerciseDone(x.id)).map(x=>x.id);
  }
  function pendingEssentials(){
    return (IF50.plan||[]).filter(x=>x.priority==='Essenziale'&&!x.cardio&&!(typeof if60ExerciseDone==='function'&&if60ExerciseDone(x.id)));
  }
  async function saveResumeSnapshot(items){
    const snap={
      plan_title:IF50.planTitle||'Seduta',
      suspended_at:new Date().toISOString(),
      started_at:IF50.started||null,
      workout_id:currentWorkoutId||null,
      pending_ids:items.map(x=>x.id),
      completed_essential_ids:doneEssentialIds()
    };
    try{await api('api/coach/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resume_snapshot:snap,last_action:'suspended',last_plan:snap.plan_title})})}catch(e){}
    try{localStorage.setItem('informha_resume_072',JSON.stringify(snap))}catch(e){}
  }

  window.if60Suspend=async function(){
    const pending=pendingEssentials();
    if(pending.length){
      try{await api('api/coach/pending',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source_plan:IF50.planTitle||'Seduta',items:pending.map(x=>({id:x.id,name:x.name,priority:'Essenziale'}))})})}catch(e){}
    }
    await saveResumeSnapshot(pending);
    currentWorkoutId=null;
    toast(pending.length?`Seduta sospesa: ${pending.length} essenzial${pending.length===1?'e':'i'} da riprendere`:'Seduta sospesa: nessun Essenziale rimasto');
    go('home');
    if(typeof if60LoadPending==='function')await if60LoadPending();
  };

  window.if60ResumePending=function(){
    if(!Array.isArray(IF60_PENDING)||!IF60_PENDING.length){toast('Nessun Essenziale da riprendere');return}
    const seen=new Set();
    IF50.plan=IF60_PENDING.map(x=>x.exercise_id).filter(id=>id&&!seen.has(id)&&(seen.add(id),true)).map(id=>if60ToPlan(id)).filter(Boolean).map(x=>({...x,priority:'Essenziale'}));
    if(!IF50.plan.length){toast('Nessun esercizio valido da riprendere');return}
    let snap={};try{snap=JSON.parse(localStorage.getItem('informha_resume_072')||'{}')}catch(e){}
    IF50.planTitle=`Ripresa · ${snap.plan_title||IF60_PENDING[0]?.source_plan||'Essenziali'}`;
    IF50.intent='Ripresa seduta';
    IF50.started=Date.now();
    currentWorkoutId=null;
    if50RenderWorkout();
    if(typeof if60AddExerciseControls==='function')if60AddExerciseControls();
    go('workout');
    toast('Ripresa caricata: solo gli Essenziali ancora aperti');
  };

  const oldHome=window.if60HomePending;
  window.if60HomePending=function(){
    if(typeof oldHome==='function')oldHome();
    const c=document.getElementById('if60PendingCard');if(!c)return;
    const sub=c.querySelector('.sub');if(sub)sub.insertAdjacentHTML('afterend','<div class="mini" style="margin-top:8px">Utile e Opzionale non vengono recuperati automaticamente.</div>');
  };
})();