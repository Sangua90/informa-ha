// InFormha 0.9.54 - catalogo coerente con la carrucola bassa realmente utilizzabile
(function(){
  const REMOVED_LOW_CABLE_IDS=new Set([
    'seated_row','row_one_arm','upright_row','front_raise_cable',
    'curl_hammer','curl_one_arm','reverse_curl','cable_squat',
    'standing_leg_curl','cable_rdl','glute_kickback','cable_calf_raise'
  ]);
  const KEPT_ID='curl';
  const KEPT_NAME='Curl bicipiti al cavo basso con appoggio inclinato';
  const KEPT_EQUIPMENT='Fassi · carrucola bassa frontale + barra corta + appoggio-braccia inclinato';

  function cleanIds(ids){return Array.isArray(ids)?ids.filter(id=>!REMOVED_LOW_CABLE_IDS.has(id)):[]}

  function applyCatalog(){
    if(typeof IF51_LIBRARY!=='undefined'){
      REMOVED_LOW_CABLE_IDS.forEach(id=>delete IF51_LIBRARY[id]);
      if(IF51_LIBRARY[KEPT_ID])Object.assign(IF51_LIBRARY[KEPT_ID],{
        name:KEPT_NAME,
        group:'Bicipiti',
        equipment:KEPT_EQUIPMENT,
        priority:'Utile',
        sets:3,
        reps:12,
        rest:75,
        guide:null
      });
    }
    if(typeof IF50_EX!=='undefined'){
      REMOVED_LOW_CABLE_IDS.forEach(id=>delete IF50_EX[id]);
      if(IF50_EX[KEPT_ID])Object.assign(IF50_EX[KEPT_ID],{name:KEPT_NAME,sets:3,reps:12,rest:75,guide:null});
    }
    if(typeof IF51_PLANS!=='undefined')Object.values(IF51_PLANS).forEach(plan=>{plan.ids=cleanIds(plan.ids)});
    if(typeof IF60_ALTERNATIVES!=='undefined'){
      REMOVED_LOW_CABLE_IDS.forEach(id=>delete IF60_ALTERNATIVES[id]);
      Object.keys(IF60_ALTERNATIVES).forEach(id=>{IF60_ALTERNATIVES[id]=cleanIds(IF60_ALTERNATIVES[id])});
    }
    if(typeof IF60_GROUPS!=='undefined')Object.keys(IF60_GROUPS).forEach(group=>{IF60_GROUPS[group]=cleanIds(IF60_GROUPS[group])});
    if(typeof IF50!=='undefined'&&Array.isArray(IF50.plan))IF50.plan=IF50.plan.filter(ex=>!REMOVED_LOW_CABLE_IDS.has(ex.id));
  }

  function renderLibrary(){
    const page=document.querySelector('[data-page="exercises"]');
    if(!page||typeof IF51_LIBRARY==='undefined')return;
    const groups={};
    Object.entries(IF51_LIBRARY).forEach(([id,x])=>{const group=x.group||'Altro';(groups[group]||(groups[group]=[])).push([id,x])});
    page.innerHTML=`<div class="ey">Altro</div><h1>Esercizi</h1><div class="sub" style="margin-bottom:14px">Libreria aggiornata in base agli attrezzi realmente disponibili.</div>${Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0])).map(([group,items])=>`<div class="card exercise-library-group"><div class="ey">${group}</div>${items.sort((a,b)=>a[1].name.localeCompare(b[1].name)).map(([id,x])=>`<button class="exercise-library-item" onclick="if62OpenExercise('${id}')"><span><b>${x.name}</b><small>${x.equipment||''}</small></span><span>›</span></button>`).join('')}</div>`).join('')}<button class="btn secondary" onclick="go('profile')">Indietro</button>`;
  }

  function routeExercisesButton(){
    const legacy=document.getElementById('if63ExercisesButton');
    if(legacy)legacy.onclick=()=>{applyCatalog();renderLibrary();go('exercises')};
    document.querySelector('[data-page="exercise-library-063"]')?.remove();
  }

  applyCatalog();
  renderLibrary();
  routeExercisesButton();
  document.addEventListener('click',event=>{
    if(event.target.closest('[onclick*="exercises"],#if63ExercisesButton'))setTimeout(()=>{applyCatalog();renderLibrary();routeExercisesButton()},80);
  });
  setTimeout(()=>{applyCatalog();renderLibrary();routeExercisesButton()},500);
  console.log('[INFORMHA_EXERCISE_CATALOG] version=0.9.54 removed_low_cable=12 kept_preacher_curl=1');
})();
