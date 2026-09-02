// InFormha 0.9.10 - menu Esercizi visibile con libreria completa a 36
(function(){
  const LIB=[
    ['Petto','Chest press alla macchina','Fassi · bracci chest press integrati','3 × 10','120 sec','chest'],
    ['Petto','Aperture / pec deck alla macchina','Fassi · bracci pec-fly integrati','3 × 12','90 sec','pec_fly'],
    ['Schiena','Lat machine al petto','Fassi · carrucola alta frontale + barra lat','3 × 10','120 sec','lat'],
    ['Schiena','Lat machine presa stretta','Fassi · carrucola alta frontale + presa stretta','3 × 10','105 sec','lat_close'],
    ['Schiena','Lat machine presa inversa','Fassi · carrucola alta frontale + barra lat','3 × 10','105 sec','lat_reverse'],
    ['Schiena','Pull-down a braccia tese','Fassi · carrucola alta frontale + barra','3 × 12','75 sec','straight_arm_pulldown'],
    ['Schiena','Rematore al cavo basso','Fassi · carrucola bassa frontale + triangolo','3 × 10','120 sec','seated_row'],
    ['Schiena','Rematore monobraccio al cavo basso','Fassi · carrucola bassa frontale + maniglia singola','3 × 10','90 sec','row_one_arm'],
    ['Schiena','Rematore al cavo medio','Fassi · carrucola media frontale + maniglia','3 × 10','90 sec','row_mid'],
    ['Spalle','Shoulder press','Manubri + panca','3 × 10','120 sec','shoulder_press'],
    ['Spalle','Alzate laterali','Manubri','3 × 12','75 sec','lateral_raise'],
    ['Spalle posteriori','Face pull con corda','Fassi · carrucola media frontale + corda','3 × 12','75 sec','face_pull'],
    ['Spalle','Tirata al mento al cavo basso','Fassi · carrucola bassa frontale + barra corta','3 × 12','75 sec','upright_row'],
    ['Spalle','Alzata frontale al cavo basso','Fassi · carrucola bassa frontale + barra corta','3 × 12','75 sec','front_raise_cable'],
    ['Tricipiti','Push-down tricipiti con corda','Fassi · carrucola alta frontale + corda','3 × 12','75 sec','pushdown'],
    ['Tricipiti','Push-down tricipiti con barra','Fassi · carrucola alta frontale + barra corta','3 × 12','75 sec','triceps_bar'],
    ['Tricipiti','Estensione tricipiti sopra la testa','Fassi · carrucola alta frontale + corda','3 × 12','75 sec','triceps_overhead'],
    ['Tricipiti','Push-down tricipiti monobraccio','Fassi · carrucola alta frontale + maniglia singola','3 × 12','60 sec','triceps_one_arm'],
    ['Bicipiti','Curl bicipiti al cavo basso','Fassi · carrucola bassa frontale + barra corta','3 × 12','75 sec','curl'],
    ['Bicipiti','Hammer curl con corda','Fassi · carrucola bassa frontale + corda','3 × 12','75 sec','curl_hammer'],
    ['Bicipiti','Curl bicipiti monobraccio','Fassi · carrucola bassa frontale + maniglia singola','3 × 12','60 sec','curl_one_arm'],
    ['Bicipiti e avambracci','Reverse curl al cavo basso','Fassi · carrucola bassa frontale + barra corta','3 × 12','75 sec','reverse_curl'],
    ['Gambe','Goblet squat a box/panca','Manubrio + panca','3 × 10','120 sec','goblet_squat'],
    ['Gambe','Leg extension alla macchina','Fassi · modulo gambe integrato','3 × 12','90 sec','leg_extension'],
    ['Gambe','Squat al cavo basso','Fassi · carrucola bassa frontale + maniglia','3 × 10','120 sec','cable_squat'],
    ['Catena posteriore','Stacco rumeno con manubri','Manubri','3 × 10','120 sec','romanian_deadlift'],
    ['Catena posteriore','Leg curl in piedi al cavo','Fassi · carrucola bassa frontale + cavigliera','3 × 12','75 sec','standing_leg_curl'],
    ['Catena posteriore','Stacco rumeno al cavo basso','Fassi · carrucola bassa frontale + barra/maniglia','3 × 10','120 sec','cable_rdl'],
    ['Glutei','Ponte glutei su panca','Panca','3 × 12','90 sec','glute_bridge'],
    ['Glutei','Glute kickback al cavo basso','Fassi · carrucola bassa frontale + cavigliera','3 × 12','75 sec','glute_kickback'],
    ['Polpacci','Calf raise in piedi','Corpo libero / manubri','3 × 15','60 sec','calf_raise'],
    ['Polpacci','Calf raise al cavo basso','Fassi · carrucola bassa frontale + barra/maniglia','3 × 15','60 sec','cable_calf_raise'],
    ['Core','Plank','Corpo libero','3 × 30 sec','60 sec','plank'],
    ['Core','Crunch al cavo alto','Fassi · carrucola alta frontale + corda','3 × 12','60 sec','cable_crunch'],
    ['Cardio','Tapis roulant Fassi','Fassi F 7.9 HRC','20 min','—','treadmill'],
    ['Cardio','Mini stepper','Mini stepper','10 min','—','stepper']
  ];

  function ensurePage(){
    let page=document.querySelector('[data-page="exercise-library-063"]');
    if(!page){page=document.createElement('section');page.className='page';page.dataset.page='exercise-library-063';document.querySelector('.app')?.appendChild(page)}
    const groups={};LIB.forEach(x=>(groups[x[0]]||(groups[x[0]]=[])).push(x));
    page.innerHTML=`<div class="ey">Altro</div><h1>Esercizi</h1><div class="sub" style="margin-bottom:14px">Libreria completa InFormha · ${LIB.length} esercizi · build 0.9.10</div>`+
      Object.entries(groups).map(([g,items])=>`<div class="card"><div class="ey">${g}</div>${items.map(x=>`<button class="exercise-library-item" onclick="if63Detail(${LIB.indexOf(x)})"><span><b>${x[1]}</b><small>${x[2]}</small></span><span>›</span></button>`).join('')}</div>`).join('')+
      `<button class="btn secondary" onclick="go('profile')">Indietro</button>`;
  }

  window.if63Detail=function(index){
    const x=LIB[index];if(!x)return;
    let page=document.querySelector('[data-page="exercise-detail-063"]');
    if(!page){page=document.createElement('section');page.className='page';page.dataset.page='exercise-detail-063';document.querySelector('.app')?.appendChild(page)}
    const image=x[5]?`<div class="card"><img src="guide-local/${x[5]}?v=0910" alt="${x[1]}" style="width:100%;border-radius:18px;display:block" onerror="this.parentElement.style.display='none'"></div>`:'';
    page.innerHTML=`<div class="ey">Esercizi · ${x[0]}</div><h1>${x[1]}</h1>${image}<div class="card"><div class="measure"><span>Gruppo</span><b>${x[0]}</b></div><div class="measure"><span>Attrezzatura</span><b>${x[2]}</b></div><div class="measure"><span>Serie / tempo</span><b>${x[3]}</b></div><div class="measure"><span>Recupero</span><b>${x[4]}</b></div></div>${x[5]?`<button class="btn" onclick="openGuide('${x[5]}')">Apri guida esercizio</button>`:''}<button class="btn secondary" onclick="go('exercise-library-063')">Torna agli esercizi</button>`;
    go('exercise-detail-063');
  };

  function ensureButton(){
    const profile=document.querySelector('[data-page="profile"]');if(!profile)return;
    let btn=document.getElementById('if63ExercisesButton');
    if(!btn){btn=document.createElement('button');btn.id='if63ExercisesButton';btn.className='btn';btn.textContent='🏋️ Esercizi';btn.onclick=()=>{ensurePage();go('exercise-library-063')};const firstCard=profile.querySelector('.card');if(firstCard)firstCard.insertBefore(btn,firstCard.firstChild);else profile.appendChild(btn)}
  }

  const style=document.createElement('style');style.textContent='.exercise-library-item{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;background:transparent;border:0;border-bottom:1px solid var(--ln);color:var(--tx);padding:14px 2px;text-align:left;font-size:15px}.exercise-library-item:last-child{border-bottom:0}.exercise-library-item span:first-child{display:flex;flex-direction:column;gap:4px}.exercise-library-item small{color:var(--m);font-size:12px;font-weight:500}';document.head.appendChild(style);
  ensurePage();ensureButton();setInterval(ensureButton,1000);
})();