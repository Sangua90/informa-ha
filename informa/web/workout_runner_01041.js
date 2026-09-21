// InFormha 0.10.41 - layout allenamento touch-first, sequenziale e compatto
(function(){
 const FLOW='informha_workout_flow_0949',ACTIVE='informha_workout_active_0109';
 function states(){try{return JSON.parse(localStorage.getItem(FLOW)||'{}')||{}}catch(e){return{}}}
 function cards(){return [...document.querySelectorAll('[data-page="workout"] .if50-ex,[data-page="workout"] #if50ex_cardio')]}
 function idOf(c){return c?.id==='if50ex_cardio'?'cardio':String(c?.id||'').replace('if50ex_','')}
 function exercise(id){return typeof IF50!=='undefined'&&Array.isArray(IF50.plan)?IF50.plan.find(x=>x.id===id):null}
 function active(){try{return localStorage.getItem(ACTIVE)||null}catch(e){return null}}
 function current(){const s=states(),a=active();if(a&&s[a]?.stage!=='archived')return a;const c=cards().find(x=>s[idOf(x)]?.stage!=='archived');return c?idOf(c):null}
 function weightInput(c){return c?.querySelector('.setrow:not(:has(.check.done)) input[id^="if50w_"]')||c?.querySelector('input[id^="if50w_"]')}
 window.if1041Weight=function(id,d){const i=weightInput(document.getElementById('if50ex_'+id));if(!i)return;let v=parseFloat(String(i.value||'0').replace(',','.'))||0;i.value=Math.max(0,v+d);i.dispatchEvent(new Event('input',{bubbles:true}))};
 function draw(){
  const p=document.querySelector('[data-page="workout"]');if(!p)return;p.classList.add('if1041-runner');
  let n=document.getElementById('if1041Nav');if(!n){n=document.createElement('div');n.id='if1041Nav';p.prepend(n)}
  const a=cards(),s=states(),id=current(),ix=Math.max(0,a.findIndex(c=>idOf(c)===id));
  n.innerHTML='<div class="if1041-top"><b>InFormha</b><button onclick="go(\'endworkout\')">Fine</button></div><div class="if1041-dots">'+a.map(c=>{const x=idOf(c),q=s[x],cl=q?.stage==='archived'?(q.status==='Saltato'?'skip':q.status==='Parziale'?'partial':'done'):(x===id?'active':'');return '<i class="'+cl+'"></i>'}).join('')+'<strong>'+(a.length?ix+1:0)+'/'+a.length+'</strong></div>';
  const c=a[ix],e=exercise(id);if(!c||!e)return;
  let b=c.querySelector('.if1041-summary');if(!b){b=document.createElement('div');b.className='if1041-summary';c.prepend(b)}
  c.classList.toggle('if1041-timed',!!(e.mobility||e.stretching||e.cardio));c.classList.toggle('if1041-strength',!(e.mobility||e.stretching||e.cardio));if(e.mobility||e.stretching||e.cardio){b.innerHTML='<div class="if1041-kicker">ESERCIZIO '+(ix+1)+' DI '+a.length+'</div><h2>'+e.name+'</h2>';return}
  const w=weightInput(c),weighted=e.loadType!=='bodyweight',unit=e.loadType==='plates'?'piastre':'kg';
  b.innerHTML='<div class="if1041-kicker">ESERCIZIO '+(ix+1)+' DI '+a.length+'</div><h2>'+e.name+'</h2><div class="if1041-metrics"><span><small>Serie</small><b>'+e.sets+'</b></span><span><small>Ripetizioni</small><b>'+(e.reps??'—')+'</b></span><span><small>Recupero</small><b>'+e.rest+' s</b></span></div>'+(weighted?'<div class="if1041-weight"><small>PESO ATTUALE · '+unit+'</small><div><button onclick="if1041Weight(\''+id+'\',-1)">−</button><b>'+(w?.value||'—')+'</b><button onclick="if1041Weight(\''+id+'\',1)">＋</button></div></div>':'')+'<div class="if1041-actions"><button onclick="if60ShowSwap(\''+id+'\')">⇄ Sostituisci</button>'+(e.guide?'<button onclick="openGuide(\''+e.guide+'\')">ⓘ Guida</button>':'')+'</div>';
 }
 function refresh(){setTimeout(draw,0);setTimeout(draw,150)}
 const r=window.if50RenderWorkout;if(typeof r==='function')window.if50RenderWorkout=function(){const x=r.apply(this,arguments);refresh();return x};
 const st=window.if50Status;if(typeof st==='function')window.if50Status=async function(){const x=await st.apply(this,arguments);refresh();return x};
 const cs=window.if50CompleteSet;if(typeof cs==='function')window.if50CompleteSet=async function(){const x=await cs.apply(this,arguments);refresh();return x};
 const g=window.go;if(typeof g==='function')window.go=function(page){const x=g.apply(this,arguments);if(page==='workout')refresh();return x};
 const css=document.createElement('style');css.textContent=`
 .if1041-runner>h1,.if1041-runner>.ey,.if1041-runner>.status,.if1041-runner>#if67SessionHead{display:none!important}
 #if1041Nav{position:sticky;top:0;z-index:40;background:rgba(8,12,16,.96);backdrop-filter:blur(18px);padding:10px 2px 12px;margin-bottom:10px}.if1041-top{display:flex;align-items:center;justify-content:space-between}.if1041-top b{font-size:20px}.if1041-top button{min-width:76px;min-height:46px;border-radius:23px;border:1px solid #ef476f;background:transparent;color:#ff758f;font-weight:850}.if1041-dots{display:flex;align-items:center;gap:5px;margin-top:12px}.if1041-dots i{height:10px;flex:1;border-radius:8px;background:rgba(255,255,255,.12)}.if1041-dots i.done{background:#22c55e}.if1041-dots i.active{background:#38bdf8;box-shadow:0 0 12px rgba(56,189,248,.45)}.if1041-dots i.skip{background:#ef4444}.if1041-dots i.partial{background:#f59e0b}.if1041-dots strong{font-size:16px;margin-left:6px}
 .if1041-runner .if50-ex,.if1041-runner #if50ex_cardio{padding:18px!important;border-radius:26px!important}
 .if1041-runner .if1041-strength>.row,.if1041-runner .if1041-strength>.sub,.if1041-runner .if1041-strength>.choice,.if1041-runner .if1041-strength>.card.coach{display:none!important}
 .if1041-runner .if1041-strength>.setrow{margin-top:9px!important}
 .if1041-runner .if1041-strength>.setrow b{font-size:17px!important}
 .if1041-runner .if1041-strength>.setrow input{min-height:50px!important;font-size:18px!important}
 .if1041-runner .if1041-strength>.setrow .check{min-width:54px!important;min-height:50px!important}
 body:has([data-page="workout"].active.if1041-runner) nav,body:has([data-page="workout"].active.if1041-runner) .bottom-nav,body:has([data-page="workout"].active.if1041-runner) [class*="bottom-nav"]{display:none!important}
 [data-page="workout"].if1041-runner{padding-bottom:12px!important}.if1041-summary .if1041-kicker{color:#38bdf8;font-size:12px;font-weight:900;letter-spacing:.08em}.if1041-summary h2{font-size:24px;margin:7px 0 14px}.if1041-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.if1041-metrics span{padding:11px 5px;text-align:center;border:1px solid rgba(56,189,248,.22);border-radius:16px}.if1041-metrics small,.if1041-weight small{display:block;color:var(--m);font-size:11px}.if1041-metrics b{display:block;font-size:19px;margin-top:4px}.if1041-weight{margin-top:10px;padding:11px;border:1px solid rgba(56,189,248,.22);border-radius:18px;text-align:center}.if1041-weight>div{display:flex;align-items:center;justify-content:space-between;margin-top:6px}.if1041-weight button{width:56px;height:50px;border-radius:15px;font-size:25px}.if1041-weight b{font-size:28px}.if1041-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.if1041-actions button{min-height:54px;border-radius:17px;font-weight:850}.if1041-runner .if949-flow .btn,.if1041-runner .if978-timed-controls button{min-height:64px!important;font-size:18px!important}.if1041-runner .if60-actions{display:none!important}
 `;document.head.appendChild(css);setTimeout(draw,500);console.log('[INFORMHA_WORKOUT_RUNNER] version=0.10.42 touch_first=1 legacy_hidden=1 workout_nav_hidden=1 sequential=1 compact=1 weight_controls=1 swap=1 guide=1');
})();