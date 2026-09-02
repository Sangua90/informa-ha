// InFormha 0.9.31 - tapis roulant modulare + mobilita/stretching selettivo
(function(){
  const EXTRA={
    mobility_upper:{name:'Mobilità dinamica parte alta',group:'Mobilità / Stretching',equipment:'Corpo libero',priority:'Opzionale',guide:'mobility_upper',mobility:true,seconds:120},
    mobility_back:{name:'Mobilità dinamica schiena e dorsali',group:'Mobilità / Stretching',equipment:'Corpo libero',priority:'Opzionale',guide:'mobility_back',mobility:true,seconds:120},
    mobility_hips:{name:'Mobilità dinamica anche',group:'Mobilità / Stretching',equipment:'Corpo libero',priority:'Opzionale',guide:'mobility_hips',mobility:true,seconds:150},
    mobility_ankles:{name:'Mobilità dinamica caviglie',group:'Mobilità / Stretching',equipment:'Corpo libero',priority:'Opzionale',guide:'mobility_ankles',mobility:true,seconds:90},
    mobility_trunk:{name:'Mobilità dinamica tronco',group:'Mobilità / Stretching',equipment:'Corpo libero',priority:'Opzionale',guide:'mobility_trunk',mobility:true,seconds:120},
    stretch_chest:{name:'Stretching petto',group:'Mobilità / Stretching',equipment:'Corpo libero',priority:'Opzionale',guide:'stretch_chest',stretching:true,seconds:90},
    stretch_back_lats:{name:'Stretching schiena e dorsali',group:'Mobilità / Stretching',equipment:'Corpo libero',priority:'Opzionale',guide:'stretch_back_lats',stretching:true,seconds:90},
    stretch_shoulders_triceps:{name:'Stretching spalle e tricipiti',group:'Mobilità / Stretching',equipment:'Corpo libero',priority:'Opzionale',guide:'stretch_shoulders_triceps',stretching:true,seconds:90},
    stretch_biceps_forearms:{name:'Stretching bicipiti e avambracci',group:'Mobilità / Stretching',equipment:'Corpo libero',priority:'Opzionale',guide:'stretch_biceps_forearms',stretching:true,seconds:90},
    stretch_quads:{name:'Stretching quadricipiti',group:'Mobilità / Stretching',equipment:'Corpo libero',priority:'Opzionale',guide:'stretch_quads',stretching:true,seconds:90},
    stretch_hamstrings_glutes:{name:'Stretching femorali e glutei',group:'Mobilità / Stretching',equipment:'Corpo libero',priority:'Opzionale',guide:'stretch_hamstrings_glutes',stretching:true,seconds:120},
    stretch_calves:{name:'Stretching polpacci',group:'Mobilità / Stretching',equipment:'Corpo libero',priority:'Opzionale',guide:'stretch_calves',stretching:true,seconds:90},
    stretch_trunk:{name:'Stretching tronco e core',group:'Mobilità / Stretching',equipment:'Corpo libero',priority:'Opzionale',guide:'stretch_trunk',stretching:true,seconds:90}
  };

  if(typeof IF51_LIBRARY!=='undefined')Object.assign(IF51_LIBRARY,EXTRA);
  if(typeof IF50_EX!=='undefined')Object.entries(EXTRA).forEach(([id,x])=>{if(!IF50_EX[id])IF50_EX[id]={id,name:x.name,priority:x.priority,sets:1,reps:null,rest:0,guide:x.guide}});

  let enabled={};
  const isEnabled=id=>enabled[id]!==false;
  async function loadEnabled(){try{const d=await api('api/exercise-enabled');enabled=d.exercises||{}}catch(e){enabled={}}}

  function pickExtra(group,val){IF50[group]=val;document.querySelectorAll(`[data-if931-group="${group}"]`).forEach(b=>b.classList.toggle('on',b.dataset.val===val))}
  window.if931Pick=pickExtra;

  const oldCheckin=window.if50Checkin;
  if(typeof oldCheckin==='function')window.if50Checkin=function(){
    const out=oldCheckin.apply(this,arguments);
    IF50.treadmill_choice=IF50.treadmill_choice||'No';
    IF50.stretch_mode=IF50.stretch_mode||'No';
    const p=document.querySelector('[data-page="checkin"]');
    const coach=[...p.querySelectorAll('.card')].find(c=>(c.textContent||'').includes('Logica coach'));
    if(coach&&!document.getElementById('if931Extras')){
      const box=document.createElement('div');box.id='if931Extras';
      box.innerHTML=`<div class="card"><b>Tapis roulant?</b><div class="choice"><button class="${IF50.treadmill_choice==='No'?'on':''}" data-if931-group="treadmill_choice" data-val="No" onclick="if931Pick('treadmill_choice','No')">No</button><button class="${IF50.treadmill_choice==='Sì'?'on':''}" data-if931-group="treadmill_choice" data-val="Sì" onclick="if931Pick('treadmill_choice','Sì')">Sì</button></div><div class="sub">Se lo scegli, InFormha prepara un blocco di camminata con minuti, velocità e inclinazione.</div></div><div class="card"><b>Stretching / mobilità?</b><div class="choice"><button class="${IF50.stretch_mode==='No'?'on':''}" data-if931-group="stretch_mode" data-val="No" onclick="if931Pick('stretch_mode','No')">No</button><button class="${IF50.stretch_mode==='Prima'?'on':''}" data-if931-group="stretch_mode" data-val="Prima" onclick="if931Pick('stretch_mode','Prima')">Prima</button><button class="${IF50.stretch_mode==='Dopo'?'on':''}" data-if931-group="stretch_mode" data-val="Dopo" onclick="if931Pick('stretch_mode','Dopo')">Dopo</button><button class="${IF50.stretch_mode==='Prima e dopo'?'on':''}" data-if931-group="stretch_mode" data-val="Prima e dopo" onclick="if931Pick('stretch_mode','Prima e dopo')">Prima e dopo</button></div><div class="sub">Prima: mobilità dinamica dei distretti che lavoreranno. Dopo: stretching dei muscoli realmente coinvolti.</div></div>`;
      coach.parentElement.insertBefore(box,coach);
    }
    loadEnabled();
    return out;
  };

  const GROUP_MAP={
    'Petto':{pre:['mobility_upper'],post:['stretch_chest']},
    'Schiena':{pre:['mobility_back'],post:['stretch_back_lats']},
    'Spalle':{pre:['mobility_upper'],post:['stretch_shoulders_triceps']},
    'Spalle posteriori':{pre:['mobility_upper','mobility_back'],post:['stretch_shoulders_triceps']},
    'Tricipiti':{pre:['mobility_upper'],post:['stretch_shoulders_triceps']},
    'Bicipiti':{pre:['mobility_upper'],post:['stretch_biceps_forearms']},
    'Bicipiti e avambracci':{pre:['mobility_upper'],post:['stretch_biceps_forearms']},
    'Gambe':{pre:['mobility_hips','mobility_ankles'],post:['stretch_quads','stretch_calves']},
    'Catena posteriore':{pre:['mobility_hips'],post:['stretch_hamstrings_glutes']},
    'Glutei':{pre:['mobility_hips'],post:['stretch_hamstrings_glutes']},
    'Polpacci':{pre:['mobility_ankles'],post:['stretch_calves']},
    'Core':{pre:['mobility_trunk'],post:['stretch_trunk']}
  };

  function unique(a){return [...new Set(a)]}
  function relevant(kind,base){
    const ids=[];
    base.forEach(ex=>{const m=GROUP_MAP[ex.group];if(m)ids.push(...(m[kind]||[]))});
    return unique(ids).filter(isEnabled).map(id=>({id,...EXTRA[id],phase:kind==='pre'?'Prima':'Dopo'}));
  }

  function treadmillProtocol(){
    const energy=IF50.energy||'Normale';
    if(energy==='Bassa')return {duration:8,phases:[['3 min','3,5 km/h','0%'],['4 min','4,2 km/h','1%'],['1 min','3,5 km/h','0%']]};
    if(energy==='Alta')return {duration:12,phases:[['3 min','4,0 km/h','1%'],['3 min','4,8 km/h','2%'],['3 min','5,3 km/h','3%'],['3 min','4,2 km/h','1%']]};
    return {duration:10,phases:[['3 min','3,8 km/h','0%'],['4 min','4,7 km/h','2%'],['3 min','4,0 km/h','1%']]};
  }

  const oldBuild=window.if50BuildPlan;
  if(typeof oldBuild==='function')window.if50BuildPlan=function(){
    oldBuild.apply(this,arguments);
    let base=(IF50.plan||[]).filter(x=>x.id!=='treadmill');
    const pre=(IF50.stretch_mode==='Prima'||IF50.stretch_mode==='Prima e dopo')?relevant('pre',base):[];
    const post=(IF50.stretch_mode==='Dopo'||IF50.stretch_mode==='Prima e dopo')?relevant('post',base):[];
    const tm=(IF50.treadmill_choice==='Sì'&&isEnabled('treadmill'))?{id:'treadmill',name:'Tapis roulant Fassi',group:'Cardio',equipment:'Fassi F 7.9 HRC',priority:'Opzionale',cardio:true,guide:'treadmill',protocol:treadmillProtocol()}:null;
    IF50.plan=[...pre,...(tm?[tm]:[]),...base,...post];
    return IF50.plan;
  };

  const oldGenerate=window.if50Generate;
  if(typeof oldGenerate==='function')window.if50Generate=async function(){await loadEnabled();return oldGenerate.apply(this,arguments)};

  const oldCard=window.if50ExerciseCard;
  window.if50ExerciseCard=function(ex){
    if(ex?.protocol){
      return `<div class="card if931-treadmill" id="if50ex_treadmill"><div class="ey">Tapis roulant · ${ex.protocol.duration} min</div><h2>${ex.name}</h2><div class="sub">Protocollo proposto in base alla seduta di oggi. Puoi modificarlo sulla macchina se necessario.</div>${ex.protocol.phases.map((p,i)=>`<div class="measure"><span>Fase ${i+1} · ${p[0]}</span><b>${p[1]} · incl. ${p[2]}</b></div>`).join('')}<div class="grid2" style="margin-top:10px"><input class="field" id="if931TreadmillMin" value="${ex.protocol.duration}" inputmode="numeric"><button class="btn secondary" onclick="if931SaveTreadmill()">Salva tapis roulant</button></div><div class="choice"><button onclick="if931BlockStatus('treadmill','Completato',this)">Completato</button><button onclick="if931BlockStatus('treadmill','Parziale',this)">Parziale</button><button onclick="if931BlockStatus('treadmill','Saltato',this)">Saltato</button></div></div>`;
    }
    if(ex?.mobility||ex?.stretching){
      const sec=ex.seconds||90;const label=ex.mobility?'Mobilità dinamica':'Stretching finale';
      return `<div class="card if931-stretch" id="if50ex_${ex.id}"><div class="ey">${label} · circa ${Math.round(sec/60*10)/10} min</div><div class="row" style="align-items:flex-start"><div style="flex:1"><h2>${ex.name}</h2><div class="sub">${ex.mobility?'Movimenti controllati e progressivi, senza forzare posizioni mantenute.':'Allungamento tranquillo e controllato, senza rimbalzi.'}</div></div>${ex.guide?`<button class="btn secondary" style="width:auto;margin:0" onclick="openGuide('${ex.guide}')">Guida</button>`:''}</div><div class="choice"><button onclick="if931BlockStatus('${ex.id}','Completato',this)">Completato</button><button onclick="if931BlockStatus('${ex.id}','Saltato',this)">Saltato</button></div></div>`;
    }
    return oldCard.apply(this,arguments);
  };

  window.if931BlockStatus=async(id,status,btn)=>{
    btn.parentElement.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===btn));
    const ex=(IF50.plan||[]).find(x=>x.id===id)||IF51_LIBRARY?.[id]||EXTRA[id];
    try{await api('api/coach/exercise-status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workout_id:currentWorkoutId,exercise:ex?.name||id,priority:'Opzionale',status})})}catch(e){}
  };

  window.if931SaveTreadmill=async()=>{
    const raw=document.getElementById('if931TreadmillMin')?.value;const min=Number(String(raw||'').replace(',','.'));
    if(!Number.isFinite(min)||min<=0){toast('Inserisci i minuti');return}
    const ex=(IF50.plan||[]).find(x=>x.id==='treadmill');
    const notes=(ex?.protocol?.phases||[]).map((p,i)=>`F${i+1} ${p.join(' ')}`).join(' | ');
    try{await api('api/cardio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({activity:'Tapis roulant Fassi',duration_min:min,notes:`Protocollo InFormha: ${notes}`})});toast('Tapis roulant salvato')}catch(e){toast(e.message||'Errore cardio')}
  };

  console.log('[INFORMHA_WARMUP] version=0.9.31 treadmill_modular=1 stretching_selective=1 toggle_aware=1 guide_ids_ready=1');
})();
