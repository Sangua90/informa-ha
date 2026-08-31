// InFormha 0.9.0 - coach adattivo locale con contesto reale
(function(){
  function ensurePage(){
    if(document.querySelector('[data-page="aicoach"]'))return;
    const app=document.querySelector('.app');if(!app)return;
    const page=document.createElement('section');page.className='page';page.dataset.page='aicoach';page.innerHTML=`
      <div class="ey">AI Coach</div><h1>Coach di oggi</h1>
      <div class="card coach" id="if90CoachToday"><div class="sub">Analizzo allenamenti, recupero, alimentazione e integratori…</div></div>
      <div class="card"><div class="ey">Chiedi al coach</div><textarea class="field" id="if90Question" rows="3" placeholder="Es. Oggi conviene allenarmi? Come sono messo con le proteine?"></textarea><button class="btn blue" onclick="if90AskCoach()">Chiedi</button><div id="if90Answer" class="sub" style="margin-top:12px"></div></div>
      <div class="card"><div class="ey">Come funziona</div><div class="sub">Questa versione usa un motore adattivo locale basato sui dati reali di InFormha. Non è ancora collegata a un modello linguistico esterno: quando lo collegheremo, userà lo stesso contesto senza perdere la logica già costruita.</div></div>
      <button class="btn secondary" onclick="go('coach')">Settimana e Coach</button><button class="btn secondary" onclick="go('profile')">Indietro</button>`;
    app.appendChild(page);
  }
  function installButtons(){
    const coach=document.querySelector('[data-page="coach"]');
    if(coach&&!document.getElementById('if90OpenCoach')){
      const b=document.createElement('button');b.id='if90OpenCoach';b.className='btn blue';b.textContent='🤖 Apri AI Coach';b.onclick=()=>{go('aicoach');setTimeout(if90LoadCoach,30)};
      const back=[...coach.querySelectorAll('button')].find(x=>x.textContent.includes('Indietro'));coach.insertBefore(b,back||null);
    }
    const profile=document.querySelector('[data-page="profile"] .card');
    if(profile&&!document.getElementById('if90ProfileCoach')){
      const b=document.createElement('button');b.id='if90ProfileCoach';b.className='btn secondary';b.textContent='AI Coach';b.onclick=()=>{go('aicoach');setTimeout(if90LoadCoach,30)};profile.appendChild(b);
    }
  }
  window.if90LoadCoach=async function(){
    const box=document.getElementById('if90CoachToday');if(!box)return;
    box.innerHTML='<div class="sub">Analisi in corso…</div>';
    try{
      const d=await api('api/ai-coach/today');const a=d.advice||{};const ps=a.priorities||[];
      box.innerHTML=`<div class="ey">Priorità di oggi</div><h2>${a.headline||'Continua a registrare i dati'}</h2>${ps.map(p=>`<div class="if90-advice"><b>${p.area}</b><span>${p.text}</span></div>`).join('')}<div class="sub" style="margin-top:12px">Motore: adattivo locale · modello generativo: non ancora collegato</div>`;
    }catch(e){box.innerHTML='<div class="sub">Non riesco a caricare il contesto del coach.</div>'}
  };
  window.if90AskCoach=async function(){
    const q=(document.getElementById('if90Question')?.value||'').trim(),out=document.getElementById('if90Answer');if(!q){toast('Scrivi una domanda');return}out.textContent='Analizzo i tuoi dati…';
    try{const d=await api('api/ai-coach/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q})});out.innerHTML=`<b>Coach</b><br>${d.answer}<br><span class="mini">Risposta dal motore adattivo locale</span>`}catch(e){out.textContent=e.message||'Errore coach'}
  };
  const css=document.createElement('style');css.textContent=`.if90-advice{padding:12px 0;border-top:1px solid var(--ln);display:grid;gap:4px}.if90-advice:first-of-type{border-top:0}.if90-advice b{color:var(--green2)}[data-page="aicoach"] textarea.field{resize:vertical;min-height:90px}`;document.head.appendChild(css);
  ensurePage();installButtons();
  document.addEventListener('click',e=>{if(e.target.closest('[onclick*="aicoach"]'))setTimeout(if90LoadCoach,50)});
})();
