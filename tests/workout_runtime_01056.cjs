const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('../.test-runtime/node_modules/jsdom');
// Keep the rendering/state wrappers in their actual Docker bundle order.
const wrapperNames=new Set(['workout_ui_067.js','workout_flow_0949.js','workout_focus_0950.js','adaptive_library_0972.js','treadmill_focus_fix_0974.js','treadmill_render_fix_0975.js','automatic_stretching_0978.js','temporary_equipment_0979.js','treadmill_flow_fix_0983.js','treadmill_complete_fix_0984.js','treadmill_advance_fix_0990.js','exercise_complete_fix_0994.js','treadmill_final_fix_0995.js','workout_controller_0108.js','workout_runner_01041.js']);
const docker=fs.readFileSync(path.join(__dirname,'../informa/Dockerfile'),'utf8');
const scripts=docker.match(/RUN for f in (.*?); do cat/)[1].split(' ').filter(x=>wrapperNames.has(x));
function fixture(){
 const dom=new JSDOM('<div class="app"><section data-page="checkin"><button onclick="if50Generate()">Genera</button></section><section data-page="workout"></section><section data-page="recovery"><div class="card"><span id="timer"></span><div id="timerbar"></div><button>Torna all’allenamento</button></div></section><section data-page="profile"></section></div><nav class="nav"></nav>',{url:'https://informa.test/',runScripts:'dangerously'});
 const w=dom.window;const jobs=new Map(),requests=[];let now=0,seq=0;
 w.setTimeout=(fn,delay=0)=>{jobs.set(++seq,{fn,time:now+delay});return seq};w.clearTimeout=id=>jobs.delete(id);
 w.setInterval=(fn,delay)=>{jobs.set(++seq,{fn,time:now+delay,interval:delay});return seq};w.clearInterval=id=>jobs.delete(id);
 w.HTMLElement.prototype.scrollIntoView=function(){};w.scrollTo=()=>{};w.confirm=()=>true;w.console={log(){},error:console.error};w.toast=s=>w.lastToast=s;w.timerInt=null;w.currentWorkoutId=null;
 w.IF50={time:45,energy:'Normale',plan:[{id:'chest',name:'Chest',sets:3,reps:10,rest:2,loadType:'plates'},{id:'plank',name:'Plank',sets:3,reps:30,rest:2,loadType:'bodyweight'},{id:'lat',name:'Lat',sets:3,reps:10,rest:2,loadType:'plates'}]};
 w.go=page=>{w.page=page};w.if50Num=id=>{const v=w.document.getElementById(id)?.value;return v==null||v===''?null:Number(v)};
 w.api=async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});if(w.failArchive&&url.includes('/archive'))throw Error('offline');return {workout_id:42}};
 w.if50RenderWorkout=function(){w.document.querySelector('[data-page="workout"]').innerHTML=w.IF50.plan.map(e=>`<div class="if50-ex" id="if50ex_${e.id}"><div class="row"></div>${Array.from({length:e.sets},(_,i)=>w.if50SetRow(e,i+1)).join('')}<select id="if50f_${e.id}"><option>Giusta</option></select></div>`).join('')};
 w.if60Swap=function(oldId,newId){w.IF50.plan=w.IF50.plan.map(e=>e.id===oldId?{...w.IF72_LIBRARY[newId],rest:2}:e);w.if50RenderWorkout()};
 w.if50ExerciseCard=()=>'';w.if970SaveTreadmill=async()=>{};
 w.if50Generate=async()=>{w.if50BuildPlan();w.if50RenderWorkout()};
 w.if50CompleteSet=async()=>{};w.if50Status=async()=>{};
 for(const file of scripts)w.eval(fs.readFileSync(path.join(__dirname,'../informa/web',file),'utf8'));
 w.if108AskEffort=async()=>3;w.Date.now=()=>now;
 w.if50RenderWorkout();
 async function advance(ms=500){const end=now+ms;for(let turns=0;turns<500;turns++){const next=[...jobs].filter(([,j])=>j.time<=end).sort((a,b)=>a[1].time-b[1].time)[0];if(!next)break;const [id,j]=next;now=j.time;jobs.delete(id);if(j.interval)jobs.set(id,{...j,time:now+j.interval});await j.fn();for(let n=0;n<12;n++)await Promise.resolve()}now=end;for(let n=0;n<12;n++)await Promise.resolve()}
 const state=id=>JSON.parse(w.localStorage.getItem('informha_workout_flow_0949')||'{}')[id];
 const active=()=>w.localStorage.getItem('informha_workout_active_0109');
 async function set(id,n){const input=w.document.getElementById(`if50w_${id}_${n}`);if(input)input.value='1';await w.if50CompleteSet(id,n);await advance(100);assert.equal(w.page,'recovery')}
 async function recover(natural=false){if(natural)await advance(2600);else{w.if950SkipRecovery();await advance(500)}}
 return {w,dom,advance,state,active,set,recover,requests};
}
test('actual load order: three sets, recovery, canonical archive, next exercise',async()=>{
 const f=fixture();try{await f.advance();f.w.if949Start('chest');
 for(let n=1;n<=3;n++){await f.set('chest',n);assert.notEqual(f.state('chest').stage,'archived');await f.recover(n===1);}
 assert.equal(f.state('chest').stage,'archived');assert.equal(f.active(),'plank');
 assert.equal(f.requests.filter(r=>r.url.includes('/archive')&&r.body.status==='Completato').length,1);
 assert.equal(f.requests.filter(r=>r.url==='api/coach/exercise-status').length,0);
 assert.equal(f.w.document.getElementById('if50r_plank_1').value,'30');
 for(let n=1;n<=3;n++){assert.equal(f.w.document.getElementById('if50r_plank_'+n).value,'30');await f.set('plank',n);await f.recover()}assert.equal(f.state('plank').stage,'archived');assert.equal(f.active(),'lat');
 }finally{f.dom.window.close()}
});
test('replacement followed by full completion; visible skip advances to next exercise',async()=>{
 const f=fixture();try{await f.advance();f.w.if949Start('chest');await f.w.if60Swap('chest','pec_fly');await f.advance();
 for(let n=1;n<=3;n++){await f.set('pec_fly',n);await f.recover()}
 assert.equal(f.state('pec_fly').stage,'archived');assert.equal(f.active(),'plank');
 const skip=[...f.w.document.querySelectorAll('#if50ex_plank button')].find(b=>b.textContent==='Salta esercizio');assert.ok(skip);skip.click();await f.advance();
 assert.equal(f.state('plank').status,'Saltato');assert.equal(f.active(),'lat');await f.set('lat',1);await f.recover();
 assert.equal(f.w.document.querySelectorAll('#if50ex_lat .check.done').length,1);
 }finally{f.dom.window.close()}
});
test('failed archive stays retryable without returning to series one',async()=>{
 const f=fixture();try{await f.advance();f.w.if949Start('chest');
 for(let n=1;n<=3;n++){await f.set('chest',n);if(n===3)f.w.failArchive=true;await f.recover()}
 assert.equal(f.active(),'chest');assert.notEqual(f.state('chest').stage,'archived');
 assert.match(f.w.document.querySelector('#if50ex_chest .if1041-line').textContent,/3 di 3/);
 f.w.failArchive=false;await f.w.if1041Primary('chest');await f.advance();assert.equal(f.active(),'plank');
 }finally{f.dom.window.close()}
});
test('catalog and detail pages mount when navigation is outside app',async()=>{
 const f=fixture();try{f.w.IF51_LIBRARY={chest:{name:'Chest',group:'Petto'}};
 for(const file of ['interface_061.js','exercise_catalog_0954.js'])f.w.eval(fs.readFileSync(path.join(__dirname,'../informa/web',file),'utf8'));
 await f.advance(600);f.w.if62OpenExercise('chest');assert.ok(f.w.document.querySelector('.app [data-page="exercise-detail"]'));assert.ok(f.w.document.querySelector('.app [data-page="exercise-library-063"]'));
 }finally{f.dom.window.close()}
});


