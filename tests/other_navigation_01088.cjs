const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('../.test-runtime/node_modules/jsdom');
const web=path.join(__dirname,'../informa/web');
async function flush(){for(let n=0;n<15;n++)await Promise.resolve()}
function fixture(){
 const dom=new JSDOM(fs.readFileSync(path.join(web,'index.html'),'utf8'),{url:'https://informa.test/',runScripts:'outside-only'}),w=dom.window,jobs=[];
 w.setTimeout=fn=>{jobs.push(fn)};w.setInterval=()=>{};w.scrollTo=()=>{};w.console.log=()=>{};w.toast=()=>{};
 w.go=name=>{const target=w.document.querySelector('[data-page="'+name+'"]');if(!target)return;w.document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p===target))};
 w.api=async()=>({guides:{},items:[],reminder:{due:false},height_cm:187});
 const evalFile=file=>w.eval(fs.readFileSync(path.join(web,file),'utf8'));
 evalFile('management_accordion_0921.js');evalFile('equipment_details_0936.js');evalFile('guide_manager_0963.js');evalFile('other_navigation_01088.js');
 return {dom,w,evalFile,jobs,active:()=>w.document.querySelector('.page.active')?.dataset.page};
}
test('X returns through actual previous pages, direct rendered subpages and repeated renders',async()=>{
 const f=fixture();try{f.w.go('profile');f.w.go('connections');await flush();assert.ok(f.w.document.querySelector('[data-page="connections"] > .if1088-close'));
 f.w.if1088Back();assert.equal(f.active(),'profile');f.w.if1088Back();assert.equal(f.active(),'home');
 f.w.go('profile');f.w.go('progress');
 const sub=f.w.document.createElement('section');sub.className='page';sub.dataset.page='custom-submenu';f.w.document.querySelector('.app').appendChild(sub);
 f.w.document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p===sub));await flush();
 assert.ok(sub.querySelector('.if1088-close'));sub.innerHTML='<h1>Ricaricato</h1>';await flush();assert.equal(sub.querySelectorAll('.if1088-close').length,1);
 f.w.if1088Back();assert.equal(f.active(),'progress');f.w.if1088Back();assert.equal(f.active(),'profile');
 }finally{f.dom.window.close()}
});
test('equipment and photo manager stay outside connections, including delayed legacy installs',async()=>{
 const f=fixture();try{for(const fn of f.jobs.splice(0))await fn();await flush();
 assert.ok(f.w.document.querySelector('[data-page="equipment"] #if936EquipmentHost'));
 assert.equal(f.w.document.querySelector('[data-page="connections"] #if921Accordion'),null);
 assert.equal(f.w.document.querySelector('[data-page="connections"] #if963Manager'),null);
 assert.ok(f.w.document.querySelector('[data-page="exercise-photos"] #if963Manager'));
 f.w.go('exercise-library-063'); // created by the real catalog renderer in production
 const list=f.w.document.createElement('section');list.dataset.page='exercise-library-063';list.className='page';f.w.document.querySelector('.app').appendChild(list);
 f.w.go('profile');f.w.go('exercise-library-063');f.w.go('exercise-photos');await flush();f.w.if1088Back();assert.equal(f.active(),'exercise-library-063');
 }finally{await flush();f.dom.window.close()}
});
test('X closes an expanded subsection; root tab navigation does not acquire a back button',async()=>{
 const f=fixture();try{f.w.go('profile');f.w.go('connections');const p=f.w.document.querySelector('[data-page="connections"]');p.insertAdjacentHTML('beforeend','<details open><summary>Dati</summary></details>');
 f.w.if1088Back();assert.equal(f.active(),'connections');assert.equal(p.querySelector('details').open,false);
 f.w.document.querySelector('[data-nav="home"]').click();f.w.go('home');await flush();assert.equal(f.w.document.querySelector('[data-page="home"] > .if1088-close'),null);
 }finally{f.dom.window.close()}
});
test('height is editable in measurements and absent from profile',async()=>{
 const f=fixture();try{f.evalFile('measurements_0978.js');f.w.go('progress');for(const fn of f.jobs.splice(0))await fn();await flush();
 assert.ok(f.w.document.getElementById('mHeight'));assert.equal(f.w.document.getElementById('mHeight').value,'187');assert.equal(f.w.document.querySelector('[data-page="profiledata"] #profileHeight'),null);
 let body;f.w.api=async(url,options)=>{body=JSON.parse(options.body);return {items:[]}};
 f.w.document.getElementById('mHeight').value='190';await f.w.if978Save();assert.equal(body.height_cm,190);
 }finally{f.dom.window.close()}
});
