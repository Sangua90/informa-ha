// InFormha 0.9.69 - storico carichi, kg/piastre e progressione iCoach
(function(){
  if(typeof IF50==='undefined')return;
  const cache={};
  function esc(s){return encodeURIComponent(String(s||''))}
  function isFassi(name){const n=String(name||'').toLowerCase();return ['chest press','pec deck','lat machine','pull-down','push-down','cavo','face pull','leg extension'].some(x=>n.includes(x))}
  function unit(ex){return isFassi(ex?.name)?'piastre':'kg'}
  function min(ex){return unit(ex)==='piastre'?1:0}

  async function loadOne(ex){
    if(!ex||ex.cardio)return;
    try{const d=await api(`api/load-progression-0969/${esc(ex.name)}`);cache[ex.id]=d;apply(ex,d)}catch(e){}
  }
  function apply(ex,d){
    const card=document.getElementById(`if50ex_${ex.id}`);if(!card)return;
    card.querySelectorAll(`[id^="if50w_${ex.id}_"]`).forEach(inp=>{
      inp.type='number';inp.inputMode='decimal';inp.min=String(d.minimum??min(ex));inp.step=unit(ex)==='piastre'?'1':'0.5';inp.placeholder=unit(ex)==='piastre'?'Piastre':'kg';
      if((inp.value===''||inp.value==null)&&d.suggestion!==null&&d.suggestion!==undefined)inp.value=d.suggestion;
    });
    let box=card.querySelector('.if969-load');if(!box){box=document.createElement('div');box.className='card coach if969-load';const first=card.querySelector('.setrow');if(first)first.insertAdjacentElement('beforebegin',box)}
    if(box){const val=d.suggestion===null||d.suggestion===undefined?'da inserire':`${d.suggestion} ${d.unit}`;box.innerHTML=`<div class="ey">Carico iCoach</div><div class="measure"><span>Oggi</span><b>${val}</b></div><div class="sub">${d.reason||''}${d.unit==='piastre'?' · La piastra 1 è il minimo e non può essere rimossa.':''}</div>`}
  }
  function hydrate(){(IF50.plan||[]).forEach(loadOne)}
  const render=window.if50RenderWorkout;if(typeof render==='function')window.if50RenderWorkout=function(){const r=render.apply(this,arguments);setTimeout(hydrate,30);return r};

  const complete=window.if50CompleteSet;if(typeof complete==='function')window.if50CompleteSet=async function(id,n){
    const ex=(IF50.plan||[]).find(x=>x.id===id);const inp=document.getElementById(`if50w_${id}_${n}`);if(ex&&inp){let v=parseFloat(String(inp.value||'').replace(',','.'));if(unit(ex)==='piastre'){if(!Number.isFinite(v)||v<1){toast('Per la Fassi inserisci almeno 1 piastra');return}v=Math.round(v);inp.value=String(v)}else if(!Number.isFinite(v)||v<0){toast('Inserisci il carico in kg');return}}
    return complete.apply(this,arguments)
  };
  console.log('[INFORMHA_LOAD_PROGRESSION] version=0.9.69 kg=1 plates=1 history_prefill=1 min_plate=1');
})();
