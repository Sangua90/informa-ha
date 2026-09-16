// InFormha 0.9.75 - rendering dedicato tapis roulant nel piano adattivo
(function(){
 if(typeof IF50==='undefined')return;
 const baseCard=window.if50ExerciseCard;
 if(typeof baseCard!=='function')return;
 window.if50ExerciseCard=function(ex){
  if(ex?.id==='treadmill'&&ex?.cardio){
   const min=Math.max(1,Math.round(Number(ex.duration||ex.minutes||IF50.treadmillMinutes||20)));
   return `<div class="card if50-ex if931-treadmill" id="if50ex_treadmill"><div class="ey">Cardio · ${min} min</div><h2>Tapis roulant Fassi</h2><div class="sub">Programma generato da iCoach in base alla durata scelta.</div><div id="if975TreadmillProgram" class="card coach" style="margin:10px 0"><div class="sub">Preparazione programma iCoach…</div></div><div class="choice"><button onclick="if50Status('treadmill','Completato','Cardio',this)">Completato</button><button onclick="if50Status('treadmill','Parziale','Cardio',this)">Parziale</button><button onclick="if50Status('treadmill','Saltato','Cardio',this)">Saltato</button></div></div>`;
  }
  return baseCard.apply(this,arguments);
 };
 const render0=window.if50RenderWorkout;
 if(typeof render0==='function')window.if50RenderWorkout=function(){const r=render0.apply(this,arguments);setTimeout(()=>{if(typeof window.if970Enhance==='function')window.if970Enhance()},60);return r};
 console.log('[INFORMHA_TREADMILL_RENDER] version=0.9.75 dedicated_card=1 first_exercise=1');
})();
