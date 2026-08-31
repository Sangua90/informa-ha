// InFormha 0.8.1 - integratori configurabili e storico
(function(){
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function fmtDose(x){if(x.dose==null||x.dose==='')return 'Dose non impostata';return `${x.dose} ${x.unit||''}`.trim()}
  async function loadSupplements081(){
    const page=document.querySelector('[data-page="supplements"]');if(!page)return;
    let today={items:[],taken:0,total:0,adherence:100},week={adherence:100,days:[]};
    try{[today,week]=await Promise.all([api('api/supplements/today'),api('api/supplements/week')])}catch(e){}
    page.innerHTML=`
      <div class="ey">Integratori</div><h1>Oggi</h1>
      <div class="card"><div class="grid2"><div class="metric"><span>Presi</span><b>${today.taken||0}/${today.total||0}</b></div><div class="metric"><span>Aderenza oggi</span><b>${today.adherence??100}%</b></div></div><div class="if81-progress"><i style="width:${Math.max(0,Math.min(100,today.adherence??100))}%"></i></div></div>
      <div class="card"><div class="row"><div style="flex:1"><div class="ey">Programma di oggi</div><h2>Integratori attivi</h2></div><button class="btn secondary" style="width:auto" onclick="if81ShowForm()">+ Aggiungi</button></div><div id="if81List">${renderItems(today.items||[])}</div></div>
      <div id="if81Form" class="card" style="display:none"><div class="ey">Configura</div><h2>Nuovo integratore</h2><input class="field" id="if81Name" placeholder="Nome"><div class="grid2" style="margin-top:8px"><input class="field" id="if81Dose" placeholder="Dose" inputmode="decimal"><input class="field" id="if81Unit" placeholder="Unità (g, mg, cps...)"></div><input class="field" id="if81Time" type="time" style="margin-top:8px"><input class="field" id="if81Notes" placeholder="Note (opzionale)" style="margin-top:8px"><button class="btn" onclick="if81Save()">Salva integratore</button><button class="btn secondary" onclick="if81HideForm()">Annulla</button></div>
      <div class="card"><div class="ey">Ultimi 7 giorni</div><div class="measure"><span>Aderenza complessiva</span><b>${week.adherence??100}%</b></div><div class="if81-progress"><i style="width:${Math.max(0,Math.min(100,week.adherence??100))}%"></i></div><div class="sub" style="margin-top:10px">${renderWeek(week.days||[])}</div></div>
      <div class="card coach"><div class="ey">Promemoria Home Assistant</div><div class="sub">InFormha espone quali integratori risultano ancora da prendere e quali hanno superato l'orario previsto. Questo dato può essere usato per notifiche Home Assistant senza creare promemoria duplicati.</div></div>`;
  }
  function renderItems(items){
    if(!items.length)return '<div class="sub">Nessun integratore configurato.</div>';
    return items.map(x=>`<div class="if81-item ${x.taken?'done':''}"><div style="flex:1"><b>${esc(x.name)}</b><div class="sub">${esc(fmtDose(x))}${x.time_text?` · ${esc(x.time_text)}`:''}${x.notes?` · ${esc(x.notes)}`:''}</div></div><button class="btn ${x.taken?'secondary':''}" style="width:auto" onclick="if81Toggle(${x.id},${x.taken?0:1})">${x.taken?'✓ Preso':'Segna preso'}</button><button class="if81-trash" onclick="if81Delete(${x.id})">✕</button></div>`).join('');
  }
  function renderWeek(days){return days.map(d=>`${d.day.slice(5)}: ${d.taken}/${d.expected}`).join(' · ')||'Nessun dato';}
  window.if81ShowForm=()=>{const x=document.getElementById('if81Form');if(x)x.style.display='block'};
  window.if81HideForm=()=>{const x=document.getElementById('if81Form');if(x)x.style.display='none'};
  window.if81Save=async()=>{const name=document.getElementById('if81Name')?.value.trim();if(!name){toast('Inserisci il nome');return}try{await api('api/supplements',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,dose:document.getElementById('if81Dose')?.value||null,unit:document.getElementById('if81Unit')?.value||null,time_text:document.getElementById('if81Time')?.value||null,notes:document.getElementById('if81Notes')?.value||null,active:true})});toast('Integratore salvato');loadSupplements081()}catch(e){toast(e.message)}};
  window.if81Toggle=async(id,taken)=>{try{await api(`api/supplements/${id}/taken`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({taken:!!taken})});loadSupplements081()}catch(e){toast(e.message)}};
  window.if81Delete=async id=>{if(!confirm('Eliminare questo integratore e il suo storico?'))return;try{await api(`api/supplements/${id}`,{method:'DELETE'});toast('Integratore eliminato');loadSupplements081()}catch(e){toast(e.message)}};
  const css=document.createElement('style');css.textContent=`.if81-progress{height:8px;background:#090b0e;border:1px solid var(--ln);border-radius:999px;overflow:hidden;margin-top:12px}.if81-progress i{display:block;height:100%;background:linear-gradient(90deg,var(--green),var(--blue));border-radius:999px}.if81-item{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--ln)}.if81-item:last-child{border-bottom:0}.if81-item.done{opacity:.72}.if81-trash{border:0;background:transparent;color:#999;font-size:18px;padding:8px}`;document.head.appendChild(css);
  const oldGo=window.go;if(oldGo)window.go=function(page){const r=oldGo.apply(this,arguments);if(page==='supplements')setTimeout(loadSupplements081,30);return r};
  if(location.hash==='#supplements')setTimeout(loadSupplements081,100);
})();