test('canonical segments retain plan order after DOM reorder, removal and stale focus',async()=>{
 const f=fixture();try{await f.advance();f.w.if949Start('chest');await f.w.if108Skip('chest');await f.advance();
 await f.w.if50Status('plank','Parziale');await f.advance();
 const before=f.w.if108Progress().map(x=>[x.id,x.kind]);
 const page=f.w.document.querySelector('[data-page="workout"]');page.prepend(f.w.document.getElementById('if50ex_lat'));f.w.document.getElementById('if50ex_chest').remove();
 f.w.localStorage.setItem('informha_workout_active_0109','chest');f.w.if1041Refresh();
 assert.deepEqual(f.w.if108Progress().map(x=>[x.id,x.kind]),before);
 assert.deepEqual(Array.from(f.w.document.querySelectorAll('.if1041-dots i'),x=>x.dataset.exercise),['chest','plank','lat']);
 assert.ok(f.w.document.querySelector('.if1041-dots i.skip'));assert.ok(f.w.document.querySelector('.if1041-dots i.partial'));
 }finally{f.dom.window.close()}
});
test('replacement retains partial history and does not rewrite earlier segments',async()=>{
 const f=fixture();try{await f.advance();await f.w.if108Skip('chest');await f.advance();await f.set('plank',1);await f.recover();
 await f.w.if60Swap('plank','reverse_crunch');await f.advance();
 assert.deepEqual(Array.from(f.w.if108Progress(),x=>[x.id,x.kind]),[['chest','skip'],['plank','partial'],['reverse_crunch',''],['lat','']]);
 f.w.if50RenderWorkout();await f.advance();assert.equal(f.w.if108Progress()[0].kind,'skip');assert.equal(f.w.if108Progress()[1].kind,'partial');
 }finally{f.dom.window.close()}
});
test('Plank countdown pauses, survives rendering and saves once before recovery',async()=>{
 const f=fixture();try{await f.advance();await f.w.if108Skip('chest');await f.advance();f.w.if949Start('plank');f.w.if1041Refresh();
 assert.match(f.w.document.querySelector('#if50ex_plank .if1041-line').textContent,/30 s/);
 f.w.if1041Primary('plank');await f.advance(10000);assert.equal(f.requests.filter(x=>x.url==='api/set').length,0);
 f.w.if1041Primary('plank');const label=f.w.document.querySelector('#if50ex_plank .if1046-series').textContent;await f.advance(5000);assert.equal(f.w.document.querySelector('#if50ex_plank .if1046-series').textContent,label);
 f.w.if50RenderWorkout();await f.advance();f.w.if1041Primary('plank');await f.advance(21000);
 assert.equal(f.requests.filter(x=>x.url==='api/set').length,1);assert.equal(f.requests.find(x=>x.url==='api/set').body.reps,30);assert.equal(f.requests.find(x=>x.url==='api/set').body.rep_type,'seconds');assert.equal(f.w.page,'recovery');
 await f.recover();assert.equal(f.w.document.querySelectorAll('#if50ex_plank .check.done').length,1);
 }finally{f.dom.window.close()}
});
test('skip cancels a running hold without saving; timed aliases normalize, dynamic core remains reps',async()=>{
 const f=fixture();try{await f.advance();await f.w.if108Skip('chest');await f.advance();f.w.if949Start('plank');f.w.if1041Primary('plank');await f.advance(1000);await f.w.if108Skip('plank');await f.advance(35000);assert.equal(f.requests.filter(x=>x.url==='api/set').length,0);
 for(const e of [{id:'plank',reps:10},{id:'side_plank',reps:20},{id:'wall_sit'},{id:'hold',repType:'sec',reps:45}]){f.w.if108Normalize(e);assert.equal(e.repType,'seconds');assert.equal(e.reps,e.id==='hold'?45:30)}
 for(const id of ['reverse_crunch','heel_taps','glute_bridge'])assert.equal(f.w.if108Timed(f.w.IF72_LIBRARY[id]),false);
 for(const e of Object.values(f.w.IF72_LIBRARY).filter(x=>x.mobility||x.stretching))assert.equal(f.w.if108Timed(e),true);
 }finally{f.dom.window.close()}
});
test('weights plus/minus and treadmill skip keep canonical previous segment',async()=>{
 const f=fixture();try{f.w.IF50.plan.unshift({id:'treadmill',name:'Tapis',cardio:true,sets:0});f.w.if108ResetOrder();f.w.if50RenderWorkout();await f.advance();
 await f.w.if1049SkipTreadmill();await f.advance();assert.equal(f.state('treadmill').status,'Saltato');assert.equal(f.active(),'chest');
 f.w.if1041Weight('chest',1);assert.equal(f.w.document.getElementById('if50w_chest_1').value,'1');f.w.if1041Weight('chest',-1);assert.equal(f.w.document.getElementById('if50w_chest_1').value,'1');
 f.w.if50RenderWorkout();await f.advance();assert.equal(f.w.if108Progress()[0].kind,'skip');
 }finally{f.dom.window.close()}
});

