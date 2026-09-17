// InFormha 0.9.91 - esercizio sostitutivo subito attivo
(function(){
 const swap=window.if60Swap;
 if(typeof swap!=='function')return;
 window.if60Swap=async function(oldId,newId){
  const result=await swap.apply(this,arguments);
  setTimeout(()=>{
   const card=document.getElementById('if50ex_'+newId);
   if(!card)return;
   // Scegliere il sostituto equivale a passare a quell'esercizio: lo avviamo subito.
   // if949Start abilita carico/piastre, ripetizioni e check senza avviare recupero.
   if(typeof window.if949Start==='function')window.if949Start(newId);
   card.querySelector('.setrow input')?.focus();
  },160);
  return result;
 };
 console.log('[INFORMHA_REPLACEMENT_START_FIX] version=0.9.91 replacement_auto_start=1 load_inputs_enabled=1 set_check_enabled=1');
})();
