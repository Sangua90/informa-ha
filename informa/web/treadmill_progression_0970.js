// InFormha 0.9.70 - tapis roulant adattivo: durata, velocita, inclinazione e storico
(function(){
  async function suggestion(){try{return await api('api/treadmill-0970/suggestion')}catch(e){return {suggestion:null,reason:''}}}
  async function enhance(){
    const card=document.getElementById('if50ex_treadmill');if(!card||card.querySelector('#if970Treadmill'))return;
    const d=await suggestion(),s=d.suggestion||{};
    const box=document.createElement('div');box.id='if970Treadmill';box.className='card coach';
    box.innerHTML=`<div class="ey">Parametri tapis roulant</div><div class="grid2"><label class="sub">Velocità media km/h<input class="field" id="if970Speed" type="number" min="0" max="25" step="0.1" value="${s.speed_kmh??''}" placeholder="km/h"></label><label class="sub">Inclinazione media %<input class="field" id="if970Incline" type="number" min="0" max="30" step="0.5" value="${s.incline_pct??0}" placeholder="%"></label></div><div class="grid2" style="margin-top:8px"><label class="sub">Velocità massima km/h<input class="field" id="if970MaxSpeed" type="number" min="0" max="25" step="0.1" value="${s.speed_kmh??''}"></label><label class="sub">Inclinazione massima %<input class="field" id="if970MaxIncline" type="number" min="0" max="30" step="0.5" value="${s.incline_pct??0}"></label></div><label class="sub" style="display:block;margin-top:8px">Fatica cardio<select class="field" id="if970Fatigue"><option>Facile</option><option selected>Giusta</option><option>Dura</option><option>Al limite</option></select></label><div class="sub" style="margin-top:8px">${d.reason||''}</div><button class="btn secondary" type="button" onclick="if970SaveTreadmill()">Salva dati tapis roulant</button>`;
    const status=card.querySelector('.choice');status?.insertAdjacentElement('beforebegin',box);
  }
  function num(id){const n=parseFloat(String(document.getElementById(id)?.value||'').replace(',','.'));return Number.isFinite(n)?n:null}
  window.if970SaveTreadmill=async function(){
    const duration=num('if931TreadmillMin')||num('if50CardioMin');const speed=num('if970Speed'),incl=num('if970Incline'),maxSpeed=num('if970MaxSpeed'),maxIncl=num('if970MaxIncline'),fatigue=document.getElementById('if970Fatigue')?.value||'Giusta';
    if(!duration||duration<=0){toast('Inserisci i minuti');return}if(speed===null){toast('Inserisci la velocità media');return}
    try{await api('api/treadmill-0970',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({duration_min:duration,avg_speed_kmh:speed,max_speed_kmh:maxSpeed,avg_incline_pct:incl,max_incline_pct:maxIncl,fatigue,phases:[]})});await api('api/cardio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({activity:'Tapis roulant Fassi',duration_min:duration,notes:`Velocità media ${speed} km/h · inclinazione media ${incl??0}% · fatica ${fatigue}`})});toast('Tapis roulant salvato')}catch(e){toast(e.message||'Errore salvataggio tapis roulant')}
  };
  const render=window.if50RenderWorkout;if(typeof render==='function')window.if50RenderWorkout=function(){const r=render.apply(this,arguments);setTimeout(enhance,80);return r};
  const go0=window.go;if(typeof go0==='function')window.go=function(page){const r=go0.apply(this,arguments);if(page==='workout')setTimeout(enhance,100);return r};
  setTimeout(enhance,400);
  console.log('[INFORMHA_TREADMILL_ADAPTIVE] version=0.9.70 speed=1 incline=1 history=1 progression=1');
})();
