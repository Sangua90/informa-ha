const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('../.test-runtime/node_modules/jsdom');
const web=path.join(__dirname,'../informa/web');
const names=fs.readFileSync(path.join(web,'../Dockerfile'),'utf8').match(/RUN for f in (.*?); do cat/)[1].split(' ');
const bundle=fs.readFileSync(path.join(web,'app.js'),'utf8')+names.map(n=>fs.readFileSync(path.join(web,n),'utf8')).join('');
async function fixture(){
 const dom=new JSDOM(fs.readFileSync(path.join(web,'index.html'),'utf8'),{url:'https://informa.test/',runScripts:'dangerously'}),w=dom.window;
 const jobs=new Map(),calls=[],observers=[],Observer=w.MutationObserver;let now=Date.now(),seq=0;
 w.MutationObserver=class extends Observer{constructor(fn){super(fn);observers.push(this)}};
 w.setTimeout=(fn,ms=0)=>{jobs.set(++seq,{fn,time:now+ms});return seq};w.clearTimeout=id=>jobs.delete(id);
 w.setInterval=(fn,ms)=>{jobs.set(++seq,{fn,time:now+ms,interval:ms});return seq};w.clearInterval=id=>jobs.delete(id);
 w.Date.now=()=>now;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.confirm=()=>true;w.console={log(){},error(){},warn(){}};
 w.fetch=async(url,opts={})=>{
  const body=typeof opts.body==='string'?JSON.parse(opts.body):{};calls.push({url,body,method:opts.method||'GET'});
  if(w.deferSet&&url==='api/set')await new Promise(resolve=>w.resolveSet=resolve);
  if(w.failFinish&&url==='api/coach/finish')throw Error('offline');
  let data={ok:true,items:[],disabled:[],guides:{},data:{},connected:false,reminder:{due:false},workout_id:101};
  if(url==='api/state')data={profile:{name:'Test'},version:'test'};
  if(url==='api/nutrition/today')data={totals:{},entries:[]};
  if(url==='api/nutrition/analyze-photo')data={ok:true,understood:'Mela',calories:80,protein_g:0,carbs_g:20,fat_g:0,fiber_g:3};
  if(url==='api/ai-workout-01089')data={mode:'gemini',decision:'train',reason:'Fixture',plan:[{id:'chest',sets:2,reps:10,rest:2},{id:'lat',sets:2,reps:10,rest:2}]};
  if(url.startsWith('api/treadmill-0970/plan'))data={ok:true,duration_min:2,phases:[{name:'Fase uno',minutes:1,speed_kmh:4,incline_pct:0},{name:'Fase due',minutes:1,speed_kmh:5,incline_pct:0}]};
  return {ok:true,json:async()=>data};
 };
 const script=w.document.createElement('script');script.textContent=bundle+'\nwindow.testPlan=IF50;window.testWorkId=()=>currentWorkoutId;';w.document.head.appendChild(script);const plan=w.testPlan;plan.exerciseCount=2;plan.stretch_mode='No';
 async function flush(){for(let i=0;i<18;i++)await Promise.resolve()}
 async function advance(ms=500){const end=now+ms;for(let i=0;i<5000;i++){const next=[...jobs].filter(([,j])=>j.time<=end).sort((a,b)=>a[1].time-b[1].time)[0];if(!next)break;const [id,j]=next;now=Math.max(now,j.time);jobs.delete(id);if(j.interval)jobs.set(id,{...j,time:now+j.interval});await j.fn();await flush()}now=end;await flush()}
 await flush();await advance(600);
 return {w,plan,calls,advance,flush,jump:ms=>{now+=ms},generate:async()=>{await w.if50Generate();await advance(600)},close:()=>{observers.forEach(o=>o.disconnect());dom.window.close()}};
}
test('full bundle: new generation cannot inherit prior workout ID or archived rows',async()=>{
 const f=await fixture();try{await f.generate();await f.w.if108Skip('chest');await f.advance();assert.equal(f.w.testWorkId(),101);
 await f.generate();assert.equal(f.w.testWorkId(),null);assert.ok(f.w.if108Progress().every(x=>!x.closed));
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
 await f.generate();assert.match(f.w.document.querySelector('.if1048-phase').textContent,/Fase uno/);
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
test('full bundle: a late saved-set response cannot corrupt a newly generated session',async()=>{
 const f=await fixture();try{await f.generate();f.w.if949Start('chest');f.w.if1041SetWeight('chest',5);f.w.deferSet=true;
 const saving=f.w.if50CompleteSet('chest',1);await f.flush();assert.ok(f.w.resolveSet);
 await f.generate();f.w.resolveSet();await saving;await f.advance();
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
