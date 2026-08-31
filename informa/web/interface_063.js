// InFormha 0.6.3 - menu Esercizi garantito e libreria indipendente
(function(){
  const LIB=[
    ['Petto','Chest press alla macchina','Fassi','3 × 10','120 sec','chest'],
    ['Petto','Aperture / pec deck alla macchina','Fassi','3 × 12','90 sec',null],
    ['Schiena','Lat machine al petto','Fassi + barra larga','3 × 10','120 sec','lat'],
    ['Schiena','Rematore al cavo basso','Fassi + triangolo','3 × 10','120 sec',null],
    ['Spalle','Shoulder press','Manubri + panca','3 × 10','120 sec',null],
    ['Spalle','Alzate laterali','Manubri','3 × 12','75 sec',null],
    ['Spalle posteriori','Face pull con corda','Fassi + corda','3 × 12','75 sec',null],
    ['Tricipiti','Push-down tricipiti con corda','Fassi + corda','3 × 12','75 sec','pushdown'],
    ['Bicipiti','Curl bicipiti al cavo basso','Fassi + barra corta','3 × 12','75 sec','curl'],
    ['Gambe','Goblet squat a box/panca','Manubrio + panca','3 × 10','120 sec',null],
    ['Catena posteriore','Stacco rumeno con manubri','Manubri','3 × 10','120 sec',null],
    ['Glutei','Ponte glutei su panca','Panca','3 × 12','90 sec',null],
    ['Polpacci','Calf raise in piedi','Corpo libero / manubri','3 × 15','60 sec',null],
    ['Core','Plank','Corpo libero','3 × 30 sec','60 sec',null],
    ['Cardio','Tapis roulant Fassi','Fassi F 7.9 HRC','20 min','—',null],
    ['Cardio','Mini stepper','Mini stepper','10 min','—',null]
  ];

  function ensurePage(){
    let page=document.querySelector('[data-page="exercise-library-063"]');
    if(!page){
      page=document.createElement('section');page.className='page';page.dataset.page='exercise-library-063';
      const app=document.querySelector('.app'); if(app) app.appendChild(page);
    }
    const groups={};LIB.forEach(x=>(groups[x[0]]||(groups[x[0]]=[])).push(x));
    page.innerHTML=`<div class="ey">Altro</div><h1>Esercizi</h1><div class="sub" style="margin-bottom:14px">Libreria completa degli esercizi disponibili in InFormha.</div>`+
      Object.entries(groups).map(([g,items])=>`<div class="card"><div class="ey">${g}</div>${items.map((x,i)=>`<button class="exercise-library-item" onclick="if63Detail('${g}',${LIB.indexOf(x)})"><span><b>${x[1]}</b><small>${x[2]}</small></span><span>›</span></button>`).join('')}</div>`).join('')+
      `<button class="btn secondary" onclick="go('profile')">Indietro</button>`;
  }

  window.if63Detail=function(group,index){
    const x=LIB[index]; if(!x)return;
    let page=document.querySelector('[data-page="exercise-detail-063"]');
    if(!page){page=document.createElement('section');page.className='page';page.dataset.page='exercise-detail-063';document.querySelector('.app')?.appendChild(page)}
    const image=x[5]?`<div class="card"><img src="guide-local/${x[5]}?v=063" alt="${x[1]}" style="width:100%;border-radius:18px;display:block" onerror="this.parentElement.style.display='none'"></div>`:'';
    page.innerHTML=`<div class="ey">Esercizi · ${x[0]}</div><h1>${x[1]}</h1>${image}<div class="card"><div class="measure"><span>Gruppo</span><b>${x[0]}</b></div><div class="measure"><span>Attrezzatura</span><b>${x[2]}</b></div><div class="measure"><span>Serie / tempo</span><b>${x[3]}</b></div><div class="measure"><span>Recupero</span><b>${x[4]}</b></div></div>${x[5]?`<button class="btn" onclick="openGuide('${x[5]}')">Apri guida esercizio</button>`:''}<button class="btn secondary" onclick="go('exercise-library-063')">Torna agli esercizi</button>`;
    go('exercise-detail-063');
  };

  function ensureButton(){
    const profile=document.querySelector('[data-page="profile"]'); if(!profile)return;
    let btn=document.getElementById('if63ExercisesButton');
    if(!btn){
      btn=document.createElement('button');btn.id='if63ExercisesButton';btn.className='btn';btn.textContent='🏋️ Esercizi';btn.onclick=()=>go('exercise-library-063');
      const firstCard=profile.querySelector('.card');
      if(firstCard) firstCard.insertBefore(btn,firstCard.firstChild); else profile.appendChild(btn);
    }
  }

  const style=document.createElement('style');style.textContent='.exercise-library-item{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;background:transparent;border:0;border-bottom:1px solid var(--ln);color:var(--tx);padding:14px 2px;text-align:left;font-size:15px}.exercise-library-item:last-child{border-bottom:0}.exercise-library-item span:first-child{display:flex;flex-direction:column;gap:4px}.exercise-library-item small{color:var(--m);font-size:12px;font-weight:500}';document.head.appendChild(style);
  ensurePage();ensureButton();
  setInterval(ensureButton,1000);
})();
