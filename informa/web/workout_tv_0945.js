// InFormha 0.9.45 - modalita allenamento orizzontale per AirPlay
(function(){
  let currentIndex=0;
  let lastLandscape=false;
  let syncing=false;

  const workoutPage=()=>document.querySelector('[data-page="workout"]');
  const exerciseCards=()=>[...(workoutPage()?.querySelectorAll('.if50-ex,[id="if50ex_cardio"]')||[])];
  const isLandscape=()=>window.matchMedia('(orientation: landscape)').matches&&window.innerWidth>=600;
  const activeName=()=>document.querySelector('.page.active')?.dataset.page||'';
  const inSession=()=>['workout','recovery'].includes(activeName())&&!!(typeof IF50!=='undefined'&&IF50.started);
  const esc=v=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};

  function firstPendingIndex(cards){
    const index=cards.findIndex(card=>{
      const checks=[...card.querySelectorAll('.check')];
      return checks.length?checks.some(button=>!button.classList.contains('done')):!card.querySelector('.choice button.on');
    });
    return index<0?Math.max(0,cards.length-1):index;
  }

  function sessionProgress(cards){
    const checks=cards.flatMap(card=>[...card.querySelectorAll('.check')]);
    const done=checks.filter(button=>button.classList.contains('done')).length;
    return {done,total:checks.length,pct:checks.length?Math.round(done/checks.length*100):0};
  }

  function ensureStage(){
    const page=workoutPage();if(!page)return null;
    let stage=document.getElementById('if945TvStage');
    if(!stage){
      stage=document.createElement('aside');stage.id='if945TvStage';stage.className='if945-tv-stage';
      page.prepend(stage);
    }
    return stage;
  }

  function renderStage(){
    if(syncing)return;syncing=true;
    try{
      const cards=exerciseCards(),stage=ensureStage();if(!stage||!cards.length)return;
      currentIndex=Math.max(0,Math.min(currentIndex,cards.length-1));
      cards.forEach((card,index)=>card.classList.toggle('if945-current',index===currentIndex));
      const current=cards[currentIndex];
      const name=current.querySelector('h2')?.textContent?.trim()||'Esercizio';
      const next=cards[currentIndex+1]?.querySelector('h2')?.textContent?.trim()||'Fine allenamento';
      const progress=sessionProgress(cards);
      stage.innerHTML=`
        <div class="if945-tv-brand"><span>In</span><b>Form</b><i>Ha</i><em>TV</em></div>
        <div class="if945-tv-live">● SEDUTA IN CORSO</div>
        <div class="if945-tv-count">Esercizio ${currentIndex+1} di ${cards.length}</div>
        <h1>${esc(name)}</h1>
        <div class="if945-tv-progress"><i style="width:${progress.pct}%"></i></div>
        <div class="if945-tv-sets">${progress.done}/${progress.total} serie · ${progress.pct}%</div>
        <div class="if945-tv-next"><span>Successivo</span><b>${esc(next)}</b></div>
        <div class="if945-tv-nav">
          <button type="button" onclick="if945TvMove(-1)" ${currentIndex===0?'disabled':''}>← Prima</button>
          <button type="button" onclick="if945TvPending()">Da completare</button>
          <button type="button" onclick="if945TvMove(1)" ${currentIndex===cards.length-1?'disabled':''}>Dopo →</button>
        </div>
        <button class="if945-tv-finish" type="button" onclick="go('endworkout')">Fine allenamento</button>
        <div class="if945-tv-hint">iPhone telecomando · TV tramite Duplica schermo AirPlay</div>`;
    }finally{syncing=false;}
  }

  function syncMode(){
    const landscape=isLandscape();
    const enabled=landscape&&inSession();
    document.body.classList.toggle('if945-tv-mode',enabled);
    if(enabled&&activeName()==='workout'){
      const cards=exerciseCards();
      if(landscape&&!lastLandscape)currentIndex=firstPendingIndex(cards);
      renderStage();
    }
    if(!landscape)document.querySelectorAll('.if945-current').forEach(card=>card.classList.remove('if945-current'));
    lastLandscape=landscape;
  }

  window.if945TvMove=function(delta){
    const cards=exerciseCards();
    currentIndex=Math.max(0,Math.min(currentIndex+delta,cards.length-1));
    renderStage();
    cards[currentIndex]?.scrollTo?.({top:0,behavior:'smooth'});
  };
  window.if945TvPending=function(){currentIndex=firstPendingIndex(exerciseCards());renderStage();};

  const oldGo=window.go;
  if(typeof oldGo==='function')window.go=function(){const result=oldGo.apply(this,arguments);setTimeout(syncMode,30);return result;};

  const oldRender=window.if50RenderWorkout;
  if(typeof oldRender==='function')window.if50RenderWorkout=function(){const result=oldRender.apply(this,arguments);currentIndex=0;setTimeout(syncMode,80);return result;};

  const oldComplete=window.if50CompleteSet;
  if(typeof oldComplete==='function')window.if50CompleteSet=async function(){const result=await oldComplete.apply(this,arguments);currentIndex=firstPendingIndex(exerciseCards());setTimeout(syncMode,80);return result;};

  const css=document.createElement('style');css.textContent=`
    .if945-tv-stage{display:none}
    body.if945-tv-mode{overflow:hidden;background:#05070a}
    body.if945-tv-mode .top,body.if945-tv-mode .nav{display:none!important}
    body.if945-tv-mode .app{max-width:none;width:100%;height:100dvh;padding:max(12px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));overflow:hidden}
    body.if945-tv-mode [data-page="workout"].active{height:100%;display:grid;grid-template-columns:minmax(245px,34%) minmax(0,1fr);gap:14px}
    body.if945-tv-mode [data-page="workout"]>:not(.if945-tv-stage):not(.if945-current){display:none!important}
    body.if945-tv-mode .if945-tv-stage{display:flex;min-width:0;flex-direction:column;padding:18px;border:1px solid rgba(255,255,255,.1);border-radius:24px;background:radial-gradient(circle at 5% 0%,rgba(34,197,94,.18),transparent 40%),linear-gradient(145deg,#11171d,#090c10);box-shadow:var(--shadow);overflow:auto}
    .if945-tv-brand{display:flex;align-items:center;font-size:21px;font-weight:950}.if945-tv-brand b{color:var(--green2)}.if945-tv-brand i{color:var(--blue);font-style:normal}.if945-tv-brand em{margin-left:8px;padding:4px 7px;border-radius:8px;background:rgba(56,189,248,.14);color:#7dd3fc;font-size:9px;font-style:normal;letter-spacing:1px}
    .if945-tv-live{margin-top:18px;color:#69e397;font-size:10px;font-weight:900;letter-spacing:1.3px}.if945-tv-count{margin-top:8px;color:var(--m);font-size:12px}.if945-tv-stage h1{font-size:clamp(24px,4vw,46px);line-height:1;margin:8px 0 14px;letter-spacing:-1.2px}
    .if945-tv-progress{height:9px;border-radius:999px;overflow:hidden;background:#050709;border:1px solid var(--ln)}.if945-tv-progress i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--green),var(--blue))}.if945-tv-sets{margin-top:7px;font-weight:850;color:#dce3ea;font-size:13px}
    .if945-tv-next{margin-top:auto;padding:12px;border-radius:15px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.2)}.if945-tv-next span{display:block;color:var(--m);font-size:9px;text-transform:uppercase;letter-spacing:1px}.if945-tv-next b{display:block;margin-top:4px;font-size:14px}
    .if945-tv-nav{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:9px}.if945-tv-nav button{min-height:44px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:#171d24;color:#fff;font-size:11px;font-weight:850}.if945-tv-nav button:disabled{opacity:.3}.if945-tv-hint{margin-top:8px;color:#74808c;font-size:9px;text-align:center}
    .if945-tv-finish{min-height:38px;margin-top:7px;border:1px solid rgba(244,63,94,.24);border-radius:11px;background:rgba(159,18,57,.16);color:#fda4af;font-size:11px;font-weight:850}
    body.if945-tv-mode [data-page="workout"]>.if945-current{display:block!important;height:100%;margin:0;padding:18px;overflow:auto;border-radius:24px;overscroll-behavior:contain}
    body.if945-tv-mode .if945-current>.row:first-child h2{font-size:clamp(24px,3.4vw,42px);line-height:1.05}
    body.if945-tv-mode .if945-current>.row:first-child .ey{font-size:12px}
    body.if945-tv-mode .if945-current .setrow{grid-template-columns:38px minmax(90px,1fr) minmax(80px,.8fr) 58px;gap:10px;padding:9px;margin-top:8px}
    body.if945-tv-mode .if945-current .setrow input{font-size:18px;min-height:50px;text-align:center}
    body.if945-tv-mode .if945-current .check{height:50px;font-size:22px}
    body.if945-tv-mode .if945-current>.card.coach,body.if945-tv-mode .if945-current .if60-actions{display:none!important}
    body.if945-tv-mode .if945-current>.choice button{min-height:46px;flex:1;font-size:14px;font-weight:800}
    body.if945-tv-mode [data-page="recovery"].active{height:100%;display:grid;place-items:center}
    body.if945-tv-mode [data-page="recovery"].active>.ey,body.if945-tv-mode [data-page="recovery"].active>h1{display:none}
    body.if945-tv-mode [data-page="recovery"]>.card{width:min(920px,94vw);margin:0;padding:clamp(20px,4vw,48px)}
    body.if945-tv-mode [data-page="recovery"] .timer{font-size:clamp(88px,18vw,190px);line-height:1}
    body.if945-tv-mode [data-page="recovery"] .btn{font-size:18px;min-height:54px}
    @media (orientation:landscape) and (max-height:430px){body.if945-tv-mode .if945-tv-stage{padding:13px}.if945-tv-live{margin-top:10px}.if945-tv-stage h1{margin-bottom:10px}.if945-tv-next{padding:9px}.if945-tv-hint{display:none}body.if945-tv-mode [data-page="workout"]>.if945-current{padding:13px}}
  `;document.head.appendChild(css);

  window.addEventListener('resize',()=>setTimeout(syncMode,60));
  window.addEventListener('orientationchange',()=>setTimeout(syncMode,180));
  const page=workoutPage();if(page)page.addEventListener('click',()=>setTimeout(syncMode,100));
  setTimeout(syncMode,250);setInterval(syncMode,1200);
  console.log('[INFORMHA_WORKOUT_TV] version=0.9.45 landscape_auto=1 airplay_mirroring=1 phone_remote=1 workout_focus=1 recovery_timer=1');
})();
