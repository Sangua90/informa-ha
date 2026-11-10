// AI decides the strength plan; existing execution, extras and recovery remain canonical.
(function(){
 if(typeof IF50==='undefined')return;
 let busy=false;
 function status(text){const p=document.querySelector('[data-page="checkin"]');if(!p)return;let box=document.getElementById('if109PlanStatus');if(!box){box=document.createElement('div');box.id='if109PlanStatus';box.className='card sub';p.appendChild(box)}box.textContent=text}
 window.if109ShowSource=function(){const n=document.getElementById('if1041Nav'),source=IF50.aiGeneration;if(!n||!source)return;let box=n.querySelector('.if109-source');if(!box){box=document.createElement('details');box.className='if109-source';n.appendChild(box)}box.replaceChildren();const summary=document.createElement('summary');summary.textContent=source.mode==='gemini'?'Seduta generata da AI Coach · Perché questa scelta':'Seduta del Coach locale · AI non utilizzata';const p=document.createElement('p');p.textContent=source.reason||'';box.append(summary,p)};
 window.if109RecordEffort=async function(id,value,migration=false){
   let entry;try{entry=JSON.parse(localStorage.getItem('informha_effort_'+id)||'null')}catch(e){}
   if(!entry||Number(entry.value)!==Number(value))entry={value:Number(value),at:new Date().toISOString()};
   try{await api('api/exercise-effort-01089',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({exercise_id:id,effort:Number(value),recorded_at:entry.at,workout_id:!migration&&typeof currentWorkoutId!=='undefined'?currentWorkoutId:null})});return true}catch(e){toast('Sforzo non sincronizzato: la valutazione resta su questo dispositivo');return false}
 };
 async function syncEffort(){for(const id of [...Object.keys(window.IF72_LIBRARY||{}),'treadmill','stepper']){let entry;try{entry=JSON.parse(localStorage.getItem('informha_effort_'+id)||'null')}catch(e){}if(entry&&Number(entry.value)>=1&&Number(entry.value)<=5)await window.if109RecordEffort(id,entry.value,true)}}
 const generate=window.if50Generate;
 if(typeof generate==='function')window.if50Generate=async function(){
   if(busy)return;busy=true;
   const buttons=[...document.querySelectorAll('[data-page="checkin"] [onclick*="if50Generate"]')];buttons.forEach(b=>b.disabled=true);
   try{
     if(IF50.pain==='Altro'&&!(document.getElementById('if929PainDetail')?.value||IF50.pain_detail||'').trim())throw Error('Specifica dove senti il fastidio prima di generare la seduta');
     status('AI Coach: raccolgo i dati aggiornati e preparo la seduta…');
     await window.if1087Refresh?.();await syncEffort();
     let data;
     try{data=await api('api/ai-workout-01089',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({exercise_count:Number(IF50.exerciseCount)||4,minutes:Number(IF50.time)||45,energy:IF50.energy||'Normale',pain:IF50.pain||'Nessuno',pain_detail:IF50.pain==='Altro'?(document.getElementById('if929PainDetail')?.value||IF50.pain_detail||'').trim():'',treadmill_minutes:IF50.treadmill_choice==='Sì'&&window.if1087Available?.('treadmill')!==false?Number(IF50.treadmillMinutes)||0:0,stretching:IF50.stretch_mode==='Sì'})})}
     catch(e){data={mode:'local_fallback',reason:'AI non raggiungibile: '+(e.message||'errore di connessione')}}
     IF50.aiGeneration={mode:data.mode,reason:data.reason};
     if(data.mode==='gemini'&&data.decision==='recovery'){status('AI Coach consiglia recupero oggi: '+data.reason);return}
     if(data.mode==='gemini'){
       const seen=new Set();
       if(!Array.isArray(data.plan)||!data.plan.length)throw Error('La proposta AI è vuota');
       IF50.aiPreparedPlan=data.plan.map(e=>{const known=window.IF72_LIBRARY?.[e.id];if(!known||seen.has(e.id)||window.if1087Available?.(e.id)===false)throw Error('La lista esercizi è cambiata: genera nuovamente la seduta');seen.add(e.id);return {...known,...e,name:known.name,loadType:known.loadType,repType:known.repType}});
       status('Seduta generata da AI Coach: '+data.reason);
     }else status('Uso il Coach locale. '+(data.reason||'AI non disponibile'));
     const out=await generate.apply(this,arguments);window.if109ShowSource();return out;
   }catch(e){status(e.message||'Non riesco a preparare la seduta');toast(e.message||'Errore generazione')}
   finally{delete IF50.aiPreparedPlan;busy=false;buttons.forEach(b=>b.disabled=false)}
 };
 const loadCoach=window.if90LoadCoach;
 if(typeof loadCoach==='function')window.if90LoadCoach=async function(){const out=await loadCoach.apply(this,arguments);const box=document.getElementById('if90CoachToday');if(box){const note=[...box.querySelectorAll('.sub')].find(x=>x.textContent.includes('Motore:'));if(note)note.textContent='Quadro dei dati registrati. La seduta viene decisa dall’AI quando premi Genera allenamento; non serve una domanda in chat.'}return out};
 const question=document.getElementById('if90Question')?.closest('.card');
 if(question){const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Domanda facoltativa al Coach';details.className='card';question.replaceWith(details);details.append(summary,question)}
 const page=document.querySelector('[data-page="aicoach"]');
 if(page){const info=[...page.querySelectorAll('.card')].find(c=>c.querySelector('.ey')?.textContent==='Come funziona');if(info?.querySelector('.sub'))info.querySelector('.sub').textContent='L’AI incrocia i dati registrati quando premi Genera allenamento: obiettivo, storico, misure, recupero, carichi, salute e attrezzatura. Non serve scrivere una domanda. La chat è facoltativa. La seduta indica se è stata generata da Gemini oppure dal Coach locale.'}
 const css=document.createElement('style');css.textContent='.if109-source{margin-top:12px;font-size:13px;color:var(--m)}.if109-source summary{cursor:pointer;color:#ffb04a}.if109-source p{max-height:180px;overflow:auto;line-height:1.5}';document.head.appendChild(css);
 // Show the expanded data coverage instead of implying the model sees an entire raw database.
 window.if93LoadContext=async function(){const box=document.getElementById('if93ContextBody');if(!box)return;try{const d=await api('api/ai-coach/context'),c=d.context||{},v=c.coverage||{};box.textContent='Dati aggiornati: '+(v.measurement_rows||0)+' rilevazioni corporee, '+(v.set_rows||0)+' serie con carichi e unità, '+(c.training?.effort_ratings?.length||0)+' valutazioni di sforzo. Include profilo, esclusioni, attrezzatura, alimentazione, integratori e dati salute disponibili. Le date e i dati mancanti sono indicati nel contesto.'}catch(e){box.textContent='Non riesco a leggere i dati del Coach.'}};
})();
