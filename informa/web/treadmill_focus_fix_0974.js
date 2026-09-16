// InFormha 0.9.74 - include tapis roulant nel flusso un-esercizio-alla-volta
(function(){
 if(typeof IF50==='undefined')return;
 function cards(){return [...document.querySelectorAll('[data-page="workout"] #if50ex_treadmill,[data-page="workout"] .if50-ex,[data-page="workout"] #if50ex_cardio')]}
 function id(card){return card.id==='if50ex_cardio'?'cardio':String(card.id||'').replace('if50ex_','')}
 function archived(card){return card.classList.contains('if949-archived')}
 function focus(){const all=cards();if(!all.length)return;let active=all.find(c=>c.classList.contains('if950-current')&&!archived(c));const treadmill=all.find(c=>id(c)==='treadmill'&&!archived(c));const anyDone=all.some(c=>c.classList.contains('if949-archived')||c.querySelector('.check.done'));if(treadmill&&!anyDone)active=treadmill;if(!active)active=all.find(c=>!archived(c))||null;all.forEach((c,i)=>{const on=c===active;c.classList.toggle('if950-current',on);c.classList.toggle('if950-hidden',!on);if(on){document.body.dataset.if950ExerciseIndex=String(i);const b=c.querySelector('.if67-index');if(b)b.textContent=`Esercizio ${i+1} di ${all.length}`}});document.body.classList.toggle('if950-session-focus',!!active)}
 const render=window.if50RenderWorkout;if(typeof render==='function')window.if50RenderWorkout=function(){const r=render.apply(this,arguments);setTimeout(focus,80);return r};
 const go0=window.go;if(typeof go0==='function')window.go=function(page){const r=go0.apply(this,arguments);if(page==='workout')setTimeout(focus,80);return r};
 const css=document.createElement('style');css.textContent='body.if950-session-focus [data-page="workout"]>#if50ex_treadmill{display:block}';document.head.appendChild(css);
 setTimeout(focus,400);
 console.log('[INFORMHA_TREADMILL_FOCUS] version=0.9.74 first_exercise=1 selector_treadmill=1');
})();
