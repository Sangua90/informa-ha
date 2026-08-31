// InFormha 0.7.1 - gestione prudente di dolori/fastidi e sostituzioni coerenti
(function(){
  const PAIN_RULES={
    Ginocchio:{
      blocked:['goblet_squat'],
      alternatives:{goblet_squat:['glute_bridge','romanian_deadlift','calf_raise']},
      note:'Evito per ora i movimenti che possono caricare direttamente il ginocchio. Mantieni solo movimenti confortevoli.'
    },
    Schiena:{
      blocked:['romanian_deadlift'],
      alternatives:{romanian_deadlift:['glute_bridge','calf_raise','plank']},
      note:'Evito per ora i movimenti che richiedono più lavoro della zona lombare. Mantieni una tecnica neutra e interrompi se il fastidio aumenta.'
    },
    Spalla:{
      blocked:['face_pull','shoulder_press'],
      alternatives:{face_pull:['curl','calf_raise','plank'],shoulder_press:['lateral_raise','curl','calf_raise']},
      note:'Evito per ora i movimenti sopra la testa o che possono irritare la spalla. Usa solo ampiezze confortevoli.'
    }
  };

  function lib(id){try{return IF51_LIBRARY[id]||IF50_EX[id]||null}catch(e){return null}}
  function toPlan(id,priority){const x=lib(id);if(!x)return null;return {id,name:x.name,priority:priority||x.priority||'Utile',sets:x.sets||3,reps:x.reps,rest:x.rest||90,guide:x.guide||null,cardio:!!x.cardio,duration:x.duration||null,equipment:x.equipment||'',group:x.group||''}}
  function isBlocked(id,pain){const r=PAIN_RULES[pain];return !!r&&r.blocked.includes(id)}
  function safeAlternatives(id,pain){const r=PAIN_RULES[pain];if(!r)return[];return (r.alternatives[id]||[]).filter(x=>lib(x)&&!isBlocked(x,pain))}

  window.if71ApplyPainPlan=function(){
    const pain=IF50?.pain||'Nessuno';
    if(pain==='Nessuno')return {changed:[],warning:null};
    if(pain==='Altro')return {changed:[],warning:'Hai segnalato un fastidio non specificato: non faccio sostituzioni automatiche. Scegli solo movimenti confortevoli e interrompi se il dolore è importante o peggiora.'};
    const rule=PAIN_RULES[pain]; if(!rule)return {changed:[],warning:null};
    const changed=[];
    IF50.plan=IF50.plan.map(ex=>{
      if(!isBlocked(ex.id,pain))return ex;
      const altId=safeAlternatives(ex.id,pain)[0];
      if(!altId)return null;
      const alt=toPlan(altId,ex.priority);
      if(alt){changed.push({from:ex,to:alt});return alt}
      return null;
    }).filter(Boolean);
    return {changed,warning:rule.note};
  };

  function explanationBox(result){
    if(!result||(!result.warning&&!result.changed?.length))return;
    const p=document.querySelector('[data-page="workout"]');if(!p)return;
    document.getElementById('if71PainBox')?.remove();
    const box=document.createElement('div');box.id='if71PainBox';box.className='card warning';
    const changes=(result.changed||[]).map(c=>`<div class="measure"><span>${c.from.name}</span><b>→ ${c.to.name}</b></div>`).join('');
    box.innerHTML=`<div class="ey">Seduta adattata al fastidio</div><div class="sub" style="margin-top:7px">${result.warning||''}</div>${changes}${result.changed?.length?'<div class="sub" style="margin-top:9px">La sostituzione mantiene il più possibile lo scopo della seduta senza forzare l’area segnalata.</div>':''}<div class="sub" style="margin-top:9px">Se il dolore è importante, persistente o peggiora, interrompi l’esercizio e valuta un professionista sanitario.</div>`;
    const first=p.querySelector('.if67-head,.status,.card');
    if(first&&first.nextSibling)p.insertBefore(box,first.nextSibling);else p.prepend(box);
  }

  window.if71ShowPainAlternatives=function(id){
    const pain=IF50?.pain||'Nessuno';
    const opts=safeAlternatives(id,pain);
    if(!opts.length){
      if(typeof if60Modal==='function')if60Modal('Alternative prudenti','<div class="sub">Non ho una sostituzione automatica abbastanza coerente per il fastidio indicato. Meglio togliere l’esercizio o scegliere manualmente un movimento confortevole.</div>');
      return;
    }
    if(typeof if60Modal==='function')if60Modal('Alternative prudenti',opts.map(x=>{const e=lib(x);return `<button class="btn secondary" onclick="if60Swap('${id}','${x}')"><b>${e.name}</b><br><span class="sub">${e.group||''} · ${e.equipment||''}</span></button>`}).join(''));
  };

  // Replace generic auto-pain substitution used by 0.6.0 with the 0.7.1 rules.
  window.if60PainSuggestions=function(){
    const result=window.if71ApplyPainPlan();
    window.IF71_LAST_PAIN=result;
    if(result.changed?.length)toast(`Sostituit${result.changed.length===1?'o':'i'} ${result.changed.length} esercizi per il fastidio segnalato`);
  };

  const oldRender=window.if50RenderWorkout;
  window.if50RenderWorkout=function(){
    const out=oldRender();
    setTimeout(()=>explanationBox(window.IF71_LAST_PAIN),0);
    return out;
  };

  // Make the in-session "Sostituisci" button prefer pain-specific alternatives when a pain is active.
  const oldSwap=window.if60ShowSwap;
  window.if60ShowSwap=function(id){
    const pain=IF50?.pain||'Nessuno';
    if(pain!=='Nessuno'&&pain!=='Altro'&&safeAlternatives(id,pain).length)return window.if71ShowPainAlternatives(id);
    return oldSwap(id);
  };
})();
