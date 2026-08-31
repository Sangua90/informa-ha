// InFormha 0.6.2 - libreria Esercizi visibile in Altro
(function(){
  function getLibrary(){
    try{return (typeof IF51_LIBRARY!=='undefined'&&IF51_LIBRARY)||{}}catch(e){return{}}
  }

  function removeTutorialUI(){
    document.querySelectorAll('.card,.hero,section,button').forEach(el=>{
      const t=(el.textContent||'').trim().toLowerCase();
      if(!t.includes('tutorial')) return;
      if(el.matches('button')){ el.remove(); return; }
      if(el.classList.contains('card')||el.classList.contains('hero')) el.remove();
    });
    document.querySelectorAll('[data-page]').forEach(p=>{
      const title=(p.querySelector('h1,h2,.ey')?.textContent||'').toLowerCase();
      if(title.includes('tutorial')) p.remove();
    });
  }

  function exerciseList(){
    const lib=getLibrary();
    const entries=Object.entries(lib);
    const groups={};
    entries.forEach(([id,x])=>{const g=x.group||'Altro';(groups[g]||(groups[g]=[])).push([id,x])});
    return Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0])).map(([group,items])=>`
      <div class="card exercise-library-group">
        <div class="ey">${group}</div>
        ${items.map(([id,x])=>`<button class="exercise-library-item" onclick="if62OpenExercise('${id}')"><span><b>${x.name}</b><small>${x.equipment||''}</small></span><span>›</span></button>`).join('')}
      </div>`).join('');
  }

  window.if62OpenExercise=function(id){
    const x=getLibrary()[id]; if(!x)return;
    let page=document.querySelector('[data-page="exercise-detail"]');
    if(!page){
      page=document.createElement('section'); page.className='page'; page.dataset.page='exercise-detail';
      document.querySelector('.app')?.insertBefore(page,document.querySelector('.nav'));
    }
    const guide=!!x.guide;
    const image=guide?`<div class="card"><img src="guide-local/${x.guide}?t=${Date.now()}" alt="${x.name}" style="width:100%;border-radius:18px;display:block" onerror="this.parentElement.style.display='none'"></div>`:'';
    page.innerHTML=`<div class="ey">Libreria esercizi</div><h1>${x.name}</h1>${image}
      <div class="card"><div class="measure"><span>Gruppo</span><b>${x.group||'—'}</b></div><div class="measure"><span>Attrezzatura</span><b>${x.equipment||'—'}</b></div><div class="measure"><span>Serie base</span><b>${x.sets||'—'}</b></div><div class="measure"><span>Ripetizioni base</span><b>${x.cardio?(x.duration||'—')+' min':(x.reps||'—')}</b></div><div class="measure"><span>Recupero</span><b>${x.rest?x.rest+' sec':'—'}</b></div></div>
      ${guide&&typeof openGuide==='function'?`<button class="btn" onclick="openGuide('${x.guide}')">Apri guida esercizio</button>`:''}
      <button class="btn secondary" onclick="go('exercises')">Torna agli esercizi</button>`;
    go('exercise-detail');
  };

  function installExercisesPage(){
    let page=document.querySelector('[data-page="exercises"]');
    if(!page){
      page=document.createElement('section');page.className='page';page.dataset.page='exercises';
      document.querySelector('.app')?.insertBefore(page,document.querySelector('.nav'));
    }
    page.innerHTML=`<div class="ey">Altro</div><h1>Esercizi</h1><div class="sub" style="margin-bottom:14px">Tutti gli esercizi disponibili in InFormha, divisi per gruppo muscolare.</div>${exerciseList()}<button class="btn secondary" onclick="go('profile')">Indietro</button>`;

    const profile=document.querySelector('[data-page="profile"]');
    if(profile&&!document.getElementById('if62ExercisesButton')){
      const firstCard=profile.querySelector('.card');
      const b=document.createElement('button');b.id='if62ExercisesButton';b.className='btn secondary';b.textContent='🏋️ Esercizi';b.onclick=()=>go('exercises');
      if(firstCard)firstCard.insertBefore(b,firstCard.firstChild);else profile.appendChild(b);
    }
  }

  const style=document.createElement('style');style.textContent=`
    .exercise-library-item{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;background:transparent;border:0;border-bottom:1px solid var(--ln);color:var(--tx);padding:14px 2px;text-align:left;font-size:15px}
    .exercise-library-item:last-child{border-bottom:0}.exercise-library-item span:first-child{display:flex;flex-direction:column;gap:4px}.exercise-library-item small{color:var(--m);font-size:12px;font-weight:500}
  `;document.head.appendChild(style);
  removeTutorialUI();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installExercisesPage);else installExercisesPage();
  setTimeout(installExercisesPage,100);
})();
