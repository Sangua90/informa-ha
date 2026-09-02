// InFormha 0.9.33 - storico allenamenti consultabile ed eliminabile da Altro
(function(){
  const PAGE='workout-history-0933';
  const DETAIL='workout-history-detail-0933';

  function fmtDate(ts){
    if(!ts)return '—';
    const d=new Date(ts);if(Number.isNaN(d.getTime()))return ts;
    return d.toLocaleString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  function num(v,suffix=''){return v===null||v===undefined||v===''?'—':`${v}${suffix}`}

  function ensurePages(){
    const app=document.querySelector('.app');if(!app)return;
    if(!document.querySelector(`[data-page="${PAGE}"]`)){
      const p=document.createElement('section');p.className='page';p.dataset.page=PAGE;
      p.innerHTML='<div class="ey">Consultazione</div><h1>Allenamenti registrati</h1><div class="sub">Consulta le sedute salvate ed elimina quelle create per prova o per errore.</div><div id="if933HistoryHost" style="margin-top:14px"></div><button class="btn secondary" type="button" onclick="if933BackProfile()">Indietro</button>';
      app.appendChild(p);
    }
    if(!document.querySelector(`[data-page="${DETAIL}"]`)){
      const p=document.createElement('section');p.className='page';p.dataset.page=DETAIL;
      p.innerHTML='<div class="ey">Allenamento</div><h1 id="if933DetailTitle">Dettaglio</h1><div id="if933DetailHost"></div><button class="btn secondary" type="button" onclick="if933OpenHistory()">Indietro</button>';
      app.appendChild(p);
    }
  }

  function show(page){
    ensurePages();
    document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.dataset.page===page));
    document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.nav==='profile'));
    window.scrollTo({top:0,behavior:'auto'});
  }

  function installButton(){
    const profile=document.querySelector('[data-page="profile"]');if(!profile)return;
    let section=document.getElementById('if912ViewSection');
    if(!section){
      section=document.createElement('div');section.id='if912ViewSection';section.className='card';section.innerHTML='<div class="ey">Consultazione / Funzioni</div>';
      const version=[...profile.querySelectorAll(':scope > .card')].find(c=>(c.textContent||'').includes('Versione'));
      profile.insertBefore(section,version||null);
    }
    if(document.getElementById('if933HistoryButton'))return;
    const b=document.createElement('button');b.id='if933HistoryButton';b.className='btn secondary';b.type='button';b.textContent='Allenamenti registrati';
    b.addEventListener('click',()=>window.if933OpenHistory());
    section.appendChild(b);
  }

  window.if933BackProfile=function(){if(typeof go==='function')go('profile');else show('profile')};

  window.if933OpenHistory=async function(){
    show(PAGE);
    const host=document.getElementById('if933HistoryHost');if(!host)return;
    host.innerHTML='<div class="card"><div class="sub">Caricamento allenamenti…</div></div>';
    try{
      const d=await api('api/workouts-0933');const items=d.items||[];
      if(!items.length){host.innerHTML='<div class="card"><div class="sub">Nessun allenamento registrato.</div></div>';return}
      host.innerHTML=items.map(w=>`<div class="card"><div class="row" style="align-items:flex-start;gap:10px"><div style="flex:1"><div class="ey">${fmtDate(w.ts)}</div><h2 style="margin-bottom:4px">${w.title||'Allenamento'}</h2><div class="sub">${w.exercise_count||0} esercizi · ${w.set_count||0} serie${w.duration_min?` · ${w.duration_min} min`:''}</div></div><button class="btn secondary" style="width:auto;margin:0" onclick="if933OpenDetail(${w.id})">Apri</button></div></div>`).join('');
    }catch(e){host.innerHTML=`<div class="card warning"><div class="sub">${e.message||'Errore caricamento storico'}</div></div>`}
  };

  window.if933OpenDetail=async function(id){
    show(DETAIL);
    const host=document.getElementById('if933DetailHost');const title=document.getElementById('if933DetailTitle');
    host.innerHTML='<div class="card"><div class="sub">Caricamento dettaglio…</div></div>';
    try{
      const d=await api(`api/workouts-0933/${id}`);const w=d.workout||{},sets=d.sets||[];title.textContent=w.title||'Allenamento';
      const groups={};sets.forEach(s=>(groups[s.exercise]||(groups[s.exercise]=[])).push(s));
      const body=Object.entries(groups).map(([name,rows])=>`<div class="card"><div class="ey">${name}</div>${rows.map(s=>`<div class="measure"><span>Serie ${s.set_no||'—'} · ${num(s.reps,' rep')}</span><b>${s.weight===null||s.weight===undefined?'—':s.weight} · ${s.fatigue||'—'}</b></div>`).join('')}</div>`).join('')||'<div class="card"><div class="sub">Nessuna serie registrata.</div></div>';
      host.innerHTML=`<div class="card"><div class="measure"><span>Data</span><b>${fmtDate(w.ts)}</b></div><div class="measure"><span>Durata</span><b>${num(w.duration_min,' min')}</b></div><div class="measure"><span>Serie registrate</span><b>${sets.length}</b></div>${w.notes?`<div class="sub" style="margin-top:8px">${w.notes}</div>`:''}</div>${body}<button class="btn" style="background:#6b2525" onclick="if933DeleteWorkout(${id})">Elimina allenamento</button>`;
    }catch(e){host.innerHTML=`<div class="card warning"><div class="sub">${e.message||'Errore caricamento dettaglio'}</div></div>`}
  };

  window.if933DeleteWorkout=async function(id){
    if(!confirm('Eliminare definitivamente questo allenamento e tutte le serie collegate?'))return;
    try{
      await api(`api/workouts-0933/${id}`,{method:'DELETE'});
      if(typeof toast==='function')toast('Allenamento eliminato');
      if(typeof if50LoadWeek==='function')if50LoadWeek();
      await window.if933OpenHistory();
    }catch(e){if(typeof toast==='function')toast(e.message||'Errore eliminazione')}
  };

  ensurePages();installButton();setTimeout(installButton,250);setInterval(installButton,1200);
  console.log('[INFORMHA_HISTORY] version=0.9.33 workout_history=1 workout_delete=1');
})();
