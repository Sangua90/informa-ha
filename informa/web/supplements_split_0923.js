// InFormha 0.9.23 - separa impostazioni integratori e promemoria quotidiano
(function(){
  const DAY_NAMES=['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
  let settingsCache=[];

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function fmtDose(x){if(x.dose==null||x.dose==='')return '';return `${x.dose} ${x.unit||''}`.trim()}
  function fmtDays(days){if(!Array.isArray(days)||days.length===7)return 'Tutti i giorni';return days.map(i=>DAY_NAMES[i]||'').filter(Boolean).join(' · ')}

  function ensureSettingsPage(){
    let page=document.querySelector('[data-page="supplement-settings-0923"]');
    if(page)return page;
    page=document.createElement('section');page.className='page';page.dataset.page='supplement-settings-0923';
    page.innerHTML='<div class="ey">Impostazioni</div><h1>Integratori</h1><div class="sub">Configura cosa prendi, dose, giorni e orario. La barra Integratori in basso resta solo per il promemoria quotidiano.</div><div id="if923SettingsHost"></div><button class="btn secondary" onclick="go(\'profile\')">Indietro</button>';
    const app=document.querySelector('.app'),nav=document.querySelector('.nav');if(app)app.insertBefore(page,nav||null);
    return page;
  }

  function wireProfileButton(){
    const profile=document.querySelector('[data-page="profile"]');if(!profile)return;
    const btn=[...profile.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='Integratori');
    if(!btn)return;
    btn.onclick=()=>{ensureSettingsPage();go('supplement-settings-0923');setTimeout(loadSettings,20)};
    btn.dataset.if923Settings='1';
  }

  function dayChecks(selected){
    const s=new Set(Array.isArray(selected)?selected:[0,1,2,3,4,5,6]);
    return DAY_NAMES.map((d,i)=>`<label class="if923-day ${s.has(i)?'on':''}"><input type="checkbox" value="${i}" ${s.has(i)?'checked':''}>${d}</label>`).join('');
  }

  function editForm(item){
    item=item||{};
    return `<div class="card if923-editor" id="if923Editor">
      <div class="ey">${item.id?'Modifica':'Nuovo integratore'}</div>
      <h2>${item.id?esc(item.name):'Impostazioni integratore'}</h2>
      <input type="hidden" id="if923Id" value="${item.id||''}">
      <input class="field" id="if923Name" placeholder="Nome integratore" value="${esc(item.name||'')}">
      <input class="field" id="if923Type" placeholder="Tipologia (es. vitamina, minerale, performance...)" value="${esc(item.type_text||'')}" style="margin-top:8px">
      <div class="grid2" style="margin-top:8px"><input class="field" id="if923Dose" placeholder="Dose" inputmode="decimal" value="${item.dose??''}"><input class="field" id="if923Unit" placeholder="Unità (g, mg, cps...)" value="${esc(item.unit||'')}"></div>
      <div class="ey" style="margin-top:14px">Giorni</div><div class="if923-days" id="if923Days">${dayChecks(item.days)}</div>
      <div class="grid2" style="margin-top:10px"><input class="field" id="if923Time" type="time" value="${esc(item.time_text||'')}"><label class="if923-active"><input type="checkbox" id="if923Active" ${item.active===0?'':'checked'}> Attivo</label></div>
      <input class="field" id="if923Notes" placeholder="Note (opzionale)" value="${esc(item.notes||'')}" style="margin-top:8px">
      <button class="btn" onclick="if923SaveSettings()">Salva</button><button class="btn secondary" onclick="if923CloseEditor()">Annulla</button>
    </div>`;
  }

  async function loadSettings(){
    ensureSettingsPage();const host=document.getElementById('if923SettingsHost');if(!host)return;
    try{const d=await api('api/supplements/settings-v2');settingsCache=d.items||[]}catch(e){settingsCache=[];toast(e.message||'Errore caricamento')}
    host.innerHTML=`<div class="card"><div class="row"><div style="flex:1"><div class="ey">Configurazione</div><h2>I tuoi integratori</h2></div><button class="btn" style="width:auto" onclick="if923NewSettings()">+ Aggiungi</button></div>${settingsCache.length?settingsCache.map(renderSettingRow).join(''):'<div class="sub">Nessun integratore configurato.</div>'}</div><div id="if923EditorHost"></div>`;
  }

  function renderSettingRow(x){
    const details=[x.type_text,fmtDose(x),fmtDays(x.days),x.time_text].filter(Boolean).join(' · ');
    return `<div class="if923-setting-row ${x.active?'':'off'}"><div><b>${esc(x.name)}</b><div class="sub">${esc(details||'Nessun dettaglio')}</div><small>${x.active?'Attivo':'Disattivato'}</small></div><div class="if923-actions"><button class="btn secondary" onclick="if923EditSettings(${x.id})">Modifica</button><button class="if923-trash" onclick="if923DeleteSettings(${x.id})">✕</button></div></div>`;
  }

  window.if923NewSettings=()=>{const h=document.getElementById('if923EditorHost');if(h){h.innerHTML=editForm({days:[0,1,2,3,4,5,6],active:1});h.scrollIntoView({behavior:'smooth',block:'start'})}};
  window.if923EditSettings=id=>{const x=settingsCache.find(s=>s.id===id);const h=document.getElementById('if923EditorHost');if(x&&h){h.innerHTML=editForm(x);h.scrollIntoView({behavior:'smooth',block:'start'})}};
  window.if923CloseEditor=()=>{const h=document.getElementById('if923EditorHost');if(h)h.innerHTML=''};
  window.if923SaveSettings=async()=>{
    const name=document.getElementById('if923Name')?.value.trim();if(!name){toast('Inserisci il nome');return}
    const days=[...document.querySelectorAll('#if923Days input:checked')].map(x=>Number(x.value));if(!days.length){toast('Seleziona almeno un giorno');return}
    const payload={id:Number(document.getElementById('if923Id')?.value)||null,name,type_text:document.getElementById('if923Type')?.value||null,dose:document.getElementById('if923Dose')?.value||null,unit:document.getElementById('if923Unit')?.value||null,days,time_text:document.getElementById('if923Time')?.value||null,notes:document.getElementById('if923Notes')?.value||null,active:!!document.getElementById('if923Active')?.checked};
    try{await api('api/supplements/settings-v2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});toast('Impostazioni salvate');await loadSettings()}catch(e){toast(e.message||'Errore salvataggio')}
  };
  window.if923DeleteSettings=async id=>{if(!confirm('Eliminare questo integratore e il suo storico?'))return;try{await api(`api/supplements/settings-v2/${id}`,{method:'DELETE'});toast('Integratore eliminato');await loadSettings()}catch(e){toast(e.message||'Errore eliminazione')}};

  function renderDailyItem(x){
    const meta=[x.type_text,fmtDose(x),x.time_text].filter(Boolean).join(' · ');
    return `<div class="if923-daily ${x.taken?'done':''}"><div class="if923-daily-icon">${x.taken?'✓':'●'}</div><div style="flex:1"><b>${esc(x.name)}</b><div class="sub">${esc(meta||'Previsto oggi')}</div>${x.notes?`<small>${esc(x.notes)}</small>`:''}</div><button class="btn ${x.taken?'secondary':''}" style="width:auto" onclick="if923ToggleTaken(${x.id},${x.taken?0:1})">${x.taken?'Preso':'Segna preso'}</button></div>`;
  }

  async function loadDaily(){
    const page=document.querySelector('[data-page="supplements"]');if(!page)return;
    let d={items:[],taken:0,total:0,remaining:0,complete:true};
    try{d=await api('api/supplements/today-v2')}catch(e){}
    page.innerHTML=`<div class="ey">Integratori</div><h1>Oggi</h1><div class="card"><div class="grid2"><div class="metric"><span>Presi</span><b>${d.taken||0}/${d.total||0}</b></div><div class="metric"><span>Da prendere</span><b>${d.remaining||0}</b></div></div></div><div class="card"><div class="ey">Promemoria di oggi</div>${(d.items||[]).length?(d.items||[]).map(renderDailyItem).join(''):'<div class="sub">Nessun integratore previsto oggi.</div>'}</div>${d.complete&&d.total?'<div class="card coach"><div class="ey">Completato</div><div class="sub">Hai segnato tutti gli integratori previsti per oggi.</div></div>':''}`;
  }

  window.if923ToggleTaken=async(id,taken)=>{try{await api(`api/supplements/${id}/taken`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({taken:!!taken})});await loadDaily()}catch(e){toast(e.message||'Errore salvataggio')}};

  const oldGo=window.go;
  if(oldGo)window.go=function(page){const r=oldGo.apply(this,arguments);if(page==='supplements')setTimeout(loadDaily,25);if(page==='profile')setTimeout(wireProfileButton,25);if(page==='supplement-settings-0923')setTimeout(loadSettings,25);return r};

  const css=document.createElement('style');css.textContent=`.if923-setting-row,.if923-daily{display:flex;align-items:center;gap:10px;padding:13px 0;border-bottom:1px solid var(--ln)}.if923-setting-row:last-child,.if923-daily:last-child{border-bottom:0}.if923-setting-row.off{opacity:.55}.if923-setting-row>div:first-child,.if923-daily>div:nth-child(2){display:flex;flex-direction:column;gap:4px;flex:1}.if923-setting-row small,.if923-daily small{color:var(--m);font-size:11px}.if923-actions{display:flex;align-items:center;gap:6px}.if923-actions .btn{width:auto;margin:0;padding:9px 11px}.if923-trash{border:0;background:transparent;color:#999;font-size:18px;padding:8px}.if923-days{display:flex;gap:6px;flex-wrap:wrap}.if923-day{border:1px solid var(--ln);border-radius:999px;padding:8px 10px;color:var(--m);font-size:12px}.if923-day:has(input:checked){border-color:var(--green2);color:var(--tx);background:rgba(34,197,94,.12)}.if923-day input{display:none}.if923-active{display:flex;align-items:center;gap:8px;padding:0 10px;color:var(--tx)}.if923-daily.done{opacity:.65}.if923-daily-icon{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(90,112,255,.16);font-weight:900}.if923-daily.done .if923-daily-icon{background:rgba(34,197,94,.16);color:var(--green2)}@media(max-width:650px){.if923-setting-row{align-items:flex-start;flex-direction:column}.if923-actions{width:100%}.if923-daily{align-items:flex-start;flex-wrap:wrap}.if923-daily .btn{margin-left:44px}}`;document.head.appendChild(css);

  ensureSettingsPage();wireProfileButton();setInterval(wireProfileButton,1200);
  if(location.hash==='#supplements')setTimeout(loadDaily,100);
})();
