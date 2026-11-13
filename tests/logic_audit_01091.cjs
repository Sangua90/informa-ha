const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('../.test-runtime/node_modules/jsdom');
const web=path.join(__dirname,'../informa/web');
const names=fs.readFileSync(path.join(web,'../Dockerfile'),'utf8').match(/RUN for f in (.*?); do cat/)[1].split(' ');
const bundle=fs.readFileSync(path.join(web,'app.js'),'utf8')+names.map(n=>fs.readFileSync(path.join(web,n),'utf8')).join('');
async function fixture(options={}){
 const dom=new JSDOM(fs.readFileSync(path.join(web,'index.html'),'utf8'),{url:options.url||'https://informa.test/',runScripts:'dangerously'}),w=dom.window;
 w.questionItems=options.questions||[];
 for(const [k,v] of Object.entries(options.storage||{}))w.localStorage.setItem(k,v);
 const server=options.server||{session:null,revision:0,closed:{}};
 const jobs=new Map(),calls=[],observers=[],Observer=w.MutationObserver;let now=options.now||Date.now(),seq=0;
 w.MutationObserver=class extends Observer{constructor(fn){super(fn);observers.push(this)}};
 w.setTimeout=(fn,ms=0)=>{jobs.set(++seq,{fn,time:now+ms});return seq};w.clearTimeout=id=>jobs.delete(id);
 w.setInterval=(fn,ms)=>{jobs.set(++seq,{fn,time:now+ms,interval:ms});return seq};w.clearInterval=id=>jobs.delete(id);
 w.Date.now=()=>now;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.confirm=()=>true;w.console={log(){},error(){},warn(){}};
 w.fetch=async(url,opts={})=>{
  const body=typeof opts.body==='string'?JSON.parse(opts.body):{};calls.push({url,body,method:opts.method||'GET'});
  if(w.deferSet&&url==='api/set')await new Promise(resolve=>w.resolveSet=resolve);
  if(url.match(/^api\/coach-questions\/\d+\/answer$/)){
   if(w.deferQuestion)await new Promise(resolve=>w.resolveQuestion=resolve);
   if(w.failQuestion)throw Error('Risposta non inviata: collegamento assente');
  }
  if(w.deferFinish&&url==='api/coach/finish'||w.deferDiscard&&opts.method==='DELETE')await new Promise(resolve=>w.resolveClosure=resolve);
  if(w.deferTreadmill&&url==='api/treadmill-0970')await new Promise(resolve=>(w.treadmillResolvers??=[]).push(resolve));
  if(w.deferArchive&&url==='api/workout-flow-0949/archive')await new Promise(resolve=>(w.archiveResolvers??=[]).push(resolve));
  if(w.deferLoad&&url.startsWith('api/load-progression-0969/'))await new Promise(resolve=>(w.loadResolvers??=[]).push(resolve));
  if(w.failFinish&&url==='api/coach/finish')throw Error('offline');
  if(url==='api/ai/test'){
   if(w.deferAiTest)await new Promise(resolve=>w.resolveAiTest=resolve);
   const data=w.aiTestResult||{ok:true,connected:true,model:'gemini-3.6-flash',message:'Connessione Gemini attiva.'};return {ok:data.ok,json:async()=>data};
  }
  if(url.startsWith('api/workout-session')){
   let data={ok:true};let status=200;
   const sid=url.match(/workout-session\/([^/]+)\/close/)?.[1],query=new URL(url,'https://informa.test/').searchParams.get('session_id');
   if(sid){server.closed[sid]=body.state;if(server.session?.session_id===sid)server.session=null}
   else if(opts.method==='PUT'){
    if(server.closed[body.snapshot.session_id]){data={error:'closed'};status=410}
    else if(body.revision!==(server.session?server.revision:0)){data={error:'conflict'};status=409}
    else{if(!server.session)server.revision=0;server.session=JSON.parse(JSON.stringify(body.snapshot));data.revision=++server.revision}
   }else data=server.closed[query]?{session:null,state:server.closed[query]}:{session:server.session,revision:server.revision};
   return {ok:status===200,status,json:async()=>data};
  }
  let data={ok:true,items:[],disabled:[],guides:{},data:{},connected:false,reminder:{due:false},workout_id:101};
  if(url==='api/state')data={profile:{name:'Test'},version:'test'};
  if(url==='api/nutrition/today')data={totals:{},entries:[]};
  if(url.startsWith('api/load-progression-0969/')&&w.loadSuggestion!=null)data={suggestion:w.loadSuggestion,reason:'Ultimo carico'};
  if(url==='api/set'&&w.savedSet)data={...data,saved_set:w.savedSet};
  if(url==='api/workout-flow-0949/archive'&&w.archiveStatus)data={...data,status:w.archiveStatus};
  if(url==='api/nutrition/analyze-photo')data={ok:true,understood:'Mela',calories:80,protein_g:0,carbs_g:20,fat_g:0,fiber_g:3};
  if(url==='api/ai-workout-01089')data={mode:'gemini',decision:'train',reason:'Fixture',plan:w.aiPlan||[{id:'chest',sets:2,reps:10,rest:2},{id:'lat',sets:2,reps:10,rest:2}]};
  if(url==='api/ai-workout-01089'&&w.clarifyQuestion){w.questionItems=[w.clarifyQuestion];data={mode:'gemini',decision:'clarify',reason:'Serve un chiarimento',question:w.clarifyQuestion,plan:null}}
  if(url==='api/coach-questions'||url==='api/coach-questions/check')data={ok:true,items:w.questionItems};
  const questionId=Number(url.match(/^api\/coach-questions\/(\d+)\//)?.[1]);
  if(questionId){const q=w.questionItems.find(x=>x.id===questionId);if(url.endsWith('/answer'))Object.assign(q,{answer:body.answer,state:'answered',revision:q.revision+1});if(url.endsWith('/postpone'))q.deferred_until='2099-01-01T00:00:00';data={ok:true,question:q}}
  if(url.startsWith('api/treadmill-0970/plan'))data={ok:true,duration_min:2,phases:[{name:'Fase uno',minutes:1,speed_kmh:4,incline_pct:0},{name:'Fase due',minutes:1,speed_kmh:5,incline_pct:0}]};
  return {ok:true,json:async()=>data};
 };
 const script=w.document.createElement('script');script.textContent=bundle+'\nwindow.testPlan=IF50;window.testWorkId=()=>currentWorkoutId;';w.document.head.appendChild(script);const plan=w.testPlan;plan.exerciseCount=2;plan.stretch_mode='No';
 async function flush(){for(let i=0;i<18;i++)await Promise.resolve()}
 async function advance(ms=500){const end=now+ms;for(let i=0;i<5000;i++){const next=[...jobs].filter(([,j])=>j.time<=end).sort((a,b)=>a[1].time-b[1].time)[0];if(!next)break;const [id,j]=next;now=Math.max(now,j.time);jobs.delete(id);if(j.interval)jobs.set(id,{...j,time:now+j.interval});await j.fn();await flush()}now=end;await flush()}
 await flush();await advance(600);
 return {w,plan,calls,server,clock:()=>now,storage:()=>Object.fromEntries(Object.entries(w.localStorage)),advance,flush,jump:ms=>{now+=ms},generate:async()=>{await w.if50Generate();await advance(600)},close:()=>{observers.forEach(o=>o.disconnect());dom.window.close()}};
}
test('full bundle: new generation cannot inherit prior workout ID or archived rows',async()=>{
 const f=await fixture();try{await f.generate();await f.w.if108Skip('chest');await f.advance();assert.equal(f.w.testWorkId(),101);
 await f.w.if50Discard();await f.generate();assert.equal(f.w.testWorkId(),null);assert.ok(f.w.if108Progress().every(x=>!x.closed));
 }finally{f.close()}
});
test('full bundle: failed finish preserves the session; retry closes once after confirmation',async()=>{
 const f=await fixture();try{await f.generate();await f.w.if108Skip('chest');await f.advance();f.w.go('endworkout');f.w.failFinish=true;
 await f.w.if50Finish();await f.advance();assert.equal(f.w.document.querySelector('.page.active').dataset.page,'endworkout');assert.equal(f.w.testWorkId(),101);assert.equal(f.w.if928WorkoutPrepared(),true);
 f.w.failFinish=false;await f.w.if50Finish();await f.advance();assert.equal(f.w.document.querySelector('.page.active').dataset.page,'summary');assert.equal(f.w.testWorkId(),null);assert.equal(f.w.if928WorkoutPrepared(),false);
 const count=f.calls.filter(x=>x.url==='api/coach/finish').length;await f.w.if50Finish();assert.equal(f.calls.filter(x=>x.url==='api/coach/finish').length,count);
 }finally{f.close()}
});
test('full bundle: treadmill is first when planned and its phase resets for the next session',async()=>{
 const f=await fixture();try{f.plan.treadmill_choice='Sì';f.plan.treadmillMinutes=2;await f.generate();assert.equal(f.w.localStorage.getItem('informha_workout_active_0109'),'treadmill');
 f.w.if1048Toggle();await f.advance(61000);assert.match(f.w.document.querySelector('.if1048-phase').textContent,/Fase due/);
 await f.w.if50Discard();await f.generate();assert.match(f.w.document.querySelector('.if1048-phase').textContent,/Fase uno/);
 }finally{f.close()}
});
test('full bundle: stretching is retained until all target strength work is decided',async()=>{
 const f=await fixture();try{f.plan.stretch_mode='Sì';await f.generate();
 const flow={chest:{stage:'archived',status:'Completato',sets:{1:{done:true}}},lat:{stage:'planned',sets:{}}};f.w.localStorage.setItem('informha_workout_flow_0949',JSON.stringify(flow));
 f.w.if978PruneStretching();let saved=JSON.parse(f.w.localStorage.getItem('informha_workout_flow_0949'));assert.notEqual(saved.stretch_back_lats?.stage,'archived');
 flow.lat={stage:'archived',status:'Saltato',sets:{}};f.w.localStorage.setItem('informha_workout_flow_0949',JSON.stringify(flow));f.w.if978PruneStretching();saved=JSON.parse(f.w.localStorage.getItem('informha_workout_flow_0949'));assert.equal(saved.stretch_back_lats.status,'Non necessario');assert.notEqual(saved.stretch_chest?.stage,'archived');
 }finally{f.close()}
});
test('full bundle: recovery uses elapsed time and cancellation prevents late navigation',async()=>{
 const f=await fixture();try{await f.generate();f.w.if950SetContext('chest',1);f.w.startTimer(90);f.w.go('recovery');f.jump(60000);await f.advance(1000);assert.match(f.w.document.getElementById('timer').textContent,/00:29/);
 f.w.if950CancelRecovery();f.w.go('home');await f.advance(100000);assert.equal(f.w.document.querySelector('.page.active').dataset.page,'home');
 }finally{f.close()}
});
test('full bundle: generation stays blocked until a pending set is saved and its session closed',async()=>{
 const f=await fixture();try{await f.generate();f.w.if949Start('chest');f.w.if1041SetWeight('chest',5);f.w.deferSet=true;
 const saving=f.w.if50CompleteSet('chest',1);await f.flush();assert.ok(f.w.resolveSet);
 const sid=f.plan.sessionId;await f.generate();assert.equal(f.plan.sessionId,sid);f.w.resolveSet();await saving;await f.advance();await f.w.if50Discard();await f.generate();
 assert.equal(f.w.testWorkId(),null);assert.equal(f.w.document.querySelectorAll('[data-page=workout] .check.done').length,0);assert.notEqual(f.w.document.querySelector('.page.active').dataset.page,'recovery');
 }finally{f.close()}
});
test('full bundle: performed partial work retains its status and relevant stretching',async()=>{
 const f=await fixture();try{f.plan.stretch_mode='Sì';await f.generate();f.w.if949Start('chest');f.w.if1041SetWeight('chest',5);await f.w.if50CompleteSet('chest',1);await f.advance();await f.w.if108Skip('chest');await f.advance();
 assert.equal(f.w.if108Progress().find(x=>x.id==='chest').kind,'partial');await f.w.if108Skip('lat');await f.advance();
 const flow=JSON.parse(f.w.localStorage.getItem('informha_workout_flow_0949'));assert.notEqual(flow.stretch_chest?.status,'Non necessario');assert.equal(flow.stretch_back_lats?.status,'Non necessario');
 }finally{f.close()}
});
test('full bundle: invalid typed measurements are not silently converted to null',async()=>{
 const f=await fixture();try{f.w.go('progress');await f.advance();f.w.document.getElementById('mHeight').value='abc';
 const before=f.calls.filter(x=>x.url==='api/measurements-0978'&&x.method==='POST').length;await f.w.if978Save();assert.equal(f.calls.filter(x=>x.url==='api/measurements-0978'&&x.method==='POST').length,before);
 }finally{f.close()}
});
test('full bundle: double meal confirmation sends one idempotent save',async()=>{
 const f=await fixture();try{f.w.if105Open();await f.w.if105PhotoChosen({files:[new f.w.File(['test'],'meal.jpg',{type:'image/jpeg'})],value:'test'});
 await Promise.all([f.w.if105Save(),f.w.if105Save()]);const saves=f.calls.filter(x=>x.url==='api/nutrition/entry'&&x.method==='POST');assert.equal(saves.length,1);assert.match(saves[0].body.request_id,/^meal:/);
 }finally{f.close()}
});

test('second pass: rapid skip clicks send one archive with a stable request ID',async()=>{
 const f=await fixture();try{await f.generate();f.w.deferArchive=true;
 const a=f.w.if108Skip('chest'),b=f.w.if108Skip('chest');await f.flush();
 const saves=f.calls.filter(x=>x.url==='api/workout-flow-0949/archive');f.w.archiveResolvers.forEach(resolve=>resolve());await Promise.all([a,b]);
 assert.equal(saves.length,1);assert.match(saves[0].body.request_id,/:archive:chest$/);
 }finally{f.close()}
});

test('second pass: pending set save blocks skip, remove, swap, finish and discard',async()=>{
 const f=await fixture();try{await f.generate();f.w.if949Start('chest');f.w.if1041SetWeight('chest',5);f.w.deferSet=true;
 const saving=f.w.if50CompleteSet('chest',1);await f.flush();
 await f.w.if108Skip('chest');await f.w.if108Remove('chest');await f.w.if60Swap('chest','pec_fly');await f.w.if50Finish();await f.w.if50Discard();
 assert.equal(f.calls.filter(x=>x.url==='api/workout-flow-0949/archive'||x.url==='api/coach/finish'||x.method==='DELETE').length,0);
 assert.ok(f.plan.plan.some(x=>x.id==='chest'));f.w.resolveSet();await saving;
 }finally{f.close()}
});

test('second pass: replacement cannot reuse an earlier archived exercise',async()=>{
 const f=await fixture();try{await f.generate();f.w.if949Start('chest');await f.w.if60Swap('chest','pec_fly');await f.advance();
 const before=JSON.stringify(f.w.if108Progress().find(x=>x.id==='chest'));await f.w.if60Swap('pec_fly','chest');await f.advance();
 assert.ok(f.plan.plan.some(x=>x.id==='pec_fly'));assert.ok(!f.plan.plan.some(x=>x.id==='chest'));
 assert.equal(JSON.stringify(f.w.if108Progress().find(x=>x.id==='chest')),before);
 }finally{f.close()}
});

test('second pass: slow load suggestion updates the visible weight control',async()=>{
 const f=await fixture();try{f.w.deferLoad=true;f.w.loadSuggestion=5;await f.generate();
 assert.equal(f.w.document.querySelector('#if50ex_chest .if1041-weight-input').value,'');
 f.w.loadResolvers.forEach(resolve=>resolve());await f.flush();
 assert.equal(f.w.document.querySelector('#if50ex_chest .if1041-weight-input').value,'5');
 }finally{f.close()}
});

test('second pass: slow suggestion cannot overwrite a weight being typed',async()=>{
 const f=await fixture();try{f.w.deferLoad=true;f.w.loadSuggestion=5;await f.generate();
 const field=f.w.document.querySelector('#if50ex_chest .if1041-weight-input');field.value='9';field.dispatchEvent(new f.w.Event('input',{bubbles:true}));
 f.w.loadResolvers.forEach(resolve=>resolve());await f.flush();
 assert.equal(field.value,'9');assert.notEqual(f.w.document.getElementById('if50w_chest_1').value,'5');
 }finally{f.close()}
});

test('second pass: an explicitly cleared weight stays clear after render and suggestion',async()=>{
 const f=await fixture();try{f.w.loadSuggestion=5;await f.generate();f.w.if1041SetWeight('chest','');f.w.if50RenderWorkout();await f.advance();
 assert.equal(f.w.document.getElementById('if50w_chest_1').value,'');assert.equal(f.w.document.querySelector('#if50ex_chest .if1041-weight-input').value,'');
 }finally{f.close()}
});

test('second pass: retried series displays the values actually saved by the server',async()=>{
 const f=await fixture();try{await f.generate();f.w.if949Start('chest');f.w.if1041SetWeight('chest',7);
 f.w.savedSet={weight:5,reps:10,rep_type:'reps',set_no:1};await f.w.if50CompleteSet('chest',1);await f.advance();
 assert.equal(f.w.document.getElementById('if50w_chest_1').value,'5');assert.ok(f.w.document.getElementById('if50c_chest_1').classList.contains('done'));
 }finally{f.close()}
});

test('second pass: Plank countdown still saves seconds through the complete production bundle',async()=>{
 const f=await fixture();try{f.w.aiPlan=[{id:'plank',sets:2,reps:30,rest:60}];await f.generate();
 f.w.if949Start('plank');await f.advance();f.w.if1041Primary('plank');await f.advance(31000);
 const saves=f.calls.filter(x=>x.url==='api/set');assert.equal(saves.length,1);assert.equal(saves[0].body.rep_type,'seconds');assert.equal(saves[0].body.reps,30);
 assert.ok(f.w.document.getElementById('if50c_plank_1').classList.contains('done'));
 }finally{f.close()}
});

test('second pass: generation cannot replace a session while its substitution is being saved',async()=>{
 const f=await fixture();try{await f.generate();f.w.if949Start('chest');f.w.deferArchive=true;
 const replacing=f.w.if60Swap('chest','pec_fly');await f.flush();assert.ok(f.w.archiveResolvers?.length);
 const sid=f.plan.sessionId;await f.generate();assert.equal(f.plan.sessionId,sid);f.w.archiveResolvers.forEach(resolve=>resolve());await replacing;await f.advance();await f.w.if50Discard();await f.generate();
 assert.equal(f.w.testWorkId(),null);assert.ok(f.plan.plan.some(x=>x.id==='chest'));assert.ok(!f.plan.plan.some(x=>x.id==='pec_fly'));
 assert.ok(f.w.if108Progress().every(x=>!x.closed));
 }finally{f.close()}
});

test('second pass: archive retry displays the canonical decision returned by the server',async()=>{
 const f=await fixture();try{await f.generate();f.w.archiveStatus='Parziale';await f.w.if108Skip('chest');await f.advance();
 assert.equal(f.w.if108Progress().find(x=>x.id==='chest').kind,'partial');
 }finally{f.close()}
});

test('second pass: removing an exercise preserves already performed partial work',async()=>{
 const f=await fixture();try{await f.generate();f.w.if949Start('chest');f.w.if1041SetWeight('chest',5);await f.w.if50CompleteSet('chest',1);await f.advance();
 await f.w.if108Remove('chest');await f.advance();assert.equal(f.w.if108Progress().find(x=>x.id==='chest').kind,'partial');
 assert.ok(!f.plan.plan.some(x=>x.id==='chest'));assert.equal(f.calls.filter(x=>x.url==='api/workout-flow-0949/archive').at(-1).body.status,'Parziale');
 }finally{f.close()}
});

for(const action of ['finish','discard'])test('second pass: '+action+' must finish before the next session can be prepared',async()=>{
 const f=await fixture();try{await f.generate();await f.w.if108Skip('chest');await f.advance();
 f.w[action==='finish'?'deferFinish':'deferDiscard']=true;
 const closing=action==='finish'?f.w.if50Finish():f.w.if50Discard();await f.flush();assert.ok(f.w.resolveClosure);
 if(action==='discard'){await f.w.if50Discard();assert.equal(f.calls.filter(x=>x.method==='DELETE').length,1)}
 const sid=f.plan.sessionId;await f.generate();assert.equal(f.plan.sessionId,sid);f.w.resolveClosure();await closing;await f.advance();await f.generate();
 assert.equal(f.w.testWorkId(),null);assert.equal(f.plan.closed,false);assert.ok(f.plan.plan.some(x=>x.id==='chest'));
 assert.equal(f.w.if928WorkoutPrepared(),true);assert.ok(f.w.if108Progress().every(x=>!x.closed));
 }finally{f.close()}
});

test('second pass: treadmill completion remains locked until the save response',async()=>{
 const f=await fixture();try{f.plan.treadmill_choice='Sì';f.plan.treadmillMinutes=2;await f.generate();
 f.w.if108AskEffort=async()=>3;f.w.deferTreadmill=true;
 const first=f.w.if1048Complete();await f.flush();assert.ok(f.w.treadmillResolvers?.length);
 const second=f.w.if1048Complete();await f.flush();const count=f.calls.filter(x=>x.url==='api/treadmill-0970'&&x.method==='POST').length;
 f.w.treadmillResolvers.forEach(resolve=>resolve());await Promise.all([first,second]);assert.equal(count,1);
 }finally{f.close()}
});

const coachQuestion=(extra={})=>({id:7,topic:'frequency',body:'Quante volte pensi di allenarti questa settimana?',state:'open',answer:null,revision:0,notification_pending:false,...extra});
test('coach questions: notification deep link opens the actual question form with a working X',async()=>{
 const f=await fixture({url:'https://informa.test/?coach_question=7',questions:[coachQuestion()]});try{
 assert.equal(f.w.document.querySelector('.page.active').dataset.page,'coachquestions');
 assert.match(f.w.document.querySelector('.if1093-question h2').textContent,/Quante volte/);assert.equal(f.w.document.getElementById('if1093Answer').value,'');
 f.w.document.querySelector('[data-page=coachquestions] .if1088-close').click();await f.advance();assert.notEqual(f.w.document.querySelector('.page.active').dataset.page,'coachquestions');
 }finally{f.close()}
});

test('coach questions: save is single-flight, persists the answer, and can be edited',async()=>{
 const f=await fixture({questions:[coachQuestion()]});try{f.w.go('coachquestions');await f.flush();
 let field=f.w.document.getElementById('if1093Answer');field.value='Due volte, martedì e sabato';field.dispatchEvent(new f.w.Event('input',{bubbles:true}));f.w.deferQuestion=true;
 f.w.document.getElementById('if1093Send').click();await f.flush();f.w.document.getElementById('if1093Send').click();
 assert.equal(f.calls.filter(x=>x.url==='api/coach-questions/7/answer').length,1);f.w.resolveQuestion();await f.flush();
 assert.equal(f.w.document.getElementById('if1093Answer'),null);assert.match(f.w.document.getElementById('if1093Confirmation').textContent,/domanda è completata/);
 const history=f.w.document.querySelector('[data-page=coachquestions] details');assert.equal(history.open,false);history.querySelector('summary').click();history.querySelector('button[data-question-id="7"]').click();
 assert.equal(f.w.document.getElementById('if1093Answer').value,'Due volte, martedì e sabato');
 f.w.deferQuestion=false;field=f.w.document.getElementById('if1093Answer');field.value='Tre volte';field.dispatchEvent(new f.w.Event('input',{bubbles:true}));f.w.document.getElementById('if1093Send').click();await f.flush();
 const saves=f.calls.filter(x=>x.url==='api/coach-questions/7/answer');assert.equal(saves[1].body.revision,1);assert.equal(saves[1].body.answer,'Tre volte');
 }finally{f.close()}
});

test('coach questions: failed save keeps the draft and question text cannot inject HTML',async()=>{
 const f=await fixture({questions:[coachQuestion({body:'<img src=x onerror=alert(1)> Quante sedute?'})]});try{f.w.go('coachquestions');await f.flush();
 const field=f.w.document.getElementById('if1093Answer');field.value='La mia risposta da conservare';field.dispatchEvent(new f.w.Event('input',{bubbles:true}));f.w.failQuestion=true;
 f.w.document.getElementById('if1093Send').click();await f.flush();assert.equal(f.w.document.getElementById('if1093Answer').value,'La mia risposta da conservare');
 assert.equal(f.w.document.querySelector('.if1093-question img'),null);assert.match(f.w.document.querySelector('[data-page=coachquestions] [role=alert]').textContent,/non inviata/);
 }finally{f.close()}
});

test('coach questions: AI clarification opens the question page and does not create a workout',async()=>{
 const f=await fixture();try{f.w.clarifyQuestion=coachQuestion();await f.generate();
 assert.equal(f.w.document.querySelector('.page.active').dataset.page,'coachquestions');assert.equal(f.plan.started,null);assert.equal(f.w.if928WorkoutPrepared(),false);
 const later=[...f.w.document.querySelectorAll('[data-page=coachquestions] button')].find(b=>b.textContent.startsWith('Rispondi più tardi'));later.click();await f.flush();
 assert.equal(f.w.document.querySelector('.page.active').dataset.page,'checkin');assert.equal(f.calls.filter(x=>x.url==='api/coach-questions/7/postpone').length,1);
 }finally{f.close()}
});

test('notification fix: native HA app path opens the specific question without query parameters',async()=>{
 const f=await fixture({url:'https://informa.test/app/abc_informa/coachquestions/7',questions:[coachQuestion()]});try{
 assert.equal(f.w.document.querySelector('.page.active').dataset.page,'coachquestions');assert.equal(f.w.document.querySelector('.if1093-question').dataset.questionId,'7');
 }finally{f.close()}
});

test('notification fix: HA route bridge opens the question in an already loaded webview',async()=>{
 const f=await fixture({questions:[coachQuestion()]});try{
 f.w.dispatchEvent(new f.w.MessageEvent('message',{origin:'https://informa.test',source:f.w,data:{type:'home-assistant/properties',route:{prefix:'/app/abc_informa',path:'/coachquestions/7'}}}));await f.flush();
 assert.equal(f.w.document.querySelector('.page.active').dataset.page,'coachquestions');assert.equal(f.w.document.querySelector('.if1093-question').dataset.questionId,'7');
 }finally{f.close()}
});

test('notification fix: closing does not trap navigation, and a repeated old notification opens again',async()=>{
 const f=await fixture({url:'https://informa.test/?coach_question=7',questions:[coachQuestion()]});try{
 f.w.document.querySelector('[data-page=coachquestions] .if1088-close').click();await f.advance(2000);assert.notEqual(f.w.document.querySelector('.page.active').dataset.page,'coachquestions');
 f.w.history.replaceState(null,'','/?coach_question=7#home');await f.advance(2000);
 assert.equal(f.w.document.querySelector('.page.active').dataset.page,'coachquestions');
 }finally{f.close()}
});

test('notification fix: messages from other origins cannot navigate or choose a question',async()=>{
 const f=await fixture({questions:[coachQuestion()]});try{
 f.w.dispatchEvent(new f.w.MessageEvent('message',{origin:'https://untrusted.test',source:f.w,data:{type:'home-assistant/properties',route:{prefix:'/app/abc_informa',path:'/coachquestions/7'}}}));await f.flush();
 assert.equal(f.w.document.querySelector('.page.active').dataset.page,'home');
 }finally{f.close()}
});

test('answered questions: an old notification shows completion, with the question and answer closed',async()=>{
 const f=await fixture({url:'https://informa.test/app/abc_informa/coachquestions/7',questions:[coachQuestion({state:'answered',answer:'Tre volte',revision:1,mobile_notification_error:'Old phone error'})]});try{
 assert.equal(f.w.document.getElementById('if1093Answer'),null);assert.equal(f.w.document.querySelector('.if1093-question'),null);
 assert.match(f.w.document.getElementById('if1093Confirmation').textContent,/completata/);assert.equal(f.w.document.querySelector('[data-page=coachquestions] details').open,false);
 assert.ok(!f.w.document.querySelector('[data-page=coachquestions]').textContent.includes('Old phone error'));
 }finally{f.close()}
});


test('inline measurements: eight unique fields stay on the page and the landmark follows focus',async()=>{
 const f=await fixture();try{f.w.go('progress');await f.advance();
 const page=f.w.document.querySelector('[data-page=progress]'),form=f.w.document.getElementById('if978Measures');assert.ok(page.querySelector('h1').compareDocumentPosition(form)&f.w.Node.DOCUMENT_POSITION_FOLLOWING);assert.ok(page.querySelector('.if1088-close').compareDocumentPosition(form)&f.w.Node.DOCUMENT_POSITION_FOLLOWING);
 for(const [id,zone] of [['mHeight',null],['mWeight',null],['mChest','chest'],['mArm','armR'],['mWaist','waist'],['mHip','hips'],['mThigh','thighR'],['mCalf','calfR']]){
  assert.equal(f.w.document.querySelectorAll('#'+id).length,1);f.w.document.getElementById(id).focus();await f.flush();assert.equal(f.w.document.querySelector('.page.active').dataset.page,'progress');
  if(zone)assert.equal(f.w.document.querySelector('[data-zone='+zone+']').getAttribute('stroke'),'#ff9418');assert.ok(f.w.document.querySelector('#if1096MeasureHelp ol').children.length>=2);
 }
 const field=f.w.document.getElementById('mWaist');field.value='99.5';f.w.document.getElementById('mHip').focus();assert.equal(field.value,'99.5');
 assert.equal(f.w.document.querySelectorAll('#mArmR,#mArmL,#mThighR,#mThighL').length,0);
 assert.equal(f.calls.filter(x=>x.url==='api/measurements-0978'&&x.method==='POST').length,0);
 }finally{f.close()}
});
test('inline measurements: one chosen side is saved without fabricating the opposite side',async()=>{
 const f=await fixture();try{f.w.go('progress');await f.advance();f.w.document.getElementById('mSide').value='left';
 for(const [id,value] of [['mWaist','99.5'],['mChest','110'],['mArm','37'],['mHip','105'],['mThigh','55'],['mCalf','40']])f.w.document.getElementById(id).value=value;
 await f.w.if978Save();const save=f.calls.filter(x=>x.url==='api/measurements-0978'&&x.method==='POST').at(-1);
 assert.equal(save.body.arm_l_cm,37);assert.equal(save.body.thigh_l_cm,55);assert.equal(save.body.arm_r_cm,undefined);assert.equal(save.body.thigh_r_cm,undefined);assert.equal(save.body.hip_cm,105);assert.equal(save.body.calf_cm,40);assert.equal(save.body.measurement_side,'left');
 }finally{f.close()}
});
test('durable session: treadmill survives a cold webview and elapsed time continues',async()=>{
 const server={session:null,revision:0,closed:{}};let f=await fixture({server});try{
  f.plan.treadmill_choice='Sì';f.plan.treadmillMinutes=2;await f.generate();f.w.if1048Toggle();await f.advance(9000);
  f.w.dispatchEvent(new f.w.Event('pagehide'));await f.flush();const storage=f.storage(),now=f.clock(),before=f.w.if1041TimerSnapshot().treadmill;
  assert.equal(before.running,true);f.close();f=await fixture({server,storage,now});f.w.if1096Resume();await f.advance(1000);
  assert.equal(f.w.if928WorkoutPrepared(),true);assert.equal(f.w.document.querySelector('.page.active').dataset.page,'workout');assert.equal(f.w.if1041TimerSnapshot().treadmill.running,true);assert.equal(f.w.if1041TimerSnapshot().treadmill.end,before.end);
  f.jump(15000);await f.advance(500);assert.ok(f.w.if1041TimerSnapshot().treadmill.left<before.left-10);assert.match(f.w.document.querySelector('.if1048-main').textContent,/PAUSA/);
 }finally{f.close()}
});
test('durable session: manually paused treadmill stays paused across app switch and restart',async()=>{
 let f=await fixture();try{f.plan.treadmill_choice='Sì';f.plan.treadmillMinutes=2;await f.generate();f.w.if1048Toggle();await f.advance(9000);f.w.if1048Toggle();
 f.w.dispatchEvent(new f.w.Event('pagehide'));await f.flush();const before=f.w.if1041TimerSnapshot().treadmill,storage=f.storage(),server=f.server;f.close();f=await fixture({server,storage});f.jump(120000);f.w.if1096Resume();await f.advance();
 assert.equal(f.w.if1041TimerSnapshot().treadmill.running,false);assert.equal(f.w.if1041TimerSnapshot().treadmill.left,before.left);
 }finally{f.close()}
});
test('durable session: skipped order, partial sets, unsaved weights and substitution survive cold restart',async()=>{
 let f=await fixture();try{await f.generate();f.w.if949Start('chest');f.w.if1041SetWeight('chest',5);await f.w.if50CompleteSet('chest',1);await f.advance();await f.w.if108Skip('chest');await f.advance();await f.w.if60Swap('lat','pec_fly');await f.advance();
 f.w.if1041SetWeight('pec_fly',9);f.w.if1096Checkpoint();await f.advance();const progress=JSON.stringify(f.w.if108Progress().map(({id,kind})=>({id,kind}))),storage=f.storage(),server=f.server,sid=f.plan.sessionId;f.close();f=await fixture({storage,server});f.w.if1096Resume();await f.advance();
 assert.equal(f.plan.sessionId,sid);assert.equal(f.w.testWorkId(),101);assert.equal(f.w.document.querySelector('#if50ex_pec_fly .if1041-weight-input').value,'9');assert.equal(JSON.stringify(f.w.if108Progress().map(({id,kind})=>({id,kind}))),progress);
 }finally{f.close()}
});
test('durable session: Plank keeps running across background and manual pause survives restart',async()=>{
 let f=await fixture();try{f.w.aiPlan=[{id:'plank',sets:2,reps:30,rest:60}];await f.generate();f.w.if949Start('plank');await f.advance();f.w.if1041Primary('plank');await f.advance(5000);
 f.w.dispatchEvent(new f.w.Event('pagehide'));assert.equal(f.w.if1041TimerSnapshot().hold.running,true);f.jump(10000);await f.advance(200);assert.ok(f.w.if1041TimerSnapshot().hold.left<20);
 f.w.if1041Primary('plank');const hold=f.w.if1041TimerSnapshot().hold;const storage=f.storage(),server=f.server;f.close();f=await fixture({storage,server});f.w.if1096Resume();f.jump(60000);await f.advance();assert.equal(f.w.if1041TimerSnapshot().hold.running,false);assert.equal(f.w.if1041TimerSnapshot().hold.left,hold.left);assert.equal(f.calls.filter(x=>x.url==='api/set').length,0);
 }finally{f.close()}
});
test('durable session: recovery and stretching retain elapsed time and explicit pause',async()=>{
 let f=await fixture();try{f.plan.stretch_mode='Sì';await f.generate();const extra=f.plan.plan.find(e=>e.mobility);f.w.if978Side(extra.id,0);await f.advance(2000);f.w.dispatchEvent(new f.w.Event('pagehide'));assert.equal(f.w.if978TimerSnapshot()[extra.id].paused,false);
 const storage=f.storage(),server=f.server;f.close();f=await fixture({storage,server});f.w.if1096Resume();f.jump(10000);await f.advance();assert.ok(f.w.if978TimerSnapshot()[extra.id].left<extra.seconds-8);
 f.w.if950SetContext('chest',1);f.w.startTimer(90);f.w.if950PauseRecovery();f.w.if1096Checkpoint();await f.advance();const next=f.storage();f.close();f=await fixture({storage:next,server});f.jump(60000);f.w.if1096Resume();await f.advance();await f.flush();assert.equal(f.w.document.querySelector('.page.active').dataset.page,'recovery');assert.equal(f.w.if950RecoverySnapshot().left,90);assert.equal(f.w.if950RecoverySnapshot().paused,true);
 }finally{f.close()}
});
for(const action of ['finish','discard'])test('durable session: '+action+' removes resume and a stale mirror cannot reopen it',async()=>{
 let f=await fixture();try{await f.generate();await f.w.if108Skip('chest');await f.advance();const old=f.storage(),server=f.server;
 if(action==='finish')await f.w.if50Finish();else await f.w.if50Discard();await f.advance();assert.equal(f.w.localStorage.getItem('informha_session_01096'),null);f.close();f=await fixture({storage:old,server});assert.equal(f.w.if928WorkoutPrepared(),false);assert.equal(f.w.document.getElementById('if1096Resume'),null);
 }finally{f.close()}
});
test('durable session: running Plank expires after cold restart and records one timed set',async()=>{
 let f=await fixture();try{f.w.aiPlan=[{id:'plank',sets:2,reps:30,rest:60}];await f.generate();f.w.if949Start('plank');await f.advance();f.w.if1041Primary('plank');await f.advance(2000);f.w.dispatchEvent(new f.w.Event('pagehide'));await f.flush();
 const storage=f.storage(),server=f.server,now=f.clock()+35000;f.close();f=await fixture({storage,server,now});f.w.if1096Resume();await f.advance(600);
 const saves=f.calls.filter(c=>c.url==='api/set');assert.equal(saves.length,1);assert.equal(saves[0].body.rep_type,'seconds');assert.equal(saves[0].body.reps,30);
 assert.ok(f.w.document.getElementById('if50c_plank_1').classList.contains('done'));
 }finally{f.close()}
});
test('durable session: running recovery counts time away after a cold restart',async()=>{
 let f=await fixture();try{await f.generate();f.w.if950SetContext('chest',1);f.w.startTimer(90);f.w.if1096Checkpoint();await f.advance(500);
 const storage=f.storage(),server=f.server,now=f.clock()+20000;f.close();f=await fixture({storage,server,now});f.w.if1096Resume();await f.advance();assert.equal(f.w.document.querySelector('.page.active').dataset.page,'recovery');assert.ok(f.w.if950RecoverySnapshot().left<70);assert.equal(f.w.if950RecoverySnapshot().paused,false);
 }finally{f.close()}
});
test('durable session: removing all exercises still retains a session that can be closed',async()=>{
 let f=await fixture();try{await f.generate();await f.w.if108Remove('chest');await f.advance();await f.w.if108Remove('lat');await f.advance();assert.equal(f.plan.plan.length,0);
 const storage=f.storage(),server=f.server;assert.ok(storage.informha_session_01096);f.close();f=await fixture({storage,server});f.w.if1096Resume();await f.advance();assert.equal(f.w.document.querySelector('.page.active').dataset.page,'endworkout');assert.equal(f.w.testWorkId(),101);
 }finally{f.close()}
});
test('Gemini connection: actual result remains visible after settings reload and double-click sends once',async()=>{
 const f=await fixture();try{f.w.go('aicoach');await f.advance();f.w.deferAiTest=true;
 const first=f.w.if91TestAI();await f.flush();await f.w.if91TestAI();assert.equal(f.calls.filter(c=>c.url==='api/ai/test').length,1);
 f.w.resolveAiTest();await first;await f.w.if91LoadAISettings();await f.advance(6000);assert.match(f.w.document.getElementById('if91AiTestResult').textContent,/Verifica riuscita.*gemini-3.6-flash/);
 f.w.deferAiTest=false;f.w.aiTestResult={ok:false,connected:false,error:'Gemini non disponibile (HTTP 503) <img src=x>'};await f.w.if91TestAI();await f.advance(6000);
 assert.match(f.w.document.getElementById('if91AiTestResult').textContent,/Verifica non riuscita.*503/);assert.equal(f.w.document.querySelector('#if91AiTestResult img'),null);
 }finally{f.close()}
});


test('dumbbell convention: all twelve exercises distinguish one and two implements, never machines or bodyweight',async()=>{
 const f=await fixture();try{
 const weighted=Object.values(f.w.IF72_LIBRARY).filter(x=>x.loadType==='kg');assert.equal(weighted.length,12);
 for(const ex of weighted){const load=f.w.if1099Load(ex);assert.equal(load.basis,'dumbbell_discs_each');assert.equal(load.count,['one_arm_dumbbell_row','goblet_squat','single_leg_romanian_deadlift','seated_dumbbell_calf_raise'].includes(ex.id)?1:2);assert.match(load.note,/impugnatura e fermadischi/)}
 assert.equal(f.w.if1099Load({id:'curl',name:'Curl bicipiti al cavo basso',equipment:'Fassi'}).basis,'kg_total');
 assert.equal(f.w.if1099Load(f.w.IF72_LIBRARY.chest).basis,'machine_plates');
 assert.equal(f.w.if1099Load(f.w.IF72_LIBRARY.calf_raise).basis,'bodyweight');
 }finally{f.close()}
});

test('dumbbell convention: two-manubri labels survive late suggestions, plus/minus and rerender; save keeps each-disc value',async()=>{
 const f=await fixture();try{f.w.aiPlan=[{id:'dumbbell_shoulder_press',sets:2,reps:10,rest:2}];f.w.loadSuggestion=6;await f.generate();
 const card=()=>f.w.document.getElementById('if50ex_dumbbell_shoulder_press');
 assert.match(card().querySelector('.if1041-weight small').textContent,/DISCHI PER MANUBRIO/);assert.match(card().querySelector('.if1099-load-note').textContent,/2 manubri/);
 assert.equal(card().querySelector('.if1041-weight-input').value,'6');
 assert.match(card().querySelector('.if969-load').textContent,/6 kg di dischi per manubrio/);
 f.w.if1041Weight('dumbbell_shoulder_press',1);assert.equal(card().querySelector('.if1041-weight-input').value,'7');f.w.if1041Weight('dumbbell_shoulder_press',-1);
 f.w.if50RenderWorkout();await f.advance();assert.equal(card().querySelector('.if1041-weight-input').value,'6');assert.match(card().textContent,/non la somma dei due/);
 f.w.if949Start('dumbbell_shoulder_press');await f.w.if50CompleteSet('dumbbell_shoulder_press',1);await f.advance();
 assert.equal(f.calls.find(x=>x.url==='api/set').body.weight,6);assert.equal(f.w.document.querySelector('[data-page="recovery"]').classList.contains('active'),true);
 }finally{f.close()}
});

test('dumbbell convention: one-manubrio instruction and decimal load survive cold resume and history uses the same unit',async()=>{
 let f=await fixture();try{f.w.aiPlan=[{id:'goblet_squat',sets:2,reps:10,rest:2}];await f.generate();
 f.w.if1041SetWeight('goblet_squat','7,5');f.w.if1096Checkpoint();await f.advance();const storage=f.storage(),server=f.server;f.close();f=await fixture({storage,server});f.w.if1096Resume();await f.advance();
 const card=f.w.document.getElementById('if50ex_goblet_squat');assert.equal(card.querySelector('.if1041-weight-input').value,'7.5');assert.match(card.querySelector('.if1099-load-note').textContent,/Usa 1 manubrio/);
 const api=f.w.api;f.w.api=async url=>url==='api/workouts-0933/55'?{workout:{title:'Seduta'},sets:[{exercise:'Goblet squat a box/panca',weight:7.5,reps:10,set_no:1}],cardio:[]}:api(url);
 await f.w.if933OpenDetail(55);assert.match(f.w.document.getElementById('if933DetailHost').textContent,/7.5 kg di dischi per manubrio/);
 }finally{f.close()}
});


test('bodyweight progression: local fallback and substitutions use the shared next-session target, with a visible reason',async()=>{
 let f=await fixture();try{
 const targets={heel_taps:{target:12,repType:'reps',action:'progress',previous_sets:2,reason:'Due sedute complete e facili: +2 ripetizioni.'},plank:{target:35,repType:'seconds',action:'progress',previous_sets:2,reason:'Due sedute complete e facili: +5 secondi.'}};
 const api=f.w.api;f.w.api=async(url,opts)=>{if(url==='api/ai-workout-01089')throw Error('offline');if(url.startsWith('api/bodyweight-progression-01099'))return {items:targets};return api(url,opts)};
 f.w.if1087Available=id=>id==='heel_taps'||id==='plank';await f.generate();
 assert.equal(f.plan.aiGeneration.mode,'local_fallback');assert.equal(f.plan.plan.length,2);
 for(const ex of f.plan.plan){assert.equal(ex.reps,targets[ex.id].target);assert.equal(ex.sets,2);assert.equal(ex.progression.reason,targets[ex.id].reason)}
 assert.match(f.w.document.querySelector('.if1044-current .if1099-progression-note').textContent,/Due sedute complete/);
 f.w.if1096Checkpoint();await f.advance();const storage=f.storage(),server=f.server;f.close();f=await fixture({storage,server});f.w.if1096Resume();await f.advance();
 const replacement=f.w.if60ToPlan('plank');assert.equal(replacement.reps,35);assert.equal(replacement.sets,2);
 }finally{f.close()}
});

test('bodyweight progression: new timed target is retained on cold resume and the countdown saves exactly those seconds',async()=>{
 let f=await fixture();try{f.w.aiPlan=[{id:'plank',sets:2,reps:35,rest:2,progression:{action:'progress',target:35,reason:'Due sedute complete e facili: +5 secondi.'}}];await f.generate();
 f.w.if1096Checkpoint();await f.advance();const storage=f.storage(),server=f.server;f.close();f=await fixture({storage,server});f.w.if1096Resume();await f.advance();
 assert.equal(f.plan.plan[0].reps,35);assert.match(f.w.document.querySelector('.if1099-progression-note').textContent,/5 secondi/);
 f.w.if949Start('plank');f.w.if1041Primary('plank');await f.advance(34000);assert.equal(f.calls.filter(x=>x.url==='api/set').length,0);await f.advance(1500);
 const saved=f.calls.find(x=>x.url==='api/set');assert.equal(saved.body.reps,35);assert.equal(saved.body.rep_type,'seconds');assert.equal(saved.body.weight,null);
 }finally{f.close()}
});
