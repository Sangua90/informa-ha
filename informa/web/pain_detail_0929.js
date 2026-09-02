// InFormha 0.9.29 - dettaglio zona/muscolo quando il fastidio e' Altro
(function(){
  function detail(){return (document.getElementById('if929PainDetail')?.value||IF50?.pain_detail||'').trim()}
  function showDetail(){
    const wrap=document.getElementById('if929PainDetailWrap');
    if(wrap)wrap.classList.toggle('hide',IF50?.pain!=='Altro');
  }

  const oldPick=window.if50Pick;
  if(typeof oldPick==='function')window.if50Pick=function(group,val){
    const out=oldPick.apply(this,arguments);
    if(group==='pain'){
      if(val!=='Altro'&&IF50)IF50.pain_detail='';
      setTimeout(showDetail,0);
    }
    return out;
  };

  const oldCheckin=window.if50Checkin;
  if(typeof oldCheckin==='function')window.if50Checkin=function(){
    const out=oldCheckin.apply(this,arguments);
    const painCard=[...document.querySelectorAll('[data-page="checkin"] .card')].find(c=>(c.textContent||'').includes('Dolori o fastidi?'));
    if(painCard&&!document.getElementById('if929PainDetailWrap')){
      const wrap=document.createElement('div');
      wrap.id='if929PainDetailWrap';wrap.className='hide';
      wrap.innerHTML='<div class="ey" style="margin-top:12px">Dove senti il fastidio?</div><input class="field" id="if929PainDetail" placeholder="Es. bicipite destro, polpaccio sinistro, petto..." autocomplete="off"><div class="sub" style="margin-top:6px">Indica zona o muscolo: InFormha userà questa informazione per adattare la seduta e il consiglio del coach.</div>';
      painCard.appendChild(wrap);
      const input=wrap.querySelector('input');
      input.value=IF50?.pain_detail||'';
      input.addEventListener('input',()=>{if(IF50)IF50.pain_detail=input.value.trim()});
    }
    showDetail();
    return out;
  };

  const oldGenerate=window.if50Generate;
  if(typeof oldGenerate==='function')window.if50Generate=async function(){
    if(IF50?.pain==='Altro'){
      const d=detail();
      if(!d){if(typeof toast==='function')toast('Specifica dove senti il fastidio');document.getElementById('if929PainDetail')?.focus();return}
      IF50.pain_detail=d;
    }else if(IF50){IF50.pain_detail=''}
    return oldGenerate.apply(this,arguments);
  };

  // Mantiene Altro come categoria per le regole esistenti, ma rende il dettaglio visibile nel workout.
  const oldPainNote=window.if50PainNote;
  if(typeof oldPainNote==='function')window.if50PainNote=function(){
    if(IF50?.pain==='Altro'&&IF50?.pain_detail){
      return `<div class="card warning"><div class="ey">Fastidio segnalato: ${IF50.pain_detail}</div><div class="sub">Il coach tiene conto della zona indicata. Non vengono applicate sostituzioni automatiche non affidabili: usa solo movimenti confortevoli e interrompi se il dolore aumenta.</div></div>`;
    }
    return oldPainNote.apply(this,arguments);
  };

  // Aggiunge il dettaglio al payload del check-in senza cambiare le API esistenti.
  const oldFetch=window.fetch;
  if(typeof oldFetch==='function')window.fetch=function(input,init){
    try{
      const url=typeof input==='string'?input:(input?.url||'');
      if(url.includes('api/coach/checkin')&&init?.body&&IF50?.pain==='Altro'&&IF50?.pain_detail){
        const body=JSON.parse(init.body);
        body.pain_detail=IF50.pain_detail;
        body.pain_label=`Altro: ${IF50.pain_detail}`;
        init={...init,body:JSON.stringify(body)};
      }
    }catch(e){}
    return oldFetch.call(this,input,init);
  };

  // Migliora il messaggio delle regole 0.7.1 per Altro specificato.
  const oldApply=window.if71ApplyPainPlan;
  if(typeof oldApply==='function')window.if71ApplyPainPlan=function(){
    const result=oldApply.apply(this,arguments);
    if(IF50?.pain==='Altro'&&IF50?.pain_detail&&result){
      result.warning=`Hai segnalato fastidio a: ${IF50.pain_detail}. Il coach conserva questa informazione ma non applica sostituzioni automatiche finché non esiste una regola specifica affidabile per quella zona.`;
    }
    return result;
  };

  console.log('[INFORMHA_PAIN] version=0.9.29 pain_detail=1 checkin_payload=1');
})();