test('legacy catalog refresh preserves supported dumbbell reverse curl in the plan',async()=>{
 const f=fixture();try{f.w.IF51_LIBRARY={};f.w.IF50.plan.push({...f.w.IF72_LIBRARY.reverse_curl});
 f.w.eval(fs.readFileSync(path.join(__dirname,'../informa/web/exercise_catalog_0954.js'),'utf8'));await f.advance();
 assert.ok(f.w.IF50.plan.some(x=>x.id==='reverse_curl'));
 assert.equal(Object.values(f.w.IF72_LIBRARY).filter(x=>x.loadType==='kg').length,12);
 }finally{f.dom.window.close()}
});

test('history displays timed sets in seconds and dynamic exercises in repetitions',async()=>{
 const f=fixture();try{f.w.api=async()=>({workout:{title:'Seduta'},sets:[{exercise:'Plank',set_no:1,reps:30},{exercise:'Hold',set_no:1,reps:45,rep_type:'seconds'},{exercise:'Curl',set_no:1,reps:10,rep_type:'reps'}]});
 f.w.eval(fs.readFileSync(path.join(__dirname,'../informa/web/workout_history_0933.js'),'utf8'));await f.w.if933OpenDetail(1);
 const text=f.w.document.getElementById('if933DetailHost').textContent;assert.match(text,/30 s/);assert.match(text,/45 s/);assert.match(text,/10 rep/);
 }finally{f.dom.window.close()}
});

