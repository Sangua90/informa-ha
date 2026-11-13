// User notes stay separate from answered Coach questions and from the open session.
(function(){
 const KEY='informa_coach_note_draft_010101';let box,field,select,send,status,list,busy=false,seq=0;
 const uid=()=>window.crypto?.randomUUID?.()||'note_'+Date.now()+'_'+Math.random().toString(36).slice(2);
 let draft;try{draft=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
 if(!draft||typeof draft.body!=='string')draft={body:'',exercise_id:'',request_id:uid()};
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n};
 function remember(){draft={body:field.value,exercise_id:select.value,request_id:uid()};try{localStorage.setItem(KEY,JSON.stringify(draft))}catch(e){}}
 function lock(value){busy=value;if(field)field.disabled=value;if(select)select.disabled=value;if(send){send.disabled=value;send.textContent=value?'Il Coach sta leggendo…':'Invia nota al Coach'}}
 function message(text,error=false){status.textContent=text;status.setAttribute('role',error?'alert':'status')}
 async function load(){
  const request=++seq;
  try{const d=await api('api/coach-notes');if(request!==seq)return;list.replaceChildren();
   for(const note of d.items||[]){const row=el('div',null,'card');row.append(el('b',note.active?(note.changes?.length&&note.current===false?'Indicazione precedente':'Indicazione salvata'):'Nota archiviata'),el('p',note.active&&note.changes?.length&&note.current===false?'Parametri sostituiti da un’indicazione successiva.':note.summary,'sub'),el('p',note.body,'sub'));
    const b=el('button',note.active?'Rimuovi indicazione':'Riattiva nota','btn secondary');b.type='button';b.onclick=async()=>{if(busy)return;lock(true);b.disabled=true;try{await api('api/coach-notes/'+note.id+'/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:!note.active})});message(note.active?'Indicazione rimossa dalle prossime schede.':'Nota riattivata per le prossime schede.');await load()}catch(e){message(e.message||'Non riesco ad aggiornare la nota.',true)}finally{lock(false);b.disabled=false}};row.appendChild(b);list.appendChild(row)
   }
   if(!(d.items||[]).length)list.appendChild(el('p','Non hai ancora inviato note.','sub'));
  }catch(e){if(request===seq)list.textContent='Non riesco a leggere le note salvate. La bozza resta disponibile.'}
 }
 async function save(){
  if(busy)return;if(field.value.trim().length<3){message('Scrivi la modifica o la preferenza da comunicare.',true);return}
  if(select.value==='bird_dog'&&/\d/.test(field.value)&&/rep|ripetiz/i.test(field.value)&&!/(?:per|ciascun)\s+lato/i.test(field.value)){message('Per il Bird dog specifica le ripetizioni per lato, per esempio 20 per lato (40 totali).',true);return}
  lock(true);message('Il Coach interpreta la nota…');
  try{const data=await api('api/coach-notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...draft,body:field.value.trim(),exercise_id:select.value||null})});message(data.note.summary);field.value='';remember();await load()}
  catch(e){message(e.message||'Nota non inviata: la bozza è conservata, puoi riprovare.',true)}finally{lock(false)}
 }
 window.if1101MountNotes=function(){
  const page=document.querySelector('[data-page="coachquestions"]');if(!page)return;
  if(!box){
   box=el('div',null,'card');box.id='if1101Notes';box.append(el('div','Note per il Coach','ey'),el('h2','Dimmi cosa vuoi cambiare'),el('p','Scegli l’esercizio e descrivi la modifica. Puoi impostare ripetizioni, serie o recupero; le altre preferenze vengono lette dal Coach. Si applicano alle prossime schede.','sub'));
   const label=el('label','Esercizio (facoltativo)');select=el('select',null,'field');select.id='if1101NoteExercise';select.setAttribute('aria-label','Esercizio della nota');const general=el('option','Preferenza generale');general.value='';select.appendChild(general);
   for(const e of Object.values(window.IF72_LIBRARY||{}).filter(e=>!e.cardio&&!e.mobility&&!e.stretching)){const o=el('option',e.name);o.value=e.id;select.appendChild(o)}
   select.value=draft.exercise_id||'';label.appendChild(select);box.appendChild(label);
   field=el('textarea',null,'field');field.id='if1101NoteBody';field.rows=4;field.maxLength=2000;field.setAttribute('aria-label','Nota per il Coach');field.placeholder='Esempio: per il Bird dog voglio 20 ripetizioni per lato, perché 10 sono poche.';field.value=draft.body;box.appendChild(field);
   field.oninput=remember;select.onchange=remember;
   send=el('button','Invia nota al Coach','btn');send.id='if1101NoteSend';send.type='button';send.onclick=save;box.appendChild(send);
   status=el('p',null,'sub');status.id='if1101NoteStatus';status.setAttribute('role','status');box.appendChild(status);
   const details=el('details'),summary=el('summary','Note e indicazioni precedenti');list=el('div');list.id='if1101NotesHistory';details.append(summary,list);box.appendChild(details);load();
  }
  if(box.parentElement!==page)page.querySelector('h1')?.nextElementSibling?.insertAdjacentElement('afterend',box)||page.appendChild(box);
 };
 window.if1101Preferred=function(ex){
  if(!ex)return ex;const p=typeof IF50!=='undefined'?IF50.exercisePreferences?.[ex.id]:null;if(!p)return ex;
  const sets=Math.min(p.sets??ex.sets,IF50.energy==='Bassa'||ex.id==='bird_dog'?2:4),reps=p.reps??ex.reps,rest=p.rest??ex.rest;
  return {...ex,sets,reps,rest,seconds:ex.repType==='seconds'?reps:ex.seconds,progression:{action:'user',reason:'Indicazione salvata: '+reps+(ex.repType==='seconds'?' secondi':ex.perSide?' ripetizioni per lato':' ripetizioni')+' per serie, '+sets+' serie, recupero '+rest+' s.'}};
 };
 const build0=window.if50BuildPlan;if(typeof build0==='function')window.if50BuildPlan=function(){const plan=build0.apply(this,arguments);if(!Array.isArray(IF50.aiPreparedPlan)&&(IF50.plan||[]).some(e=>IF50.exercisePreferences?.[e.id])){const seconds=(IF50.plan||[]).reduce((sum,e)=>sum+(e.cardio?(Number(e.minutes||e.duration)||0)*60:e.mobility||e.stretching?(Number(e.seconds||e.reps)||30)*(e.perSide?2:1):(e.sets||1)*(e.repType==='seconds'?e.reps:e.reps*(e.perSide?8:3))+Math.max(0,(e.sets||1)-1)*(e.rest||0)+45),0);if(seconds>(Number(IF50.time)||45)*60)throw Error('Le indicazioni salvate superano il tempo disponibile. Aumenta la durata o modifica ripetizioni, serie o recuperi nelle Note per il Coach.')}return plan};
 const toPlan=window.if60ToPlan;if(typeof toPlan==='function')window.if60ToPlan=function(){return window.if1101Preferred(toPlan.apply(this,arguments))};
 const go0=window.go;if(typeof go0==='function')window.go=function(name){const out=go0.apply(this,arguments);if(name==='coachquestions'){window.if1101MountNotes();load()}return out};
 window.if1101MountNotes();
})();
