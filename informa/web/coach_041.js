// InFormha 0.4.1 - workout core adattivo
const COACH_041_EXERCISES=[
 {id:'chest',name:'Chest press alla macchina',sets:3,reps:10,rest:120,load:'Livello pin',guide:'chest'},
 {id:'lat',name:'Lat machine al petto',sets:3,reps:10,rest:120,load:'Livello pin',guide:'lat'},
 {id:'pushdown',name:'Push-down tricipiti con corda',sets:3,reps:12,rest:75,load:'Livello pin',guide:'pushdown'},
 {id:'curl',name:'Curl bicipiti al cavo basso',sets:3,reps:12,rest:75,load:'Livello pin',guide:'curl'}
];
const FATIGUE_RIR={Facile:'RIR 4+',Giusta:'RIR 2–3',Dura:'RIR 1','Al limite':'RIR 0'};
function coach041State(){try{return JSON.parse(localStorage.getItem('informha_workout_041')||'{}')}catch(e){return{}}}
function coach041Save(s){localStorage.setItem('informha_workout_041',JSON.stringify(s))}
function coach041Val(id){const e=document.getElementById(id);if(!e)return null;const v=parseFloat(String(e.value||'').replace(',','.'));return Number.isFinite(v)?v:null}
function coach041Fatigue(ex){return document.getElementById(`f041_${ex}`)?.value||'Giusta'}
function coach041Progress(ex){
 const s=coach041State(), rows=s[ex]||[]; if(rows.length<3)return 'Completa le serie per avere un consiglio.';
 const hard=rows.some(x=>x.fatigue==='Al limite'||x.fatigue==='Dura');
 const easy=rows.every(x=>x.fatigue==='Facile'||x.fatigue==='Giusta');
 if(hard)return 'Prossima volta: mantieni il livello. Se perdi tecnica o ripetizioni, riduci di un livello.';
 if(easy)return 'Prossima volta: se la tecnica resta pulita, valuta +1 livello del pacco pesi.';
 return 'Prossima volta: mantieni il livello e consolida tutte le ripetizioni.';
}
function coach041UpdateProgress(ex){const e=document.getElementById(`prog041_${ex}`);if(e)e.textContent=coach041Progress(ex)}
async function coach041Complete(ex,setNo){
 const cfg=COACH_041_EXERCISES.find(x=>x.id===ex); if(!cfg)return;
 const load=coach041Val(`l041_${ex}_${setNo}`), reps=coach041Val(`r041_${ex}_${setNo}`), fatigue=coach041Fatigue(ex);
 if(reps===null){toast('Inserisci le ripetizioni');return}
 try{
  const out=await api('api/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workout_id:currentWorkoutId,workout_title:'Petto + Schiena + Braccia',exercise:cfg.name,set_no:setNo,weight:load,reps,fatigue,rest_sec:cfg.rest})});
  currentWorkoutId=out.workout_id;
  const s=coach041State(); s[ex]=(s[ex]||[]).filter(x=>x.setNo!==setNo); s[ex].push({setNo,load,reps,fatigue,ts:Date.now()}); coach041Save(s);
  const b=document.getElementById(`c041_${ex}_${setNo}`); if(b){b.classList.add('done');b.textContent='✓'}
  coach041UpdateProgress(ex); startTimer(fatigue==='Al limite'?Math.max(cfg.rest,120):cfg.rest); go('recovery');
 }catch(e){toast(e.message||'Errore salvataggio serie')}
}
function coach041Card(cfg){
 const rows=Array.from({length:cfg.sets},(_,i)=>{const n=i+1;return `<div class="setrow"><b>${n}</b><input id="l041_${cfg.id}_${n}" placeholder="${cfg.load}" inputmode="decimal"><input id="r041_${cfg.id}_${n}" value="${cfg.reps}" inputmode="numeric"><button id="c041_${cfg.id}_${n}" class="check" onclick="coach041Complete('${cfg.id}',${n})">✓</button></div>`}).join('');
 return `<div class="card coach041-ex"><div class="row" style="align-items:flex-start;gap:8px"><div style="flex:1"><div class="ey">${cfg.sets} × ${cfg.reps} · recupero ${cfg.rest}s</div><h2>${cfg.name}</h2></div><button class="btn secondary" style="width:auto;margin:0" onclick="openGuide('${cfg.guide}')">Guida</button></div>${rows}<div class="row" style="margin-top:10px"><select class="field" id="f041_${cfg.id}" onchange="document.getElementById('rir041_${cfg.id}').textContent=FATIGUE_RIR[this.value]"><option>Facile</option><option selected>Giusta</option><option>Dura</option><option>Al limite</option></select><div class="metric" style="min-width:92px"><span>Fatica</span><b id="rir041_${cfg.id}">RIR 2–3</b></div></div><div class="card coach" style="margin:10px 0 0"><div class="ey">Progressione</div><div class="sub" id="prog041_${cfg.id}">${coach041Progress(cfg.id)}</div></div></div>`;
}
function installCoach041(){
 const workout=document.querySelector('[data-page="workout"]'); if(!workout||document.getElementById('coach041Workout'))return;
 const oldSet=[...workout.querySelectorAll('.card')].find(c=>c.querySelector('h2')?.textContent.includes('Chest press alla macchina'));
 const oldFat=document.getElementById('fatigue')?.closest('.card'); if(oldSet)oldSet.style.display='none'; if(oldFat)oldFat.style.display='none';
 const box=document.createElement('div'); box.id='coach041Workout'; box.innerHTML=`<div class="card"><div class="ey">Coach adattivo · base annuale</div><h2>Seduta completa</h2><div class="sub">Registra il livello reale del pacco pesi, le ripetizioni e la fatica di ogni esercizio. InFormha usa questi dati per suggerire la progressione.</div></div>${COACH_041_EXERCISES.map(coach041Card).join('')}`;
 const end=[...workout.querySelectorAll('button')].find(b=>b.textContent.includes('Fine allenamento')); workout.insertBefore(box,end||null);
}
installCoach041();
