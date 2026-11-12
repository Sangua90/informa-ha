// InFormha 0.9.1 - stato provider AI e test Gemini
(function(){
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  function ensureSettingsCard(){
    const page=document.querySelector('[data-page="aicoach"]');
    if(!page||document.getElementById('if91AiSettings'))return;
    const how=[...page.querySelectorAll('.card')].find(c=>c.textContent.includes('Come funziona'));
    const card=document.createElement('div');card.className='card';card.id='if91AiSettings';card.innerHTML=`
      <div class="ey">Impostazioni AI</div>
      <div id="if91AiStatus" class="sub">Controllo configurazione…</div>
      <button class="btn secondary" id="if91AiTest" onclick="if91TestAI()">Testa connessione AI</button>
      <div class="sub" id="if91AiTestResult" role="status" style="margin-top:10px"></div>
      <details><summary>Dettagli della connessione</summary><pre id="if91AiTestDetails" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre></details>
      <div class="sub" style="margin-top:10px">Provider, modello e chiave API si configurano nelle impostazioni dell'add-on InFormha in Home Assistant. La chiave non viene mostrata in questa pagina.</div>`;
    if(how)page.insertBefore(card,how);else page.appendChild(card);
  }

  window.if91LoadAISettings=async function(){
    ensureSettingsCard();
    const out=document.getElementById('if91AiStatus');if(!out)return;
    try{
      const d=await api('api/ai/settings');
      const provider=d.provider==='gemini'?'Google Gemini':'Coach locale';
      const ready=d.configured||d.provider==='none';
      out.innerHTML=`<div class="measure"><span>Provider</span><b>${esc(provider)}</b></div>${d.provider==='gemini'?`<div class="measure"><span>Modello</span><b>${esc(d.model)}</b></div><div class="measure"><span>API key</span><b class="${d.has_api_key?'green':''}">${d.has_api_key?'Configurata':'Mancante'}</b></div>`:''}<div class="if91-state ${ready?'ok':'warn'}">${ready?'Configurazione pronta':'Completa la configurazione nelle impostazioni dell’add-on'}</div><div class="sub" style="margin-top:10px">${esc(d.privacy_note||'')}</div>`;
    }catch(e){out.textContent='Non riesco a leggere le impostazioni AI.'}
  };

  window.if91TestAI=async function(){
    const b=document.getElementById('if91AiTest'),out=document.getElementById('if91AiTestResult'),details=document.getElementById('if91AiTestDetails');
    if(b?.disabled)return;
    if(b)b.disabled=true;
    if(out)out.textContent='Verifica della connessione a Gemini…';
    if(details)details.textContent='';
    try{
      const response=await fetch('api/ai/test',{method:'POST'}),d=await response.json();
      if(details&&d.connection)details.textContent=JSON.stringify(d.connection,null,2);
      if(!response.ok||!d.connected)throw Error(d.error||'Connessione non disponibile');
      toast(d.connected?'Connessione AI attiva':'Connessione non disponibile');
      await if91LoadAISettings();
      if(out)out.textContent='Verifica riuscita: '+(d.model||'Coach locale')+'. '+(d.message||'Connessione attiva');
    }catch(e){if(out)out.textContent='Verifica non riuscita: '+(e.message||'Connessione non disponibile');toast(e.message||'Test AI non riuscito');await if91LoadAISettings()}
    finally{if(b)b.disabled=false}
  };

  const oldLoad=window.if90LoadCoach;
  window.if90LoadCoach=async function(){
    const r=await oldLoad();
    setTimeout(if91LoadAISettings,0);
    return r;
  };

  const oldAsk=window.if90AskCoach;
  window.if90AskCoach=async function(){
    const q=(document.getElementById('if90Question')?.value||'').trim(),out=document.getElementById('if90Answer');
    if(!q){toast('Scrivi una domanda');return}
    out.textContent='Analizzo i tuoi dati…';
    try{
      const d=await api('api/ai-coach/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q})});
      const source=d.mode==='gemini'?`Google Gemini · ${d.model||''}`:(d.fallback?'Coach locale · fallback da Gemini':'Coach locale');
      const warning=d.fallback&&d.provider_error?`<div class="mini" style="margin-top:6px">Gemini non disponibile: ${esc(d.provider_error)}</div>`:'';
      out.innerHTML=`<b>Coach</b><br><div class="if91-answer">${esc(d.answer).replace(/\n/g,'<br>')}</div><span class="mini">Risposta: ${esc(source)}</span>${warning}`;
    }catch(e){out.textContent=e.message||'Errore coach'}
  };

  const css=document.createElement('style');css.textContent=`.if91-state{margin-top:10px;padding:9px 11px;border-radius:12px;border:1px solid var(--ln)}.if91-state.ok{color:var(--green2)}.if91-state.warn{color:#ffb74d}.if91-answer{margin:7px 0 8px;line-height:1.45}`;document.head.appendChild(css);
  ensureSettingsCard();setTimeout(if91LoadAISettings,150);
})();
