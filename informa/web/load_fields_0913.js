// InFormha 0.9.13 - parametri allenamento specifici per attrezzatura
(function(){
  function kind(ex){
    const eq=String(ex?.equipment||'').toLowerCase();
    const id=String(ex?.id||'');
    if(ex?.cardio||id==='treadmill'||id==='stepper') return id==='stepper'?'stepper':'treadmill';
    if(eq.includes('fassi')) return 'fassi';
    if(eq.includes('manub')||eq.includes('bilancier')||eq.includes('ez')) return 'freeweight';
    if(eq.includes('corpo libero')||id==='plank'||id==='glute_bridge'||id==='calf_raise') return 'bodyweight';
    return 'freeweight';
  }

  window.if913Kind=kind;

  window.if50SetRow=function(ex,n){
    const k=kind(ex);
    const load=k==='fassi'
      ? `<input id="if50w_${ex.id}_${n}" placeholder="Piastra / pin" inputmode="numeric" aria-label="Piastra o livello pin">`
      : k==='bodyweight'
        ? `<input id="if50w_${ex.id}_${n}" type="hidden" value=""><span class="if913-no-load">Corpo libero</span>`
        : `<input id="if50w_${ex.id}_${n}" placeholder="Peso totale kg" inputmode="decimal" aria-label="Peso totale in kg">`;
    return `<div class="setrow if913-${k}"><b>${n}</b>${load}<input id="if50r_${ex.id}_${n}" value="${ex.reps}" inputmode="numeric" aria-label="Ripetizioni"><button id="if50c_${ex.id}_${n}" class="check" onclick="if50CompleteSet('${ex.id}',${n})">✓</button></div>`;
  };

  function cardioCard(ex){
    const k=kind(ex);
    if(k==='stepper'){
      return `<div class="card" id="if50ex_cardio"><div class="ey">${ex.priority}</div><h2>${ex.name}</h2><div class="sub">Registra durata e sforzo percepito.</div><div class="if913-cardio-grid"><label>Minuti<input class="field" id="if50CardioMin" value="${ex.duration||10}" inputmode="numeric"></label><label>Sforzo<select class="field" id="if913StepperEffort"><option>Leggero</option><option selected>Moderato</option><option>Intenso</option></select></label></div><button class="btn secondary" onclick="if50SaveCardio()">Salva cardio</button><div class="choice"><button onclick="if50Status('cardio','Completato','Opzionale',this)">Completato</button><button onclick="if50Status('cardio','Parziale','Opzionale',this)">Parziale</button><button onclick="if50Status('cardio','Saltato','Opzionale',this)">Saltato</button></div></div>`;
    }
    return `<div class="card" id="if50ex_cardio"><div class="ey">${ex.priority}</div><h2>${ex.name}</h2><div class="sub">Registra i parametri reali del tapis roulant.</div><div class="if913-cardio-grid"><label>Minuti<input class="field" id="if50CardioMin" value="${ex.duration||20}" inputmode="numeric"></label><label>Velocità km/h<input class="field" id="if913Speed" placeholder="es. 5,5" inputmode="decimal"></label><label>Inclinazione %<input class="field" id="if913Incline" placeholder="es. 3" inputmode="decimal"></label></div><button class="btn secondary" onclick="if50SaveCardio()">Salva cardio</button><div class="choice"><button onclick="if50Status('cardio','Completato','Opzionale',this)">Completato</button><button onclick="if50Status('cardio','Parziale','Opzionale',this)">Parziale</button><button onclick="if50Status('cardio','Saltato','Opzionale',this)">Saltato</button></div></div>`;
  }

  window.if50ExerciseCard=function(ex){
    if(ex.cardio) return cardioCard(ex);
    const k=kind(ex);
    const loadLabel=k==='fassi'?'Carico: piastra / livello pin':k==='bodyweight'?'Carico: corpo libero':'Carico: peso totale in kg';
    return `<div class="card if50-ex" id="if50ex_${ex.id}" data-if913-kind="${k}"><div class="row" style="align-items:flex-start;gap:8px"><div style="flex:1"><div class="ey">${ex.priority} · ${ex.sets} × ${ex.reps} · ${ex.rest}s</div><h2>${ex.name}</h2><div class="sub if913-load-label">${loadLabel}</div></div>${ex.guide?`<button class="btn secondary" style="width:auto;margin:0" onclick="openGuide('${ex.guide}')">Guida</button>`:''}</div>${Array.from({length:ex.sets},(_,i)=>if50SetRow(ex,i+1)).join('')}<div class="row" style="margin-top:10px"><select class="field" id="if50f_${ex.id}" onchange="document.getElementById('if50rir_${ex.id}').textContent=IF50_RIR[this.value]"><option>Facile</option><option selected>Giusta</option><option>Dura</option><option>Al limite</option></select><div class="metric"><span>Intensità</span><b id="if50rir_${ex.id}">RIR 2–3</b></div></div><div class="choice"><button onclick="if50Status('${ex.id}','Completato','${ex.priority}',this)">Completato</button><button onclick="if50Status('${ex.id}','Parziale','${ex.priority}',this)">Parziale</button><button onclick="if50Status('${ex.id}','Saltato','${ex.priority}',this)">Saltato</button></div><div class="card coach" style="margin:10px 0 0"><div class="ey">Coach prossima volta</div><div class="sub" id="if50prog_${ex.id}">Completa le serie per generare il consiglio.</div></div></div>`;
  };

  window.if50Progress=function(id){
    const ex=(typeof IF51_LIBRARY!=='undefined'&&IF51_LIBRARY[id])||IF50_EX[id];if(!ex)return;
    const done=[...document.querySelectorAll(`[id^="if50c_${id}_"]`)].filter(b=>b.classList.contains('done')).length;
    const fat=document.getElementById(`if50f_${id}`)?.value||'Giusta';
    const k=kind({...ex,id});let msg='Completa le serie per generare il consiglio.';
    if(done>=2){
      if(k==='fassi'){
        if(fat==='Facile')msg='Tecnica pulita e margine alto: valuta +1 piastra / livello pin la prossima volta.';
        else if(fat==='Giusta')msg='Mantieni questa piastra finché completi tutte le ripetizioni con RIR 2–3; poi valuta +1 piastra.';
        else if(fat==='Dura')msg='Mantieni la stessa piastra e consolida prima le ripetizioni.';
        else msg='Non aumentare. Mantieni o riduci di una piastra se tecnica o ripetizioni cedono.';
      }else if(k==='bodyweight'){
        if(fat==='Facile')msg='Aumenta gradualmente ripetizioni, secondi o difficoltà della variante.';
        else if(fat==='Giusta')msg='Mantieni la variante e completa il volume previsto con tecnica pulita.';
        else msg='Non aumentare la difficoltà; consolida tecnica e volume.';
      }else{
        if(fat==='Facile')msg='Tecnica pulita e margine alto: valuta un piccolo aumento del peso totale.';
        else if(fat==='Giusta')msg='Mantieni il peso finché completi tutte le ripetizioni con RIR 2–3; poi aumenta gradualmente.';
        else if(fat==='Dura')msg='Mantieni lo stesso peso e consolida prima le ripetizioni.';
        else msg='Non aumentare. Mantieni o riduci il peso se tecnica o ripetizioni cedono.';
      }
    }
    const el=document.getElementById(`if50prog_${id}`);if(el)el.textContent=msg;
  };

  window.if50SaveCardio=async function(){
    const m=if50Num('if50CardioMin');if(!m||m<=0){toast('Inserisci i minuti');return}
    const speed=if50Num('if913Speed'),incline=if50Num('if913Incline');
    const effort=document.getElementById('if913StepperEffort')?.value;
    const isStepper=!!effort;
    const notes=isStepper?`Mini stepper · sforzo ${effort}`:`Tapis roulant · velocità ${speed??'—'} km/h · inclinazione ${incline??'—'}%`;
    try{await api('api/cardio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({activity:isStepper?'Mini stepper':'Tapis roulant',duration_min:m,notes})});toast('Cardio salvato')}catch(e){toast('Errore cardio')}
  };

  const css=document.createElement('style');css.textContent=`
    .if913-load-label{margin:3px 0 10px;color:var(--m)}
    .if913-no-load{display:flex;align-items:center;min-height:42px;padding:0 10px;border:1px solid var(--ln);border-radius:12px;color:var(--m);font-size:12px}
    .if913-cardio-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:12px 0}.if913-cardio-grid label{font-size:11px;color:var(--m);font-weight:700}.if913-cardio-grid .field{margin-top:5px}
  `;document.head.appendChild(css);
})();
