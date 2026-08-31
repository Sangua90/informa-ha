// InFormha 0.6.9 - riepilogo mobile 7 giorni e conteggi corretti
(function(){
  const oldLoad = typeof if50LoadWeek === 'function' ? if50LoadWeek : null;
  window.if69LoadWeek = async function(){
    const p=document.querySelector('[data-page="coach"]'); if(!p)return;
    let d=null; try{d=await api('api/coach/week')}catch(e){}
    const s=d?.summary||{};
    p.innerHTML=`<div class="ey">Coach virtuale</div><h1>Ultimi 7 giorni</h1>
      <div class="card coach">
        <div class="measure"><span>Giorni con allenamento</span><b>${s.workouts||0}</b></div>
        <div class="measure"><span>Forza</span><b>${s.strength_workouts||0}</b></div>
        <div class="measure"><span>Cardio</span><b>${s.cardio_sessions||0} · ${s.cardio_minutes||0} min</b></div>
        <div class="measure"><span>Solo cardio</span><b>${s.cardio_only_sessions||0}</b></div>
        <div class="measure"><span>Serie registrate</span><b>${s.sets||0}</b></div>
      </div>
      <div class="card">
        <div class="ey">Esercizi</div>
        <div class="measure"><span>Completati</span><b class="green">${s.completed||0}</b></div>
        <div class="measure"><span>Parziali</span><b>${s.partial||0}</b></div>
        <div class="measure"><span>Saltati</span><b>${s.skipped||0}</b></div>
      </div>
      <div class="card"><h2>Nessun giorno rigido</h2><div class="sub">Il riepilogo usa una finestra mobile di 7 giorni. Se registri solo cardio, la seduta viene comunque conteggiata.</div></div>
      <button class="btn secondary" onclick="go('progress')">Progressi e misure</button><button class="btn secondary" onclick="go('profile')">Indietro</button>`;
  };
  if(oldLoad){ try{ window.if50LoadWeek = window.if69LoadWeek; }catch(e){} }
  setTimeout(()=>window.if69LoadWeek(),80);
})();
