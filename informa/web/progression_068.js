// InFormha 0.6.8 - progressione basata sullo storico reale
(function(){
  async function loadProgression(){
    const plan=(typeof IF50!=='undefined'&&IF50.plan)||[];
    for(const ex of plan){
      if(ex.cardio)continue;
      const el=document.getElementById(`if50prog_${ex.id}`);if(!el)continue;
      try{
        const d=await api(`api/coach/progression/${encodeURIComponent(ex.name)}`);
        el.innerHTML=`<b>${d.calibrated?'Storico calibrato':'Calibrazione in corso'}</b><br>${d.recommendation}<br><span class="mini">Sedute confrontabili: ${d.sessions||0}</span>`;
      }catch(e){}
    }
  }
  const oldRender=window.if50RenderWorkout;if(oldRender)window.if50RenderWorkout=function(){const r=oldRender.apply(this,arguments);setTimeout(loadProgression,80);return r};
  const oldComplete=window.if50CompleteSet;if(oldComplete)window.if50CompleteSet=async function(){const r=await oldComplete.apply(this,arguments);setTimeout(loadProgression,120);return r};
  setTimeout(loadProgression,250);
})();
