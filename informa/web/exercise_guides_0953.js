// InFormha 0.9.53 - pacchetto guide approvate corpo libero e manubri
(function(){
  const GUIDE_IDS=new Set([
    'plank','glute_bridge','calf_raise',
    'shoulder_press','lateral_raise','romanian_deadlift'
  ]);
  const oldOpen=window.openGuide;

  window.openGuide=function(id){
    if(GUIDE_IDS.has(id)&&typeof window.if74OpenImage==='function'){
      window.if74OpenImage(id);
      return;
    }
    return typeof oldOpen==='function'?oldOpen.apply(this,arguments):undefined;
  };

  console.log('[INFORMHA_EXERCISE_GUIDES] version=0.9.53 approved_guides=6 bundled_photos=1 workout_buttons=1');
})();
