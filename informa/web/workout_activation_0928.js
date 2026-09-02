// InFormha 0.9.28 - Allenamento accessibile solo dopo preparazione dalla Home
(function(){
  const KEY='informha_workout_prepared_0928';
  const prepared=()=>sessionStorage.getItem(KEY)==='1';

  function workoutNav(){return document.querySelector('.nav button[data-nav="workout"]')}

  function updateWorkoutNav(){
    const btn=workoutNav();if(!btn)return;
    const on=prepared();
    btn.classList.toggle('if928-locked',!on);
    btn.setAttribute('aria-disabled',on?'false':'true');
    btn.title=on?'Allenamento pronto':'Prepara prima l’allenamento dalla Home';
  }

  function lockWorkout(){sessionStorage.removeItem(KEY);updateWorkoutNav()}
  function unlockWorkout(){sessionStorage.setItem(KEY,'1');updateWorkoutNav()}

  window.if928WorkoutPrepared=prepared;
  window.if928UnlockWorkout=unlockWorkout;
  window.if928LockWorkout=lockWorkout;

  const originalGenerate=window.if50Generate;
  if(typeof originalGenerate==='function'){
    window.if50Generate=async function(){
      unlockWorkout();
      try{return await originalGenerate.apply(this,arguments)}
      catch(e){lockWorkout();throw e}
    };
  }

  const originalFinish=window.if50Finish;
  if(typeof originalFinish==='function'){
    window.if50Finish=async function(){
      try{return await originalFinish.apply(this,arguments)}
      finally{setTimeout(lockWorkout,80)}
    };
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest('.nav button[data-nav="workout"]');
    if(!btn||prepared())return;
    e.preventDefault();e.stopImmediatePropagation();
    if(typeof toast==='function')toast('Prepara prima l’allenamento dalla Home');
    if(typeof go==='function')go('home');
  },true);

  const originalGo=window.go;
  if(typeof originalGo==='function'){
    window.go=function(page){
      if(page==='workout'&&!prepared()){
        if(typeof toast==='function')toast('Prepara prima l’allenamento dalla Home');
        return originalGo.call(this,'home');
      }
      return originalGo.apply(this,arguments);
    };
  }

  const css=document.createElement('style');
  css.textContent=`.nav button[data-nav="workout"].if928-locked{opacity:.38;filter:grayscale(1)}.nav button[data-nav="workout"].if928-locked b{opacity:.55}`;
  document.head.appendChild(css);

  lockWorkout();
  setTimeout(updateWorkoutNav,300);
  console.log('[INFORMHA_WORKOUT] version=0.9.28 home_preparation_unlock=1 finish_relock=1');
})();
