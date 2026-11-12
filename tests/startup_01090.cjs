const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('../.test-runtime/node_modules/jsdom');
const web=path.join(__dirname,'../informa/web');
const names=fs.readFileSync(path.join(web,'../Dockerfile'),'utf8').match(/RUN for f in (.*?); do cat/)[1].split(' ');
const core=fs.readFileSync(path.join(web,'app.js'),'utf8');
const bundle=core+names.map(n=>fs.readFileSync(path.join(web,n),'utf8')).join('');
async function fixture({fail=[],full=true}={}){
 const dom=new JSDOM(fs.readFileSync(path.join(web,'index.html'),'utf8'),{url:'https://informa.test/',runScripts:'outside-only'}),w=dom.window;
 w.setTimeout=()=>0;w.setInterval=()=>0;w.scrollTo=()=>{};w.console={log(){},warn(){},error(){}};
 const observers=[],Observer=w.MutationObserver;
 w.MutationObserver=class extends Observer{constructor(fn){super(fn);observers.push(this)}};
 w.fetch=async url=>{
   if(fail.includes(url))throw Error('offline');
   let data={ok:true,items:[],disabled:[],guides:{},data:{},connected:false,reminder:{due:false}};
   if(url==='api/state')data={profile:{name:'Test',goal:'Forza',level:'Guidato',weight_kg:91},measurement:{weight_kg:90,waist_cm:95},version:'0.10.90'};
   if(url==='api/healthsync')data={connected:true,data:{weight:{value:89,unit:'kg'},steps:{value:7000}}};
   if(url==='api/nutrition/today')data={totals:{calories:750},entries:[]};
   return {ok:true,json:async()=>data};
 };
 w.eval(full?bundle:core);
 await new Promise(resolve=>setImmediate(resolve));
 return {dom,w,close:()=>{observers.forEach(o=>o.disconnect());dom.window.close()},toasts:()=>Array.from(w.document.querySelectorAll('.toast'),e=>e.textContent)};
}
test('actual startup bundle loads profile/version despite removed legacy home weight',async()=>{
 const f=await fixture();try{
   assert.equal(f.w.document.getElementById('homeWeight'),null);
   assert.equal(f.w.document.getElementById('version').textContent,'0.10.90');
   assert.equal(f.w.document.getElementById('profileName').textContent,'Test');
   assert.equal(f.w.document.getElementById('profileWeight').textContent,'89 kg');
   assert.deepEqual(f.toasts(),[]);
   await f.w.load();assert.deepEqual(f.toasts(),[]);
 }finally{f.close()}
});
test('optional health/nutrition failures preserve core data and identify the unavailable section',async()=>{
 const f=await fixture({fail:['api/healthsync','api/nutrition/today']});try{
   assert.equal(f.w.document.getElementById('version').textContent,'0.10.90');
   assert.equal(f.w.document.getElementById('profileGoal').textContent,'Forza');
   assert.ok(f.toasts().some(s=>s.includes('salute')));
   assert.ok(f.toasts().some(s=>s.includes('alimentazione')));
   assert.ok(!f.toasts().includes('Backend non raggiungibile'));
 }finally{f.close()}
});
test('real core API failure still warns and does not suppress available health/nutrition',async()=>{
 const f=await fixture({fail:['api/state'],full:false});try{
   assert.ok(f.toasts().includes('Backend non raggiungibile'));
   assert.equal(f.w.document.getElementById('version').textContent,'—');
   assert.equal(f.w.document.getElementById('profileWeight').textContent,'89 kg');
   assert.match(f.w.document.getElementById('nutCalories').textContent,/750/);
 }finally{f.close()}
});
test('a renderer failure reports a display error while independent data still loads',async()=>{
 const f=await fixture({full:false});try{
   f.w.renderHealth=()=>{throw Error('render failed')};
   await f.w.load();
   assert.ok(f.toasts().some(s=>s.includes('visualizzazione')&&s.includes('salute')));
   assert.ok(!f.toasts().includes('Backend non raggiungibile'));
   assert.equal(f.w.document.getElementById('version').textContent,'0.10.90');
   assert.match(f.w.document.getElementById('nutCalories').textContent,/750/);
 }finally{f.close()}
});
