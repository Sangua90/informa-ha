// InFormha 0.9.76 - selezione semplice stretching/mobilita nel pre-allenamento
(function(){
 if(typeof IF50==='undefined')return;
 function ensure(){
  const box=document.getElementById('if932Extras');if(!box)return;
  IF50.stretch_mode=(IF50.stretch_mode&&IF50.stretch_mode!=='No')?'Sì':'No';
  const cards=[...box.querySelectorAll('.card')];
  const card=cards.find(c=>(c.textContent||'').includes('Stretching / mobilità'));
  if(!card)return;
  card.innerHTML=`<b>Stretching / mobilità?</b><div class="choice"><button data-if976-stretch="No">No</button><button data-if976-stretch="Sì">Sì</button></div><div class="sub">Se scegli Sì, iCoach gestisce automaticamente la preparazione e lo stretching finale. Con il tapis roulant all'inizio non aggiunge mobilità iniziale.</div>`;
  card.querySelectorAll('[data-if976-stretch]').forEach(b=>{b.classList.toggle('on',b.dataset.if976Stretch===IF50.stretch_mode);b.onclick=()=>{IF50.stretch_mode=b.dataset.if976Stretch;window.if50Estimate?.();card.querySelectorAll('[data-if976-stretch]').forEach(x=>x.classList.toggle('on',x===b))}});
 }
 const go0=window.go;if(typeof go0==='function')window.go=function(page){const r=go0.apply(this,arguments);if(page==='checkin')setTimeout(ensure,20);return r};
 const check0=window.if50Checkin;if(typeof check0==='function')window.if50Checkin=function(){const r=check0.apply(this,arguments);setTimeout(ensure,20);return r};
 setTimeout(ensure,300);
 console.log('[INFORMHA_PREWORKOUT] version=0.9.76 stretch_yes_no=1 treadmill_replaces_initial_mobility=1');
})();
