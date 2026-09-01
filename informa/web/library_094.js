// InFormha 0.9.4 - libreria esercizi estesa per Fassi multigym a 3 carrucole frontali
(function(){
  if(typeof IF51_LIBRARY==='undefined') return;

  Object.assign(IF51_LIBRARY,{
    lat_close:{name:'Lat machine presa stretta',group:'Schiena',equipment:'Fassi · carrucola alta frontale + presa stretta',priority:'Utile',sets:3,reps:10,rest:105,guide:'lat_close'},
    lat_reverse:{name:'Lat machine presa inversa',group:'Schiena',equipment:'Fassi · carrucola alta frontale + barra lat',priority:'Utile',sets:3,reps:10,rest:105,guide:'lat_reverse'},
    straight_arm_pulldown:{name:'Pull-down a braccia tese',group:'Schiena',equipment:'Fassi · carrucola alta frontale + barra',priority:'Utile',sets:3,reps:12,rest:75,guide:'straight_arm_pulldown'},
    row_one_arm:{name:'Rematore monobraccio al cavo basso',group:'Schiena',equipment:'Fassi · carrucola bassa frontale + maniglia singola',priority:'Utile',sets:3,reps:10,rest:90,guide:'row_one_arm'},
    row_mid:{name:'Rematore al cavo medio',group:'Schiena',equipment:'Fassi · carrucola media frontale + maniglia',priority:'Utile',sets:3,reps:10,rest:90,guide:'row_mid'},

    triceps_bar:{name:'Push-down tricipiti con barra',group:'Tricipiti',equipment:'Fassi · carrucola alta frontale + barra corta',priority:'Utile',sets:3,reps:12,rest:75,guide:'triceps_bar'},
    triceps_overhead:{name:'Estensione tricipiti sopra la testa',group:'Tricipiti',equipment:'Fassi · carrucola alta frontale + corda',priority:'Utile',sets:3,reps:12,rest:75,guide:'triceps_overhead'},
    triceps_one_arm:{name:'Push-down tricipiti monobraccio',group:'Tricipiti',equipment:'Fassi · carrucola alta frontale + maniglia singola',priority:'Utile',sets:3,reps:12,rest:60,guide:'triceps_one_arm'},

    curl_hammer:{name:'Hammer curl con corda',group:'Bicipiti',equipment:'Fassi · carrucola bassa frontale + corda',priority:'Utile',sets:3,reps:12,rest:75,guide:'curl_hammer'},
    curl_one_arm:{name:'Curl bicipiti monobraccio',group:'Bicipiti',equipment:'Fassi · carrucola bassa frontale + maniglia singola',priority:'Utile',sets:3,reps:12,rest:60,guide:'curl_one_arm'},
    reverse_curl:{name:'Reverse curl al cavo basso',group:'Bicipiti e avambracci',equipment:'Fassi · carrucola bassa frontale + barra corta',priority:'Utile',sets:3,reps:12,rest:75,guide:'reverse_curl'},

    upright_row:{name:'Tirata al mento al cavo basso',group:'Spalle',equipment:'Fassi · carrucola bassa frontale + barra corta',priority:'Utile',sets:3,reps:12,rest:75,guide:'upright_row'},
    front_raise_cable:{name:'Alzata frontale al cavo basso',group:'Spalle',equipment:'Fassi · carrucola bassa frontale + barra corta',priority:'Utile',sets:3,reps:12,rest:75,guide:'front_raise_cable'},

    leg_extension:{name:'Leg extension alla macchina',group:'Gambe',equipment:'Fassi · modulo gambe integrato',priority:'Essenziale',sets:3,reps:12,rest:90,guide:'leg_extension',painAvoid:['Ginocchio']},
    standing_leg_curl:{name:'Leg curl in piedi al cavo',group:'Catena posteriore',equipment:'Fassi · carrucola bassa frontale + cavigliera',priority:'Utile',sets:3,reps:12,rest:75,guide:'standing_leg_curl'},
    cable_squat:{name:'Squat al cavo basso',group:'Gambe',equipment:'Fassi · carrucola bassa frontale + maniglia',priority:'Essenziale',sets:3,reps:10,rest:120,guide:'cable_squat',painAvoid:['Ginocchio']},
    cable_rdl:{name:'Stacco rumeno al cavo basso',group:'Catena posteriore',equipment:'Fassi · carrucola bassa frontale + barra/maniglia',priority:'Essenziale',sets:3,reps:10,rest:120,guide:'cable_rdl',painAvoid:['Schiena']},
    glute_kickback:{name:'Glute kickback al cavo basso',group:'Glutei',equipment:'Fassi · carrucola bassa frontale + cavigliera',priority:'Utile',sets:3,reps:12,rest:75,guide:'glute_kickback'},
    cable_calf_raise:{name:'Calf raise al cavo basso',group:'Polpacci',equipment:'Fassi · carrucola bassa frontale + barra/maniglia',priority:'Utile',sets:3,reps:15,rest:60,guide:'cable_calf_raise'},

    cable_crunch:{name:'Crunch al cavo alto',group:'Core',equipment:'Fassi · carrucola alta frontale + corda',priority:'Utile',sets:3,reps:12,rest:60,guide:'cable_crunch'}
  });

  // Correzioni descrittive per gli esercizi già presenti: la Fassi ha carrucole alta/media/bassa frontali.
  Object.assign(IF51_LIBRARY.chest,{equipment:'Fassi · bracci chest press integrati'});
  Object.assign(IF51_LIBRARY.lat,{equipment:'Fassi · carrucola alta frontale + barra lat'});
  Object.assign(IF51_LIBRARY.pushdown,{equipment:'Fassi · carrucola alta frontale + corda'});
  Object.assign(IF51_LIBRARY.curl,{equipment:'Fassi · carrucola bassa frontale + barra corta'});
  Object.assign(IF51_LIBRARY.seated_row,{equipment:'Fassi · carrucola bassa frontale + triangolo',guide:'seated_row'});
  Object.assign(IF51_LIBRARY.pec_fly,{equipment:'Fassi · bracci pec-fly integrati',guide:'pec_fly'});
  Object.assign(IF51_LIBRARY.face_pull,{equipment:'Fassi · carrucola media frontale + corda',guide:'face_pull'});

  // Rende tutti i nuovi esercizi disponibili anche al motore workout.
  Object.entries(IF51_LIBRARY).forEach(([id,x])=>{
    if(!x.cardio && typeof IF50_EX!=='undefined' && !IF50_EX[id]){
      IF50_EX[id]={id,name:x.name,priority:x.priority,sets:x.sets,reps:x.reps,rest:x.rest,guide:x.guide||null};
    }
  });

  function refreshExercises(){
    const page=document.querySelector('[data-page="exercises"]');
    if(!page) return;
    const groups={};
    Object.entries(IF51_LIBRARY).forEach(([id,x])=>{const g=x.group||'Altro';(groups[g]||(groups[g]=[])).push([id,x]);});
    page.innerHTML=`<div class="ey">Altro</div><h1>Esercizi</h1><div class="sub" style="margin-bottom:14px">Libreria completa InFormha, divisa per gruppo muscolare.</div>${Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0])).map(([group,items])=>`<div class="card exercise-library-group"><div class="ey">${group}</div>${items.sort((a,b)=>a[1].name.localeCompare(b[1].name)).map(([id,x])=>`<button class="exercise-library-item" onclick="if62OpenExercise('${id}')"><span><b>${x.name}</b><small>${x.equipment||''}</small></span><span>›</span></button>`).join('')}</div>`).join('')}<button class="btn secondary" onclick="go('profile')">Indietro</button>`;
  }

  document.addEventListener('click',e=>{if(e.target.closest('[onclick*="exercises"]')) setTimeout(refreshExercises,80);});
  setTimeout(refreshExercises,180);
})();
