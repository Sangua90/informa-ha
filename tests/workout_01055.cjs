const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

// Execute the real focus/controller code with a deterministic clock and API boundary.
function fixture(){
 const disk=new Map(), jobs=[];let intervals=new Map(), tickId=0;
 const classes=()=>{const s=new Set();return {contains:x=>s.has(x),add:(...xs)=>xs.forEach(x=>s.add(x)),remove:(...xs)=>xs.forEach(x=>s.delete(x)),toggle:(x,on)=>on?s.add(x):s.delete(x)}};
 function card(id){const rows=Array.from({length:3},()=>{const check={classList:classes()};const row={classList:classes(),scrollIntoView(){},querySelector:s=>s==='.check'?check:null};check.closest=()=>row;return row});return {id:'if50ex_'+id,classList:classes(),rows,querySelectorAll:()=>rows,querySelector:s=>s==='.check:not(.done)'?rows.map(r=>r.querySelector('.check')).find(c=>!c.classList.contains('done')):null}}
 let cards=[card('a'),card('b')];
 const key='informha_workout_flow_0949',active='informha_workout_active_0109';
 const states=()=>JSON.parse(disk.get(key)||'{}');
 const stage=(id,value)=>{const s=states();s[id]={stage:value,sets:{}};disk.set(key,JSON.stringify(s))};
 const c={console:{log(){}},Set,Date,JSON,Promise,timerInt:null,currentWorkoutId:null,IF50:{plan:[{id:'a'},{id:'b'}]},page:'workout',calls:0,fail:false,cancelSwap:false,
 localStorage:{getItem:k=>disk.get(k)||null,setItem:(k,v)=>disk.set(k,v),removeItem:k=>disk.delete(k)},
 setTimeout:f=>{jobs.push(f);return jobs.length},clearInterval:id=>intervals.delete(id),setInterval:f=>{intervals.set(++tickId,f);return tickId},toast(){},
 document:{querySelectorAll:()=>cards,querySelector:()=>null,getElementById:()=>null,addEventListener(){},createElement:()=>({}),head:{appendChild(){}},body:{classList:classes()}},
 go(page){c.page=page},if50RenderWorkout(){},if949Start:id=>stage(id,'started'),
 async if50CompleteSet(id,n){c.calls++;await Promise.resolve();if(c.fail)return;cards.find(x=>x.id==='if50ex_'+id).rows[n-1].querySelector('.check').classList.add('done');c.startTimer(2);c.go('recovery')},
 async if50Status(id){if(!c.fail)stage(id,'archived')},
 async if949CompleteExercise(id){await c.if50Status(id)},
 async if60Swap(oldId,newId){if(c.cancelSwap)return;c.IF50.plan=c.IF50.plan.map(x=>x.id===oldId?{id:newId}:x);cards=cards.map(x=>x.id==='if50ex_'+oldId?card(newId):x)},
 async api(){if(c.fail)throw Error('offline');return {workout_id:7}}
 };c.window=c;vm.createContext(c);
 for(const file of ['workout_focus_0950.js','workout_controller_0108.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../informa/web',file),'utf8'),c);
 async function flush(){for(let loops=0;jobs.length&&loops<30;loops++){const batch=jobs.splice(0);for(const f of batch)await f();await Promise.resolve()}await Promise.resolve()}
 async function recover(skip=false){if(skip)c.if950SkipRecovery();else{for(let n=0;n<2;n++)for(const f of [...intervals.values()])f()}await flush()}
 stage('a','started');
 return {c,states,flush,recover,active:()=>disk.get(active),stage};
}
test('three sets retain recovery, then archive and advance; final exercise completes',async()=>{
 const f=fixture();await f.flush();
 for(const id of ['a','b'])for(let n=1;n<=3;n++){
  await f.c.if50CompleteSet(id,n);await f.flush();assert.equal(f.c.page,'recovery');assert.equal(f.states()[id].stage,'started');
  await f.recover(n===2);assert.equal(f.c.page,'workout');
  assert.equal(f.states()[id].stage,n===3?'archived':'started');
 }
 assert.equal(f.active(),undefined);
});
test('replacement starts at first set, then advances after recovery',async()=>{
 const f=fixture();await f.c.if60Swap('a','replacement');await f.flush();assert.equal(f.active(),'replacement');
 for(let n=1;n<=3;n++){await f.c.if50CompleteSet('replacement',n);await f.recover()}
 assert.equal(f.states().replacement.stage,'archived');assert.equal(f.active(),'b');
});
test('cancelled replacement preserves current exercise',async()=>{
 const f=fixture();f.c.cancelSwap=true;await f.c.if60Swap('a','replacement');await f.flush();assert.equal(f.active(),'a');assert.equal(f.states().replacement,undefined);
});
test('skip archives and advances; stale recovery cannot return to skipped exercise',async()=>{
 const f=fixture();await f.c.if50CompleteSet('a',1);await f.c.if108Skip('a');await f.flush();await f.recover();assert.equal(f.active(),'b');assert.equal(f.states().a.stage,'archived');assert.equal(f.c.currentWorkoutId,7);
});
test('failed skip or archive does not advance; archive can be retried',async()=>{
 const f=fixture();await f.flush();f.c.fail=true;await f.c.if108Skip('a');await f.flush();assert.equal(f.active(),'a');assert.equal(f.states().a.stage,'started');
 f.c.fail=false;for(let n=1;n<=3;n++){await f.c.if50CompleteSet('a',n);if(n<3)await f.recover()}
 f.c.fail=true;await f.recover();assert.equal(f.states().a.stage,'started');f.c.fail=false;await f.c.if108RecoveryFinished('a');await f.flush();assert.equal(f.active(),'b');
});
test('concurrent clicks save a set once',async()=>{
 const f=fixture();await Promise.all([f.c.if50CompleteSet('a',1),f.c.if50CompleteSet('a',1)]);assert.equal(f.c.calls,1);
});
