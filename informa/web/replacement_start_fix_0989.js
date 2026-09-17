// InFormha 0.9.89 - esercizio sostitutivo pronto per essere iniziato
(function(){
 const swap=window.if60Swap;
 if(typeof swap!=='function')return;
 window.if60Swap=async function(oldId,newId){
  const result=await swap.apply(this,arguments);
  setTimeout(()=>{
   const card=document.getElementById('if50ex_'+newId);
   if(!card)return;
   // Il nuovo esercizio deve restare "Da iniziare": il click abilita carico/ripetizioni/check.
   const startBtn=[...card.querySelectorAll('.if949-flow button')].find(b=>(b.textContent||'').includes('Inizia esercizio'));
   if(startBtn){
    startBtn.disabled=false;
    startBtn.onclick=()=>window.if949Start(newId);
   }
  },120);
  return result;
 };
 console.log('[INFORMHA_REPLACEMENT_START_FIX] version=0.9.89 replacement_start_enabled=1 load_and_check_after_start=1');
})();
