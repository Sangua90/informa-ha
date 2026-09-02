// InFormha 0.9.20 - unico gestore UI per foto ed esercizi
(function(){
  const GROUP_ORDER=['Petto','Schiena','Spalle','Spalle posteriori','Tricipiti','Bicipiti','Bicipiti e avambracci','Gambe','Catena posteriore','Glutei','Polpacci','Core','Cardio'];
  let guideData={guides:{}};
  let enabledData={};

  function library(){try{return (typeof IF51_LIBRARY!=='undefined'&&IF51_LIBRARY)||{}}catch(e){return{}}}
  function entries(){return Object.entries(library()).map(([id,x])=>({id,name:x.name||id,group:x.group||'Altro',equipment:x.equipment||'—'}))}
  function esc(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
  function groups(){return [...new Set(entries().map(x=>x.group))].sort((a,b)=>{const ia=GROUP_ORDER.indexOf(a),ib=GROUP_ORDER.indexOf(b);return (ia<0?999:ia)-(ib<0?999:ib)||a.localeCompare(b)})}

  function cleanup(){
    ['if74Manager','if914Manager','if915Manager','if916CompactMenu','if917CompactMenu','if918CompactMenu'].forEach(id=>document.getElementById(id)?.remove());
    ['photo-manager-0916','exercise-manager-0916','photo-manager-0917','exercise-manager-0917','photo-manager-0919','exercise-manager-0919'].forEach(name=>document.querySelector(`[data-page="${name}"]`)?.remove());
  }

  function showPage(name){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    const page=document.querySelector(`[data-page="${name}"]`);
    if(!page)return;
    page.classList.add('active');
    document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.nav==='profile'));
    window.scrollTo({top:0,behavior:'auto'});
  }
  function backToConnections(){if(typeof go==='function')go('connections');else showPage('connections')}

  function ensurePages(){
    const root=document.querySelector('.app'),nav=document.querySelector('.nav');if(!root)return;
    if(!document.querySelector('[data-page="photo-manager-0920"]')){
      const p=document.createElement('section');p.className='page';p.dataset.page='photo-manager-0920';
      p.innerHTML=`<div class="if920-head"><button type="button" data-if920-back>←</button><div><div class="ey">Dati automatici</div><h1>Gestione foto esercizi</h1></div></div><div class="sub">Carica, sostituisci o rimuovi le foto degli esercizi.</div><div id="if920PhotoHost"></div>`;
      root.insertBefore(p,nav||null);
    }
    if(!document.querySelector('[data-page="exercise-manager-0920"]')){
      const p=document.createElement('section');p.className='page';p.dataset.page='exercise-manager-0920';
      p.innerHTML=`<div class="if920-head"><button type="button" data-if920-back>←</button><div><div class="ey">Dati automatici</div><h1>Gestione esercizi</h1></div></div><div class="sub">Attiva o escludi gli esercizi utilizzabili negli allenamenti.</div><div id="if920ExerciseHost"></div>`;
      root.insertBefore(p,nav||null);
    }
  }

  function ensureMenu(){
    cleanup();ensurePages();
    const conn=document.querySelector('[data-page="connections"]');if(!conn)return;
    let menu=document.getElementById('if920CompactMenu');
    if(!menu){
      menu=document.createElement('div');menu.id='if920CompactMenu';menu.className='card';
      menu.innerHTML=`<div class="ey">Dati automatici</div><h2>Gestione esercizi</h2><div class="sub">Gestisci foto e disponibilità degli esercizi utilizzati da InFormha.</div>
      <button type="button" class="if920-menu-item" data-if920-open="photos"><span class="if920-icon">🖼️</span><span><b>Gestione foto esercizi</b><small>Carica, sostituisci o rimuovi le foto degli esercizi.</small></span><strong>›</strong></button>
      <button type="button" class="if920-menu-item" data-if920-open="exercises"><span class="if920-icon">🏋️</span><span><b>Gestione esercizi</b><small>Attiva o escludi gli esercizi utilizzabili negli allenamenti.</small></span><strong>›</strong></button>`;
      conn.appendChild(menu);
    }
  }

  async function loadGuides(){try{guideData=await api('api/guides')}catch(e){guideData={guides:{}}}}
  async function loadEnabled(){try{const d=await api('api/exercise-enabled');enabledData=d.exercises||{}}catch(e){enabledData={}}}

  async function renderPhotos(){
    const host=document.getElementById('if920PhotoHost');if(!host)return;await loadGuides();
    host.innerHTML=`<div class="if920-controls"><input class="field" id="if920PhotoSearch" placeholder="Cerca esercizio, gruppo o attrezzatura…"><select class="field" id="if920PhotoGroup"><option value="">Tutti i gruppi</option>${groups().map(g=>`<option>${esc(g)}</option>`).join('')}</select><select class="field" id="if920PhotoState"><option value="">Tutte le foto</option><option value="missing">Solo senza foto</option><option value="present">Solo con foto</option></select></div><div class="if920-summary" id="if920PhotoSummary"></div><div id="if920PhotoRows"></div>`;
    const draw=()=>{
      const q=(document.getElementById('if920PhotoSearch')?.value||'').toLowerCase().trim(),g=document.getElementById('if920PhotoGroup')?.value||'',s=document.getElementById('if920PhotoState')?.value||'';
      let rows=entries().map(x=>({...x,installed:!!guideData.guides?.[x.id]?.installed}));const total=rows.length,present=rows.filter(x=>x.installed).length;
      rows=rows.filter(x=>(!q||`${x.name} ${x.group} ${x.equipment}`.toLowerCase().includes(q))&&(!g||x.group===g)&&(!s||(s==='missing'?!x.installed:x.installed)));
      document.getElementById('if920PhotoSummary').textContent=`${present}/${total} foto presenti · ${rows.length} visualizzati`;
      document.getElementById('if920PhotoRows').innerHTML=rows.map(x=>`<div class="if920-row"><div class="if920-main"><b>${esc(x.name)}</b><small>${esc(x.group)} · ${esc(x.equipment)}</small><em class="${x.installed?'ok':'bad'}">${x.installed?'● Foto presente':'● Foto mancante'}</em></div><div class="if920-actions">${x.installed?`<button class="btn secondary" type="button" data-if920-open-image="${x.id}">Apri</button>`:''}<input hidden type="file" id="if920File_${x.id}" accept="image/jpeg,image/png,image/webp"><button class="btn secondary" type="button" data-if920-upload="${x.id}">${x.installed?'Sostituisci':'Carica'}</button>${x.installed?`<button class="btn secondary" type="button" data-if920-remove="${x.id}">Rimuovi</button>`:''}</div></div>`).join('');
    };
    draw();host.addEventListener('input',draw);host.addEventListener('change',e=>{if(e.target.matches('#if920PhotoGroup,#if920PhotoState'))draw()},{once:false});
  }

  async function renderExercises(){
    const host=document.getElementById('if920ExerciseHost');if(!host)return;await loadEnabled();
    host.innerHTML=`<div class="if920-controls"><input class="field" id="if920ExSearch" placeholder="Cerca esercizio, gruppo o attrezzatura…"><select class="field" id="if920ExGroup"><option value="">Tutti i gruppi</option>${groups().map(g=>`<option>${esc(g)}</option>`).join('')}</select><select class="field" id="if920ExState"><option value="">Tutti</option><option value="on">Solo attivi</option><option value="off">Solo esclusi</option></select></div><div class="if920-summary" id="if920ExSummary"></div><div id="if920ExRows"></div>`;
    const draw=()=>{
      const q=(document.getElementById('if920ExSearch')?.value||'').toLowerCase().trim(),g=document.getElementById('if920ExGroup')?.value||'',s=document.getElementById('if920ExState')?.value||'';
      let rows=entries().map(x=>({...x,on:enabledData[x.id]!==false}));const total=rows.length,active=rows.filter(x=>x.on).length;
      rows=rows.filter(x=>(!q||`${x.name} ${x.group} ${x.equipment}`.toLowerCase().includes(q))&&(!g||x.group===g)&&(!s||(s==='on'?x.on:!x.on)));
      document.getElementById('if920ExSummary').textContent=`${active}/${total} esercizi attivi · ${total-active} esclusi`;
      document.getElementById('if920ExRows').innerHTML=rows.map(x=>`<label class="if920-row ${x.on?'':'off'}"><div class="if920-main"><b>${esc(x.name)}</b><small>${esc(x.group)} · ${esc(x.equipment)}</small></div><span class="if920-toggle"><input type="checkbox" data-if920-toggle="${x.id}" ${x.on?'checked':''}><strong>${x.on?'Attivo':'Escluso'}</strong></span></label>`).join('');
    };
    draw();host.addEventListener('input',draw);host.addEventListener('change',e=>{if(e.target.matches('#if920ExGroup,#if920ExState'))draw()},{once:false});
  }

  async function openPhotos(){ensureMenu();showPage('photo-manager-0920');await renderPhotos()}
  async function openExercises(){ensureMenu();showPage('exercise-manager-0920');await renderExercises()}

  document.addEventListener('click',async e=>{
    const open=e.target.closest('[data-if920-open]');
    if(open){e.preventDefault();e.stopPropagation();if(open.dataset.if920Open==='photos')await openPhotos();else await openExercises();return}
    if(e.target.closest('[data-if920-back]')){e.preventDefault();e.stopPropagation();backToConnections();return}
    const up=e.target.closest('[data-if920-upload]');
    if(up){const id=up.dataset.if920Upload,input=document.getElementById(`if920File_${id}`);if(!input)return;input.onchange=async()=>{const f=input.files?.[0];if(!f)return;const fd=new FormData();fd.append('image',f,f.name);try{await api(`api/guides/${id}`,{method:'POST',body:fd});toast('Immagine caricata');await renderPhotos()}catch(err){toast(err.message||'Errore caricamento')}};input.click();return}
    const rm=e.target.closest('[data-if920-remove]');
    if(rm){try{await api(`api/guides/${rm.dataset.if920Remove}`,{method:'DELETE'});toast('Immagine rimossa');await renderPhotos()}catch(err){toast(err.message||'Errore rimozione')}return}
    const img=e.target.closest('[data-if920-open-image]');if(img&&typeof if74OpenImage==='function'){if74OpenImage(img.dataset.if920OpenImage)}
  },true);

  document.addEventListener('change',async e=>{
    const c=e.target.closest('[data-if920-toggle]');if(!c)return;const id=c.dataset.if920Toggle,on=c.checked;c.disabled=true;
    try{await api(`api/exercise-enabled/${id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:on})});enabledData[id]=on;toast(on?'Esercizio attivato':'Esercizio escluso');await renderExercises()}catch(err){c.checked=!on;toast(err.message||'Errore salvataggio')}finally{c.disabled=false}
  },true);

  const style=document.createElement('style');style.textContent=`#if920CompactMenu{margin-top:14px;padding:16px}.if920-menu-item{width:100%;display:grid;grid-template-columns:52px 1fr auto;gap:12px;align-items:center;background:transparent;border:0;border-top:1px solid var(--ln);padding:15px 0;color:var(--tx);text-align:left;cursor:pointer}.if920-menu-item:first-of-type{margin-top:12px}.if920-menu-item span:nth-child(2){display:flex;flex-direction:column;gap:4px}.if920-menu-item small{color:var(--m);font-size:12px}.if920-menu-item strong{font-size:24px;color:var(--m)}.if920-icon{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;background:rgba(90,112,255,.18);font-size:22px}.if920-head{display:flex;align-items:center;gap:12px}.if920-head button{width:42px;height:42px;border-radius:12px;border:1px solid var(--ln);background:transparent;color:var(--tx);font-size:22px}.if920-controls{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;margin:14px 0}.if920-summary{font-size:12px;color:var(--m);margin:8px 0}.if920-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid var(--ln)}.if920-row.off{opacity:.62}.if920-main{display:flex;flex-direction:column;gap:4px}.if920-main small{color:var(--m);font-size:12px}.if920-main em{font-size:11px;font-style:normal}.if920-main em.ok{color:var(--green2)}.if920-main em.bad{color:#ff6b6b}.if920-actions{display:flex;gap:6px;flex-wrap:wrap}.if920-actions .btn{width:auto;margin:0;padding:9px 11px}.if920-toggle{display:flex;gap:8px;align-items:center}@media(max-width:760px){.if920-controls{grid-template-columns:1fr}.if920-row{align-items:flex-start;flex-direction:column}.if920-menu-item{grid-template-columns:46px 1fr auto}}`;document.head.appendChild(style);

  function start(){ensureMenu()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,250));else setTimeout(start,250);
  setTimeout(start,700);
})();
