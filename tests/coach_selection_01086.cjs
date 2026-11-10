const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

function fixture(seed=1){
 const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const c={Math:math,console:{log(){}},IF50:{energy:'Normale',time:45,exerciseCount:4,pain:'Nessuno'},document:{querySelector:()=>null,getElementById:()=>null,createElement:()=>({}),head:{appendChild(){}}},setTimeout(){},setInterval(){},api:async()=>({items:[]}),if50ExerciseCard:()=>'',if50BuildPlan:()=>[]};
 c.window=c;vm.createContext(c);
 for(const file of ['adaptive_coach_0968.js','adaptive_library_0972.js','automatic_stretching_0978.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../informa/web',file),'utf8'),c);
 return c;
}
const groups=['Petto','Schiena','Spalle','Tricipiti','Bicipiti','Gambe','Femorali','Glutei','Polpacci','Core'];
test('every strength exercise, including all dumbbell choices, can be selected',()=>{
 const c=fixture(),seen=new Set();
 for(const group of groups){
   c.IF50.adaptiveGroups=[group,...groups.filter(x=>x!==group)];
   for(let n=0;n<100;n++)c.if50BuildPlan().forEach(x=>seen.add(x.id));
 }
 const strength=Object.values(c.IF72_LIBRARY).filter(x=>!x.mobility&&!x.stretching);
 assert.ok(strength.length>30);
 for(const e of strength)assert.ok(seen.has(e.id),e.id);
 assert.equal(strength.filter(x=>x.loadType==='kg').length,12);
});
test('unseen and older alternatives outrank recently trained exercises',()=>{
 const c=fixture();c.IF50.adaptiveGroups=['Schiena','Bicipiti','Core'];
 c.IF50.adaptiveExercises={};
 const back=Object.values(c.IF72_LIBRARY).filter(x=>x.group==='Schiena');
 back.forEach((e,i)=>c.IF50.adaptiveExercises[c.if68ExerciseKey(e.name)]={lastAt:100+i,sessions:1});
 delete c.IF50.adaptiveExercises[c.if68ExerciseKey(back[4].name)];
 const selected=c.if50BuildPlan().slice(0,2).map(x=>x.id);
 assert.deepEqual(Array.from(selected),[back[4].id,back[0].id]);
});
test('history counts sessions rather than sets, maps all catalog names and resets on failure',async()=>{
 const c=fixture(),stamp=new Date(Date.now()-4*3600000).toISOString();
 c.api=async url=>url==='api/workouts-0933'?{items:[{id:1,ts:stamp}]}:{sets:[{exercise:'Heel taps / Tocchi ai talloni'},{exercise:'Heel taps / Tocchi ai talloni'},{exercise:'Rematore monobraccio con manubrio su panca'}]};
 await c.if68Prepare();
 assert.equal(c.IF50.adaptiveExercises[c.if68ExerciseKey('Heel taps / Tocchi ai talloni')].sessions,1);
 assert.equal(c.IF50.adaptiveRecovery.Core.sets,2);
 assert.equal(c.IF50.adaptiveRecovery.Schiena.sets,1);
 c.api=async()=>{throw Error('offline')};await c.if68Prepare();
 assert.equal(Object.keys(c.IF50.adaptiveExercises).length,0);
 assert.equal(c.if50BuildPlan().filter(x=>!x.cardio&&!x.mobility&&!x.stretching).length,4);
});
test('recovery outranks random ties; equal recovery can choose every primary group',async()=>{
 const c=fixture(),primaries=new Set();
 for(let n=0;n<150;n++){await c.if68Prepare();primaries.add(c.IF50.adaptiveGroups[0])}
 for(const g of groups)assert.ok(primaries.has(g),g);
 c.api=async url=>url==='api/workouts-0933'?{items:[{id:1,ts:new Date().toISOString()}]}:{sets:[{exercise:'Chest press alla macchina'}]};
 for(let n=0;n<20;n++){await c.if68Prepare();assert.notEqual(c.IF50.adaptiveGroups[0],'Petto')}
});
test('final stretching wrapper preserves counts, pain exclusions, units and explicit treadmill',()=>{
 const c=fixture();c.IF50.adaptiveGroups=groups;
 for(const count of [2,3,4,5])for(const pain of ['Nessuno','Ginocchio','Spalla','Schiena']){
   Object.assign(c.IF50,{exerciseCount:count,pain,stretch_mode:'Sì',treadmill_choice:'Sì',treadmillMinutes:15,energy:'Bassa'});
   const p=c.if50BuildPlan(),strength=p.filter(x=>!x.cardio&&!x.mobility&&!x.stretching);
   assert.equal(strength.length,count);assert.equal(new Set(p.map(x=>x.id)).size,p.length);
   assert.equal(p[0].id,'treadmill');assert.equal(p[0].duration,15);assert.ok(!p.some(x=>x.mobility));
   const blocked={Ginocchio:['Gambe','Polpacci'],Spalla:['Petto','Spalle','Tricipiti'],Schiena:['Schiena','Femorali']}[pain]||[];
   assert.ok(strength.every(x=>!blocked.includes(x.group)));assert.ok(strength.every(x=>x.sets===2));
 }
 const plank=c.IF72_LIBRARY.plank;assert.equal(plank.repType,'seconds');assert.equal(plank.reps,30);
});
