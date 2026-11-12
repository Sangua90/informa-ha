// Resume the complete unfinished session; saved sets remain canonical on the server.
(function(){
 const KEY='informha_session_01096',CLOSED='informha_closed_sessions_01096',FLOW='informha_workout_flow_0949',ORDER='informha_workout_order_01085',ACTIVE='informha_workout_active_0109';
 const OPTIONS=['planTitle','started','aiGeneration','energy','pain','pain_detail','time','exerciseCount','treadmill_choice','treadmillMinutes','stretch_mode','finishReason','effort'];
 let snapshot=null,pendingRecovery=null,revision=0,ready=false,restoring=false,needsResume=false,syncing=false,conflict=false,lastBody='',syncedBody='',syncJob=null;
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch(e){return fallback}};
 const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch(e){toast('Memoria del dispositivo piena: verifica il salvataggio della seduta su Home Assistant')}};
 const active=()=>!!(IF50.sessionId&&Array.isArray(IF50.plan)&&IF50.started&&!IF50.closed);
 function banner(){
  const home=document?.querySelector('[data-page=home]');if(!home)return;let box=document.getElementById('if1096Resume');
  if(!active()){box?.remove();return}
  if(!box){box=document.createElement('div');box.id='if1096Resume';box.className='card coach';const title=document.createElement('h2');title.textContent='Allenamento da completare';const text=document.createElement('p');text.className='sub';text.dataset.sessionStatus='';const b=document.createElement('button');b.className='btn';b.textContent='Riprendi allenamento';b.onclick=()=>resume();box.append(title,text,b);home.prepend(box)}
  const text=conflict?'La seduta è stata aggiornata su un altro dispositivo. Riapri InFormha per caricare quella salvata.':syncedBody===lastBody?'Seduta conservata sul dispositivo e su Home Assistant.':'Seduta conservata sul dispositivo; sincronizzazione con Home Assistant in corso.';
  const p=box.querySelector('[data-session-status]');if(p.textContent!==text)p.textContent=text;
 }
 async function request(path,body,method='POST',keepalive=false){const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);try{const r=await fetch(path,body===undefined?{cache:'no-store',signal:controller.signal}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body),keepalive,signal:controller.signal});const data=await r.json();if(!r.ok){const e=Error(data.error||'Salvataggio seduta non riuscito');e.status=r.status;throw e}return data}finally{clearTimeout(timeout)}}
 function capture(){
  if(restoring||!active())return null;
  for(const c of document.querySelectorAll('[data-page=workout] .if50-ex')){const visible=c.querySelector('.if1041-weight-input[data-edited]'),row=c.querySelector('.setrow:not(:has(.check.done))'),input=row?.querySelector('[id^=if50w_]');if(visible&&input){input.value=visible.value.replace(',','.');input.dataset.edited='1'}}
  window.if949CaptureSession?.();
  const flow=read(FLOW,{}),order=read(ORDER,IF50.plan.map(x=>x.id));
  const value={session_id:IF50.sessionId,workout_id:currentWorkoutId||null,plan:IF50.plan,options:Object.fromEntries(OPTIONS.map(k=>[k,IF50[k]??null])),flow,order,active:localStorage.getItem(ACTIVE),names:{...snapshot?.names,...Object.fromEntries(order.map(id=>[id,IF50.plan.find(e=>e.id===id)?.name||snapshot?.names?.[id]||id]))},recovery:pendingRecovery||window.if950RecoverySnapshot?.(),timers:window.if1041TimerSnapshot?.(),extras:window.if978TimerSnapshot?.()};
  const body=JSON.stringify(value);if(body!==lastBody){lastBody=body;snapshot={...value,updated_at:Date.now()};write(KEY,{snapshot,revision})}banner();return snapshot;
 }
 async function sync(keepalive=false){
  if(syncing||conflict||restoring||!ready)return;const value=capture();if(!value||lastBody===syncedBody)return;syncing=true;const body=lastBody,sid=value.session_id;
  try{const d=await request('api/workout-session',{revision,snapshot:value},'PUT',keepalive);if(IF50.sessionId===sid&&!IF50.closed){revision=d.revision;syncedBody=body;write(KEY,{snapshot,revision})}}
  catch(e){if(e.status===409){conflict=true;toast(e.message)}else if(e.status===410){localStorage.removeItem(KEY);IF50.closed=true;window.if928LockWorkout?.();toast('La seduta risulta già terminata su Home Assistant')}}
  finally{syncing=false;banner()}
 }
 function checkpoint(){capture();clearTimeout(syncJob);syncJob=setTimeout(()=>sync(),500)}
 function background(){capture();sync(true)}
 async function closed(sid,state){
  if(!sid)return;const list=read(CLOSED,{});list[sid]=state;write(CLOSED,list);localStorage.removeItem(KEY);snapshot=null;pendingRecovery=null;lastBody='';syncedBody='';banner();
  try{await request('api/workout-session/'+encodeURIComponent(sid)+'/close',{state});delete list[sid];write(CLOSED,list)}catch(e){}
 }
 function restore(value,serverRevision){
  if(!Array.isArray(value?.plan)||!value.session_id||read(CLOSED,{})[value.session_id])return false;
  restoring=true;window.if1041ResetTimers?.();window.if978ResetTimers?.();window.if950CancelRecovery?.();
  IF50.plan=JSON.parse(JSON.stringify(value.plan));for(const key of OPTIONS)if(value.options?.[key]!=null)IF50[key]=value.options[key];IF50.sessionId=value.session_id;IF50.closed=false;IF50.finishing=false;currentWorkoutId=value.workout_id||null;
  write(FLOW,value.flow||{});write(ORDER,value.order||value.plan.map(e=>e.id));value.active?localStorage.setItem(ACTIVE,value.active):localStorage.removeItem(ACTIVE);window.if949ReloadSession?.();
  revision=serverRevision||0;snapshot=value;pendingRecovery=value.recovery||null;lastBody='';syncedBody='';window.if928UnlockWorkout?.();window.if50RenderWorkout();window.if949HydrateSession?.();window.if1041RestoreTimers?.(value.timers);window.if978RestoreTimers?.(value.extras);needsResume=true;restoring=false;capture();return true;
 }
 function resume(){
  if(!ready){toast('Recupero della seduta in corso…');return}if(!active())return;
  needsResume=false;window.if928UnlockWorkout?.();baseGo(IF50.plan.length?'workout':'endworkout');window.if1041Refresh?.();
  const recovery=pendingRecovery;pendingRecovery=null;if(recovery)window.if950RestoreRecovery?.(recovery);checkpoint();
 }
 window.if1096Resume=resume;window.if1096Checkpoint=checkpoint;
 const baseGo=window.go;window.go=function(name){if(ready&&active()&&name==='checkin'){toast('Hai un allenamento da completare');resume();return}if(name==='workout'&&needsResume){resume();return}const result=baseGo.apply(this,arguments);banner();return result};
 const generate=window.if50Generate;window.if50Generate=async function(){await window.if1096Ready;if(active()||IF50.finishing||window.if108IsSaving?.()){toast('Riprendi o termina la seduta in corso prima di prepararne un’altra');resume();return}revision=0;lastBody='';syncedBody='';conflict=false;const out=await generate.apply(this,arguments);checkpoint();return out};
 for(const name of ['if50CompleteSet','if108Skip','if108Remove','if60Swap','if978Next','if970SaveTreadmill','if949Start','if1041SetWeight','if1041Weight','if978Side','if1048Toggle','if1041Primary','if950PauseRecovery','if950AddRecovery','startTimer']){const original=window[name];if(typeof original!=='function')continue;window[name]=function(){const r=original.apply(this,arguments);if(r?.then)return r.finally(checkpoint);checkpoint();return r}}
 const finish=window.if50Finish;window.if50Finish=async function(){const sid=IF50.sessionId,result=await finish.apply(this,arguments);if(result===true)await closed(sid,'saved');else checkpoint();return result};
 const discard=window.if50Discard;window.if50Discard=async function(){const sid=IF50.sessionId,result=await discard.apply(this,arguments);if(IF50.closed)await closed(sid,'discarded');else checkpoint();return result};
 document.addEventListener('input',e=>{if(e.target.closest('[data-page=workout]'))checkpoint()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)background()});window.addEventListener('pagehide',background);
 setInterval(()=>{if(active()){capture();sync()}},5000);
 window.if1096Ready=(async()=>{
  const local=read(KEY,null),pending=read(CLOSED,{});
  for(const [sid,state] of Object.entries(pending)){try{await request('api/workout-session/'+encodeURIComponent(sid)+'/close',{state});delete pending[sid]}catch(e){}}write(CLOSED,pending);
  try{
   let data=await request('api/workout-session'+(local?.snapshot?.session_id?'?session_id='+encodeURIComponent(local.snapshot.session_id):''));
   if(data.state){localStorage.removeItem(KEY);const current=await request('api/workout-session');if(current.session)data=current}
   if(data.state){localStorage.removeItem(KEY)}else if(data.session){const same=local?.snapshot?.session_id===data.session.session_id;let value=data.session;if(same&&local.revision===data.revision&&local.snapshot.updated_at>data.session.updated_at){value=local.snapshot;for(const [id,state] of Object.entries(data.session.flow||{})){const mine=value.flow[id]||{};const sets={...mine.sets};for(const [n,set] of Object.entries(state.sets||{}))if(set.done)sets[n]=set;value.flow[id]={...mine,...(state.stage==='archived'?state:{}),sets}}value.workout_id=data.session.workout_id}restore(value,data.revision)}else if(local?.snapshot)restore(local.snapshot,0);
  }catch(e){if(local?.snapshot)restore(local.snapshot,local.revision)}
  ready=true;banner();if(active())sync();
 })();
})();
