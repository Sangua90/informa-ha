// InFormha 0.9.19 - apertura diretta e autonoma dei due sottomenu
(function(){
  const GROUP_ORDER=['Petto','Schiena','Spalle','Spalle posteriori','Tricipiti','Bicipiti','Bicipiti e avambracci','Gambe','Catena posteriore','Glutei','Polpacci','Core','Cardio'];
  let guides={guides:{}}, enabled={};
  const lib=()=>{try{return (typeof IF51_LIBRARY!=='undefined'&&IF51_LIBRARY)||{}}catch(e){return{}}};
  const entries=()=>Object.entries(lib()).map(([id,x])=>({id,name:x.name||id,group:x.group||'Altro',equipment:x.equipment||'—'}));
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const groups=()=>[...new Set(entries().map(x=>x.group))].sort((a,b)=>{const ia=GROUP_ORDER.indexOf(a),ib=GROUP_ORDER.indexOf(b);return (ia<0?999:ia)-(ib<0?999:ib)||a.localeCompare(b)});

  function showPage(name){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    const page=document.querySelector(`[data-page="${name}"]`);
    if(!page)return false;
    page.classList.add('active');
    document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.nav==='profile'));
    window.scrollTo({top:0,behavior:'auto'});
    return true;
  }
  function back(){if(typeof go==='function')go('connections');else showPage('connections')}

  function ensurePages(){
    const root=document.querySelector('.app'),nav=document.querySelector('.nav');if(!root)return;
    if(!document.querySelector('[data-page="photo-manager-0919"]')){
      const p=document.createElement('section');p.className='page';p.dataset.page='photo-manager-0919';
      p.innerHTML='<div class="if919-head"><button type="button" id="if919PhotoBack">←</button><div><div class="ey">Dati automatici</div><h1>Gestione foto esercizi</h1></div></div><div class="sub">Carica o gestisci le foto degli esercizi.</div><div id="if919PhotoHost"></div>';
      root.insertBefore(p,nav||null);
    }
    if(!document.querySelector('[data-page="exercise-manager-0919"]')){
      const p=document.createElement('section');p.className='page';p.dataset.page='exercise-manager-0919';
      p.innerHTML='<div class="if919-head"><button type="button" id="if919ExerciseBack">←</button><div><div class="ey">Dati automatici</div><h1>Gestione esercizi</h1></div></div><div class="sub">Attiva o escludi gli esercizi utilizzabili negli allenamenti.</div><div id="if919ExerciseHost"></div>';
      root.insertBefore(p,nav||null);
    }
    document.getElementById('if919PhotoBack')?.addEventListener('click',back);
    document.getElementById('if919ExerciseBack')?.addEventListener('click',back);
  }

  async function loadGuides(){try{guides=await api('api/guides')}catch(e){guides={guides:{}}}}
  async function loadEnabled(){try{const d=await api('api/exercise-enabled');enabled=d.exercises||{}}catch(e){enabled={}}}

  async function renderPhotos(){
    await loadGuides();const host=document.getElementById('if919PhotoHost');if(!host)return;
    host.innerHTML=`<div class="if919-controls"><input class="field" id="if919PhotoSearch" placeholder="Cerca esercizio, gruppo o attrezzatura…"><select class="field" id="if919PhotoGroup"><option value="">Tutti i gruppi</option>${groups().map(g=>`<option>${esc(g)}</option>`).join('')}</select><select class="field" id="if919PhotoState"><option value="">Tutte le foto</option><option value="missing">Solo senza foto</option><option value="present">Solo con foto</option></select></div><div id="if919PhotoRows"></div>`;
    const draw=()=>{const q=(document.getElementById('if919PhotoSearch')?.value||'').toLowerCase(),g=document.getElementById('if919PhotoGroup')?.value||'',s=document.getElementById('if919PhotoState')?.value||'';const rows=entries().map(x=>({...x,installed:!!guides.guides?.[x.id]?.installed})).filter(x=>(!q||`${x.name} ${x.group} ${x.equipment}`.toLowerCase().includes(q))&&(!g||x.group===g)&&(!s||(s==='missing'?!x.installed:x.installed)));document.getElementById('if919PhotoRows').innerHTML=rows.map(x=>`<div class="if919-row"><div><b>${esc(x.name)}</b><small>${esc(x.group)} · ${esc(x.equipment)}</small><em class="${x.installed?'ok':'bad'}">${x.installed?'Foto presente':'Foto mancante'}</em></div><span>${x.installed?`<button class="btn secondary" onclick="if74OpenImage('${x.id}')">Apri</button>`:''}<input hidden type="file" id="if919File_${x.id}" accept="image/jpeg,image/png,image/webp"><button class="btn secondary" type="button" data-upload="${x.id}">${x.installed?'Sostituisci':'Carica'}</button></span></div>`).join('')};draw();host.addEventListener('input',draw);host.addEventListener('change',draw);host.querySelectorAll('[data-upload]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.upload,input=document.getElementById(`if919File_${id}`);input.onchange=async()=>{const f=input.files?.[0];if(!f)return;const fd=new FormData();fd.append('image',f,f.name);try{await api(`api/guides/${id}`,{method:'POST',body:fd});toast('Immagine caricata');await renderPhotos()}catch(e){toast(e.message||'Errore caricamento')}};input.click()}));
  }

  async function renderExercises(){
    await loadEnabled();const host=document.getElementById('if919ExerciseHost');if(!host)return;
    host.innerHTML=`<div class="if919-controls"><input class="field" id="if919ExSearch" placeholder="Cerca esercizio, gruppo o attrezzatura…"><select class="field" id="if919ExGroup"><option value="">Tutti i gruppi</option>${groups().map(g=>`<option>${esc(g)}</option>`).join('')}</select><select class="field" id="if919ExState"><option value="">Tutti</option><option value="on">Solo attivi</option><option value="off">Solo esclusi</option></select></div><div id="if919ExRows"></div>`;
    const draw=()=>{const q=(document.getElementById('if919ExSearch')?.value||'').toLowerCase(),g=document.getElementById('if919ExGroup')?.value||'',s=document.getElementById('if919ExState')?.value||'';const rows=entries().map(x=>({...x,on:enabled[x.id]!==false})).filter(x=>(!q||`${x.name} ${x.group} ${x.equipment}`.toLowerCase().includes(q))&&(!g||x.group===g)&&(!s||(s==='on'?x.on:!x.on)));document.getElementById('if919ExRows').innerHTML=rows.map(x=>`<label class="if919-row"><div><b>${esc(x.name)}</b><small>${esc(x.group)} · ${esc(x.equipment)}</small></div><span><input type="checkbox" data-toggle="${x.id}" ${x.on?'checked':''}> ${x.on?'Attivo':'Escluso'}</span></label>`).join('');host.querySelectorAll('[data-toggle]').forEach(c=>c.addEventListener('change',async()=>{const id=c.dataset.toggle,on=c.checked;c.disabled=true;try{await api(`api/exercise-enabled/${id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:on})});enabled[id]=on;toast(on?'Esercizio attivato':'Esercizio escluso');draw()}catch(e){c.checked=!on;toast(e.message||'Errore salvataggio')}finally{c.disabled=false}}))};draw();host.addEventListener('input',draw);host.addEventListener('change',e=>{if(!e.target.matches('[data-toggle]'))draw()});
  }

  async function openPhotos(){ensurePages();if(showPage('photo-manager-0919'))await renderPhotos()}
  async function openExercises(){ensurePages();if(showPage('exercise-manager-0919'))await renderExercises()}

  function wireMenu(){
    ensurePages();const menu=document.getElementById('if918CompactMenu');if(!menu)return;
    const buttons=menu.querySelectorAll('.if918-menu-item');
    if(buttons[0]){buttons[0].removeAttribute('onclick');buttons[0].onclick=null;buttons[0].addEventListener('click',openPhotos,{once:false})}
    if(buttons[1]){buttons[1].removeAttribute('onclick');buttons[1].onclick=null;buttons[1].addEventListener('click',openExercises,{once:false})}
    menu.dataset.if919='wired';
  }

  const style=document.createElement('style');style.textContent=`.if919-head{display:flex;align-items:center;gap:12px}.if919-head button{width:42px;height:42px;border-radius:12px;border:1px solid var(--ln);background:transparent;color:var(--tx);font-size:22px}.if919-controls{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;margin:14px 0}.if919-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid var(--ln)}.if919-row>div{display:flex;flex-direction:column;gap:4px}.if919-row small{color:var(--m);font-size:12px}.if919-row em{font-size:11px;font-style:normal}.if919-row em.ok{color:var(--green2)}.if919-row em.bad{color:#ff6b6b}.if919-row>span{display:flex;gap:6px;align-items:center}.if919-row .btn{width:auto;margin:0;padding:9px 11px}@media(max-width:760px){.if919-controls{grid-template-columns:1fr}.if919-row{align-items:flex-start;flex-direction:column}}`;document.head.appendChild(style);
  const start=()=>{wireMenu();const o=new MutationObserver(wireMenu);const conn=document.querySelector('[data-page="connections"]');if(conn)o.observe(conn,{childList:true,subtree:true});setTimeout(wireMenu,600);setTimeout(wireMenu,1200)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,300));else setTimeout(start,300);
})();
