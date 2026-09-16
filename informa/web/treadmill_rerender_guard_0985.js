// InFormha 0.9.85 - non riaprire tapis roulant gia archiviato dopo rerender/sostituzione
(function(){
 const start=window.if949Start;
 if(typeof start!=='function')return;
 window.if949Start=function(id){
  if(id==='treadmill'){
   const card=document.getElementById('if50ex_treadmill');
   if(card?.classList.contains('if949-archived'))return;
  }
  return start.apply(this,arguments);
 };
 console.log('[INFORMHA_TREADMILL_RERENDER_GUARD] version=0.9.85 archived_treadmill_blocked=1 swap_keeps_progress=1');
})();
