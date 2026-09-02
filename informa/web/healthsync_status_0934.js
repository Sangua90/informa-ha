// InFormha 0.9.34 - stato dati automatici iPhone / Health Sync
(function(){
  const LABELS={
    steps:'Passi oggi',active_calories:'Calorie attive',exercise_time:'Tempo esercizio',heart_rate:'Frequenza cardiaca',resting_heart_rate:'FC a riposo',hrv:'HRV',weight:'Peso',body_fat:'Massa grassa',bmi:'BMI',lean_body_mass:'Massa magra',vo2_max:'VO₂ max',walking_running_distance:'Distanza cammino/corsa',sleep:'Sonno ultima notte',last_workout_type:'Ultimo allenamento',last_workout_duration:'Durata ultimo allenamento',last_workout_calories:'Calorie ultimo allenamento',last_workout_distance:'Distanza ultimo allenamento'
  };
  const esc=v=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
  function fmt(x){if(!x||x.value===null||x.value===undefined||x.value==='')return '—';return `${esc(x.value)}${x.unit?` ${esc(x.unit)}`:''}`}
  function fmtTs(x){const raw=x?.value||x?.last_updated;if(!raw)return '—';const d=new Date(raw);return Number.isNaN(d.getTime())?esc(raw):d.toLocaleString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
  function install(){
    const box=document.getElementById('if921Accordion');if(!box||document.getElementById('if934Health'))return;
    const details=document.createElement('details');details.className='if921-section';details.id='if934Health';
    details.innerHTML=`<summary><span class="if921-icon">📱</span><span><b>iPhone / Health Sync</b><small>Verifica quali dati salute e attività stanno arrivando.</small></span><strong>›</strong></summary><div class="if921-body" id="if934HealthHost"><div class="sub">Apri la sezione per controllare il collegamento.</div></div>`;
    const first=box.querySelector('.if921-section');if(first)box.insertBefore(details,first);else box.appendChild(details);
    details.addEventListener('toggle',()=>{if(details.open)load()});
  }
  async function load(){
    const host=document.getElementById('if934HealthHost');if(!host)return;
    host.innerHTML='<div class="sub">Lettura dati da Home Assistant…</div>';
    try{
      const d=await api('api/healthsync');const data=d.data||{};const connected=!!d.connected;const found=Number(d.found||0);
      const last=data.last_sync;
      const rows=Object.entries(LABELS).filter(([k])=>data[k]).map(([k,label])=>`<div class="measure"><span>${esc(label)}</span><b>${fmt(data[k])}</b></div>`).join('');
      host.innerHTML=`<div class="card" style="margin:0 0 12px"><div class="measure"><span>Collegamento</span><b class="${connected?'green':''}">${connected?'● Attivo':'● Nessun dato trovato'}</b></div><div class="measure"><span>Sensori riconosciuti</span><b>${found}</b></div><div class="measure"><span>Ultimo aggiornamento</span><b>${fmtTs(last)}</b></div></div>${rows?`<div class="card" style="margin:0">${rows}</div>`:'<div class="card" style="margin:0"><div class="sub">InFormha non sta trovando ancora sensori Health Sync compatibili in Home Assistant.</div></div>'}<button class="btn secondary" type="button" id="if934Refresh">Aggiorna dati</button>`;
      document.getElementById('if934Refresh')?.addEventListener('click',load);
    }catch(e){host.innerHTML=`<div class="card warning"><div class="sub">${esc(e.message||'Errore lettura dati automatici')}</div></div>`}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,350));else setTimeout(install,350);
  setTimeout(install,900);setInterval(install,1500);
  console.log('[INFORMHA_HEALTHSYNC] version=0.9.34 status_ui=1 existing_backend=1');
})();
