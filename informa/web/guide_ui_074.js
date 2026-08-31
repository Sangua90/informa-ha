// InFormha 0.7.4 - gestione guide estesa a tutta la libreria
(function(){
 const labels={
  chest:'Chest press alla macchina',lat:'Lat machine al petto',pushdown:'Push-down tricipiti con corda',curl:'Curl bicipiti al cavo basso',
  seated_row:'Rematore al cavo basso',pec_fly:'Aperture / pec deck alla macchina',shoulder_press:'Shoulder press',lateral_raise:'Alzate laterali',
  goblet_squat:'Goblet squat a box/panca',romanian_deadlift:'Stacco rumeno con manubri',glute_bridge:'Ponte glutei su panca',calf_raise:'Calf raise in piedi',
  face_pull:'Face pull con corda',plank:'Plank',treadmill:'Tapis roulant Fassi',stepper:'Mini stepper'
 };
 async function status(){try{return await api('api/guides')}catch(e){return {guides:{}}}}
 window.if74OpenImage=function(id){
  let m=document.getElementById('if74Zoom');
  if(!m){m=document.createElement('div');m.id='if74Zoom';m.innerHTML='<div class="if74bar"><button onclick="if74CloseImage()">✕ Chiudi</button><span id="if74Title"></span></div><div class="if74stage"><img id="if74Img"></div>';document.body.appendChild(m)}
  document.getElementById('if74Title').textContent=labels[id]||id;document.getElementById('if74Img').src=`guide-local/${id}?v=074&t=${Date.now()}`;m.classList.add('open');document.body.style.overflow='hidden';
 };
 window.if74CloseImage=function(){document.getElementById('if74Zoom')?.classList.remove('open');document.body.style.overflow=''};
 async function enhanceLibrary(){
  const page=document.querySelector('[data-page="exercises-static"]');if(!page)return;const d=await status();
  page.querySelectorAll('.measure').forEach(row=>{
   const name=(row.querySelector('span')?.textContent||'').trim();const id=Object.keys(labels).find(k=>labels[k]===name);if(!id)return;
   const installed=!!d.guides?.[id]?.installed;let thumb=row.querySelector('.if74-thumb');if(!thumb){thumb=document.createElement('button');thumb.className='if74-thumb';row.appendChild(thumb)}
   if(installed){thumb.innerHTML=`<img src="guide-local/${id}?v=074" alt="${name}"><span>Apri</span>`;thumb.onclick=e=>{e.stopPropagation();if74OpenImage(id)}}
   else{thumb.classList.add('missing');thumb.innerHTML='<span>Immagine non ancora disponibile</span>';thumb.onclick=null}
  });
 }
 async function installManager(){
  const conn=document.querySelector('[data-page="connections"]');if(!conn||document.getElementById('if74Manager'))return;const d=await status();
  const box=document.createElement('div');box.id='if74Manager';box.className='card';box.innerHTML=`<div class="ey">Guide esercizi</div><h2>Libreria immagini</h2><div class="sub">Supporto immagini esteso a tutti gli esercizi. Le immagini caricate restano persistenti dopo gli aggiornamenti.</div>${Object.entries(labels).map(([id,name])=>{const g=d.guides?.[id];return `<div class="if74-manager-row"><div><b>${name}</b><div class="mini">${g?.installed?'✓ immagine presente':'immagine non ancora disponibile'}</div></div>${g?.installed?`<button class="btn secondary" onclick="if74OpenImage('${id}')">Apri</button>`:''}</div>`}).join('')}`;
  conn.appendChild(box);
 }
 const st=document.createElement('style');st.textContent=`
 .if74-thumb{width:104px;min-height:72px;border:1px solid var(--ln);border-radius:16px;background:#0b0e12;color:white;overflow:hidden;position:relative;padding:0}.if74-thumb img{width:100%;height:72px;object-fit:cover;display:block}.if74-thumb>span{font-size:10px;padding:5px 7px}.if74-thumb:not(.missing)>span{position:absolute;right:5px;bottom:5px;border-radius:8px;background:rgba(0,0,0,.72)}.if74-thumb.missing{border-style:dashed;color:var(--m)}
 #if74Zoom{display:none;position:fixed;inset:0;background:#050607;z-index:20000}.if74bar{display:flex;align-items:center;gap:12px;padding:12px;background:#0d1014;border-bottom:1px solid var(--ln)}.if74bar button{background:#1a1f25;color:white;border:1px solid var(--ln);border-radius:12px;padding:10px 13px}.if74bar span{font-weight:800}.if74stage{height:calc(100vh - 62px);overflow:auto;display:flex;justify-content:center;align-items:flex-start}.if74stage img{max-width:none;width:min(100%,1100px);height:auto;display:block}.if74-manager-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--ln)}.if74-manager-row:last-child{border-bottom:0}.if74-manager-row .btn{width:auto;margin:0;padding:10px 14px}
 `;document.head.appendChild(st);
 document.addEventListener('click',e=>{if(e.target.closest('[onclick*="exercises-static"]'))setTimeout(enhanceLibrary,120);if(e.target.closest('[onclick*="connections"]'))setTimeout(installManager,120)});
 setTimeout(()=>{enhanceLibrary();installManager()},250);
})();
