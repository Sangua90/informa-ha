// InFormha 0.8.0 - Alimentazione: obiettivi, progressi e riepilogo 7 giorni
(function(){
  const fmt=(v,d=0)=>Number(v||0).toFixed(d).replace('.',',');
  const pct=(v,g)=>g>0?Math.min(100,Math.round((Number(v||0)/Number(g))*100)):0;
  const goalLine=(label,value,goal,unit)=>{
    const p=pct(value,goal);
    return `<div class="if80-goal"><div class="row"><span>${label}</span><b>${fmt(value)}${unit}${goal?` / ${fmt(goal)}${unit}`:''}</b></div>${goal?`<div class="if80-bar"><i style="width:${p}%"></i></div><div class="mini">${p}% dell'obiettivo</div>`:'<div class="mini">Obiettivo non impostato</div>'}</div>`;
  };
  async function if80Render(){
    const page=document.querySelector('[data-page="nutrition"]');if(!page)return;
    let today=null,week=null,goals={};
    try{today=await api('api/nutrition/today')}catch(e){}
    try{week=await api('api/nutrition/week');goals=week.goals||{}}catch(e){try{goals=(await api('api/nutrition/goals')).goals||{}}catch(_){} }
    const t=today?.totals||{};const entries=today?.entries||[];
    page.innerHTML=`<div class="ey">Alimentazione</div><h1>Diario di oggi</h1>
      <div class="card if80-summary">
        ${goalLine('Calorie',t.calories,goals.calories,' kcal')}
        ${goalLine('Proteine',t.protein_g,goals.protein_g,' g')}
        ${goalLine('Carboidrati',t.carbs_g,goals.carbs_g,' g')}
        ${goalLine('Grassi',t.fat_g,goals.fat_g,' g')}
        ${goalLine('Fibre',t.fiber_g,goals.fiber_g,' g')}
        ${goalLine('Acqua',t.water_ml,goals.water_ml,' ml')}
        <div class="row"><button class="btn secondary" onclick="addWater(250);setTimeout(if80Render,150)">💧 +250 ml</button><button class="btn secondary" onclick="addWater(500);setTimeout(if80Render,150)">💧 +500 ml</button></div>
      </div>
      <div class="card"><div class="ey">Aggiungi</div><button class="btn" onclick="go('foodsearch')">🍽 Alimento / HomeStock</button><button class="btn secondary" onclick="go('barcode')">▦ Barcode</button><button class="btn secondary" onclick="go('platephoto')">📷 Foto del piatto</button></div>
      <div class="card"><div class="row"><div style="flex:1"><div class="ey">Obiettivi</div><h2>Target giornalieri</h2></div><button class="btn secondary if80-small" onclick="if80EditGoals()">Modifica</button></div><div class="sub">Impostali tu: InFormha non inventa automaticamente calorie o macro.</div></div>
      <div class="card"><div class="ey">Pasti registrati</div><div id="if80Entries">${entries.length?entries.map(e=>`<div class="if80-entry"><div style="flex:1"><b>${e.name}</b><div class="mini">${e.meal||''}${e.quantity_g?` · ${fmt(e.quantity_g)} g`:''}${e.calories?` · ${fmt(e.calories)} kcal`:''}</div></div><button class="if80-delete" onclick="if80Delete(${e.id})">✕</button></div>`).join(''):'<div class="sub">Nessun alimento registrato oggi.</div>'}</div></div>
      <div class="card"><div class="ey">Ultimi 7 giorni</div><div class="measure"><span>Giorni registrati</span><b>${week?.active_days||0} / 7</b></div><div class="measure"><span>Media calorie</span><b>${fmt(week?.averages?.calories||0)} kcal</b></div><div class="measure"><span>Media proteine</span><b>${fmt(week?.averages?.protein_g||0)} g</b></div><div class="measure"><span>Media acqua</span><b>${fmt(week?.averages?.water_ml||0)} ml</b></div></div>`;
  }
  window.if80Render=if80Render;
  window.if80Delete=async function(id){if(!confirm('Eliminare questa registrazione?'))return;try{await api(`api/nutrition/entry/${id}`,{method:'DELETE'});toast('Registrazione eliminata');if80Render()}catch(e){toast(e.message)}};
  window.if80EditGoals=function(){
    let m=document.getElementById('if80GoalsModal');if(!m){m=document.createElement('div');m.id='if80GoalsModal';m.className='if80-modal';m.innerHTML=`<div class="if80-sheet"><div class="row"><h2 style="flex:1">Obiettivi giornalieri</h2><button class="btn secondary if80-small" onclick="if80CloseGoals()">✕</button></div><input class="field" id="if80gCal" placeholder="Calorie kcal"><input class="field" id="if80gProt" placeholder="Proteine g"><input class="field" id="if80gCarb" placeholder="Carboidrati g"><input class="field" id="if80gFat" placeholder="Grassi g"><input class="field" id="if80gFib" placeholder="Fibre g"><input class="field" id="if80gWater" placeholder="Acqua ml"><button class="btn" onclick="if80SaveGoals()">Salva obiettivi</button></div>`;document.body.appendChild(m)};api('api/nutrition/goals').then(d=>{const g=d.goals||{};[['if80gCal','calories'],['if80gProt','protein_g'],['if80gCarb','carbs_g'],['if80gFat','fat_g'],['if80gFib','fiber_g'],['if80gWater','water_ml']].forEach(([id,k])=>document.getElementById(id).value=g[k]??'')});m.classList.add('open')
  };
  window.if80CloseGoals=function(){document.getElementById('if80GoalsModal')?.classList.remove('open')};
  window.if80SaveGoals=async function(){const val=id=>document.getElementById(id)?.value||null;try{await api('api/nutrition/goals',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({calories:val('if80gCal'),protein_g:val('if80gProt'),carbs_g:val('if80gCarb'),fat_g:val('if80gFat'),fiber_g:val('if80gFib'),water_ml:val('if80gWater')})});if80CloseGoals();toast('Obiettivi salvati');if80Render()}catch(e){toast(e.message)}};
  const css=document.createElement('style');css.textContent=`.if80-goal{padding:10px 0;border-bottom:1px solid var(--ln)}.if80-bar{height:7px;border-radius:999px;overflow:hidden;background:#090b0e;border:1px solid var(--ln);margin:7px 0}.if80-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--green),var(--blue));border-radius:999px}.if80-entry{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--ln)}.if80-delete{border:1px solid var(--ln);background:#11151a;color:#fff;border-radius:12px;width:38px;height:38px}.if80-small{width:auto!important;margin:0!important}.if80-modal{display:none;position:fixed;inset:0;z-index:13000;background:rgba(0,0,0,.74);padding:18px;align-items:flex-end}.if80-modal.open{display:flex}.if80-sheet{width:100%;background:#0e1115;border:1px solid #303640;border-radius:24px;padding:18px;max-height:88vh;overflow:auto}.if80-sheet .field{margin-top:8px}`;document.head.appendChild(css);
  const oldGo=window.go;if(oldGo)window.go=function(page,updateHash=true){const r=oldGo(page,updateHash);if(page==='nutrition')setTimeout(if80Render,60);return r};
  if(location.hash==='#nutrition')setTimeout(if80Render,100);
})();
