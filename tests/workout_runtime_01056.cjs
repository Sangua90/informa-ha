const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('../.test-runtime/node_modules/jsdom');
const scripts=['workout_flow_0949.js','workout_focus_0950.js','adaptive_library_0972.js','exercise_complete_fix_0994.js','workout_controller_0108.js','workout_runner_01041.js'];
function fixture(){
 const dom=new JSDOM('<div class="app"><section data-page="workout"></section><section data-page="recovery"><div class="card"><span id="timer"></span><div id="timerbar"></div><button>Torna all’allenamento</button></div></section><section data-page="profile"></section></div><nav class="nav"></nav>',{url:'https://informa.test/',runScripts:'dangerously'});
 const w=dom.window;const jobs=new Map(),requests=[];let now=0,seq=0;
 w.setTimeout=(fn,delay=0)=>{jobs.set(++seq,{fn,time:now+delay});return seq};w.clearTimeout=id=>jobs.delete(id);
 w.setInterval=(fn,delay)=>{jobs.set(++seq,{fn,time:now+delay,interval:delay});return seq};w.clearInterval=id=>jobs.delete(id);
 w.HTMLElement.prototype.scrollIntoView=function(){};w.scrollTo=()=>{};w.confirm=()=>true;w.console={log(){},error:console.error};w.toast=s=>w.lastToast=s;w.timerInt=null;w.currentWorkoutId=null;
 w.IF50={time:45,energy:'Normale',plan:[{id:'chest',name:'Chest',sets:3,reps:10,rest:2,loadType:'plates'},{id:'plank',name:'Plank',sets:3,reps:30,rest:2,loadType:'bodyweight'},{id:'lat',name:'Lat',sets:3,reps:10,rest:2,loadType:'plates'}]};
 w.go=page=>{w.page=page};w.if50Num=id=>{const v=w.document.getElementById(id)?.value;return v==null||v===''?null:Number(v)};
 w.api=async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});if(w.failArchive&&url.includes('/archive'))throw Error('offline');return {workout_id:42}};
 w.if50RenderWorkout=function(){w.document.querySelector('[data-page="workout"]').innerHTML=w.IF50.plan.map(e=>`<div class="if50-ex" id="if50ex_${e.id}"><div class="row"></div>${Array.from({length:e.sets},(_,i)=>w.if50SetRow(e,i+1)).join('')}<select id="if50f_${e.id}"><option>Giusta</option></select></div>`).join('')};
 w.if60Swap=function(oldId,newId){w.IF50.plan=w.IF50.plan.map(e=>e.id===oldId?{...w.IF72_LIBRARY[newId],rest:2}:e);w.if50RenderWorkout()};
 w.if50CompleteSet=async()=>{};w.if50Status=async()=>{};
 for(const file of scripts)w.eval(fs.readFileSync(path.join(__dirname,'../informa/web',file),'utf8'));
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
