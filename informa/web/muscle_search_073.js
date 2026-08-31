// InFormha 0.7.3 - ricerca per muscolo/zona ed esercizio
(function(){
  const ALIASES={
    petto:['petto','pettorali','pettorale','chest'],
    schiena:['schiena','dorso','dorsali','dorsale','lat','gran dorsale'],
    bicipiti:['bicipiti','bicipite','braccio anteriore'],
    tricipiti:['tricipiti','tricipite','braccio posteriore'],
    spalle:['spalle','spalla','deltoidi','deltoide'],
    gambe:['gambe','gamba','quadricipiti','quadricipite','femorali','femorale','cosce','coscia'],
    glutei:['glutei','gluteo'],
    polpacci:['polpacci','polpaccio','calf'],
    core:['core','addome','addominali','plank'],
    cardio:['cardio','tapis roulant','treadmill','stepper'],
    posteriore:['catena posteriore','femorali','femorale','posteriori coscia']
  };
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()}
  function expanded(q){
    q=norm(q);if(!q)return [];
    const out=new Set([q]);
    Object.entries(ALIASES).forEach(([canonical,terms])=>{if(terms.some(t=>norm(t).includes(q)||q.includes(norm(t)))){out.add(canonical);terms.forEach(t=>out.add(norm(t)))}});
    return [...out];
  }
  function matches(id,x,q){
    const terms=expanded(q);if(!terms.length)return true;
    const hay=norm([id,x.name,x.group,x.equipment].filter(Boolean).join(' '));
    return terms.some(t=>hay.includes(t));
  }
  function resultHtml(q){
    let lib={};try{lib=IF51_LIBRARY||{}}catch(e){}
    const rows=Object.entries(lib).filter(([id,x])=>matches(id,x,q));
    if(!rows.length)return '<div class="card"><div class="sub">Nessun esercizio trovato per questa zona.</div></div>';
    return rows.map(([id,x])=>`<button class="if73-result" onclick="if(typeof if62OpenExercise==='function')if62OpenExercise('${id}')"><span><b>${x.name}</b><small>${x.group||''} · ${x.equipment||''}</small></span><span>›</span></button>`).join('');
  }
  window.if73Search=function(v){const box=document.getElementById('if73Results');if(box)box.innerHTML=resultHtml(v)};
  function installLibrarySearch(){
    const page=document.querySelector('[data-page="exercises-static"]');if(!page||document.getElementById('if73SearchBox'))return;
    const anchor=page.querySelector('.sub');
    const wrap=document.createElement('div');wrap.id='if73SearchBox';wrap.className='card if73-search';wrap.innerHTML=`<div class="ey">Trova esercizio</div><input class="field" placeholder="Scrivi un muscolo: es. dorsali, bicipiti, glutei…" oninput="if73Search(this.value)"><div id="if73Results" class="if73-results"></div>`;
    anchor?.insertAdjacentElement('afterend',wrap);if73Search('');
  }
  window.if60AddExercise=function(){
    let lib={};try{lib=IF51_LIBRARY||{}}catch(e){}
    const ids=Object.keys(lib).filter(id=>!IF50.plan.some(x=>x.id===id)&&!if60PainBlocks(id));
    const html=`<input id="if73AddSearch" class="field" placeholder="Muscolo o esercizio" oninput="if73FilterAdd(this.value)"><div id="if73AddList">${ids.map(id=>{const e=if60Library(id);const text=norm([id,e.name,e.group,e.equipment].join(' '));return `<button class="btn secondary if73-add" data-id="${id}" data-search="${text}" onclick="if60Append('${id}')">${e.name}<br><span class="sub">${e.group||''} · ${e.equipment||''}</span></button>`}).join('')}</div>`;
    if60Modal('Aggiungi esercizio',html);
  };
  window.if73FilterAdd=function(q){
    let lib={};try{lib=IF51_LIBRARY||{}}catch(e){}
    document.querySelectorAll('#if73AddList .if73-add').forEach(b=>{const id=b.dataset.id;const x=lib[id];b.style.display=matches(id,x,q)?'block':'none'});
  };
  const css=document.createElement('style');css.textContent=`
    .if73-search{position:relative}.if73-results{margin-top:10px;max-height:380px;overflow:auto}.if73-result{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;background:rgba(255,255,255,.025);border:0;border-bottom:1px solid var(--ln);color:var(--tx);padding:13px 4px;text-align:left}.if73-result:last-child{border-bottom:0}.if73-result span:first-child{display:flex;flex-direction:column;gap:3px}.if73-result small{color:var(--m);font-size:11px}
  `;document.head.appendChild(css);
  document.addEventListener('click',e=>{if(e.target.closest('[onclick*="exercises-static"]'))setTimeout(installLibrarySearch,80)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installLibrarySearch);else installLibrarySearch();
  setTimeout(installLibrarySearch,200);
})();