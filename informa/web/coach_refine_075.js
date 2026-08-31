// InFormha 0.7.5 - consiglio coach basato su recupero + fatica + storico
(function(){
 async function loadAdvice(id,name){
  const target=document.getElementById(`if50prog_${id}`);if(!target||!name)return;
  try{
   const d=await api(`api/coach/advice/${encodeURIComponent(name)}`);
   if(!d?.ok)return;
   target.textContent=d.recommendation||'Mantieni tecnica e margine.';
   const card=target.closest('.card.coach');if(card){
    let meta=card.querySelector('.if75-meta');if(!meta){meta=document.createElement('div');meta.className='if75-meta mini';card.appendChild(meta)}
    const rec=d.hours_since_last==null?'recupero non ancora calibrato':`${d.hours_since_last} h dall’ultima seduta`;
    meta.textContent=`${d.calibrated?'Storico attivo':'Calibrazione'} · ${rec}`;
   }
  }catch(e){}
 }
 function refresh(){
  (IF50.plan||[]).forEach(ex=>{if(!ex.cardio)loadAdvice(ex.id,ex.name)});
 }
 const oldRender=window.if50RenderWorkout;
 if(typeof oldRender==='function')window.if50RenderWorkout=function(){const out=oldRender.apply(this,arguments);setTimeout(refresh,60);return out};
 const oldComplete=window.if50CompleteSet;
 if(typeof oldComplete==='function')window.if50CompleteSet=async function(id,n){const out=await oldComplete.apply(this,arguments);const ex=(IF50.plan||[]).find(x=>x.id===id);setTimeout(()=>{if(ex)loadAdvice(id,ex.name)},150);return out};
 const st=document.createElement('style');st.textContent='.if75-meta{margin-top:8px;padding-top:8px;border-top:1px solid var(--ln)}';document.head.appendChild(st);
})();
