// InFormha 0.9.32 - rende visibili tapis roulant e stretching nel check-in gia' costruito
(function(){
  function ensureExtras(){
    const p=document.querySelector('[data-page="checkin"]');if(!p)return;
    IF50.treadmill_choice=IF50.treadmill_choice||'No';
    IF50.stretch_mode=IF50.stretch_mode||'No';
    let box=document.getElementById('if932Extras');
    if(!box){
      box=document.createElement('div');box.id='if932Extras';
      box.innerHTML=`<div class="card"><b>Tapis roulant?</b><div class="choice"><button data-if932-group="treadmill_choice" data-val="No">No</button><button data-if932-group="treadmill_choice" data-val="Sì">Sì</button></div><div class="sub">Se lo scegli, InFormha prepara un blocco con minuti, velocità e inclinazione.</div></div><div class="card"><b>Stretching / mobilità?</b><div class="choice"><button data-if932-group="stretch_mode" data-val="No">No</button><button data-if932-group="stretch_mode" data-val="Prima">Prima</button><button data-if932-group="stretch_mode" data-val="Dopo">Dopo</button><button data-if932-group="stretch_mode" data-val="Prima e dopo">Prima e dopo</button></div><div class="sub">Prima: mobilità dinamica dei muscoli che lavoreranno. Dopo: stretching dei muscoli coinvolti.</div></div>`;
      const coach=[...p.querySelectorAll('.card')].find(c=>(c.textContent||'').includes('Logica coach'));
      if(coach)coach.parentElement.insertBefore(box,coach);else p.appendChild(box);
      box.querySelectorAll('button[data-if932-group]').forEach(btn=>btn.addEventListener('click',()=>{
        const g=btn.dataset.if932Group,v=btn.dataset.val;IF50[g]=v;
        box.querySelectorAll(`button[data-if932-group="${g}"]`).forEach(b=>b.classList.toggle('on',b===btn));
      }));
    }
    box.querySelectorAll('button[data-if932-group]').forEach(btn=>btn.classList.toggle('on',IF50[btn.dataset.if932Group]===btn.dataset.val));
    const legacy=document.getElementById('if931Extras');if(legacy)legacy.remove();
  }

  window.if932EnsureExtras=ensureExtras;
  const oldGo=window.go;
  if(typeof oldGo==='function')window.go=function(page){const r=oldGo.apply(this,arguments);if(page==='checkin')setTimeout(ensureExtras,0);return r};
  setTimeout(ensureExtras,0);
  setTimeout(ensureExtras,250);
  console.log('[INFORMHA_WARMUP_UI] version=0.9.32 existing_checkin_injection=1');
})();
