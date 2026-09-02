// InFormha 0.9.16 - gestione compatta: menu foto ed esercizi in pagine dedicate
(function(){
  function appRoot(){return document.querySelector('.app')}

  function ensurePage(name,title,subtitle,id){
    let page=document.querySelector(`[data-page="${name}"]`);
    if(!page){
      page=document.createElement('section');
      page.className='page';
      page.dataset.page=name;
      page.innerHTML=`<div class="ey">Impostazioni</div><h1>${title}</h1><div class="sub" style="margin-bottom:14px">${subtitle}</div><div id="${id}"></div><button class="btn secondary if916-back" onclick="go('connections')">Indietro</button>`;
      const nav=document.querySelector('.nav');
      appRoot()?.insertBefore(page,nav||null);
    }
    return page;
  }

  function ensureCompactMenu(){
    const conn=document.querySelector('[data-page="connections"]');if(!conn)return;
    document.getElementById('if74Manager')?.remove();

    let menu=document.getElementById('if916CompactMenu');
    if(!menu){
      menu=document.createElement('div');
      menu.id='if916CompactMenu';
      menu.className='card';
      menu.innerHTML=`
        <div class="ey">Gestione occasionale</div>
        <div class="if916-menu-row" onclick="go('photo-manager-0916')">
          <span><b>🖼️ Gestione foto esercizi</b><small>Carica, sostituisci o rimuovi le immagini delle guide.</small></span><strong>›</strong>
        </div>
        <div class="if916-menu-row" onclick="go('exercise-manager-0916')">
          <span><b>🏋️ Gestione esercizi</b><small>Scegli quali esercizi possono essere usati negli allenamenti.</small></span><strong>›</strong>
        </div>`;
      conn.appendChild(menu);
    }

    // I gestori completi non devono restare nella pagina principale.
    ['if914Manager','if915Manager'].forEach(id=>{
      const el=document.getElementById(id);
      if(el&&el.parentElement===conn) moveManagers();
    });
  }

  function moveManagers(){
    const photoPage=ensurePage('photo-manager-0916','Gestione foto esercizi','Questa sezione serve solo quando devi aggiungere o aggiornare le immagini delle guide.','if916PhotoHost');
    const exercisePage=ensurePage('exercise-manager-0916','Gestione esercizi','Attiva o escludi gli esercizi che InFormha può utilizzare negli allenamenti.','if916ExerciseHost');
    const photoHost=photoPage.querySelector('#if916PhotoHost');
    const exerciseHost=exercisePage.querySelector('#if916ExerciseHost');

    const photo=document.getElementById('if914Manager');
    if(photo&&photoHost&&photo.parentElement!==photoHost){
      photo.style.display='block';
      photoHost.appendChild(photo);
    }
    const exercise=document.getElementById('if915Manager');
    if(exercise&&exerciseHost&&exercise.parentElement!==exerciseHost){
      exercise.style.display='block';
      exerciseHost.appendChild(exercise);
    }
    document.getElementById('if74Manager')?.remove();
  }

  function compact(){ensureCompactMenu();moveManagers()}

  const style=document.createElement('style');
  style.textContent=`
    #if916CompactMenu{padding:8px 16px}.if916-menu-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 2px;border-bottom:1px solid var(--ln);cursor:pointer}.if916-menu-row:last-child{border-bottom:0}.if916-menu-row>span{display:flex;flex-direction:column;gap:4px}.if916-menu-row small{color:var(--m);font-size:12px;font-weight:500}.if916-menu-row>strong{font-size:24px;color:var(--m)}
    [data-page="photo-manager-0916"] #if914Manager,[data-page="exercise-manager-0916"] #if915Manager{display:block!important;margin-bottom:14px}
    [data-page="photo-manager-0916"] #if914Manager,[data-page="exercise-manager-0916"] #if915Manager{box-shadow:none}
    .if916-back{margin-top:12px}
  `;
  document.head.appendChild(style);

  const observer=new MutationObserver(()=>compact());
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{compact();const conn=document.querySelector('[data-page="connections"]');if(conn)observer.observe(conn,{childList:true,subtree:false})});
  }else{
    compact();const conn=document.querySelector('[data-page="connections"]');if(conn)observer.observe(conn,{childList:true,subtree:false});
  }
  document.addEventListener('click',e=>{if(e.target.closest('[onclick*="connections"]'))setTimeout(compact,180)});
  setTimeout(compact,500);
})();
