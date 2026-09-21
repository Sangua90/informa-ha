// InFormha 0.6.7 - schermata allenamento piu chiara
(function(){
  function decorateWorkout(){
    const page=document.querySelector('[data-page="workout"]'); if(!page)return;
    page.classList.add('if67-workout');
    const cards=[...page.querySelectorAll('.if50-ex,[id="if50ex_cardio"]')];
    cards.forEach((card,i)=>{
      card.classList.add('if67-exercise-card');
      if(card.querySelector('.if67-index'))return;
      const h=card.querySelector('h2');
      if(h){const badge=document.createElement('div');badge.className='if67-index';badge.textContent=`Esercizio ${i+1} di ${cards.length}`;h.parentElement?.insertBefore(badge,h)}
    });
    let head=page.querySelector('#if67SessionHead');
    if(!head){
      head=document.createElement('div');head.id='if67SessionHead';head.className='card if67-session-head';
      const firstCard=cards[0]; page.insertBefore(head,firstCard||page.firstChild);
    }
    const total=cards.length;let flow={};try{flow=JSON.parse(localStorage.getItem('informha_workout_flow_0949')||'{}')||{}}catch(e){}const ids=cards.map(c=>c.id==='if50ex_cardio'?'cardio':String(c.id||'').replace('if50ex_',''));const completedExercises=ids.filter(id=>flow[id]?.stage==='archived').length;const pct=total?Math.round(completedExercises/total*100):0;const activeId=localStorage.getItem('informha_workout_active_0109');const segments=cards.map((c,i)=>{const id=ids[i],s=flow[id],status=s?.status||'',archived=s?.stage==='archived',cls=archived?(status==='Completato'?'done':status==='Parziale'?'partial':status==='Saltato'?'skipped':status==='Sostituito'?'replaced':'done'):(activeId===id?'active':'');return `<i class="${cls}" title="Esercizio ${i+1}${status?' · '+status:''}"></i>`}).join('');
    head.innerHTML=`<div class="row"><div style="flex:1"><div class="ey">Seduta in corso</div><b>${completedExercises}/${total} esercizi completati</b></div><div class="if67-pct">${pct}%</div></div><div class="if67-progress if67-segmented">${segments}</div>`;
  }
  const css=document.createElement('style');css.textContent=`
    .if67-session-head{position:sticky;top:8px;z-index:5;background:rgba(12,15,19,.94);backdrop-filter:blur(18px);box-shadow:0 12px 32px rgba(0,0,0,.28)}
    .if67-progress{height:10px;background:#090b0e;border:1px solid var(--ln);border-radius:999px;overflow:hidden;margin:12px 0}.if67-progress.if67-segmented{display:flex;gap:3px;padding:2px;height:14px;overflow:visible}.if67-progress.if67-segmented i{display:block;flex:1;height:8px;background:rgba(255,255,255,.10);border-radius:999px;transition:background .2s,box-shadow .2s,transform .2s}.if67-progress.if67-segmented i.done{background:#22c55e;box-shadow:0 0 10px rgba(34,197,94,.30)}.if67-progress.if67-segmented i.partial{background:#f59e0b;box-shadow:0 0 10px rgba(245,158,11,.25)}.if67-progress.if67-segmented i.skipped{background:#ef4444;box-shadow:0 0 10px rgba(239,68,68,.22)}.if67-progress.if67-segmented i.replaced{background:#a855f7;box-shadow:0 0 10px rgba(168,85,247,.24)}.if67-progress.if67-segmented i.active{background:var(--blue);box-shadow:0 0 12px rgba(56,189,248,.38);transform:scaleY(1.25)}.if67-pct{font-size:22px;font-weight:900;color:var(--green2)}
    .if67-exercise-card{padding:20px;border-radius:26px}.if67-index{font-size:11px;color:var(--blue);font-weight:850;text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px}.if67-exercise-card .setrow{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.045);padding:8px;border-radius:15px}.if67-exercise-card .check{min-width:44px}.if67-exercise-card .check.done{box-shadow:0 0 20px rgba(34,197,94,.22)}
  `;document.head.appendChild(css);
  window.if67Refresh=decorateWorkout;
  const oldRender=window.if50RenderWorkout;if(oldRender)window.if50RenderWorkout=function(){const r=oldRender.apply(this,arguments);setTimeout(decorateWorkout,0);return r};
  const oldComplete=window.if50CompleteSet;if(oldComplete)window.if50CompleteSet=async function(){const r=await oldComplete.apply(this,arguments);setTimeout(decorateWorkout,0);return r};
  setTimeout(decorateWorkout,150);
})();
