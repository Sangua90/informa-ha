// InFormha 0.9.18 - forza una sola gestione compatta e rimuove i duplicati legacy
(function(){
  function cleanupLegacy(){
    ['if74Manager','if914Manager','if915Manager','if916CompactMenu'].forEach(id=>document.getElementById(id)?.remove());
    document.querySelector('[data-page="photo-manager-0916"]')?.remove();
    document.querySelector('[data-page="exercise-manager-0916"]')?.remove();
  }

  function ensureMenu(){
    cleanupLegacy();
    const conn=document.querySelector('[data-page="connections"]');
    if(!conn)return;
    let box=document.getElementById('if918CompactMenu');
    if(!box){
      document.getElementById('if917CompactMenu')?.remove();
      box=document.createElement('div');
      box.id='if918CompactMenu';
      box.className='card if918-menu-card';
      box.innerHTML=`
        <div class="ey">Dati automatici</div>
        <h2>Gestione esercizi</h2>
        <div class="sub">Gestisci foto e disponibilità degli esercizi utilizzati da InFormha.</div>
        <button class="if918-menu-item" type="button" onclick="if917OpenPhotos()">
          <span class="if918-icon">🖼️</span>
          <span><b>Gestione foto esercizi</b><small>Carica, sostituisci o rimuovi le foto degli esercizi.</small></span>
          <strong>›</strong>
        </button>
        <button class="if918-menu-item" type="button" onclick="if917OpenExercises()">
          <span class="if918-icon">🏋️</span>
          <span><b>Gestione esercizi</b><small>Attiva o escludi gli esercizi utilizzabili negli allenamenti.</small></span>
          <strong>›</strong>
        </button>`;
      conn.appendChild(box);
    }
  }

  const style=document.createElement('style');
  style.textContent=`
    #if917CompactMenu{display:none!important}
    #if918CompactMenu{margin-top:14px;padding:16px}
    .if918-menu-item{width:100%;display:grid;grid-template-columns:52px 1fr auto;gap:12px;align-items:center;background:transparent;border:0;border-top:1px solid var(--ln);padding:15px 0;color:var(--tx);text-align:left;cursor:pointer}
    .if918-menu-item:first-of-type{margin-top:12px}.if918-menu-item span:nth-child(2){display:flex;flex-direction:column;gap:4px}.if918-menu-item small{color:var(--m);font-size:12px}.if918-menu-item strong{font-size:24px;color:var(--m)}
    .if918-icon{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;background:rgba(90,112,255,.18);font-size:22px}
    @media(max-width:760px){.if918-menu-item{grid-template-columns:46px 1fr auto}}
  `;
  document.head.appendChild(style);

  let busy=false;
  function enforce(){
    if(busy)return;
    busy=true;
    try{ensureMenu()}finally{busy=false}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(enforce,250));else setTimeout(enforce,250);
  document.addEventListener('click',e=>{if(e.target.closest('[onclick*="connections"]'))setTimeout(enforce,120)});
  const observer=new MutationObserver(()=>setTimeout(enforce,0));
  const startObserver=()=>{const conn=document.querySelector('[data-page="connections"]');if(conn)observer.observe(conn,{childList:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(startObserver,500));else setTimeout(startObserver,500);
  setTimeout(enforce,700);
  setTimeout(enforce,1300);
})();
