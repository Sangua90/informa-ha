// InFormha 0.9.15 - Gestione guide: abilita/escludi esercizi dagli allenamenti
(function(){
  const GROUP_ORDER=['Petto','Schiena','Spalle','Spalle posteriori','Tricipiti','Bicipiti','Bicipiti e avambracci','Gambe','Catena posteriore','Glutei','Polpacci','Core','Cardio'];
  let enabledState={};
  let stateLoaded=false;

  function library(){
    try{return (typeof IF51_LIBRARY!=='undefined'&&IF51_LIBRARY)||{}}catch(e){return{}}
  }
  function entries(){
    return Object.entries(library()).map(([id,x])=>({id,name:x.name||id,group:x.group||'Altro',equipment:x.equipment||'—'}));
  }
  async function loadEnabled(force=false){
    if(stateLoaded&&!force)return enabledState;
    try{
      const d=await api('api/exercise-enabled');
      enabledState=d.exercises||{};
      stateLoaded=true;
    }catch(e){
      enabledState={};
    }
    return enabledState;
  }
  function planId(ex){
    const id=String(ex?.id||'');
    const name=String(ex?.name||'').toLowerCase();
    if(id==='cardio'||name.includes('tapis roulant'))return 'treadmill';
    if(name.includes('mini stepper'))return 'stepper';
    return id;
  }
  function isEnabled(exOrId){
    const id=typeof exOrId==='string'?exOrId:planId(exOrId);
    return enabledState[id]!==false;
  }
  window.if915ExerciseEnabled=isEnabled;

  function ensureManager(){
    const conn=document.querySelector('[data-page="connections"]');if(!conn)return null;
    const old=document.getElementById('if914Manager');if(old)old.style.display='none';
    document.getElementById('if74Manager')?.remove();
    let box=document.getElementById('if915Manager');
    if(!box){
      box=document.createElement('div');box.id='if915Manager';box.className='card';
      box.innerHTML=`
        <div class="ey">Gestione guide</div>
        <h2>Esercizi utilizzabili</h2>
        <div class="sub">La gestione delle foto è separata. Qui scegli quali esercizi InFormha può usare negli allenamenti. Gli esercizi disattivati restano nella libreria e nelle guide.</div>
        <div class="if915-controls">
          <input class="field" id="if915Search" placeholder="Cerca esercizio, gruppo o attrezzatura…">
          <select class="field" id="if915Group"><option value="">Tutti i gruppi</option></select>
          <select class="field" id="if915State"><option value="">Tutti</option><option value="on">Solo attivi</option><option value="off">Solo esclusi</option></select>
        </div>
        <div class="if915-summary" id="if915Summary"></div>
        <div id="if915Rows"></div>`;
      conn.appendChild(box);
      const groups=[...new Set(entries().map(x=>x.group))].sort((a,b)=>{
        const ia=GROUP_ORDER.indexOf(a),ib=GROUP_ORDER.indexOf(b);
        return (ia<0?999:ia)-(ib<0?999:ib)||a.localeCompare(b);
      });
      const sel=box.querySelector('#if915Group');groups.forEach(g=>{const o=document.createElement('option');o.value=g;o.textContent=g;sel.appendChild(o)});
      ['input','change'].forEach(ev=>box.addEventListener(ev,e=>{
        if(e.target.matches('#if915Search,#if915Group,#if915State'))renderManager();
      }));
    }
    return box;
  }

  async function renderManager(){
    const box=ensureManager();if(!box)return;
    await loadEnabled();
    const q=(box.querySelector('#if915Search')?.value||'').trim().toLowerCase();
    const group=box.querySelector('#if915Group')?.value||'';
    const state=box.querySelector('#if915State')?.value||'';
    let rows=entries().map(x=>({...x,enabled:isEnabled(x.id)}));
    const total=rows.length;
    const active=rows.filter(x=>x.enabled).length;
    rows=rows.filter(x=>{
      const text=`${x.name} ${x.group} ${x.equipment}`.toLowerCase();
      return (!q||text.includes(q))&&(!group||x.group===group)&&(!state||(state==='on'?x.enabled:!x.enabled));
    });
    rows.sort((a,b)=>{
      const ga=GROUP_ORDER.indexOf(a.group),gb=GROUP_ORDER.indexOf(b.group);
      return (ga<0?999:ga)-(gb<0?999:gb)||a.group.localeCompare(b.group)||a.name.localeCompare(b.name);
    });
    box.querySelector('#if915Summary').textContent=`${active}/${total} esercizi attivi · ${total-active} esclusi`;
    box.querySelector('#if915Rows').innerHTML=rows.map(x=>`
      <label class="if915-row ${x.enabled?'enabled':'disabled'}">
        <span class="if915-info"><b>${x.name}</b><small>${x.group} · ${x.equipment}</small></span>
        <span class="if915-toggle"><input type="checkbox" ${x.enabled?'checked':''} onchange="if915Toggle('${x.id}',this.checked,this)"><i></i><strong>${x.enabled?'Attivo':'Escluso'}</strong></span>
      </label>`).join('')||'<div class="sub" style="padding:14px 0">Nessun esercizio corrisponde ai filtri.</div>';
  }

  window.if915Toggle=async function(id,enabled,input){
    input.disabled=true;
    try{
      await api(`api/exercise-enabled/${id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled})});
      enabledState[id]=enabled;
      toast(enabled?'Esercizio attivato':'Esercizio escluso dagli allenamenti');
      await renderManager();
    }catch(e){
      input.checked=!enabled;
      toast(e.message||'Errore salvataggio');
    }finally{input.disabled=false}
  };

  const oldBuild=window.if50BuildPlan;
  if(oldBuild)window.if50BuildPlan=function(){
    const result=oldBuild.apply(this,arguments);
    if(typeof IF50!=='undefined'&&Array.isArray(IF50.plan))IF50.plan=IF50.plan.filter(isEnabled);
    return typeof IF50!=='undefined'?IF50.plan:result;
  };

  const oldGenerate=window.if50Generate;
  if(oldGenerate)window.if50Generate=async function(){
    await loadEnabled(true);
    return oldGenerate.apply(this,arguments);
  };

  const oldRender=window.if50RenderWorkout;
  if(oldRender)window.if50RenderWorkout=function(){
    if(typeof IF50!=='undefined'&&Array.isArray(IF50.plan))IF50.plan=IF50.plan.filter(isEnabled);
    return oldRender.apply(this,arguments);
  };

  const css=document.createElement('style');css.textContent=`
    #if914Manager{display:none!important}.if915-controls{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;margin:14px 0}.if915-summary{font-size:12px;color:var(--m);margin-bottom:8px}.if915-row{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--ln);cursor:pointer}.if915-row:last-child{border-bottom:0}.if915-row.disabled{opacity:.62}.if915-info{display:flex;flex-direction:column;gap:4px;min-width:0}.if915-info small{color:var(--m);font-size:12px}.if915-toggle{display:flex;align-items:center;gap:8px;white-space:nowrap}.if915-toggle input{position:absolute;opacity:0;pointer-events:none}.if915-toggle i{width:38px;height:22px;border-radius:999px;background:#252a31;border:1px solid var(--ln);position:relative;transition:.18s}.if915-toggle i:after{content:'';position:absolute;width:16px;height:16px;left:2px;top:2px;border-radius:50%;background:#8b929b;transition:.18s}.if915-toggle input:checked+i{background:rgba(34,197,94,.22);border-color:rgba(34,197,94,.55)}.if915-toggle input:checked+i:after{left:18px;background:var(--green2)}.if915-toggle strong{font-size:12px;min-width:48px}@media(max-width:760px){.if915-controls{grid-template-columns:1fr}.if915-row{align-items:flex-start}.if915-toggle{margin-top:2px}}
  `;document.head.appendChild(css);

  document.addEventListener('click',e=>{if(e.target.closest('[onclick*="connections"]'))setTimeout(()=>{ensureManager();renderManager()},120)});
  setTimeout(async()=>{await loadEnabled();ensureManager();renderManager()},420);
})();
