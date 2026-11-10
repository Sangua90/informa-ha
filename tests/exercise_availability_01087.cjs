const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('../.test-runtime/node_modules/jsdom');
const source=fs.readFileSync(path.join(__dirname,'../informa/web/exercise_availability_01087.js'),'utf8');
const items=[{id:'chest',name:'Chest',group:'Petto'},{id:'plank',name:'Plank',group:'Core'},{id:'stretch_trunk_core',name:'Stretching core',group:'Stretching'}];
function fixture(server=new Set()){
 const dom=new JSDOM('<main class="app"><section data-page="exercises-server"></section></main>',{url:'https://test.local/ingress/token/',runScripts:'dangerously'}),w=dom.window;
 w.setTimeout=()=>{};w.toast=text=>w.lastToast=text;w.IF50={plan:[{id:'chest'}]};w.IF51_LIBRARY={};w.IF50_EX={};w.api=async()=>({items:[]});w.generated=0;w.swaps=0;
 w.if50Generate=async()=>{w.generated++};w.if60Swap=()=>{w.swaps++};
 w.fetch=async(url,opts={})=>{
   if(w.offline)return {ok:false};
   if(opts.method==='PUT'){
     if(w.rejectSave)return {ok:false};
     const id=url.split('/').pop(),enabled=JSON.parse(opts.body).enabled;enabled?server.delete(id):server.add(id);
     return {ok:true};
   }
   return {ok:true,json:async()=>({disabled:[...server],items})};
 };
 w.eval(source);
 return {dom,w,server,ready:()=>w.if1087Refresh()};
}
async function flush(){for(let n=0;n<10;n++)await Promise.resolve()}
test('catalog delete and restore buttons save and survive a fresh browser session',async()=>{
 const f=fixture();try{await f.ready();
 const button=f.w.document.querySelector('[data-availability-id="chest"]');assert.match(button.textContent,/Elimina/);button.click();await flush();
 assert.ok(f.server.has('chest'));assert.equal(f.w.if1087Available('chest'),false);assert.equal(f.w.IF50.plan[0].id,'chest');
 assert.match(f.w.document.querySelector('details').textContent,/Chest/);
 const next=fixture(f.server);try{await next.ready();assert.equal(next.w.if1087Available('chest'),false);next.w.document.querySelector('details [data-availability-id="chest"]').click();await flush();assert.equal(next.w.if1087Available('chest'),true);assert.ok(!f.server.has('chest'))}finally{next.dom.window.close()}
 }finally{f.dom.window.close()}
});
test('failed save preserves availability; failed refresh blocks generation',async()=>{
 const f=fixture();try{await f.ready();f.w.rejectSave=true;f.w.document.querySelector('[data-availability-id="chest"]').click();await flush();assert.equal(f.w.if1087Available('chest'),true);assert.match(f.w.lastToast,/non salvata/);
 f.w.offline=true;await f.w.if50Generate();assert.equal(f.w.generated,0);f.w.offline=false;await f.w.if50Generate();assert.equal(f.w.generated,1);
 }finally{f.dom.window.close()}
});
test('aliases and direct swaps respect server exclusions before legacy archive wrappers',async()=>{
 const f=fixture(new Set(['chest','stretch_trunk_core']));try{await f.ready();assert.equal(f.w.if1087Available('stretch_trunk'),false);await f.w.if60Swap('plank','chest');assert.equal(f.w.swaps,0);await f.w.if60Swap('chest','plank');assert.equal(f.w.swaps,1);
 // Execute the real menu/add/resume helpers as well, not a copy of their predicates.
 f.w.eval(fs.readFileSync(path.join(__dirname,'../informa/web/coach_controls_060.js'),'utf8'));
 f.w.IF72_LIBRARY={chest:{name:'Chest',group:'Petto'},plank:{name:'Plank',group:'Core'}};
 assert.ok(!f.w.if60AllIds().includes('chest'));assert.equal(f.w.if60ToPlan('chest'),null);assert.ok(f.w.if60ToPlan('plank'));await flush();
 }finally{f.dom.window.close()}
});
