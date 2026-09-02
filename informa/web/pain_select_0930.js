// InFormha 0.9.30 - scelta muscolo/zona per fastidio Altro
(function(){
  const ZONES=['Petto','Bicipite','Tricipite','Avambraccio / Gomito','Collo / Trapezio','Addome / Core','Gluteo','Quadricipite','Femorale','Polpaccio','Caviglia / Piede'];

  function selected(){return (IF50?.pain_detail||'').trim()}
  function showWrap(){const w=document.getElementById('if930PainZones');if(w)w.classList.toggle('hide',IF50?.pain!=='Altro')}
  function renderZones(){
    const old=document.getElementById('if929PainDetailWrap');if(old)old.remove();
    const painCard=[...document.querySelectorAll('[data-page="checkin"] .card')].find(c=>(c.textContent||'').includes('Dolori o fastidi?'));
    if(!painCard||document.getElementById('if930PainZones'))return;
    const wrap=document.createElement('div');wrap.id='if930PainZones';wrap.className='hide';
    wrap.innerHTML=`<div class="ey" style="margin-top:12px">Dove senti il fastidio?</div><div class="choice if930-zones">${ZONES.map(z=>`<button type="button" data-if930-zone="${z}">${z}</button>`).join('')}</div><div class="sub" style="margin-top:7px">Seleziona la zona principale interessata.</div>`;
    painCard.appendChild(wrap);
    wrap.querySelectorAll('[data-if930-zone]').forEach(btn=>btn.addEventListener('click',()=>{
      IF50.pain_detail=btn.dataset.if930Zone;
      wrap.querySelectorAll('[data-if930-zone]').forEach(b=>b.classList.toggle('on',b===btn));
    }));
    const current=selected();if(current){const b=[...wrap.querySelectorAll('[data-if930-zone]')].find(x=>x.dataset.if930Zone===current);if(b)b.classList.add('on')}
    showWrap();
  }

  const oldCheckin=window.if50Checkin;
  if(typeof oldCheckin==='function')window.if50Checkin=function(){const out=oldCheckin.apply(this,arguments);setTimeout(renderZones,0);return out};

  const oldPick=window.if50Pick;
  if(typeof oldPick==='function')window.if50Pick=function(group,val){const out=oldPick.apply(this,arguments);if(group==='pain'){if(val!=='Altro'&&IF50)IF50.pain_detail='';setTimeout(()=>{renderZones();showWrap()},0)}return out};

  const oldGenerate=window.if50Generate;
  if(typeof oldGenerate==='function')window.if50Generate=async function(){
    if(IF50?.pain==='Altro'&&!selected()){
      if(typeof toast==='function')toast('Seleziona la zona che ti fa male');
      return;
    }
    return oldGenerate.apply(this,arguments);
  };

  const css=document.createElement('style');
  css.textContent=`.if930-zones{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}.if930-zones button{flex:1 1 calc(50% - 7px);min-width:130px}`;
  document.head.appendChild(css);
  console.log('[INFORMHA_PAIN] version=0.9.30 pain_zone_selector=1');
})();
