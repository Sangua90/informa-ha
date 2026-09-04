// InFormha 0.9.35 - sposta HealthSync nel riquadro Apple Salute esistente
(function(){
  const LABELS={steps:'Passi oggi',active_calories:'Calorie attive',exercise_time:'Tempo esercizio',heart_rate:'Frequenza cardiaca',resting_heart_rate:'FC a riposo',hrv:'HRV',weight:'Peso',body_fat:'Massa grassa',bmi:'BMI',lean_body_mass:'Massa magra',vo2_max:'VO₂ max',walking_running_distance:'Distanza cammino/corsa',sleep:'Sonno ultima notte',last_workout_type:'Ultimo allenamento',last_workout_duration:'Durata ultimo allenamento',last_workout_calories:'Calorie ultimo allenamento',last_workout_distance:'Distanza ultimo allenamento'};
  const esc=v=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
  const fmt=x=>!x||x.value===null||x.value===undefined||x.value===''?'—':`${esc(x.value)}${x.unit?` ${esc(x.unit)}`:''}`;
  function fmtTs(x){const raw=x?.value||x?.last_updated;if(!raw)return'—';const d=new Date(raw);return Number.isNaN(d.getTime())?esc(raw):d.toLocaleString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
  function appleCard(){
    const page=document.querySelector('[data-page="connections"]');if(!page)return null;
    return [...page.querySelectorAll(':scope > .card')].find(c=>{const t=(c.textContent||'').toLowerCase();return t.includes('apple salute')&&(t.includes('health auto export')||t.includes('healthsync'))})||null;
  }
  function removeDuplicate(){document.getElementById('if934Health')?.remove()}
  async function load(){
    const host=document.getElementById('if935HealthHost');if(!host)return;
    host.innerHTML='<div class="sub">Lettura dati da Home Assistant…</div>';
    try{
      const d=await api('api/healthsync'),data=d.data||{},connected=!!d.connected,found=Number(d.found||0),last=data.last_sync;
      const rows=Object.entries(LABELS).filter(([k])=>data[k]).map(([k,label])=>`<div class="measure"><span>${esc(label)}</span><b>${fmt(data[k])}</b></div>`).join('');
      host.innerHTML=`<div class="measure"><span>Collegamento</span><b class="${connected?'green':''}">${connected?'● Attivo':'● Nessun dato trovato'}</b></div><div class="measure"><span>Sensori riconosciuti</span><b>${found}</b></div><div class="measure"><span>Ultimo aggiornamento</span><b>${fmtTs(last)}</b></div>${rows?`<div class="if935HealthRows">${rows}</div>`:'<div class="sub" style="margin-top:10px">Nessun sensore Health Auto Export compatibile trovato.</div>'}<button class="btn secondary" type="button" id="if935Refresh">Aggiorna dati</button>`;
      document.getElementById('if935Refresh')?.addEventListener('click',load);
    }catch(e){host.innerHTML=`<div class="sub">${esc(e.message||'Errore lettura dati automatici')}</div>`}
  }
  function install(){
    removeDuplicate();
    const card=appleCard();if(!card||card.dataset.if935Ready==='1')return;
    card.dataset.if935Ready='1';card.style.cursor='pointer';
    const original=[...card.children];
    const body=document.createElement('div');body.id='if935HealthHost';body.className='hide';body.style.marginTop='14px';card.appendChild(body);
    const hint=document.createElement('div');hint.id='if935Hint';hint.className='sub';hint.style.marginTop='10px';hint.textContent='Tocca per vedere i dati ricevuti dall’iPhone.';card.appendChild(hint);
    card.addEventListener('click',e=>{
      if(e.target.closest('button'))return;
      const open=body.classList.contains('hide');body.classList.toggle('hide',!open);hint.textContent=open?'Tocca di nuovo per chiudere.':'Tocca per vedere i dati ricevuti dall’iPhone.';if(open)load();
    });
  }
  const css=document.createElement('style');css.textContent='#if935HealthHost{border-top:1px solid var(--ln);padding-top:12px}.if935HealthRows{margin-top:10px}';document.head.appendChild(css);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,300));else setTimeout(install,300);
  setTimeout(install,800);setInterval(()=>{removeDuplicate();install()},1500);
  console.log('[INFORMHA_HEALTHSYNC] version=0.9.35 relocated_to_apple_card=1 duplicate_removed=1');
})();
