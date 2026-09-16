// InFormha 0.9.83 - tapis roulant compatibile con workout flow 0.9.49
(function(){
 if(typeof IF50==='undefined')return;
 const render=window.if50RenderWorkout;
 function prepareTreadmill(){
  const c=document.getElementById('if50ex_treadmill');if(!c)return;
  let bar=c.querySelector('.if949-flow');
  if(bar){
   bar.innerHTML='<div><b class="green">Cardio in corso</b><span>Al termine scegli Completato o Parziale.</span></div>';
  }
  // Il tapis roulant non ha serie: il suo avvio coincide con la visualizzazione della card.
  // Porta il gestore 0.9.49 nello stato started usando la sua API pubblica.
  try{if(typeof window.if949Start==='function')window.if949Start('treadmill')}catch(e){}
  // if949Start ridisegna la barra; normalizza il testo dopo l'avvio.
  setTimeout(()=>{const b=c.querySelector('.if949-flow');if(b)b.innerHTML='<div><b class="green">Cardio in corso</b><span>Al termine scegli Completato o Parziale.</span></div>';},0);
 }
 if(typeof render==='function')window.if50RenderWorkout=function(){const r=render.apply(this,arguments);setTimeout(prepareTreadmill,100);return r};
 setTimeout(prepareTreadmill,350);
 console.log('[INFORMHA_TREADMILL_FLOW_FIX] version=0.9.83 treadmill_auto_started=1 status_can_archive=1');
})();
