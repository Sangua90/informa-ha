// InFormha 0.9.38 - rende persistente e visibile il contatore calibrazione nella Home
(function(){
  function modeMetric(){
    const home=document.querySelector('[data-page="home"]');
    if(!home)return null;
    const metrics=[...home.querySelectorAll('.metric')];
    const metric=metrics.find(m=>((m.querySelector('span')?.textContent||'').trim().toLowerCase()==='modalità')) || metrics[1];
    return metric?.querySelector('b')||null;
  }

  async function refresh(){
    const out=modeMetric();
    if(!out)return;
    try{
      const d=await api('api/calibration-0938');
      if(d.adaptive){
        out.textContent='Adattiva';
        out.dataset.ifCalibration='adaptive';
        out.title=`${d.valid_workouts} allenamenti validi registrati`;
      }else{
        out.textContent=`Calibrazione ${d.valid_workouts}/${d.target}`;
        out.dataset.ifCalibration='calibration';
        out.title=`Mancano ${d.remaining} allenament${d.remaining===1?'o':'i'} valid${d.remaining===1?'o':'i'} alla modalità adattiva`;
      }
    }catch(e){
      out.textContent='Calibrazione 0/3';
      out.dataset.ifCalibration='fallback';
    }
  }

  window.if938RefreshCalibration=refresh;
  const oldGo=window.go;
  if(typeof oldGo==='function'){
    window.go=function(page){
      const r=oldGo.apply(this,arguments);
      if(page==='home')setTimeout(refresh,50);
      return r;
    };
  }

  setTimeout(refresh,50);
  setTimeout(refresh,400);
  setTimeout(refresh,1200);
  setInterval(()=>{
    const home=document.querySelector('[data-page="home"].active');
    if(home)refresh();
  },5000);

  console.log('[INFORMHA_CALIBRATION_FIX] version=0.9.38 persistent_home_counter=1');
})();