test('AI-selected prescriptions survive final builder wrappers without a chat question',async()=>{
 const f=fixture();try{await f.advance();f.w.IF50.exerciseCount=2;f.w.IF50.stretch_mode='No';
 const base=f.w.api;let requests=0;
 f.w.api=async(url,options)=>{if(url==='api/ai-workout-01089'){requests++;return {mode:'gemini',decision:'train',reason:'Obiettivo forza e recupero storico',plan:[{id:'dumbbell_curl',sets:2,reps:8,rest:60,repType:'reps'},{id:'plank',sets:2,reps:25,rest:45,repType:'seconds'}]}}return base(url,options)};
 f.w.eval(fs.readFileSync(path.join(__dirname,'../informa/web/ai_workout_01089.js'),'utf8'));
 await Promise.all([f.w.if50Generate(),f.w.if50Generate()]);await f.advance();
 assert.equal(requests,1);assert.deepEqual(Array.from(f.w.IF50.plan,x=>x.id),['dumbbell_curl','plank']);assert.equal(f.w.IF50.plan[0].reps,8);assert.equal(f.w.IF50.plan[1].reps,25);
 assert.equal(f.w.IF50.aiPreparedPlan,undefined);assert.match(f.w.document.querySelector('.if109-source summary').textContent,/generata da AI/);
 f.w.if50RenderWorkout();await f.advance();assert.equal(f.w.IF50.plan[0].reps,8);assert.equal(f.active(),'dumbbell_curl');
 }finally{f.dom.window.close()}
});
test('AI recovery does not start an empty workout; fallback stays visibly local',async()=>{
 const f=fixture();try{await f.advance();const old=f.w.IF50.plan;
 f.w.api=async()=>({mode:'gemini',decision:'recovery',reason:'Recupero dopo fatica elevata',plan:[]});
 f.w.eval(fs.readFileSync(path.join(__dirname,'../informa/web/ai_workout_01089.js'),'utf8'));
 await f.w.if50Generate();assert.equal(f.w.IF50.plan,old);assert.match(f.w.document.getElementById('if109PlanStatus').textContent,/consiglia recupero/);assert.equal(f.w.document.querySelector('[data-page="checkin"] button').disabled,false);
 f.w.api=async()=>({mode:'local_fallback',reason:'Gemini non configurato',plan:null});f.w.IF50.exerciseCount=2;
 await f.w.if50Generate();await f.advance();assert.equal(f.w.IF50.aiGeneration.mode,'local_fallback');assert.match(f.w.document.querySelector('.if109-source summary').textContent,/AI non utilizzata/);
 }finally{f.dom.window.close()}
});
test('numeric effort is synchronized for future AI decisions',async()=>{
 const f=fixture();try{f.w.eval(fs.readFileSync(path.join(__dirname,'../informa/web/ai_workout_01089.js'),'utf8'));await f.w.if109RecordEffort('plank',4);
 const r=f.requests.find(x=>x.url==='api/exercise-effort-01089');assert.equal(r.body.effort,4);assert.equal(r.body.exercise_id,'plank');
 }finally{f.dom.window.close()}
});
