// InFormha 0.5.0 - coach adattivo completo
const IF50_EX={
 chest:{id:'chest',name:'Chest press alla macchina',priority:'Essenziale',sets:3,reps:10,rest:120,guide:'chest'},
 lat:{id:'lat',name:'Lat machine al petto',priority:'Essenziale',sets:3,reps:10,rest:120,guide:'lat'},
 pushdown:{id:'pushdown',name:'Push-down tricipiti con corda',priority:'Utile',sets:3,reps:12,rest:75,guide:'pushdown'},
 curl:{id:'curl',name:'Curl bicipiti al cavo basso',priority:'Utile',sets:3,reps:12,rest:75,guide:'curl'}
};
let IF50={time:45,energy:'Normale',pain:'Nessuno',intent:'Segui programma',focus:'Completo',plan:[],started:null,finishReason:'Completato'};
const IF50_RIR={Facile:'RIR 4+',Giusta:'RIR 2–3',Dura:'RIR 1','Al limite':'RIR 0'};
function if50Pick(group,val){IF50[group]=val;document.querySelectorAll(`[data-if50-group="${group}"]`).forEach(b=>b.classList.toggle('on',b.dataset.val===String(val)));if(group==='intent'){document.getElementById('if50FocusWrap')?.classList.toggle('hide',val!=='Cambia gruppo')}}
function if50BuildPlan(){
 let ids=['chest','lat'];
 if(IF50.time>=30)ids.push(IF50.intent==='Cambia gruppo'&&IF50.focus==='Schiena + Bicipiti'?'curl':'pushdown');
 if(IF50.time>=45)ids=['chest','lat','pushdown','curl'];
 if(IF50.intent==='Cambia gruppo'){
  if(IF50.focus==='Petto + Tricipiti')ids=['chest','pushdown'];
  if(IF50.focus==='Schiena + Bicipiti')ids=['lat','curl'];
  if(IF50.focus==='Cardio')ids=[];
 }
 if(IF50.intent==='Seduta breve')ids=ids.slice(0,Math.min(2,ids.length));
 const reduce=IF50.energy==='Bassa'?1:0;
 IF50.plan=ids.map(id=>({...IF50_EX[id],sets:Math.max(2,IF50_EX[id].sets-reduce)}));
 if(IF50.time>=60&&IF50.energy!=='Bassa'&&IF50.intent!=='Seduta breve')IF50.plan.push({id:'cardio',name:'Tapis roulant / cardio',priority:'Opzionale',sets:1,reps:null,rest:0,guide:null,cardio:true,duration:15});
 return IF50.plan;
}
function if50PainNote(){if(IF50.pain==='Nessuno')return'';return `<div class="card warning"><div class="ey">Fastidio segnalato: ${IF50.pain}</div><div class="sub">Il coach non forza esercizi che aumentano il fastidio. Mantieni solo movimenti confortevoli e interrompi se il dolore è importante o peggiora.</div></div>`}
async function if50Generate(){
 if50BuildPlan();IF50.started=Date.now();
 try{await api('api/coach/checkin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({time_min:IF50.time,energy:IF50.energy,pain:IF50.pain,intent:IF50.intent,plan:IF50.plan})})}catch(e){}
 if50RenderWorkout();go('workout');
}
function if50Checkin(){
 const p=document.querySelector('[data-page="checkin"]');if(!p)return;
 p.innerHTML=`<div class="ey">Check iniziale</div><h1>Come stai oggi?</h1>
 <div class="card"><b>Quanto tempo hai?</b><div class="choice"><button class="on" data-if50-group="time" data-val="45" onclick="if50Pick('time',45)">45 min</button><button data-if50-group="time" data-val="20" onclick="if50Pick('time',20)">20 min</button><button data-if50-group="time" data-val="30" onclick="if50Pick('time',30)">30 min</button><button data-if50-group="time" data-val="60" onclick="if50Pick('time',60)">60+ min</button></div></div>
 <div class="card"><b>Energia</b><div class="choice"><button data-if50-group="energy" data-val="Bassa" onclick="if50Pick('energy','Bassa')">Bassa</button><button class="on" data-if50-group="energy" data-val="Normale" onclick="if50Pick('energy','Normale')">Normale</button><button data-if50-group="energy" data-val="Alta" onclick="if50Pick('energy','Alta')">Alta</button></div></div>
 <div class="card"><b>Dolori o fastidi?</b><div class="choice"><button class="on" data-if50-group="pain" data-val="Nessuno" onclick="if50Pick('pain','Nessuno')">Nessuno</button><button data-if50-group="pain" data-val="Ginocchio" onclick="if50Pick('pain','Ginocchio')">Ginocchio</button><button data-if50-group="pain" data-val="Schiena" onclick="if50Pick('pain','Schiena')">Schiena</button><button data-if50-group="pain" data-val="Spalla" onclick="if50Pick('pain','Spalla')">Spalla</button><button data-if50-group="pain" data-val="Altro" onclick="if50Pick('pain','Altro')">Altro</button></div></div>
 <div class="card"><b>Cosa vuoi fare?</b><div class="choice"><button class="on" data-if50-group="intent" data-val="Segui programma" onclick="if50Pick('intent','Segui programma')">Segui programma</button><button data-if50-group="intent" data-val="Seduta breve" onclick="if50Pick('intent','Seduta breve')">Seduta breve</button><button data-if50-group="intent" data-val="Cambia gruppo" onclick="if50Pick('intent','Cambia gruppo')">Cambia gruppo</button><button data-if50-group="intent" data-val="Portami avanti" onclick="if50Pick('intent','Portami avanti')">Portami avanti</button></div></div>
 <div id="if50FocusWrap" class="card hide"><b>Su cosa vuoi lavorare?</b><select class="field" onchange="IF50.focus=this.value"><option>Completo</option><option>Petto + Tricipiti</option><option>Schiena + Bicipiti</option><option>Cardio</option></select></div>
 <div class="card coach"><div class="ey">Logica coach</div><div class="sub">Essenziale prima, poi utile, infine opzionale. Se il tempo finisce, non crea volume arretrato inutile.</div></div>
 <button class="btn blue" onclick="if50Generate()">Genera allenamento di oggi</button>`;
}
function if50SetRow(ex,n){return `<div class="setrow"><b>${n}</b><input id="if50w_${ex.id}_${n}" placeholder="Livello" inputmode="decimal"><input id="if50r_${ex.id}_${n}" value="${ex.reps}" inputmode="numeric"><button id="if50c_${ex.id}_${n}" class="check" onclick="if50CompleteSet('${ex.id}',${n})">✓</button></div>`}
function if50ExerciseCard(ex){
 if(ex.cardio)return `<div class="card" id="if50ex_cardio"><div class="ey">${ex.priority}</div><h2>${ex.name}</h2><div class="sub">${ex.duration} minuti consigliati. Puoi chiudere prima senza creare debito.</div><div class="grid2" style="margin-top:10px"><input class="field" id="if50CardioMin" value="${ex.duration}" inputmode="numeric"><button class="btn secondary" onclick="if50SaveCardio()">Salva cardio</button></div><div class="choice"><button onclick="if50Status('cardio','Completato','Opzionale',this)">Completato</button><button onclick="if50Status('cardio','Parziale','Opzionale',this)">Parziale</button><button onclick="if50Status('cardio','Saltato','Opzionale',this)">Saltato</button></div></div>`;
 return `<div class="card if50-ex" id="if50ex_${ex.id}"><div class="row" style="align-items:flex-start;gap:8px"><div style="flex:1"><div class="ey">${ex.priority} · ${ex.sets} × ${ex.reps} · ${ex.rest}s</div><h2>${ex.name}</h2></div>${ex.guide?`<button class="btn secondary" style="width:auto;margin:0" onclick="openGuide('${ex.guide}')">Guida</button>`:''}</div>${Array.from({length:ex.sets},(_,i)=>if50SetRow(ex,i+1)).join('')}<div class="row" style="margin-top:10px"><select class="field" id="if50f_${ex.id}" onchange="document.getElementById('if50rir_${ex.id}').textContent=IF50_RIR[this.value]"><option>Facile</option><option selected>Giusta</option><option>Dura</option><option>Al limite</option></select><div class="metric"><span>Intensità</span><b id="if50rir_${ex.id}">RIR 2–3</b></div></div><div class="choice"><button onclick="if50Status('${ex.id}','Completato','${ex.priority}',this)">Completato</button><button onclick="if50Status('${ex.id}','Parziale','${ex.priority}',this)">Parziale</button><button onclick="if50Status('${ex.id}','Saltato','${ex.priority}',this)">Saltato</button></div><div class="card coach" style="margin:10px 0 0"><div class="ey">Coach prossima volta</div><div class="sub" id="if50prog_${ex.id}">Completa le serie per generare il consiglio.</div></div></div>`;
}
function if50RenderWorkout(){
 const p=document.querySelector('[data-page="workout"]');if(!p)return;
 const title=IF50.intent==='Cambia gruppo'?IF50.focus:'Seduta adattata';
 p.innerHTML=`<div class="ey">Coach adattivo</div><h1>${title}</h1><div class="status">● ${IF50.time} min · energia ${IF50.energy.toLowerCase()} · ${IF50.intent}</div>${if50PainNote()}<div class="card"><div class="measure"><span>Essenziale</span><b>da completare per primo</b></div><div class="measure"><span>Utile</span><b>se tempo e recupero lo permettono</b></div><div class="measure"><span>Opzionale</span><b>può sparire senza debito</b></div></div>${IF50.plan.map(if50ExerciseCard).join('')}<button class="btn secondary" onclick="go('endworkout')">Fine allenamento</button>`;
}
function if50Num(id){const e=document.getElementById(id);if(!e)return null;const n=parseFloat(String(e.value||'').replace(',','.'));return Number.isFinite(n)?n:null}
async function if50CompleteSet(id,n){
 const ex=IF50_EX[id],reps=if50Num(`if50r_${id}_${n}`),weight=if50Num(`if50w_${id}_${n}`),fatigue=document.getElementById(`if50f_${id}`)?.value||'Giusta';if(!ex||reps===null){toast('Inserisci le ripetizioni');return}
 try{const out=await api('api/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workout_id:currentWorkoutId,workout_title:'Seduta adattata',exercise:ex.name,set_no:n,weight,reps,fatigue,rest_sec:ex.rest})});currentWorkoutId=out.workout_id;const b=document.getElementById(`if50c_${id}_${n}`);if(b){b.classList.add('done');b.textContent='✓'}if50Progress(id);startTimer(fatigue==='Al limite'?Math.max(ex.rest,120):ex.rest);go('recovery')}catch(e){toast(e.message||'Errore salvataggio')}
}
function if50Progress(id){
 const ex=IF50_EX[id];if(!ex)return;const done=[...document.querySelectorAll(`[id^="if50c_${id}_"]`)].filter(b=>b.classList.contains('done')).length;const fat=document.getElementById(`if50f_${id}`)?.value||'Giusta';let msg='Completa le serie per generare il consiglio.';if(done>=2){if(fat==='Facile')msg='Tecnica pulita e margine alto: valuta +1 livello la prossima volta.';else if(fat==='Giusta')msg='Mantieni finché completi tutte le ripetizioni con RIR 2–3; poi valuta +1 livello.';else if(fat==='Dura')msg='Mantieni il livello e consolida prima le ripetizioni.';else msg='Non aumentare. Mantieni o riduci un livello se tecnica o ripetizioni cedono.'}const el=document.getElementById(`if50prog_${id}`);if(el)el.textContent=msg
}
async function if50Status(id,status,priority,btn){
 const ex=IF50_EX[id];document.querySelectorAll(`#if50ex_${id} .choice button,#if50ex_cardio .choice button`).forEach(b=>{if(b.parentElement===btn.parentElement)b.classList.remove('on')});btn.classList.add('on');
 try{await api('api/coach/exercise-status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workout_id:currentWorkoutId,exercise:ex?.name||'Cardio',priority,status})})}catch(e){}
}
async function if50SaveCardio(){const m=if50Num('if50CardioMin');if(!m||m<=0){toast('Inserisci i minuti');return}try{await api('api/cardio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({activity:'Tapis roulant',duration_min:m,notes:'Cardio opzionale InFormha'})});toast('Cardio salvato')}catch(e){toast('Errore cardio')}}
function if50End(){const p=document.querySelector('[data-page="endworkout"]');if(!p)return;p.innerHTML=`<div class="ey">Chiusura seduta</div><h1>Finisci allenamento</h1><div class="card"><b>Perché termini adesso?</b><div class="choice"><button class="on" data-if50-group="finishReason" data-val="Completato" onclick="if50FinishPick(this,'Completato')">Completato</button><button onclick="if50FinishPick(this,'Tempo finito')">Tempo finito</button><button onclick="if50FinishPick(this,'Imprevisto')">Imprevisto</button><button onclick="if50FinishPick(this,'Stanchezza')">Stanchezza</button><button onclick="if50FinishPick(this,'Fastidio / dolore')">Fastidio / dolore</button></div></div><div class="card coach"><div class="sub">InFormha conserva il lavoro svolto. Solo gli elementi essenziali non completati potranno essere riproposti; utile e opzionale non diventano debito automatico.</div></div><button class="btn" onclick="if50Finish()">Salva e chiudi</button><button class="btn secondary" onclick="go('workout')">Torna all'allenamento</button>`}
function if50FinishPick(btn,v){IF50.finishReason=v;btn.parentElement.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===btn))}
async function if50Finish(){const dur=Math.max(1,Math.round((Date.now()-(IF50.started||Date.now()))/60000));try{await api('api/coach/finish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workout_id:currentWorkoutId,reason:IF50.finishReason,duration_min:dur,useful_work:'Salvato per priorità, senza debito opzionale'})})}catch(e){}if50Summary(dur);go('summary');if50LoadWeek()}
function if50Summary(dur){const p=document.querySelector('[data-page="summary"]');if(!p)return;const done=document.querySelectorAll('.check.done').length;p.innerHTML=`<div class="ey">Riepilogo</div><h1>Allenamento salvato</h1><div class="card"><div class="measure"><span>Serie completate</span><b class="green">${done}</b></div><div class="measure"><span>Tempo</span><b>${dur} min</b></div><div class="measure"><span>Chiusura</span><b>${IF50.finishReason}</b></div></div><div class="card coach"><div class="ey">Coach</div><div class="sub">Il prossimo allenamento parte da ciò che hai realmente fatto, non da una lista arretrata di esercizi.</div></div><button class="btn" onclick="go('home')">Torna alla Home</button>`}
async function if50LoadWeek(){
 const p=document.querySelector('[data-page="coach"]');if(!p)return;let d=null;try{d=await api('api/coach/week')}catch(e){}
 const s=d?.summary||{workouts:0,sets:0,completed:0,partial:0,skipped:0};p.innerHTML=`<div class="ey">Coach virtuale</div><h1>Settimana mobile</h1><div class="card coach"><div class="measure"><span>Allenamenti registrati</span><b>${s.workouts}</b></div><div class="measure"><span>Serie svolte</span><b>${s.sets}</b></div><div class="measure"><span>Esercizi completati</span><b class="green">${s.completed}</b></div><div class="measure"><span>Parziali / saltati</span><b>${s.partial} / ${s.skipped}</b></div></div><div class="card"><h2>Nessun giorno rigido</h2><div class="sub">La settimana si adatta a quello che riesci a fare. Il coach recupera prima il lavoro essenziale utile e lascia cadere ciò che non serve recuperare.</div></div><div class="card"><h2>Regola di progressione</h2><div class="sub">Aumenti solo quando ripetizioni, tecnica e fatica indicano margine. Una seduta dura non obbliga ad aumentare il carico.</div></div><button class="btn secondary" onclick="go('progress')">Progressi e misure</button><button class="btn secondary" onclick="go('profile')">Indietro</button>`
}
function installIF50(){
 const st=document.createElement('style');st.textContent='.hide{display:none!important}.warning{border-color:#7a5129;background:linear-gradient(180deg,rgba(122,81,41,.16),rgba(20,20,20,.8))}.if50-ex .choice{margin-top:10px}.if50-ex .choice button.on{border-color:#65c934}.if50-ex input::placeholder{font-size:12px}';document.head.appendChild(st);
 const legacy=document.getElementById('coach041Workout');if(legacy)legacy.remove();if50Checkin();if50End();if50LoadWeek();
}
installIF50();
