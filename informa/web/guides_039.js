// InFormha 0.3.9 - guide vettoriali HD con overlay e zoom
const GUIDE_IMAGES_039={
  chest:'guide-hd/chest.svg',
  lat:'guide-hd/lat.svg',
  pushdown:'guide-hd/pushdown.svg',
  curl:'guide-hd/curl.svg'
};
function visualBlock(id){
  const src=GUIDE_IMAGES_039[id];
  if(!src)return'';
  return `<div class="guide-photo-wrap"><img class="guide-photo guide-hd" src="${src}" alt="Guida visuale ${GUIDES[id]?.title||id}" loading="eager"><div class="guide-photo-actions"><button class="btn secondary" type="button" onclick="openGuideZoom('${id}')">Apri guida grande</button></div><div class="guide-photo-note">Versione HD vettoriale · zoom senza perdita di qualità</div></div>`;
}
function openGuideZoom(id){
  const src=GUIDE_IMAGES_039[id]; if(!src)return;
  let modal=document.getElementById('guideZoomModal');
  if(!modal){
    modal=document.createElement('div'); modal.id='guideZoomModal'; modal.className='guide-zoom-modal';
    modal.innerHTML=`<div class="guide-zoom-toolbar"><button type="button" onclick="closeGuideZoom()">✕ Chiudi</button><button type="button" onclick="guideZoom(-0.25)">−</button><span id="guideZoomValue">100%</span><button type="button" onclick="guideZoom(0.25)">+</button></div><div class="guide-zoom-stage"><img id="guideZoomImage" alt="Guida esercizio"></div>`;
    document.body.appendChild(modal);
  }
  const img=document.getElementById('guideZoomImage'); img.src=src; img.dataset.scale='1'; img.style.width='100%';
  document.getElementById('guideZoomValue').textContent='100%'; modal.classList.add('open'); document.body.style.overflow='hidden';
}
function closeGuideZoom(){const m=document.getElementById('guideZoomModal');if(m)m.classList.remove('open');document.body.style.overflow=''}
function guideZoom(delta){const img=document.getElementById('guideZoomImage');if(!img)return;let s=parseFloat(img.dataset.scale||'1')+delta;s=Math.max(.75,Math.min(3,s));img.dataset.scale=String(s);img.style.width=(s*100)+'%';document.getElementById('guideZoomValue').textContent=Math.round(s*100)+'%'}
(function(){const style=document.createElement('style');style.textContent=`.guide-photo.guide-hd{background:#090b0e;max-height:none}.guide-photo-actions{margin-top:10px}.guide-zoom-modal{display:none;position:fixed;inset:0;z-index:10000;background:#000;overflow:hidden}.guide-zoom-modal.open{display:flex;flex-direction:column}.guide-zoom-toolbar{height:58px;flex:0 0 58px;display:flex;align-items:center;gap:10px;padding:8px 12px;background:#0b0d10;border-bottom:1px solid #2b3138}.guide-zoom-toolbar button{background:#1a1f25;color:#fff;border:1px solid #3a424b;border-radius:12px;padding:9px 13px;font-weight:700}.guide-zoom-toolbar span{margin-left:auto;color:#79d63b;font-weight:700}.guide-zoom-stage{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;display:flex;align-items:flex-start;justify-content:center}.guide-zoom-stage img{display:block;height:auto;max-width:none;transition:width .12s ease}`;document.head.appendChild(style);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeGuideZoom()})})();
