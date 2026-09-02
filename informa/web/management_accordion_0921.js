// InFormha 0.9.21 - gestione compatta con fisarmoniche native
(function(){
  const GROUP_ORDER=['Petto','Schiena','Spalle','Spalle posteriori','Tricipiti','Bicipiti','Bicipiti e avambracci','Gambe','Catena posteriore','Glutei','Polpacci','Core','Cardio'];
  let guideData={guides:{}};
  let enabledData={};

  function library(){try{return (typeof IF51_LIBRARY!=='undefined'&&IF51_LIBRARY)||{}}catch(e){return{}}}
  function entries(){return Object.entries(library()).map(([id,x])=>({id,name:x.name||id,group:x.group||'Altro',equipment:x.equipment||'—'}))}
  function groups(){return [...new Set(entries().map(x=>x.group))].sort((a,b)=>{const ia=GROUP_ORDER.indexOf(a),ib=GROUP_ORDER.indexOf(b);return (ia<0?999:ia)-(ib<0?999:ib)||a.localeCompare(b)})}
  function esc(v){const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML}
  async function loadGuides(){try{guideData=await api('api/guides')}catch(e){guideData={guides:{}}}}
  async function loadEnabled(){try{const d=await api('api/exercise-enabled');enabledData=d.exercises||{}}catch(e){enabledData={}}}

  function removeOldManagers(){
    ['if74Manager','if914Manager','if915Manager','if916CompactMenu','if917CompactMenu','if918CompactMenu','if920CompactMenu'].forEach(id=>document.getElementById(id)?.remove());
    ['photo-manager-0916','exercise-manager-0916','photo-manager-0917','exercise-manager-0917','photo-manager-0919','exercise-manager-0919','photo-manager-0920','exercise-manager-0920'].forEach(name=>document.querySelector(`[data-page="${name}"]`)?.remove());
  }

  function install(){
    removeOldManagers();
    const conn=document.querySelector('[data-page="connections"]');
    if(!conn||document.getElementById('if921Accordion'))return;
    const box=document.createElement('div');
    box.id='if921Accordion';
    box.className='card';
    box.innerHTML=`
      <div class="ey">Dati automatici</div>
      <h2>Gestione esercizi</h2>
      <div class="sub">Apri solo la sezione che ti serve. Le altre restano chiuse.</div>
      <details class="if921-section" id="if921Photos">
        <summary><span class="if921-icon">🖼️</span><span><b>Gestione foto esercizi</b><small>Carica, sostituisci o rimuovi le foto.</small></span><strong>›</strong></summary>
        <div class="if921-body" id="if921PhotoHost"></div>
      </details>
      <details class="if921-section" id="if921Exercises">
        <summary><span class="if921-icon">🏋️</span><span><b>Gestione esercizi</b><small>Attiva o escludi gli esercizi dagli allenamenti.</small></span><strong>›</strong></summary>
        <div class="if921-body" id="if921ExerciseHost"></div>
      </details>`;
    conn.appendChild(box);
    document.getElementById('if921Photos').addEventListener('toggle',e=>{if(e.target.open)renderPhotos()});
    document.getElementById('if921Exercises').addEventListener('toggle',e=>{if(e.target.open)renderExercises()});
  }

  function photoControls(){return `<div class="if921-controls"><input class="field" id="if921PhotoSearch" placeholder="Cerca esercizio, gruppo o attrezzatura…"><select class="field" id="if921PhotoGroup"><option value="">Tutti i gruppi</option>${groups().map(g=>`<option>${esc(g)}</option>`).join('')}</select><select class="field" id="if921PhotoState"><option value="">Tutte le foto</option><option value="missing">Solo senza foto</option><option value="present">Solo con foto</option></select></div><div class="if921-summary" id="if921PhotoSummary"></div><div id="if921PhotoRows"></div>`}

  async function renderPhotos(){
    const host=document.getElementById('if921PhotoHost');if(!host)return;
    await loadGuides();
    if(!host.dataset.ready){host.innerHTML=photoControls();host.dataset.ready='1'}
    const q=(document.getElementById('if921PhotoSearch')?.value||'').trim().toLowerCase();
    const group=document.getElementById('if921PhotoGroup')?.value||'';
    const state=document.getElementById('if921PhotoState')?.value||'';
    let rows=entries().map(x=>({...x,installed:!!guideData.guides?.[x.id]?.installed}));
    const total=rows.length,present=rows.filter(x=>x.installed).length;
    rows=rows.filter(x=>(!q||`${x.name} ${x.group} ${x.equipment}`.toLowerCase().includes(q))&&(!group||x.group===group)&&(!state||(state==='missing'?!x.installed:x.installed)));
    document.getElementById('if921PhotoSummary').textContent=`${present}/${total} foto presenti · ${rows.length} visualizzati`;
    document.getElementById('if921PhotoRows').innerHTML=rows.map(x=>`<div class="if921-row"><div class="if921-main"><b>${esc(x.name)}</b><small>${esc(x.group)} · ${esc(x.equipment)}</small><em class="${x.installed?'ok':'bad'}">${x.installed?'● Foto presente':'● Foto mancante'}</em></div><div class="if921-actions">${x.installed?`<button class="btn secondary" type="button" data-if921-view="${x.id}">Apri</button>`:''}<input type="file" hidden id="if921File_${x.id}" accept="image/jpeg,image/png,image/webp"><button class="btn secondary" type="button" data-if921-upload="${x.id}">${x.installed?'Sostituisci':'Carica'}</button>${x.installed?`<button class="btn secondary" type="button" data-if921-remove="${x.id}">Rimuovi</button>`:''}</div></div>`).join('');
  }

  async function renderExercises(){
    const host=document.getElementById('if921ExerciseHost');if(!host)return;
    await loadEnabled();
    if(!host.dataset.ready){host.innerHTML=`<div class="if921-controls"><input class="field" id="if921ExSearch" placeholder="Cerca esercizio, gruppo o attrezzatura…"><select class="field" id="if921ExGroup"><option value="">Tutti i gruppi</option>${groups().map(g=>`<option>${esc(g)}</option>`).join('')}</select><select class="field" id="if921ExState"><option value="">Tutti</option><option value="on">Solo attivi</option><option value="off">Solo esclusi</option></select></div><div class="if921-summary" id="if921ExSummary"></div><div id="if921ExRows"></div>`;host.dataset.ready='1'}
    const q=(document.getElementById('if921ExSearch')?.value||'').trim().toLowerCase();
    const group=document.getElementById('if921ExGroup')?.value||'';
    const state=document.getElementById('if921ExState')?.value||'';
    let rows=entries().map(x=>({...x,on:enabledData[x.id]!==false}));
    const total=rows.length,active=rows.filter(x=>x.on).length;
    rows=rows.filter(x=>(!q||`${x.name} ${x.group} ${x.equipment}`.toLowerCase().includes(q))&&(!group||x.group===group)&&(!state||(state==='on'?x.on:!x.on)));
    document.getElementById('if921ExSummary').textContent=`${active}/${total} esercizi attivi · ${total-active} esclusi`;
    document.getElementById('if921ExRows').innerHTML=rows.map(x=>`<label class="if921-row ${x.on?'':'off'}"><div class="if921-main"><b>${esc(x.name)}</b><small>${esc(x.group)} · ${esc(x.equipment)}</small></div><span class="if921-toggle"><input type="checkbox" data-if921-toggle="${x.id}" ${x.on?'checked':''}><strong>${x.on?'Attivo':'Escluso'}</strong></span></label>`).join('');
  }

  function openImage(id){
    let modal=document.getElementById('if921Modal');
    if(!modal){modal=document.createElement('div');modal.id='if921Modal';modal.innerHTML='<div class="if921-modal-bar"><button type="button" data-if921-close>✕ Chiudi</button></div><div class="if921-modal-stage"><img id="if921ModalImg"></div>';document.body.appendChild(modal)}
    document.getElementById('if921ModalImg').src=`guide-local/${id}?v=0921&t=${Date.now()}`;
    modal.classList.add('open');document.body.style.overflow='hidden';
  }
  function closeImage(){document.getElementById('if921Modal')?.classList.remove('open');document.body.style.overflow=''}

  document.addEventListener('input',e=>{if(e.target.matches('#if921PhotoSearch'))renderPhotos();if(e.target.matches('#if921ExSearch'))renderExercises()});
  document.addEventListener('change',async e=>{
    if(e.target.matches('#if921PhotoGroup,#if921PhotoState')){renderPhotos();return}
    if(e.target.matches('#if921ExGroup,#if921ExState')){renderExercises();return}
    const toggle=e.target.closest('[data-if921-toggle]');if(!toggle)return;
    const id=toggle.dataset.if921Toggle,on=toggle.checked;toggle.disabled=true;
    try{await api(`api/exercise-enabled/${id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:on})});enabledData[id]=on;toast(on?'Esercizio attivato':'Esercizio escluso');await renderExercises()}catch(err){toggle.checked=!on;toast(err.message||'Errore salvataggio')}finally{toggle.disabled=false}
  });
  document.addEventListener('click',async e=>{
    const upload=e.target.closest('[data-if921-upload]');
    if(upload){const id=upload.dataset.if921Upload,input=document.getElementById(`if921File_${id}`);if(!input)return;input.onchange=async()=>{const f=input.files?.[0];if(!f)return;const fd=new FormData();fd.append('image',f,f.name);try{await api(`api/guides/${id}`,{method:'POST',body:fd});toast('Immagine caricata');await renderPhotos()}catch(err){toast(err.message||'Errore caricamento')}};input.click();return}
    const remove=e.target.closest('[data-if921-remove]');
    if(remove){try{await api(`api/guides/${remove.dataset.if921Remove}`,{method:'DELETE'});toast('Immagine rimossa');await renderPhotos()}catch(err){toast(err.message||'Errore rimozione')}return}
    const view=e.target.closest('[data-if921-view]');if(view){openImage(view.dataset.if921View);return}
    if(e.target.closest('[data-if921-close]'))closeImage();
  });

  const style=document.createElement('style');style.textContent=`
    #if921Accordion{margin-top:14px;padding:16px}.if921-section{border-top:1px solid var(--ln)}.if921-section:first-of-type{margin-top:12px}.if921-section summary{list-style:none;display:grid;grid-template-columns:52px 1fr auto;gap:12px;align-items:center;padding:15px 0;cursor:pointer}.if921-section summary::-webkit-details-marker{display:none}.if921-section summary>span:nth-child(2){display:flex;flex-direction:column;gap:4px}.if921-section summary small{color:var(--m);font-size:12px}.if921-section summary>strong{font-size:24px;color:var(--m);transition:.15s}.if921-section[open] summary>strong{transform:rotate(90deg)}.if921-icon{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;background:rgba(90,112,255,.18);font-size:22px}.if921-body{padding:0 0 14px 0}.if921-controls{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;margin:4px 0 12px}.if921-summary{font-size:12px;color:var(--m);margin:8px 0}.if921-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid var(--ln)}.if921-row.off{opacity:.62}.if921-main{display:flex;flex-direction:column;gap:4px}.if921-main small{color:var(--m);font-size:12px}.if921-main em{font-size:11px;font-style:normal}.if921-main em.ok{color:var(--green2)}.if921-main em.bad{color:#ff6b6b}.if921-actions{display:flex;gap:6px;flex-wrap:wrap}.if921-actions .btn{width:auto;margin:0;padding:9px 11px}.if921-toggle{display:flex;align-items:center;gap:8px}#if921Modal{display:none;position:fixed;inset:0;background:#050607;z-index:30000}#if921Modal.open{display:block}.if921-modal-bar{padding:12px;background:#0d1014;border-bottom:1px solid var(--ln)}.if921-modal-bar button{background:#1a1f25;color:white;border:1px solid var(--ln);border-radius:12px;padding:10px 13px}.if921-modal-stage{height:calc(100vh - 62px);overflow:auto;text-align:center}.if921-modal-stage img{width:min(100%,1100px);height:auto}@media(max-width:760px){.if921-controls{grid-template-columns:1fr}.if921-row{align-items:flex-start;flex-direction:column}.if921-section summary{grid-template-columns:46px 1fr auto}}
  `;document.head.appendChild(style);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,250));else setTimeout(install,250);
  setTimeout(install,700);
})();
