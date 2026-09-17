// InFormha 0.9.95 - handler finale tapis roulant, caricato per ultimo
(function(){
 const KEY='informha_workout_flow_0949';
 function states(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){return {}}}
 function saveStates(a){try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}}
 function archiveLocal(){const a=states(),s=a.treadmill||(a.treadmill={sets:{},fatigue:'Giusta'});s.stage='archived';s.status='Completato';s.archivedAt=new Date().toISOString();saveStates(a)}
 function cards(){return [...document.querySelectorAll('[data-page="workout"] .if50-ex,[data-page="workout"] #if50ex_cardio')]}
 function id(c){return c.id==='if50ex_cardio'?'cardio':String(c.id||'').replace('if50ex_','')}
 function nextStrength(){const a=states();return cards().find(c=>id(c)!=='treadmill'&&id(c)!=='cardio'&&a[id(c)]?.stage!=='archived'&&!c.classList.contains('if949-archived'))||null}
 function advance(){const all=cards(),tm=document.getElementById('if50ex_treadmill');if(tm){tm.classList.add('if949-archived','if950-hidden');tm.classList.remove('if950-current')}const n=nextStrength();if(!n)return;const nid=id(n),a=states(),s=a[nid]||(a[nid]={stage:'planned',sets:{},fatigue:'Giusta',status:null});if(s.stage==='planned'){s.stage='started';s.startedAt=new Date().toISOString();saveStates(a)}if(typeof window.go==='function')window.go('workout');setTimeout(()=>{cards().forEach(c=>{const on=c===n;c.classList.toggle('if950-hidden',!on);c.classList.toggle('if950-current',on)});n.querySelectorAll('.setrow input,.setrow .check').forEach(x=>x.disabled=false);n.scrollIntoView({behavior:'smooth',block:'start'});n.querySelector('.setrow input')?.focus()},140)}
 async function complete(btn){if(btn){btn.disabled=true;btn.textContent='Salvataggio…'}try{if(typeof window.if970SaveTreadmill!=='function')throw new Error('Salvataggio tapis roulant non disponibile');await window.if970SaveTreadmill();archiveLocal();advance()}catch(e){toast(e.message||'Errore salvataggio tapis roulant');if(btn){btn.disabled=false;btn.textContent='Completa tapis roulant'}}}
 function patch(){const c=document.getElementById('if50ex_treadmill');if(!c)return;const b=[...c.querySelectorAll('button')].find(x=>(x.textContent||'').trim()==='Completa tapis roulant');if(!b)return;b.removeAttribute('onclick');b.onclick=function(){complete(this)}}
 const render=window.if50RenderWorkout;if(typeof render==='function')window.if50RenderWorkout=function(){const r=render.apply(this,arguments);setTimeout(patch,300);return r};
 setTimeout(patch,800);
 console.log('[INFORMHA_TREADMILL_FINAL_FIX] version=0.9.95 loaded_last=1 direct_save=1 local_archive=1 advance_strength=1');
})();