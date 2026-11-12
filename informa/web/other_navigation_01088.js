// Final organization and close navigation for Altro, including direct-render subpages.
(function(){
 window.IF1088_ORGANIZED=true;
 const parents={profile:'home',profiledata:'profile',connections:'profile',equipment:'profile',progress:'profile',coach:'profile',coachquestions:'aicoach',exercises:'profile','exercise-library-063':'profile','exercises-server':'profile','exercise-photos':'exercise-library-063','exercise-detail':'exercises','exercise-detail-063':'exercise-library-063','workout-history-0933':'profile','workout-history-detail-0933':'workout-history-0933','supplement-settings-0923':'profile'};
 let current=null,trail=[],backTarget=null;
 const active=()=>document.querySelector('.page.active')?.dataset.page;
 const app=document.querySelector('.app');
 function page(name,title){let p=document.querySelector('[data-page="'+name+'"]');if(!p&&app){p=document.createElement('section');p.className='page';p.dataset.page=name;p.innerHTML='<div class="ey">Altro</div><h1>'+title+'</h1>';app.appendChild(p)}return p}
 function organize(){
   if(typeof go!=='function')return;
   const equipment=page('equipment','La mia attrezzatura');page('exercise-photos','Foto e guide esercizi');
   const conn=document.querySelector('[data-page="connections"]');
   if(conn){
     for(const c of conn.querySelectorAll(':scope > .card')){
       if(c.querySelector('#if936EquipmentHost')||c.querySelector('h2')?.textContent==='La tua macchina')equipment?.appendChild(c);
     }
     for(const id of ['if921Accordion','if914Manager','if74Manager'])conn.querySelector('#'+id)?.remove();
   }
 }
 function observePage(){
   if(typeof document==='undefined')return;
   organize();const id=active();if(!id)return;
   if(id!==current){
     if(id===backTarget)backTarget=null;
     else if(current&&(parents[id]||trail.includes('profile')||current==='profile'))trail.push(current);
     else trail=[];
     current=id;
   }
   const p=document.querySelector('[data-page="'+id+'"]');
   if(parents[id]||trail.includes('profile'))document.querySelectorAll('.nav [data-nav]').forEach(b=>b.classList.toggle('on',b.dataset.nav==='profile'));
   if(!p)return;
   if(!parents[id]&&!trail.includes('profile')){p.querySelector(':scope > .if1088-close')?.remove();if(p.classList.contains('if1088-other-page'))p.classList.remove('if1088-other-page');return}
   if(!p.classList.contains('if1088-other-page'))p.classList.add('if1088-other-page');
   if(!p.querySelector(':scope > .if1088-close')){
     const b=document.createElement('button');b.type='button';b.className='if1088-close';b.setAttribute('aria-label','Torna alla pagina precedente');b.title='Indietro';b.textContent='×';b.onclick=()=>window.if1088Back();p.prepend(b);
   }
 }
 window.if1088Back=function(){
   const id=active(),p=document.querySelector('[data-page="'+id+'"]');
   const expanded=[...(p?.querySelectorAll('details[open]')||[])].pop();
   if(expanded){expanded.open=false;return}
   const health=[...(p?.querySelectorAll('#if935HealthHost:not(.hide),#if941HealthHost:not(.hide),#if944HealthHost:not(.hide)')||[])];
   if(health.length){health.forEach(x=>x.classList.add('hide'));return}
   if(typeof go!=='function'){location.href='./#profile';return}
   const target=trail.pop()||parents[id]||'profile';backTarget=target;
   go(target);observePage();
 };
 const baseGo=window.go;
 if(typeof baseGo==='function')window.go=function(name){organize();const result=baseGo.apply(this,arguments);observePage();if(name==='exercise-photos')window.if963Render?.();return result};
 document.addEventListener('click',e=>{
   if(e.target.closest('.nav [data-nav]')){trail=[];current=null;backTarget=null}
   const photos=e.target.closest('[data-photo-library]');
   if(photos&&typeof go==='function'){e.preventDefault();go('exercise-photos')}
 },true);
 const css=document.createElement('style');css.textContent='.if1088-other-page{position:relative;padding-top:8px}.if1088-other-page>h1{padding-right:58px}.if1088-close{position:absolute;right:0;top:0;z-index:45;width:46px;height:46px;border-radius:16px;border:1px solid rgba(255,126,0,.5);background:#17191d;color:#ffb04a;font-size:32px;line-height:1;cursor:pointer}.if1088-close:focus-visible{outline:2px solid white;outline-offset:3px}';document.head.appendChild(css);
 // Some older pages render directly instead of calling go(); observe those too.
 const observer=new MutationObserver(observePage);
 if(app)observer.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 observePage();
})();
