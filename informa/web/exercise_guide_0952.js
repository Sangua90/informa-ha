// InFormha 0.9.52 - prima guida libera inclusa nel pacchetto
(function(){
  const GUIDE_ID='goblet_squat';
  const oldOpen=window.openGuide;

  window.openGuide=function(id){
    if(id===GUIDE_ID&&typeof window.if74OpenImage==='function'){
      window.if74OpenImage(id);
      return;
    }
    return typeof oldOpen==='function'?oldOpen.apply(this,arguments):undefined;
  };

  console.log('[INFORMHA_EXERCISE_GUIDE] version=0.9.52 guide=goblet_squat bundled_photo=1 workout_button=1');
})();
