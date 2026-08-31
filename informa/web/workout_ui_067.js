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
    const total=cards.length;const done=[...page.querySelectorAll('.check.done')].length;const totalSets=page.querySelectorAll('.if50-ex .check').length;
    const pct=totalSets?Math.round(done/totalSets*100):0;
    head.innerHTML=`<div class="row"><div style="flex:1"><div class="ey">Seduta in corso</div><b>${done}/${totalSets} serie completate</b></div><div class="if67-pct">${pct}%</div></div><div class="if67-progress"><i style="width:${pct}%"></i></div><div class="sub">Segna una serie alla volta. Il recupero parte automaticamente dopo il salvataggio.</div>`;
  }
  const css=document.createElement('style');css.textContent=`
    .if67-session-head{position:sticky;top:8px;z-index:5;background:rgba(12,15,19,.94);backdrop-filter:blur(18px);box-shadow:0 12px 32px rgba(0,0,0,.28)}
    .if67-progress{height:8px;background:#090b0e;border:1px solid var(--ln);border-radius:999px;overflow:hidden;margin:12px 0}.if67-progress i{display:block;height:100%;background:linear-gradient(90deg,var(--green),var(--blue));border-radius:999px;transition:width .2s}.if67-pct{font-size:22px;font-weight:900;color:var(--green2)}
    .if67-exercise-card{padding:20px;border-radius:26px}.if67-index{font-size:11px;color:var(--blue);font-weight:850;text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px}.if67-exercise-card .setrow{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.045);padding:8px;border-radius:15px}.if67-exercise-card .check{min-width:44px}.if67-exercise-card .check.done{box-shadow:0 0 20px rgba(34,197,94,.22)}
  `;document.head.appendChild(css);
  const oldRender=window.if50RenderWorkout;if(oldRender)window.if50RenderWorkout=function(){const r=oldRender.apply(this,arguments);setTimeout(decorateWorkout,0);return r};
  const oldComplete=window.if50CompleteSet;if(oldComplete)window.if50CompleteSet=async function(){const r=await oldComplete.apply(this,arguments);setTimeout(decorateWorkout,0);return r};
  setTimeout(decorateWorkout,150);
})();
