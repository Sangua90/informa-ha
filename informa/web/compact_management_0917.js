// InFormha 0.9.17 - gestione compatta stabile come mockup approvato
(function(){
  const GROUP_ORDER=['Petto','Schiena','Spalle','Spalle posteriori','Tricipiti','Bicipiti','Bicipiti e avambracci','Gambe','Catena posteriore','Glutei','Polpacci','Core','Cardio'];
  let guideStatus={guides:{}};
  let enabledState={};

  function library(){try{return (typeof IF51_LIBRARY!=='undefined'&&IF51_LIBRARY)||{}}catch(e){return{}}}
  function entries(){return Object.entries(library()).map(([id,x])=>({id,name:x.name||id,group:x.group||'Altro',equipment:x.equipment||'—'}))}
  function appRoot(){return document.querySelector('.app')}
  function groups(){return [...new Set(entries().map(x=>x.group))].sort((a,b)=>{const ia=GROUP_ORDER.indexOf(a),ib=GROUP_ORDER.indexOf(b);return (ia<0?999:ia)-(ib<0?999:ib)||a.localeCompare(b)})}
  function esc(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
  async function loadGuides(){try{guideStatus=await api('api/guides')}catch(e){guideStatus={guides:{}}}}
  async function loadEnabled(){try{const d=await api('api/exercise-enabled');enabledState=d.exercises||{}}catch(e){enabledState={}}}
  function isEnabled(id){return enabledState[id]!==false}

  function removeLegacyManagement(){
    document.getElementById('if74Manager')?.remove();
    document.getElementById('if914Manager')?.remove();
    document.getElementById('if915Manager')?.remove();
    document.getElementById('if916CompactMenu')?.remove();
    document.querySelector('[data-page="photo-manager-0916"]')?.remove();
    document.querySelector('[data-page="exercise-manager-0916"]')?.remove();
  }

  function ensurePage(name,title,subtitle,bodyId){
    let page=document.querySelector(`[data-page="${name}"]`);
    if(!page){
      page=document.createElement('section');page.className='page';page.dataset.page=name;
      page.innerHTML=`<div class="if917-page-head"><button class="if917-back-top" onclick="go('connections')">←</button><div><div class="ey">Dati automatici</div><h1>${title}</h1></div></div><div class="sub if917-page-sub">${subtitle}</div><div id="${bodyId}"></div>`;
      appRoot()?.insertBefore(page,document.querySelector('.nav')||null);
    }
    return page;
  }

  function installHomeMenu(){
    const conn=document.querySelector('[data-page="connections"]');if(!conn)return;
    removeLegacyManagement();
    let box=document.getElementById('if917CompactMenu');
    if(!box){
      box=document.createElement('div');box.id='if917CompactMenu';box.className='card if917-menu-card';
      box.innerHTML=`<div class="ey">Dati automatici</div><h2>Gestione esercizi</h2><div class="sub">Gestisci foto e disponibilità degli esercizi utilizzati da InFormha.</div>
      <button class="if917-menu-item" onclick="if917OpenPhotos()"><span class="if917-icon">🖼️</span><span><b>Gestione foto esercizi</b><small>Carica, sostituisci o rimuovi le foto degli esercizi.</small></span><strong>›</strong></button>
      <button class="if917-menu-item" onclick="if917OpenExercises()"><span class="if917-icon">🏋️</span><span><b>Gestione esercizi</b><small>Attiva o escludi gli esercizi utilizzabili negli allenamenti.</small></span><strong>›</strong></button>`;
      conn.appendChild(box);
    }
  }

  function photoControls(){
    return `<div class="if917-controls"><input class="field" id="if917PhotoSearch" placeholder="Cerca esercizio, gruppo o attrezzatura…"><select class="field" id="if917PhotoGroup"><option value="">Tutti i gruppi</option>${groups().map(g=>`<option>${esc(g)}</option>`).join('')}</select><select class="field" id="if917PhotoState"><option value="">Tutte le foto</option><option value="missing">Solo senza foto</option><option value="present">Solo con foto</option></select></div><div class="if917-summary" id="if917PhotoSummary"></div><div id="if917PhotoRows"></div>`;
  }

  async function renderPhotos(){
    const host=document.getElementById('if917PhotoHost');if(!host)return;
    await loadGuides();
    if(!host.dataset.ready){host.innerHTML=photoControls();host.dataset.ready='1';['input','change'].forEach(ev=>host.addEventListener(ev,e=>{if(e.target.matches('#if917PhotoSearch,#if917PhotoGroup,#if917PhotoState'))renderPhotos()}))}
    const q=(document.getElementById('if917PhotoSearch')?.value||'').toLowerCase().trim(),group=document.getElementById('if917PhotoGroup')?.value||'',state=document.getElementById('if917PhotoState')?.value||'';
    let rows=entries().map(x=>({...x,installed:!!guideStatus.guides?.[x.id]?.installed}));
    const total=rows.length,present=rows.filter(x=>x.installed).length;
    rows=rows.filter(x=>(!q||`${x.name} ${x.group} ${x.equipment}`.toLowerCase().includes(q))&&(!group||x.group===group)&&(!state||(state==='missing'?!x.installed:x.installed)));
    document.getElementById('if917PhotoSummary').textContent=`${present}/${total} foto presenti · ${rows.length} esercizi visualizzati`;
    document.getElementById('if917PhotoRows').innerHTML=rows.map(x=>`<div class="if917-row"><div class="if917-main"><b>${esc(x.name)}</b><small>${esc(x.group)} · ${esc(x.equipment)}</small><em class="${x.installed?'ok':'bad'}">${x.installed?'● Foto presente':'● Foto mancante'}</em></div><div class="if917-actions">${x.installed?`<button class="btn secondary" onclick="if74OpenImage('${x.id}')">Apri</button>`:''}<input hidden type="file" id="if917File_${x.id}" accept="image/jpeg,image/png,image/webp" onchange="if917Upload('${x.id}',this)"><button class="btn secondary" onclick="document.getElementById('if917File_${x.id}').click()">${x.installed?'Sostituisci':'Carica'}</button>${x.installed?`<button class="btn secondary" onclick="if917Remove('${x.id}')">Rimuovi</button>`:''}</div></div>`).join('')||'<div class="sub">Nessun esercizio corrisponde ai filtri.</div>';
  }

  async function renderExercises(){
    const host=document.getElementById('if917ExerciseHost');if(!host)return;
    await loadEnabled();
    if(!host.dataset.ready){host.innerHTML=`<div class="if917-controls"><input class="field" id="if917ExSearch" placeholder="Cerca esercizio, gruppo o attrezzatura…"><select class="field" id="if917ExGroup"><option value="">Tutti i gruppi</option>${groups().map(g=>`<option>${esc(g)}</option>`).join('')}</select><select class="field" id="if917ExState"><option value="">Tutti</option><option value="on">Solo attivi</option><option value="off">Solo esclusi</option></select></div><div class="if917-summary" id="if917ExSummary"></div><div id="if917ExRows"></div>`;host.dataset.ready='1';['input','change'].forEach(ev=>host.addEventListener(ev,e=>{if(e.target.matches('#if917ExSearch,#if917ExGroup,#if917ExState'))renderExercises()}))}
    const q=(document.getElementById('if917ExSearch')?.value||'').toLowerCase().trim(),group=document.getElementById('if917ExGroup')?.value||'',state=document.getElementById('if917ExState')?.value||'';
    let rows=entries().map(x=>({...x,enabled:isEnabled(x.id)}));const total=rows.length,active=rows.filter(x=>x.enabled).length;
    rows=rows.filter(x=>(!q||`${x.name} ${x.group} ${x.equipment}`.toLowerCase().includes(q))&&(!group||x.group===group)&&(!state||(state==='on'?x.enabled:!x.enabled)));
    document.getElementById('if917ExSummary').textContent=`${active} attivi · ${total-active} esclusi · ${total} esercizi totali`;
    document.getElementById('if917ExRows').innerHTML=rows.map(x=>`<label class="if917-row if917-toggle-row ${x.enabled?'':'off'}"><div class="if917-main"><b>${esc(x.name)}</b><small>${esc(x.group)} · ${esc(x.equipment)}</small></div><span class="if917-check"><input type="checkbox" ${x.enabled?'checked':''} onchange="if917Toggle('${x.id}',this.checked,this)"><i></i><strong>${x.enabled?'Attivo':'Escluso'}</strong></span></label>`).join('')||'<div class="sub">Nessun esercizio corrisponde ai filtri.</div>';
  }

  window.if917OpenPhotos=async function(){ensurePage('photo-manager-0917','Gestione foto esercizi','Carica o gestisci le foto che illustrano correttamente l’esecuzione di ogni esercizio.','if917PhotoHost');go('photo-manager-0917');await renderPhotos()};
  window.if917OpenExercises=async function(){ensurePage('exercise-manager-0917','Gestione esercizi','Seleziona gli esercizi che vuoi rendere disponibili negli allenamenti. Quelli esclusi restano nella libreria.','if917ExerciseHost');go('exercise-manager-0917');await renderExercises()};
  window.if917Upload=async function(id,input){const file=input.files?.[0];if(!file)return;const fd=new FormData();fd.append('image',file,file.name);try{await api(`api/guides/${id}`,{method:'POST',body:fd});toast('Immagine caricata');input.value='';await renderPhotos()}catch(e){toast(e.message||'Errore caricamento')}};
  window.if917Remove=async function(id){try{await api(`api/guides/${id}`,{method:'DELETE'});toast('Immagine rimossa');await renderPhotos()}catch(e){toast(e.message||'Errore rimozione')}};
  window.if917Toggle=async function(id,enabled,input){input.disabled=true;try{await api(`api/exercise-enabled/${id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled})});enabledState[id]=enabled;toast(enabled?'Esercizio attivato':'Esercizio escluso');await renderExercises()}catch(e){input.checked=!enabled;toast(e.message||'Errore salvataggio')}finally{input.disabled=false}};

  const style=document.createElement('style');style.textContent=`
  #if917CompactMenu{margin-top:14px}.if917-menu-card{padding:16px}.if917-menu-item{width:100%;display:grid;grid-template-columns:52px 1fr auto;gap:12px;align-items:center;background:transparent;border:0;border-top:1px solid var(--ln);padding:15px 0;color:var(--tx);text-align:left}.if917-menu-item:first-of-type{margin-top:12px}.if917-menu-item span:nth-child(2){display:flex;flex-direction:column;gap:4px}.if917-menu-item small{color:var(--m);font-size:12px}.if917-menu-item strong{font-size:24px;color:var(--m)}.if917-icon{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;background:rgba(90,112,255,.18);font-size:22px}.if917-page-head{display:flex;align-items:center;gap:12px}.if917-page-head h1{margin:0}.if917-back-top{width:42px;height:42px;border-radius:12px;border:1px solid var(--ln);background:transparent;color:var(--tx);font-size:22px}.if917-page-sub{margin:10px 0 14px}.if917-controls{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;margin:10px 0}.if917-summary{color:var(--m);font-size:12px;margin:8px 0}.if917-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 0;border-bottom:1px solid var(--ln)}.if917-main{display:flex;flex-direction:column;gap:4px;min-width:0}.if917-main small{color:var(--m);font-size:12px}.if917-main em{font-size:11px;font-style:normal}.if917-main em.ok{color:var(--green2)}.if917-main em.bad{color:#ff6b6b}.if917-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.if917-actions .btn{width:auto;margin:0;padding:9px 11px}.if917-toggle-row.off{opacity:.62}.if917-check{display:flex;align-items:center;gap:8px}.if917-check input{position:absolute;opacity:0}.if917-check i{width:38px;height:22px;border-radius:999px;background:#252a31;border:1px solid var(--ln);position:relative}.if917-check i:after{content:'';position:absolute;width:16px;height:16px;left:2px;top:2px;border-radius:50%;background:#8b929b;transition:.18s}.if917-check input:checked+i{background:rgba(34,197,94,.22);border-color:rgba(34,197,94,.55)}.if917-check input:checked+i:after{left:18px;background:var(--green2)}.if917-check strong{font-size:12px;min-width:48px}@media(max-width:760px){.if917-controls{grid-template-columns:1fr}.if917-row{align-items:flex-start;flex-direction:column}.if917-actions{justify-content:flex-start;width:100%}.if917-toggle-row{flex-direction:row}.if917-menu-item{grid-template-columns:46px 1fr auto}}
  `;document.head.appendChild(style);

  function install(){removeLegacyManagement();installHomeMenu();ensurePage('photo-manager-0917','Gestione foto esercizi','Carica o gestisci le foto che illustrano correttamente l’esecuzione di ogni esercizio.','if917PhotoHost');ensurePage('exercise-manager-0917','Gestione esercizi','Seleziona gli esercizi che vuoi rendere disponibili negli allenamenti. Quelli esclusi restano nella libreria.','if917ExerciseHost')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,350));else setTimeout(install,350);
  setTimeout(install,900);
})();