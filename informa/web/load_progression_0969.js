// InFormha 0.9.72 - storico carichi con metadata kg/piastre/corpo libero
(function(){
 if(typeof IF50==='undefined')return;
 const cache={};function esc(s){return encodeURIComponent(String(s||''))}
 function type(ex){if(ex?.loadType)return ex.loadType;const n=String(ex?.name||'').toLowerCase();if(['chest press','pec deck','lat machine','pull-down','push-down','cavo','face pull','leg extension'].some(x=>n.includes(x)))return'plates';return'kg'}
 function unit(ex){return type(ex)==='plates'?'piastre':type(ex)==='kg'?'kg':'corpo libero'}
 async function loadOne(ex){if(!ex||ex.cardio||type(ex)==='bodyweight')return;try{const d=await api(`api/load-progression-0969/${esc(ex.name)}`);cache[ex.id]=d;d.unit=unit(ex);d.minimum=type(ex)==='plates'?1:0;apply(ex,d)}catch(e){}}
 function apply(ex,d){const card=document.getElementById(`if50ex_${ex.id}`);if(!card)return;card.querySelectorAll(`[id^="if50w_${ex.id}_"]`).forEach(inp=>{inp.type='number';inp.inputMode='decimal';inp.min=String(d.minimum);inp.step=type(ex)==='plates'?'1':'0.5';inp.placeholder=unit(ex);if((inp.value===''||inp.value==null)&&d.suggestion!=null)inp.value=d.suggestion});let box=card.querySelector('.if969-load');if(!box){box=document.createElement('div');box.className='card coach if969-load';const first=card.querySelector('.setrow');if(first)first.insertAdjacentElement('beforebegin',box)}if(box){const val=d.suggestion==null?'da inserire':`${d.suggestion} ${unit(ex)}`;box.innerHTML=`<div class="ey">Carico iCoach</div><div class="measure"><span>Oggi</span><b>${val}</b></div><div class="sub">${d.reason||''}${type(ex)==='plates'?' · La piastra 1 è il minimo e non può essere rimossa.':''}</div>`}}
 function hydrate(){(IF50.plan||[]).forEach(ex=>{if(type(ex)==='bodyweight'){const card=document.getElementById(`if50ex_${ex.id}`);card?.querySelectorAll(`[id^="if50w_${ex.id}_"]`).forEach(inp=>{inp.value='';inp.placeholder='Corpo libero';inp.disabled=true})}else loadOne(ex)})}
 const render=window.if50RenderWorkout;if(typeof render==='function')window.if50RenderWorkout=function(){const r=render.apply(this,arguments);setTimeout(hydrate,40);return r};
 console.log('[INFORMHA_LOAD_PROGRESSION] version=0.9.72 metadata=1 kg=1 plates=1 bodyweight=1 min_plate=1');
})();
