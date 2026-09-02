// InFormha 0.9.14 - gestione foto/guide per tutti i 36 esercizi
(function(){
  const GROUP_ORDER=['Petto','Schiena','Spalle','Spalle posteriori','Tricipiti','Bicipiti','Bicipiti e avambracci','Gambe','Catena posteriore','Glutei','Polpacci','Core','Cardio'];

  function lib(){
    try{return (typeof IF51_LIBRARY!=='undefined'&&IF51_LIBRARY)||{}}catch(e){return{}}
  }
  function equipmentCategory(x){
    const eq=String(x?.equipment||'').toLowerCase();
    if(eq.includes('fassi')&&!eq.includes('f 7.9')) return 'Fassi multigym';
    if(eq.includes('tapis')||eq.includes('f 7.9')) return 'Tapis roulant';
    if(eq.includes('stepper')) return 'Mini stepper';
    if(eq.includes('manub')||eq.includes('bilancier')||eq.includes('ez')) return 'Manubri / bilanciere';
    if(eq.includes('corpo libero')||eq.includes('panca')) return 'Corpo libero';
    return 'Altro';
  }
  function allEntries(){
    return Object.entries(lib()).map(([id,x])=>({id,name:x.name||id,group:x.group||'Altro',equipment:x.equipment||'—',equipmentCategory:equipmentCategory(x)}));
  }
  async function status(){try{return await api('api/guides')}catch(e){return {guides:{}}}}

  function ensureManagerShell(){
    const conn=document.querySelector('[data-page="connections"]');if(!conn)return null;
    document.getElementById('if74Manager')?.remove();
    let box=document.getElementById('if914Manager');
    if(!box){
      box=document.createElement('div');box.id='if914Manager';box.className='card';
      box.innerHTML=`
        <div class="ey">Guide / Foto esercizi</div>
        <h2>Libreria immagini completa</h2>
        <div class="sub">Tutti i 36 esercizi. Puoi cercare per nome, gruppo o attrezzatura, filtrare quelli senza immagine e caricare o sostituire direttamente il file.</div>
        <div class="if914-controls">
          <input class="field" id="if914Search" placeholder="Cerca nome, gruppo o attrezzatura…">
          <select class="field" id="if914Group"><option value="">Tutti i gruppi</option></select>
          <select class="field" id="if914Equipment"><option value="">Tutte le attrezzature</option><option>Fassi multigym</option><option>Manubri / bilanciere</option><option>Corpo libero</option><option>Tapis roulant</option><option>Mini stepper</option><option>Altro</option></select>
          <label class="if914-check"><input type="checkbox" id="if914Missing"> Solo senza immagine</label>
        </div>
        <div class="if914-summary" id="if914Summary"></div>
        <div id="if914Rows"></div>`;
      conn.appendChild(box);
      const groups=[...new Set(allEntries().map(x=>x.group))].sort((a,b)=>{
        const ia=GROUP_ORDER.indexOf(a),ib=GROUP_ORDER.indexOf(b);return (ia<0?999:ia)-(ib<0?999:ib)||a.localeCompare(b);
      });
      const sel=box.querySelector('#if914Group');groups.forEach(g=>{const o=document.createElement('option');o.value=g;o.textContent=g;sel.appendChild(o)});
      ['input','change'].forEach(ev=>box.addEventListener(ev,e=>{if(e.target.matches('#if914Search,#if914Group,#if914Equipment,#if914Missing'))renderRows()}));
    }
    return box;
  }

  async function renderRows(){
    const box=ensureManagerShell();if(!box)return;
    const d=await status();
    const q=(box.querySelector('#if914Search')?.value||'').trim().toLowerCase();
    const group=box.querySelector('#if914Group')?.value||'';
    const eq=box.querySelector('#if914Equipment')?.value||'';
    const missing=!!box.querySelector('#if914Missing')?.checked;
    let rows=allEntries().map(x=>({...x,installed:!!d.guides?.[x.id]?.installed,filename:d.guides?.[x.id]?.filename||null}));
    rows=rows.filter(x=>(!q||`${x.name} ${x.group} ${x.equipment}`.toLowerCase().includes(q))&&(!group||x.group===group)&&(!eq||x.equipmentCategory===eq)&&(!missing||!x.installed));
    rows.sort((a,b)=>{
      const ga=GROUP_ORDER.indexOf(a.group),gb=GROUP_ORDER.indexOf(b.group);
      return (ga<0?999:ga)-(gb<0?999:gb)||a.group.localeCompare(b.group)||a.name.localeCompare(b.name);
    });
    const total=allEntries().length,installed=Object.values(d.guides||{}).filter(x=>x?.installed).length;
    box.querySelector('#if914Summary').textContent=`${installed}/${total} immagini presenti · ${rows.length} esercizi visualizzati`;
    box.querySelector('#if914Rows').innerHTML=rows.map(x=>`
      <div class="if914-row" data-id="${x.id}">
        <div class="if914-info"><b>${x.name}</b><span>${x.group} · ${x.equipment}</span><small class="${x.installed?'ok':'missing'}">${x.installed?'✓ Immagine presente':'Immagine mancante'}</small></div>
        <div class="if914-actions">
          ${x.installed?`<button class="btn secondary" onclick="if74OpenImage('${x.id}')">Apri</button>`:''}
          <input type="file" id="if914File_${x.id}" accept="image/jpeg,image/png,image/webp" hidden onchange="if914Upload('${x.id}',this)">
          <button class="btn secondary" onclick="document.getElementById('if914File_${x.id}').click()">${x.installed?'Sostituisci':'Carica file'}</button>
          ${x.installed?`<button class="btn secondary if914-danger" onclick="if914Remove('${x.id}')">Rimuovi</button>`:''}
        </div>
      </div>`).join('')||'<div class="sub" style="padding:14px 0">Nessun esercizio corrisponde ai filtri.</div>';
  }

  window.if914Upload=async function(id,input){
    const file=input.files?.[0];if(!file)return;
    const fd=new FormData();fd.append('image',file,file.name);
    try{await api(`api/guides/${id}`,{method:'POST',body:fd});toast('Immagine caricata');input.value='';await renderRows()}catch(e){toast(e.message||'Errore caricamento')}
  };
  window.if914Remove=async function(id){
    try{await api(`api/guides/${id}`,{method:'DELETE'});toast('Immagine rimossa');await renderRows()}catch(e){toast(e.message||'Errore rimozione')}
  };

  const css=document.createElement('style');css.textContent=`
    .if914-controls{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;margin:14px 0}.if914-check{display:flex;align-items:center;gap:8px;color:var(--m);font-size:13px;font-weight:700}.if914-summary{font-size:12px;color:var(--m);margin-bottom:8px}.if914-row{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:14px 0;border-bottom:1px solid var(--ln)}.if914-row:last-child{border-bottom:0}.if914-info{display:flex;flex-direction:column;gap:4px;min-width:0}.if914-info>span{font-size:12px;color:var(--m)}.if914-info>small{font-size:11px}.if914-info>small.ok{color:var(--green2)}.if914-info>small.missing{color:var(--m)}.if914-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.if914-actions .btn{width:auto;margin:0;padding:9px 11px}.if914-danger{opacity:.78}@media(max-width:760px){.if914-controls{grid-template-columns:1fr}.if914-row{align-items:flex-start;flex-direction:column}.if914-actions{width:100%;justify-content:flex-start}}
  `;document.head.appendChild(css);

  document.addEventListener('click',e=>{if(e.target.closest('[onclick*="connections"]'))setTimeout(()=>{ensureManagerShell();renderRows()},100)});
  setTimeout(()=>{ensureManagerShell();renderRows()},350);
})();
