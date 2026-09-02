// InFormha 0.9.37 - calibrazione reale: 3 allenamenti validi poi modalità adattiva
(function(){
  function modeMetric(){
    const home=document.querySelector('[data-page="home"]');if(!home)return null;
    const metric=[...home.querySelectorAll('.metric')].find(m=>(m.querySelector('span')?.textContent||'').trim()==='Modalità');
    return metric?.querySelector('b')||null;
  }
  async function refresh(){
    const out=modeMetric();if(!out)return;
    try{
      const d=await api('api/calibration-0937');
      if(d.adaptive){
        out.textContent='Adattiva';
        out.title=`${d.valid_workouts} allenamenti validi registrati`;
      }else{
        out.textContent=`Calibrazione ${d.valid_workouts}/${d.target}`;
        out.title=`Mancano ${d.remaining} allenament${d.remaining===1?'o':'i'} valid${d.remaining===1?'o':'i'} alla modalità adattiva`;
      }
    }catch(e){
      out.textContent='Calibrazione';
    }
  }
  window.if937RefreshCalibration=refresh;
  const oldGo=window.go;
  if(typeof oldGo==='function')window.go=function(page){const r=oldGo.apply(this,arguments);if(page==='home')setTimeout(refresh,0);return r};
  setTimeout(refresh,100);setTimeout(refresh,700);
  console.log('[INFORMHA_CALIBRATION] version=0.9.37 ui_mode_counter=1');
})();
