// Personal equipment exclusions, shared by the standalone catalog and the app.
(function(){
 const URL='api/exercise-availability-01087',KEY='informha_exercise_exclusions_01087';
 const aliases={mobility_back:'mobility_back_lats',stretch_trunk:'stretch_trunk_core'};
 const canonical=id=>aliases[id]||id;
 let disabled=new Set(),items=[],request=null;
 try{disabled=new Set(JSON.parse(localStorage.getItem(KEY)||'[]'))}catch(e){}
 window.if1087Available=id=>!disabled.has(canonical(id));
 const esc=value=>String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 function row(e,excluded){
   return '<div class="exercise-library-row" data-exercise-id="'+esc(e.id)+'"><div class="measure"><span><b>'+esc(e.name)+'</b></span></div>'+
     (!excluded?'<img src="guide-local/'+encodeURIComponent(e.id)+'?v=01087" alt="'+esc(e.name)+'" loading="lazy" style="width:100%;border-radius:16px" onerror="this.style.display=\'none\'">':'')+
     '<button type="button" class="btn secondary" data-availability-id="'+esc(e.id)+'" data-enabled="'+excluded+'">'+(excluded?'Ripristina nella mia lista':'Elimina dalla mia lista')+'</button></div>';
 }
 window.if1087LibraryHtml=function(){
   if(!items.length)return '';
   const active=items.filter(e=>window.if1087Available(e.id)),removed=items.filter(e=>!window.if1087Available(e.id)),groups={};
   active.forEach(e=>(groups[e.group]||(groups[e.group]=[])).push(e));
   return '<div class="ey">Libreria</div><h1>Esercizi</h1><a class="btn secondary" data-photo-library href="./#exercise-photos">Foto e guide esercizi</a><div class="sub">Elimina dalla tua lista gli esercizi non adatti alla tua attrezzatura: il Coach non li proporrà nelle nuove sedute. Lo storico resta salvato. Nella seduta già aperta puoi saltarli o sostituirli.</div><p>'+active.length+' disponibili · '+removed.length+' esclusi</p>'+
     Object.entries(groups).map(([group,rows])=>'<div class="card"><div class="ey">'+esc(group)+'</div>'+rows.map(e=>row(e,false)).join('')+'</div>').join('')+
     '<details class="card"'+(!active.length?' open':'')+'><summary>Esercizi esclusi ('+removed.length+')</summary>'+removed.map(e=>row(e,true)).join('')+'</details><a class="btn secondary" href="./">Indietro</a>';
 };
 function render(){
   const server=document.querySelector('[data-page="exercises-server"]');
   if(server)server.innerHTML=window.if1087LibraryHtml();
   window.if1087RenderLibraries?.();
 }
 async function refresh(){
   if(request)return request;
   request=(async()=>{
     const response=await fetch(URL,{cache:'no-store'});
     if(!response.ok)throw Error('Impossibile caricare la tua lista esercizi');
     const data=await response.json();
     if(!Array.isArray(data.disabled)||!Array.isArray(data.items))throw Error('Lista esercizi non disponibile');
     disabled=new Set(data.disabled);items=data.items;
     try{localStorage.setItem(KEY,JSON.stringify([...disabled]))}catch(e){}
     render();return data;
   })();
   try{return await request}finally{request=null}
 }
 window.if1087Refresh=refresh;
 function message(text){if(typeof toast==='function')toast(text);else{let p=document.getElementById('if1087Message');if(!p){p=document.createElement('p');p.id='if1087Message';document.querySelector('.app')?.prepend(p)}if(p)p.textContent=text}}
 document.addEventListener('click',async event=>{
   const button=event.target.closest('[data-availability-id]');if(!button)return;
   event.preventDefault();if(button.disabled)return;button.disabled=true;
   const id=button.dataset.availabilityId,enabled=button.dataset.enabled==='true';
   try{
     const response=await fetch(URL+'/'+encodeURIComponent(id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled})});
     if(!response.ok)throw Error('Modifica non salvata. Riprova.');
     // Only update local availability after the server has saved successfully.
     enabled?disabled.delete(canonical(id)):disabled.add(canonical(id));
     try{localStorage.setItem(KEY,JSON.stringify([...disabled]))}catch(e){}
     render();message(enabled?'Esercizio ripristinato':'Esercizio eliminato dalla tua lista');
   }catch(e){message(e.message)}finally{button.disabled=false}
 });
 const generate=window.if50Generate;
 if(typeof generate==='function')window.if50Generate=async function(){
   try{await refresh()}catch(e){message(e.message);return}
   const out=await generate.apply(this,arguments);
   if(typeof IF50!=='undefined'&&!IF50.plan?.some(e=>!e.cardio&&!e.mobility&&!e.stretching))message('Nessun esercizio di forza compatibile disponibile. Ripristina alcuni esercizi dalla tua lista.');
   return out;
 };
 // Guard direct calls too, before older swap wrappers archive the original exercise.
 const swap=window.if60Swap;
 if(typeof swap==='function')window.if60Swap=async function(oldId,newId){try{await refresh()}catch(e){message(e.message);return}if(!window.if1087Available(newId)){message('Esercizio escluso dalla tua lista');return}return swap.apply(this,arguments)};
 for(const name of ['if60Append','if60AddExercise','if60ShowSwap','if60UseGroup','if60ResumePending']){
   const original=window[name];if(typeof original!=='function')continue;
   window[name]=async function(){try{await refresh()}catch(e){message(e.message);return}return original.apply(this,arguments)};
 }
 refresh().catch(e=>message(e.message));
})();
