// InFormha 0.9.3 - riepilogo del contesto realmente usato dal coach
(function(){
  function ensure(){
    const page=document.querySelector('[data-page="aicoach"]');
    if(!page||document.getElementById('if93Context'))return;
    const settings=document.getElementById('if91AiSettings');
    const card=document.createElement('div');card.className='card';card.id='if93Context';
    card.innerHTML=`<div class="ey">Contesto del coach</div><div id="if93ContextBody" class="sub">Controllo i dati disponibili…</div>`;
    if(settings&&settings.nextSibling)page.insertBefore(card,settings.nextSibling);else page.appendChild(card);
  }
  window.if93LoadContext=async function(){
    ensure();const box=document.getElementById('if93ContextBody');if(!box)return;
    try{
      const d=await api('api/ai-coach/context-summary');const s=d.summary||{};
      box.innerHTML=`<div class="grid2"><div class="metric"><span>Sedute recenti</span><b>${s.recent_sessions||0}</b></div><div class="metric"><span>Esercizi con storico</span><b>${s.exercise_trends||0}</b></div><div class="metric"><span>Essenziali aperti</span><b>${s.pending_essentials||0}</b></div><div class="metric"><span>Diario alimentare</span><b>${s.nutrition_logged_days_7d||0}/7 gg</b></div></div><div class="sub" style="margin-top:10px">Gemini riceve solo questi dati in forma riassunta: storico utile, progressione, recupero, diario e promemoria. Non viene inviato il database grezzo.</div>`;
    }catch(e){box.textContent='Contesto non disponibile.'}
  };
  const old=window.if90LoadCoach;
  window.if90LoadCoach=async function(){const r=await old();setTimeout(if93LoadContext,0);return r};
  ensure();setTimeout(if93LoadContext,180);
})();
