// InFormha 0.6.6 - galleria esercizi con guide reali quando disponibili
(function(){
  const GUIDE_IDS={
    'Chest press alla macchina':'chest',
    'Lat machine al petto':'lat',
    'Push-down tricipiti con corda':'pushdown',
    'Curl bicipiti al cavo basso':'curl'
  };
  function enhance(){
    const page=document.querySelector('[data-page="exercises-static"]');if(!page)return;
    page.querySelectorAll('.measure').forEach(row=>{
      if(row.classList.contains('if66-ready'))return;row.classList.add('if66-ready');
      const name=(row.querySelector('span')?.textContent||'').trim();const gid=GUIDE_IDS[name];
      const info=document.createElement('div');info.className='if66-thumb';
      if(gid){
        info.innerHTML=`<img src="guide-local/${gid}?v=066" alt="${name}" onerror="this.parentElement.classList.add('missing');this.remove()"><span>Apri guida</span>`;
        info.onclick=()=>{if(typeof openGuide==='function')openGuide(gid)};
        row.style.cursor='pointer';row.onclick=info.onclick;
      }else{
        info.classList.add('missing');info.innerHTML='<span>Immagine da completare</span>';
      }
      row.appendChild(info);
    });
  }
  const css=document.createElement('style');css.textContent=`
    [data-page="exercises-static"] .measure.if66-ready{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px}.if66-thumb{width:92px;height:64px;border-radius:14px;overflow:hidden;border:1px solid var(--ln);background:#0a0d10;position:relative;display:grid;place-items:center}.if66-thumb img{width:100%;height:100%;object-fit:cover;display:block}.if66-thumb span{font-size:10px;color:white;background:rgba(0,0,0,.68);padding:4px 6px;border-radius:8px;position:absolute;bottom:5px;right:5px}.if66-thumb.missing{border-style:dashed}.if66-thumb.missing span{position:static;background:transparent;color:var(--m);text-align:center;padding:8px}
  `;document.head.appendChild(css);
  document.addEventListener('click',e=>{if(e.target.closest('[onclick*="exercises-static"]'))setTimeout(enhance,80)});
  setTimeout(enhance,200);
})();
