// InFormha 0.7.0 - Portami avanti distinto e recovery-aware
function if70ByName(name){
  const hit=Object.entries(IF51_LIBRARY).find(([,x])=>x.name===name);
  return hit?hit[0]:null;
}
function if70PlanScore(key,recentNames){
  const plan=IF51_PLANS[key];
  let score=0;
  for(const id of plan.ids){
    const x=IF51_LIBRARY[id];
    if(!x||x.cardio)continue;
    if(recentNames.has(x.name))score+=x.priority==='Essenziale'?3:1;
  }
  return score;
}
async function if70AdvancePlan(){
  let ctx={recent_36h:[],pending_essentials:[]};
  try{ctx=await api('api/coach/advance-context')}catch(e){}
  const recentNames=new Set(ctx.recent_36h||[]);
  const pendingIds=(ctx.pending_essentials||[]).map(x=>x.exercise_id).filter(id=>IF51_LIBRARY[id]&&!if60PainBlocks(id));
  const keys=['A','B','C'];
  keys.sort((a,b)=>if70PlanScore(a,recentNames)-if70PlanScore(b,recentNames));
  const chosen=keys[0];
  const adapted=if51AdaptPlan(chosen,IF50.time,IF50.energy,IF50.pain);
  let items=adapted.items.filter(x=>x.cardio||!recentNames.has(x.name));

  // Recupera prima solo gli essenziali realmente rimasti in sospeso.
  const pendingItems=pendingIds.map(if60ToPlan).filter(Boolean);
  const seen=new Set();
  const merged=[];
  [...pendingItems,...items].forEach(x=>{if(x&&!seen.has(x.id)){seen.add(x.id);merged.push(x)}});

  // Se il filtro recupero rende la seduta troppo corta, aggiunge solo elementi non bloccati.
  if(merged.length<2){
    for(const x of adapted.items){
      if(!seen.has(x.id)&&!if60PainBlocks(x.id)){seen.add(x.id);merged.push(if60ToPlan(x.id)||x)}
      if(merged.length>=3)break;
    }
  }

  IF50.plan=merged.map(x=>({id:x.id,name:x.name,priority:x.priority,sets:x.sets,reps:x.reps,rest:x.rest,guide:x.guide||null,cardio:!!x.cardio,duration:x.duration||null,equipment:x.equipment||'',group:x.group||''}));
  IF50.planTitle=`Portami avanti · ${chosen} · ${IF51_PLANS[chosen].title}`;
  return {chosen,pending:pendingItems.length,recoveryHours:ctx.recovery_hours||36};
}
(function(){
  const previous=window.if50Generate;
  window.if50Generate=async function(){
    if(IF50.intent!=='Portami avanti')return previous();
    const info=await if70AdvancePlan();
    if60PainSuggestions();
    IF50.started=Date.now();
    try{await api('api/coach/checkin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({time_min:IF50.time,energy:IF50.energy,pain:IF50.pain,intent:IF50.intent,plan:IF50.plan,advance_plan:info.chosen})})}catch(e){}
    if50RenderWorkout();if60AddExerciseControls();go('workout');
    toast(info.pending?`Portami avanti: ${info.pending} essenziali recuperati, poi lavoro nuovo`:`Portami avanti: scelto il blocco più recuperato`);
  };
})();
